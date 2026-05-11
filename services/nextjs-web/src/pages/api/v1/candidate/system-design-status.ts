import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

type DesignStatus = 'not_started' | 'in_progress' | 'completed'

interface ApiResponse {
  success: boolean
  data?: {
    status: DesignStatus
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' })
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

  const applicationId = typeof req.query.applicationId === 'string'
    ? req.query.applicationId.trim()
    : ''

  if (!applicationId) {
    return res.status(400).json({ success: false, error: 'Missing applicationId' })
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

  const { data: assessment, error: assessmentError } = await supabaseAdmin
    .from('system_design_assessments')
    .select('id, status')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (assessmentError) {
    return res.status(500).json({ success: false, error: 'Failed to load assessment' })
  }

  if (!assessment) {
    return res.status(200).json({ success: true, data: { status: 'not_started' } })
  }

  const { data: responseCount, error: responseError } = await supabaseAdmin
    .from('system_design_responses')
    .select('id', { count: 'exact', head: true })
    .eq('assessment_id', assessment.id)

  if (responseError) {
    return res.status(500).json({ success: false, error: 'Failed to load system design responses' })
  }

  if ((responseCount ?? 0) > 0 || assessment.status === 'submitted' || assessment.status === 'completed') {
    return res.status(200).json({ success: true, data: { status: 'completed' } })
  }

  return res.status(200).json({ success: true, data: { status: 'in_progress' } })
}
