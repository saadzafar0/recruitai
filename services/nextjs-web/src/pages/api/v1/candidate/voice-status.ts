import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

type ApiResponse = {
  success: boolean
  data?: { status: 'not_started' | 'in_progress' | 'completed' }
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

  const applicationId = typeof req.query.applicationId === 'string' ? req.query.applicationId : ''
  if (!applicationId) {
    return res.status(400).json({ success: false, error: 'applicationId is required' })
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

  const { data: application, error: applicationError } = await supabaseAdmin
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('applicant_id', profile.id)
    .single()

  if (applicationError || !application) {
    return res.status(404).json({ success: false, error: 'Application not found' })
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('interview_sessions')
    .select('id, status, full_transcript')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (sessionError) {
    return res.status(500).json({ success: false, error: 'Failed to load interview session' })
  }

  if (!session) {
    return res.status(200).json({ success: true, data: { status: 'not_started' } })
  }

  if (session.status === 'completed' || (session.full_transcript || '').trim()) {
    return res.status(200).json({ success: true, data: { status: 'completed' } })
  }

  return res.status(200).json({ success: true, data: { status: 'in_progress' } })
}
