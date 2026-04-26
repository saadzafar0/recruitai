import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase'
import {
  readVapiRequestBody,
  verifyVapiWebhook,
  parseVapiMessage,
  extractApplicationId,
  buildTranscript,
  extractVapiCallId,
  extractDurationSeconds,
} from '../../../../lib/vapiWebhook'

/**
 * Vapi Server URL: receives POSTs for configured server messages.
 * For `end-of-call-report`, stores `artifact.transcript` on `interview_sessions` for the
 * application in `variableValues.applicationId` (set client-side via vapi.start overrides).
 *
 * Set `VAPI_WEBHOOK_SECRET` to match the assistant's serverUrlSecret; verify HMAC (x-vapi-signature) or x-vapi-secret.
 * @see https://docs.vapi.ai/server-url/events
 * @see https://docs.vapi.ai/server-url/server-authentication
 */
export const config = {
  api: {
    bodyParser: false,
  },
}

type OkResponse = { success: true; action?: string; applicationId?: string; duplicate?: boolean }
type ErrResponse = { success: false; error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | ErrResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'Server not configured (SUPABASE_SERVICE_ROLE_KEY)' })
  }

  let raw: Buffer
  try {
    raw = await readVapiRequestBody(req)
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e)
    return m.includes('Payload too large')
      ? res.status(413).json({ success: false, error: 'Payload too large' })
      : res.status(500).json({ success: false, error: 'Failed to read body' })
  }

  const secret = process.env.VAPI_WEBHOOK_SECRET
  if (secret) {
    const v = verifyVapiWebhook(raw, req, secret)
    if (!v.ok) {
      return res.status(401).json({ success: false, error: v.reason || 'unauthorized' })
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[Vapi webhook] VAPI_WEBHOOK_SECRET is not set; refusing in production')
    return res.status(500).json({ success: false, error: 'Webhook not configured' })
  }

  const rawStr = raw.toString('utf8')
  const parsed = parseVapiMessage(rawStr)
  if (!parsed.ok) {
    return res.status(400).json({ success: false, error: parsed.error })
  }

  const body = parsed.body
  const msg = body?.message
  if (!msg || typeof msg.type !== 'string') {
    return res.status(200).json({ success: true, action: 'ignoring_no_message' })
  }

  if (msg.type !== 'end-of-call-report') {
    return res.status(200).json({ success: true, action: 'skipped', applicationId: undefined })
  }

  const artifact = msg.artifact
  if (!artifact || typeof artifact !== 'object') {
    return res.status(400).json({ success: false, error: 'end-of-call-report missing artifact' })
  }

  const art = artifact as Record<string, unknown>
  let applicationId = extractApplicationId(art)
  if (!applicationId && msg.call && typeof msg.call === 'object' && msg.call !== null) {
    const c = msg.call as Record<string, unknown>
    applicationId =
      extractApplicationId(c) ||
      (c.assistantOverrides && typeof c.assistantOverrides === 'object' && c.assistantOverrides !== null
        ? extractApplicationId(c.assistantOverrides as Record<string, unknown>)
        : null)
  }
  if (!applicationId) {
    return res.status(400).json({
      success: false,
      error:
        'No applicationId in end-of-call artifact (set via assistantOverrides.variableValues when starting the call)',
    })
  }

  const { data: application, error: appErr } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .maybeSingle()

  if (appErr || !application) {
    return res.status(404).json({ success: false, error: 'Application not found' })
  }

  const transcript = buildTranscript(artifact)
  if (!transcript) {
    return res.status(400).json({ success: false, error: 'no transcript in artifact' })
  }

  const vapiCallId = extractVapiCallId({ call: msg.call as unknown })
  if (vapiCallId) {
    const { data: dup } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, application_id')
      .eq('vapi_call_id', vapiCallId)
      .maybeSingle()
    if (dup && dup.application_id === applicationId) {
      return res.status(200).json({ success: true, action: 'duplicate', duplicate: true, applicationId })
    }
  }

  const durationSeconds = extractDurationSeconds({ call: msg.call as unknown })
  const completedAt = new Date().toISOString()

  const { data: sessionRow, error: selErr } = await supabaseAdmin
    .from('interview_sessions')
    .select('id, vapi_call_id')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (selErr) {
    console.error('[Vapi webhook] load interview_sessions', selErr)
    return res.status(500).json({ success: false, error: 'Database error' })
  }

  if (sessionRow?.id) {
    if (sessionRow.vapi_call_id && vapiCallId && sessionRow.vapi_call_id === vapiCallId) {
      return res.status(200).json({ success: true, action: 'duplicate', duplicate: true, applicationId })
    }
    const { error: updErr } = await supabaseAdmin
      .from('interview_sessions')
      .update({
        status: 'completed',
        completed_at: completedAt,
        full_transcript: transcript,
        duration_seconds: durationSeconds,
        ...(vapiCallId ? { vapi_call_id: vapiCallId } : {}),
      })
      .eq('id', sessionRow.id)
    if (updErr) {
      console.error('[Vapi webhook] update interview_sessions', updErr)
      return res.status(500).json({ success: false, error: 'Failed to save transcript' })
    }
  } else {
    const { error: insErr } = await supabaseAdmin.from('interview_sessions').insert({
      application_id: applicationId,
      status: 'completed',
      completed_at: completedAt,
      full_transcript: transcript,
      duration_seconds: durationSeconds,
      vapi_call_id: vapiCallId ?? null,
    })
    if (insErr) {
      if (String(insErr).includes('interview_sessions_application_id_key') || (insErr as { code?: string })?.code === '23505') {
        // Race: another row appeared
        return res.status(409).json({ success: false, error: 'interview session conflict' })
      }
      console.error('[Vapi webhook] insert interview_sessions', insErr)
      return res.status(500).json({ success: false, error: 'Failed to save transcript' })
    }
  }

  return res.status(200).json({ success: true, action: 'saved', applicationId })
}
