import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { systemDesignEvaluationQueue } from '@/lib/bull'

const SystemDesignQueueSchema = z.object({
  assessment_id: z.string().uuid(),
  question_id: z.string().uuid(),
  response_id: z.string().uuid().optional(),
  application_id: z.string().uuid().optional(),
})

type ApiResponse = {
  success: boolean
  data?: {
    queued: boolean
    jobId?: string
  }
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

  let payload: z.infer<typeof SystemDesignQueueSchema>
  try {
    payload = SystemDesignQueueSchema.parse(req.body)
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

  const { data: assessment, error: assessmentError } = await supabaseAdmin
    .from('system_design_assessments')
    .select('id, application_id')
    .eq('id', payload.assessment_id)
    .single()

  if (assessmentError || !assessment) {
    return res.status(404).json({ success: false, error: 'Assessment not found' })
  }

  if (payload.application_id && payload.application_id !== assessment.application_id) {
    return res.status(400).json({ success: false, error: 'Assessment does not match application' })
  }

  const { data: application, error: appError } = await supabaseAdmin
    .from('applications')
    .select('id, applicant_id')
    .eq('id', assessment.application_id)
    .single()

  if (appError || !application) {
    return res.status(404).json({ success: false, error: 'Application not found' })
  }

  if (application.applicant_id !== profile.id) {
    return res.status(403).json({ success: false, error: 'Access denied' })
  }

  console.info('[System Design API] Forwarding system-design payload:', {
    assessment_id: payload.assessment_id,
    question_id: payload.question_id,
    response_id: payload.response_id ?? null,
    application_id: assessment.application_id,
  })

  let queued = false
  let jobId: string | undefined

  try {
    jobId = `system-design-${assessment.id}-${payload.question_id}`
    console.info('[System Design API] Enqueueing system-design job:', {
      job_id: jobId,
      application_id: assessment.application_id,
      assessment_id: assessment.id,
      response_id: payload.response_id ?? null,
      question_id: payload.question_id,
    })
    await systemDesignEvaluationQueue.add(
      'system-design-evaluation',
      {
        applicationId: assessment.application_id,
        assessmentId: assessment.id,
        responseId: payload.response_id,
        questionId: payload.question_id,
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
    console.error('[System Design API] Failed to enqueue system-design job', enqueueError)
  }

  return res.status(200).json({
    success: true,
    data: {
      queued,
      jobId,
    },
  })
}
