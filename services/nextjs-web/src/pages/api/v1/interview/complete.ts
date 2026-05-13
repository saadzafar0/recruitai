import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { voiceEvaluationQueue } from '@/lib/bull'

const CompleteInterviewSchema = z.object({
  application_id: z.string().uuid(),
  session_id: z.string().uuid(),
  full_transcript: z.string().min(1),
  duration_seconds: z.number().int().nonnegative().optional(),
})

type ApiResponse = {
  success: boolean
  data?: { queued: boolean; jobId?: string }
  error?: string
  details?: unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' })
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'Server is not configured with SUPABASE_SERVICE_ROLE_KEY' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'applicant') {
    return res.status(403).json({ success: false, error: 'Access denied' })
  }

  let payload: z.infer<typeof CompleteInterviewSchema>
  try {
    payload = CompleteInterviewSchema.parse(req.body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
    }
    return res.status(400).json({ success: false, error: 'Invalid request body' })
  }

  const { data: application, error: applicationError } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('id', payload.application_id)
    .eq('applicant_id', profile.id)
    .single()

  if (applicationError || !application) {
    return res.status(404).json({ success: false, error: 'Application not found' })
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('interview_sessions')
    .select('id, application_id')
    .eq('id', payload.session_id)
    .single()

  if (sessionError || !session) {
    return res.status(404).json({ success: false, error: 'Interview session not found' })
  }

  if (session.application_id !== payload.application_id) {
    return res.status(400).json({ success: false, error: 'Session does not match application' })
  }

  const { error: updateError } = await supabaseAdmin
    .from('interview_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      full_transcript: payload.full_transcript.trim(),
      duration_seconds: payload.duration_seconds ?? null,
    })
    .eq('id', payload.session_id)

  if (updateError) {
    return res.status(500).json({ success: false, error: 'Failed to update interview session' })
  }

  let queued = false
  let jobId: string | undefined

  try {
    jobId = `voice-${payload.session_id}`
    await voiceEvaluationQueue.add(
      'voice-evaluation',
      { applicationId: payload.application_id, sessionId: payload.session_id },
      {
        jobId,
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 200 },
      },
    )
    queued = true
  } catch (enqueueError) {
    console.error('[Interview Complete API] Failed to enqueue voice evaluation job', enqueueError)
  }

  return res.status(200).json({
    success: true,
    data: { queued, jobId },
  })
}
