import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

const FinalizeSchema = z.object({
  application_id: z.string().uuid(),
})

type ApiResponse = {
  success: boolean
  data?: {
    composite_score?: number
  }
  error?: string
  details?: unknown
}

function computeCompositeScore(
  scores: { cv: number | null; voice: number | null; coding: number | null; design: number | null },
  weights: { cv: number; voice: number; coding: number; design: number },
): { composite: number; missing: string[] } {
  const missing: string[] = []
  if (scores.voice === null && weights.voice > 0) missing.push('voice')
  if (scores.coding === null && weights.coding > 0) missing.push('coding')
  if (scores.design === null && weights.design > 0) missing.push('system_design')

  const cvMissing = scores.cv === null && weights.cv > 0

  const adjustedWeights = {
    cv: cvMissing ? 0 : weights.cv,
    voice: weights.voice,
    coding: weights.coding,
    design: weights.design,
  }

  const totalWeight = adjustedWeights.cv + adjustedWeights.voice + adjustedWeights.coding + adjustedWeights.design

  if (totalWeight <= 0) {
    return { composite: 0, missing: [...missing, 'weights'] }
  }

  const composite = (
    (scores.cv ?? 0) * adjustedWeights.cv +
    (scores.voice ?? 0) * adjustedWeights.voice +
    (scores.coding ?? 0) * adjustedWeights.coding +
    (scores.design ?? 0) * adjustedWeights.design
  ) / totalWeight

  return { composite: Math.round(composite * 100) / 100, missing }
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

  let payload: z.infer<typeof FinalizeSchema>
  try {
    payload = FinalizeSchema.parse(req.body)
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
    .select('id, job_id, cv_score, voice_score, coding_score, system_design_score')
    .eq('id', payload.application_id)
    .eq('applicant_id', profile.id)
    .single()

  if (applicationError || !application) {
    return res.status(404).json({ success: false, error: 'Application not found' })
  }

  const { data: assessment, error: assessmentError } = await supabaseAdmin
    .from('coding_assessments')
    .select('id')
    .eq('application_id', payload.application_id)
    .maybeSingle()

  if (assessmentError) {
    return res.status(500).json({ success: false, error: 'Failed to load coding assessment' })
  }

  if (!assessment) {
    return res.status(404).json({ success: false, error: 'Coding assessment not found' })
  }

  const { error: updateError } = await supabaseAdmin
    .from('coding_assessments')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', assessment.id)

  if (updateError) {
    return res.status(500).json({ success: false, error: 'Failed to update coding assessment status' })
  }

  const { data: job, error: jobError } = await supabaseAdmin
    .from('job_postings')
    .select('weight_cv, weight_voice, weight_coding, weight_system_design')
    .eq('id', application.job_id)
    .single()

  if (jobError || !job) {
    return res.status(500).json({ success: false, error: 'Job posting not found' })
  }

  const weights = {
    cv: job.weight_cv ?? 25,
    voice: job.weight_voice ?? 35,
    coding: job.weight_coding ?? 30,
    design: job.weight_system_design ?? 10,
  }

  const scores = {
    cv: application.cv_score,
    voice: application.voice_score,
    coding: application.coding_score,
    design: application.system_design_score,
  }

  const computed = computeCompositeScore(scores, weights)
  if (computed.missing.length > 0) {
    return res.status(200).json({
      success: true,
      data: { composite_score: undefined },
      error: `Composite score not updated. Missing: ${computed.missing.join(', ')}`,
    })
  }

  const { error: scoreUpdateError } = await supabaseAdmin
    .from('applications')
    .update({
      composite_score: computed.composite,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.application_id)

  if (scoreUpdateError) {
    return res.status(500).json({ success: false, error: 'Failed to update composite score' })
  }

  return res.status(200).json({
    success: true,
    data: { composite_score: computed.composite },
  })
}
