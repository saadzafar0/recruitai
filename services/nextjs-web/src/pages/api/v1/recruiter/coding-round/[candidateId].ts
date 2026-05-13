import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { embedOne } from '@/lib/utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server is not configured with SUPABASE_SERVICE_ROLE_KEY' })
  }

  const { candidateId } = req.query
  const applicantId = typeof candidateId === 'string' ? candidateId : ''

  if (!applicantId) {
    return res.status(400).json({ error: 'candidateId is required' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return res.status(403).json({ error: 'Profile not found' })
  }

  if (profile.role !== 'recruiter' && profile.role !== 'admin') {
    return res.status(403).json({ error: 'Only recruiters can access coding rounds' })
  }

  const allowedOrgIds = new Set<string>()
  if (profile.organization_id) {
    allowedOrgIds.add(profile.organization_id)
  }

  const { data: memberships } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', profile.id)

  for (const row of memberships || []) {
    const orgId = (row as { organization_id?: string }).organization_id
    if (orgId) allowedOrgIds.add(orgId)
  }

  if (allowedOrgIds.size === 0) {
    return res.status(200).json(null)
  }

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('job_postings')
    .select('id')
    .in('organization_id', Array.from(allowedOrgIds))

  if (jobsError) {
    console.error('Error fetching job postings for coding detail:', jobsError)
    return res.status(500).json({ error: 'Failed to load job postings' })
  }

  const jobIds = (jobs || []).map((job) => job.id).filter(Boolean)

  if (jobIds.length === 0) {
    return res.status(200).json(null)
  }

  const { data: application, error: applicationError } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      created_at,
      coding_score,
      applicant:profiles!applications_applicant_id_fkey (
        id,
        first_name,
        last_name
      ),
      job:job_postings (
        id,
        title
      )
    `)
    .eq('applicant_id', applicantId)
    .in('job_id', jobIds)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (applicationError) {
    console.error('Error fetching coding application:', applicationError)
    return res.status(500).json({ error: 'Failed to load application' })
  }

  const applicantRow = embedOne(application?.applicant)
  const jobRow = embedOne(application?.job)

  if (!application || !applicantRow) {
    return res.status(404).json({ error: 'Candidate application not found' })
  }

  const { data: assessment, error: assessmentError } = await supabaseAdmin
    .from('coding_assessments')
    .select('id, submitted_at')
    .eq('application_id', application.id)
    .maybeSingle()

  if (assessmentError) {
    console.error('Error fetching coding assessment:', assessmentError)
    return res.status(500).json({ error: 'Failed to load coding assessment' })
  }

  if (!assessment) {
    return res.status(200).json({
      candidate_id: applicantRow.id,
      candidate_name: `${applicantRow.first_name} ${applicantRow.last_name}`.trim(),
      job_title: jobRow?.title || 'Role not available',
      submitted_at: null,
      language: null,
      problem_title: null,
      coding_score: application.coding_score ?? null,
      submission: null,
      test_results: [],
    })
  }

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('coding_submissions')
    .select(`
      id,
      language,
      source_code,
      submitted_at,
      score_correctness,
      score_efficiency,
      score_code_quality,
      score_best_practices,
      ai_feedback,
      total_score,
      problem:coding_problems (
        title
      )
    `)
    .eq('assessment_id', assessment.id)
    .eq('is_final', true)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (submissionError) {
    console.error('Error fetching coding submission:', submissionError)
    return res.status(500).json({ error: 'Failed to load coding submission' })
  }

  let testResults: Array<any> = []

  if (submission?.id) {
    const { data: results, error: resultsError } = await supabaseAdmin
      .from('coding_test_results')
      .select(`
        id,
        passed,
        actual_output,
        error_message,
        test_case:coding_test_cases (
          input,
          expected_output
        )
      `)
      .eq('submission_id', submission.id)

    if (resultsError) {
      console.error('Error fetching test results:', resultsError)
    } else {
      testResults = (results || []).map((result: any) => ({
        id: result.id,
        input: result.test_case?.input || '',
        expected_output: result.test_case?.expected_output || '',
        actual_output: result.actual_output || null,
        passed: Boolean(result.passed),
        error_message: result.error_message || null,
      }))
    }
  }

  const problemRow = submission ? embedOne(submission.problem) : null

  const candidateName = `${applicantRow.first_name} ${applicantRow.last_name}`.trim()

  return res.status(200).json({
    candidate_id: applicantRow.id,
    candidate_name: candidateName,
    job_title: jobRow?.title || 'Role not available',
    submitted_at: assessment.submitted_at || submission?.submitted_at || null,
    language: submission?.language || null,
    problem_title: problemRow?.title || null,
    coding_score: application.coding_score ?? null,
    submission: submission
      ? {
          id: submission.id,
          source_code: submission.source_code || '',
          total_score: submission.total_score ?? null,
          score_correctness: submission.score_correctness ?? null,
          score_efficiency: submission.score_efficiency ?? null,
          score_code_quality: submission.score_code_quality ?? null,
          score_best_practices: submission.score_best_practices ?? null,
          ai_feedback: submission.ai_feedback || null,
        }
      : null,
    test_results: testResults,
  })
}
