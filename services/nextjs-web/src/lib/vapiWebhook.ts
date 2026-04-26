import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import type { NextApiRequest } from 'next'

const MAX_BODY_BYTES = 4 * 1024 * 1024

/** Read raw body (required for HMAC verification). */
export async function readVapiRequestBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer | string) => {
      const b = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
      size += b.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Payload too large'))
        return
      }
      chunks.push(b)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

const hexPair = /^[0-9a-fA-F]+$/g

/**
 * Vapi Server URL: sign HMAC-SHA256 over the raw request body, hex digest in `x-vapi-signature`
 * (see https://docs.vapi.ai/server-url/server-authentication)
 * or legacy `X-Vapi-Secret` / `x-vapi-secret` matching the assistant server secret.
 */
export function verifyVapiWebhook(
  rawBody: Buffer,
  req: NextApiRequest,
  secret: string,
): { ok: true } | { ok: false; reason: string } {
  const h = getHeaderCaseInsensitive(req.headers, 'x-vapi-signature')
  if (h) {
    if (!/^[0-9a-fA-F]+$/.test(h) || h.length % 2 !== 0) {
      return { ok: false, reason: 'invalid x-vapi-signature format' }
    }
    const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex')
    const a = Buffer.from(expectedHex, 'utf8')
    const b = Buffer.from(h, 'utf8')
    if (a.length !== b.length) {
      return { ok: false, reason: 'signature length mismatch' }
    }
    if (!timingSafeEqual(a, b)) {
      return { ok: false, reason: 'invalid hmac' }
    }
    return { ok: true }
  }

  const plain = getHeaderCaseInsensitive(req.headers, 'x-vapi-secret')
  if (plain && timingSafeStringEqual(plain, secret)) {
    return { ok: true }
  }
  if (plain) {
    return { ok: false, reason: 'invalid x-vapi-secret' }
  }

  return { ok: false, reason: 'missing x-vapi-signature and x-vapi-secret' }
}

function getHeaderCaseInsensitive(
  headers: NextApiRequest['headers'],
  name: string,
): string | undefined {
  const lower = name.toLowerCase()
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) {
      const v = headers[k]
      if (Array.isArray(v)) return v[0]
      if (v) return v
    }
  }
  return undefined
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

const UuidV4 = z.string().uuid()

const MessageWrap = z
  .object({
    message: z
      .object({
        type: z.string().optional(),
        endedReason: z.string().optional(),
        call: z.unknown().optional(),
        artifact: z
          .object({
            transcript: z.string().optional(),
            messages: z
              .array(
                z.object({ role: z.string().optional(), message: z.string().optional() }).passthrough(),
              )
              .optional(),
            variableValues: z.record(z.unknown()).optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  })
  .passthrough()

export function parseVapiMessage(rawJson: string): { ok: true; body: z.infer<typeof MessageWrap> } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(rawJson)
    const b = MessageWrap.safeParse(parsed)
    if (!b.success) {
      return { ok: false, error: b.error.message }
    }
    return { ok: true, body: b.data }
  } catch {
    return { ok: false, error: 'invalid JSON' }
  }
}

function parseUuid(s: unknown): string | null {
  if (typeof s !== 'string' || !s.trim()) return null
  const u = UuidV4.safeParse(s.trim())
  return u.success ? u.data : null
}

/**
 * Prefer `artifact.variableValues.applicationId` (Vapi stores assistantOverrides.variableValues there).
 * Also checks top-level keys on the same object for flexibility.
 */
export function extractApplicationId(artifact: Record<string, unknown> | undefined): string | null {
  if (!artifact) return null

  const v = artifact.variableValues
  if (v && typeof v === 'object' && v !== null) {
    const inner = v as Record<string, unknown>
    const p = parseUuid(inner.applicationId) ?? parseUuid(inner.application_id)
    if (p) return p
  }

  for (const k of ['applicationId', 'application_id', 'applicationid']) {
    if (k in artifact) {
      const p = parseUuid(artifact[k])
      if (p) return p
    }
  }
  return null
}

type ArtifactType = {
  transcript?: string
  messages?: Array<{ role?: string; message?: string }>
}

export function buildTranscript(artifact: ArtifactType | null | undefined): string {
  if (!artifact) return ''
  if (typeof artifact.transcript === 'string' && artifact.transcript.trim()) {
    return artifact.transcript
  }
  if (Array.isArray(artifact.messages) && artifact.messages.length > 0) {
    return artifact.messages
      .map((m) => {
        const role = m?.role || 'message'
        const t = m?.message ?? ''
        return `${role}: ${t}`.trim()
      })
      .filter(Boolean)
      .join('\n\n')
  }
  return ''
}

type Callish = { id?: string; startedAt?: string; endedAt?: string; [key: string]: unknown }

export function extractVapiCallId(message: { call?: unknown }): string | null {
  const c = message.call as Callish | undefined
  if (c && typeof c === 'object' && typeof c.id === 'string' && c.id.trim()) {
    return c.id
  }
  return null
}

/**
 * @returns duration in seconds, or null
 */
export function extractDurationSeconds(message: { call?: unknown }): number | null {
  const c = message.call as { startedAt?: string; endedAt?: string } & Record<string, unknown> | undefined
  if (!c || typeof c !== 'object') return null
  if (c.startedAt && c.endedAt) {
    const a = Date.parse(c.startedAt)
    const b = Date.parse(c.endedAt)
    if (Number.isFinite(a) && Number.isFinite(b) && b >= a) {
      return Math.round((b - a) / 1000)
    }
  }
  const s = c.duration
  if (typeof s === 'number' && Number.isFinite(s)) return Math.max(0, Math.round(s))
  return null
}
