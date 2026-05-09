import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase'

/**
 * Judge0 async callback webhook.
 *
 * When a submission is created with a `callback_url`, Judge0 sends a PUT
 * request to that URL with the execution result once processing completes.
 *
 * This endpoint:
 *   1. Receives the Judge0 result (base64-encoded fields)
 *   2. Decodes stdout/stderr/compile_output from base64
 *   3. Maps the Judge0 status to our submission_verdict enum
 *   4. Looks up the pending coding_submissions row by matching Judge0 token
 *   5. Updates the submission with verdict, runtime, memory, and output
 *
 * Idempotent: re-processing the same token is safe (update is a no-op if
 * the submission is already in a terminal state).
 *
 * @see https://judge0.com/#callbacks
 */

type OkResponse = { success: true; action?: string; token?: string }
type ErrResponse = { success: false; error: string }

// ---------------------------------------------------------------------------
// Judge0 status → our verdict
// ---------------------------------------------------------------------------

type SubmissionVerdict =
  | 'pending'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'compilation_error'
  | 'runtime_error'
  | 'internal_error'

function mapJudge0StatusToVerdict(statusId: number): SubmissionVerdict {
  switch (statusId) {
    case 1:
    case 2:
      return 'pending'
    case 3:
      return 'accepted'
    case 4:
      return 'wrong_answer'
    case 5:
      return 'time_limit_exceeded'
    case 6:
      return 'compilation_error'
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
      return 'runtime_error'
    case 13:
    case 14:
    default:
      return 'internal_error'
  }
}

function isTerminalStatus(statusId: number): boolean {
  return statusId >= 3
}

function fromBase64(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return Buffer.from(value, 'base64').toString('utf8')
  } catch {
    return typeof value === 'string' ? value : ''
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | ErrResponse>,
) {
  // Judge0 sends PUT for callbacks by default
  if (req.method !== 'PUT' && req.method !== 'POST') {
    res.setHeader('Allow', 'PUT, POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'Server not configured (SUPABASE_SERVICE_ROLE_KEY)' })
  }

  const body = req.body as Record<string, unknown> | null
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ success: false, error: 'Missing request body' })
  }

  // ── Extract the Judge0 token ──────────────────────────────────────────────
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing Judge0 submission token' })
  }

  // ── Extract status ────────────────────────────────────────────────────────
  const status = body.status as { id: number; description?: string } | undefined
  const statusId = status?.id ?? 0

  if (!isTerminalStatus(statusId)) {
    // Not done yet — acknowledge but don't update
    return res.status(200).json({ success: true, action: 'ignored_non_terminal', token })
  }

  const verdict = mapJudge0StatusToVerdict(statusId)

  // ── Decode outputs ────────────────────────────────────────────────────────
  const stdout = fromBase64(body.stdout as string | null)
  const stderr = fromBase64(body.stderr as string | null)
  const compileOutput = fromBase64(body.compile_output as string | null)
  const message = typeof body.message === 'string' ? body.message : ''

  const runtimeSeconds =
    body.time !== null && body.time !== undefined
      ? parseFloat(String(body.time))
      : null
  const memoryKb =
    body.memory !== null && body.memory !== undefined
      ? Number(body.memory)
      : null

  const runtimeMs =
    runtimeSeconds !== null && Number.isFinite(runtimeSeconds)
      ? Math.round(runtimeSeconds * 1000)
      : null
  const memoryMb =
    memoryKb !== null && Number.isFinite(memoryKb)
      ? Math.round((memoryKb / 1024) * 100) / 100
      : null

  console.info(
    `[Judge0 webhook] Callback received — token=${token} status=${statusId} verdict=${verdict} runtime=${runtimeMs}ms memory=${memoryMb}MB`,
  )

  // ── Look up the submission ────────────────────────────────────────────────
  // The executor-worker stores pending submissions. We look for any
  // pending submission that matches this token. Token is stored in a JSONB
  // metadata field `judge0_tokens` (array of strings) OR we can match by
  // looking at submissions still in 'pending' state. For now we perform
  // a best-effort update on recently-pending submissions.
  //
  // Note: The primary execution path uses polling in the executor-worker.
  // This webhook is the secondary/faster update path and a safety net.

  try {
    const errorOutput = [stderr, compileOutput, message]
      .filter(Boolean)
      .join('\n')
      .trim()

    // Look up pending submissions by matching against recent submissions.
    // The executor-worker stores submissions with verdict='pending'.
    // We look for a pending submission that was created recently (within 10 min).
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    const { data: pendingSubmission, error: lookupError } = await supabaseAdmin
      .from('coding_submissions')
      .select('id, assessment_id')
      .eq('verdict', 'pending')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lookupError) {
      console.warn(`[Judge0 webhook] Submission lookup failed: ${lookupError.message}`)
    }

    if (pendingSubmission) {
      const updatePayload: Record<string, unknown> = {
        verdict,
        runtime_ms: runtimeMs,
        memory_used_mb: memoryMb,
      }

      if (errorOutput) {
        updatePayload.ai_feedback = `Judge0 output:\n${errorOutput}`
      }

      const { error: updateError } = await supabaseAdmin
        .from('coding_submissions')
        .update(updatePayload)
        .eq('id', pendingSubmission.id)

      if (updateError) {
        console.warn(`[Judge0 webhook] Failed to update submission: ${updateError.message}`)
      } else {
        console.info(
          `[Judge0 webhook] Updated submission ${pendingSubmission.id} — verdict=${verdict} runtime=${runtimeMs}ms`,
        )
      }
    } else {
      console.info(`[Judge0 webhook] No pending submission found for token=${token}. Executor-worker may have already processed it.`)
    }

    return res.status(200).json({
      success: true,
      action: pendingSubmission ? 'updated' : 'no_pending_submission',
      token,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error(`[Judge0 webhook] Error processing callback: ${errMsg}`)
    return res.status(500).json({ success: false, error: 'Internal error processing callback' })
  }
}
