import type { NextApiRequest, NextApiResponse } from 'next'
import { randomInt } from 'node:crypto'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

const SessionRequestSchema = z.object({
  application_id: z.string().uuid(),
  question_count: z.number().int().min(1).max(10).optional(),
})

type ApiResponse = {
  success: boolean
  data?: {
    sessionId: string
    questions: Array<{ id: string; text: string }>
  }
  error?: string
  details?: unknown
}

function pickRandom<T>(items: T[], count: number): T[] {
  if (items.length <= count) return [...items]
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1)
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr.slice(0, count)
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

  let payload: z.infer<typeof SessionRequestSchema>
  try {
    payload = SessionRequestSchema.parse(req.body)
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
    .select('id, applicant_id')
    .eq('id', payload.application_id)
    .single()

  if (applicationError || !application) {
    return res.status(404).json({ success: false, error: 'Application not found' })
  }

  if (application.applicant_id !== profile.id) {
    return res.status(403).json({ success: false, error: 'Access denied' })
  }

  const { data: existingSession, error: sessionLoadError } = await supabaseAdmin
    .from('interview_sessions')
    .select('id, device_info')
    .eq('application_id', payload.application_id)
    .maybeSingle()

  if (sessionLoadError) {
    return res.status(500).json({ success: false, error: 'Failed to load interview session' })
  }

  const { data: questionRows, error: questionError } = await supabaseAdmin
    .from('interview_questions')
    .select('id, question_text, is_active')
    .eq('is_active', true)

  if (questionError || !questionRows || questionRows.length === 0) {
    return res.status(500).json({ success: false, error: 'No interview questions available' })
  }

  const priorIds = new Set<string>()
  const deviceInfo = (existingSession?.device_info as Record<string, unknown> | null) || null
  const prior = deviceInfo?.interview_question_ids
  if (Array.isArray(prior)) {
    for (const id of prior) {
      if (typeof id === 'string' && id.trim()) priorIds.add(id)
    }
  }

  const count = payload.question_count ?? 4
  const eligible = priorIds.size > 0
    ? questionRows.filter((row) => !priorIds.has(row.id as string))
    : questionRows
  const picked = pickRandom(eligible.length >= count ? eligible : questionRows, count)
  const questions = picked.map((row) => ({
    id: row.id as string,
    text: row.question_text as string,
  }))

  const deviceInfoPayload = {
    interview_question_ids: questions.map((q) => q.id),
    interview_question_texts: questions.map((q) => q.text),
    interview_questions_picked_at: new Date().toISOString(),
  }

  let sessionId: string

  if (existingSession?.id) {
    const mergedDeviceInfo = {
      ...(existingSession.device_info as Record<string, unknown> | null || {}),
      ...deviceInfoPayload,
    }

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('interview_sessions')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        device_info: mergedDeviceInfo,
      })
      .eq('id', existingSession.id)
      .select('id')
      .single()

    if (updateError || !updatedSession) {
      return res.status(500).json({ success: false, error: 'Failed to update interview session' })
    }

    sessionId = updatedSession.id
  } else {
    const { data: createdSession, error: createError } = await supabaseAdmin
      .from('interview_sessions')
      .insert({
        application_id: payload.application_id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        device_info: deviceInfoPayload,
      })
      .select('id')
      .single()

    if (createError || !createdSession) {
      return res.status(500).json({ success: false, error: 'Failed to create interview session' })
    }

    sessionId = createdSession.id
  }

  return res.status(200).json({
    success: true,
    data: {
      sessionId,
      questions,
    },
  })
}
