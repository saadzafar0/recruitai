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
    // 200 (not 404): executor creates the assessment asynchronously after BullMQ dequeue.
    // Polling should treat this as "still processing" without browser 404 noise.
    return res.status(200).json({
      success: true,
      data: { verdict: 'pending', output: '' },
    })
  }

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('coding_submissions')
    .select('id, verdict, ai_feedback')
    .eq('assessment_id', assessment.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (submissionError) {
    return res.status(500).json({ success: false, error: 'Failed to fetch submission' })
  }

  if (!submission) {
    return res.status(200).json({
      success: true,
      data: { verdict: 'pending', output: '' },
    })
  }

  let output = submission.ai_feedback || ''

  if (!output && submission.verdict && submission.verdict !== 'pending') {
    const { data: failedResult } = await supabaseAdmin
      .from('coding_test_results')
      .select('error_message, actual_output')
      .eq('submission_id', submission.id)
      .eq('passed', false)
      .limit(1)
      .maybeSingle()

    if (failedResult) {
      const parts = []
      if (failedResult.error_message) parts.push(`Error: ${failedResult.error_message}`)
      if (failedResult.actual_output) parts.push(`Output: ${failedResult.actual_output}`)
      output = parts.join('\n')
    } else {
      const { data: anyResult } = await supabaseAdmin
        .from('coding_test_results')
        .select('error_message, actual_output')
        .eq('submission_id', submission.id)
        .limit(1)
        .maybeSingle()

      if (anyResult) {
        const parts = []
        if (anyResult.error_message) parts.push(`Error: ${anyResult.error_message}`)
        if (anyResult.actual_output) parts.push(`Output: ${anyResult.actual_output}`)
        output = parts.join('\n')
      }
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      verdict: submission.verdict || 'pending',
      output,
    },
  })
}
