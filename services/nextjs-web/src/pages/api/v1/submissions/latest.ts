import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase'

type ApiResponse = {
  success: boolean
  data?: {
    verdict: string
    output?: string
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

  const applicationId = typeof req.query.application_id === 'string' ? req.query.application_id : ''
  if (!applicationId) {
    return res.status(400).json({ success: false, error: 'application_id is required' })
  }

  const { data: assessment, error: assessmentError } = await supabaseAdmin
    .from('coding_assessments')
    .select('id')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (assessmentError) {
    return res.status(500).json({ success: false, error: 'Failed to fetch assessment' })
  }

  if (!assessment?.id) {
    return res.status(404).json({ success: false, error: 'No assessment found for this application' })
  }

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('coding_submissions')
    .select('verdict, ai_feedback')
    .eq('assessment_id', assessment.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (submissionError) {
    return res.status(500).json({ success: false, error: 'Failed to fetch submission' })
  }

  if (!submission) {
    return res.status(404).json({ success: false, error: 'No submissions found yet' })
  }

  return res.status(200).json({
    success: true,
    data: {
      verdict: submission.verdict || 'pending',
      output: submission.ai_feedback || '',
    },
  })
}
