import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { voiceEvaluationQueue } from '@/lib/bull'

const InterviewPayloadSchema = z.object({
  application_id: z.string().uuid(),
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  order_index: z.number().int().min(0),
  transcript: z.string().min(1),
  audio_duration_seconds: z.number().int().nonnegative(),
  transcript_confidence: z.number().min(0).max(1).optional(),
})

type ApiResponse = {
  success: boolean
  data?: {
    responseId: string
    queued: boolean
    jobId?: string
  }
  error?: string
  details?: unknown
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
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

  let payload: z.infer<typeof InterviewPayloadSchema>
  try {
    payload = InterviewPayloadSchema.parse(req.body)
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

  const wordCount = countWords(payload.transcript)

  console.info('[Interview API] Saving interview response:', {
    application_id: payload.application_id,
    session_id: payload.session_id,
    question_id: payload.question_id,
    order_index: payload.order_index,
    transcript_chars: payload.transcript.length,
    audio_duration_seconds: payload.audio_duration_seconds,
    transcript_confidence: payload.transcript_confidence ?? null,
  })

  const { data: responseRow, error: responseError } = await supabaseAdmin
    .from('interview_responses')
    .insert({
      session_id: payload.session_id,
      question_id: payload.question_id,
      order_index: payload.order_index,
      audio_duration_seconds: payload.audio_duration_seconds,
      transcript: payload.transcript.trim(),
      transcript_confidence: payload.transcript_confidence ?? null,
      word_count: wordCount,
      processing_status: 'pending',
    })
    .select('id')
    .single()

  if (responseError || !responseRow) {
    return res.status(500).json({ success: false, error: 'Failed to save interview response' })
  }

  let queued = false
  let jobId: string | undefined

  try {
    jobId = `voice-${payload.session_id}-${payload.order_index}`
    console.info('[Interview API] Enqueueing voice evaluation job:', {
      job_id: jobId,
      application_id: payload.application_id,
      session_id: payload.session_id,
      question_id: payload.question_id,
      order_index: payload.order_index,
      audio_duration_seconds: payload.audio_duration_seconds,
      transcript_chars: payload.transcript.length,
    })
    await voiceEvaluationQueue.add(
      'voice-evaluation',
      {
        applicationId: payload.application_id,
        sessionId: payload.session_id,
        questionId: payload.question_id,
        transcript: payload.transcript,
        audioDurationSeconds: payload.audio_duration_seconds,
      },
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
    console.error('[Interview API] Failed to enqueue voice evaluation job', enqueueError)
  }

  return res.status(200).json({
    success: true,
    data: {
      responseId: responseRow.id,
      queued,
      jobId,
    },
  })
}
