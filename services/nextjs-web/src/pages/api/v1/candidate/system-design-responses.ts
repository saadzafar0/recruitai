import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

interface ApiResponse {
  success: boolean
  data?: {
    assessmentId: string
    responseId: string
  }
  error?: string
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

  const { applicationId, problemId, writtenResponse } = req.body || {}

  if (typeof applicationId !== 'string' || !applicationId.trim()) {
    return res.status(400).json({ success: false, error: 'Missing applicationId' })
  }

  if (typeof problemId !== 'string' || !problemId.trim()) {
    return res.status(400).json({ success: false, error: 'Missing problemId' })
  }

  if (typeof writtenResponse !== 'string' || !writtenResponse.trim()) {
    return res.status(400).json({ success: false, error: 'Written response is required' })
  }

  const { data: application, error: applicationError } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('applicant_id', profile.id)
    .single()

  if (applicationError || !application) {
    return res.status(404).json({ success: false, error: 'Application not found' })
  }

  const { data: existingAssessment, error: assessmentError } = await supabaseAdmin
    .from('system_design_assessments')
    .select('id')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (assessmentError) {
    return res.status(500).json({ success: false, error: 'Failed to load assessment' })
  }

  let assessmentId = existingAssessment?.id as string | undefined

  if (!assessmentId) {
    const { data: createdAssessment, error: createError } = await supabaseAdmin
      .from('system_design_assessments')
      .insert({
        application_id: applicationId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (createError || !createdAssessment) {
      return res.status(500).json({ success: false, error: 'Failed to create assessment' })
    }

    assessmentId = createdAssessment.id
  }

  const { data: createdResponse, error: responseError } = await supabaseAdmin
    .from('system_design_responses')
    .insert({
      assessment_id: assessmentId,
      problem_id: problemId,
      written_response: writtenResponse.trim(),
    })
    .select('id')
    .single()

  if (responseError || !createdResponse) {
    return res.status(500).json({ success: false, error: 'Failed to save response' })
  }

  const { error: updateError } = await supabaseAdmin
    .from('system_design_assessments')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)

  if (updateError) {
    return res.status(500).json({ success: false, error: 'Failed to update assessment status' })
  }

  return res.status(200).json({
    success: true,
    data: {
      assessmentId,
      responseId: createdResponse.id,
    },
  })
}
