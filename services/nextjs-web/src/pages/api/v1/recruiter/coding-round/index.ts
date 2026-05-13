import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

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
    return res.status(200).json({ rounds: [] })
  }

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('job_postings')
    .select('id')
    .in('organization_id', Array.from(allowedOrgIds))

  if (jobsError) {
    console.error('Error fetching job postings for coding rounds:', jobsError)
    return res.status(500).json({ error: 'Failed to load job postings' })
  }

  const jobIds = (jobs || []).map((job) => job.id).filter(Boolean)

  if (jobIds.length === 0) {
    return res.status(200).json({ rounds: [] })
  }

  const { data: assessments, error: assessmentsError } = await supabaseAdmin
    .from('coding_assessments')
    .select(`
      id,
      application_id,
      status,
      submitted_at,
      applications:applications (
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
          title,
          organization:organizations (
            name
          )
        )
      )
    `)
    .in('applications.job_id', jobIds)
    .order('submitted_at', { ascending: false })

  if (assessmentsError) {
    console.error('Error fetching coding assessments:', assessmentsError)
    return res.status(500).json({ error: 'Failed to fetch coding assessments' })
  }

  const relevantAssessments = (assessments || []).filter((assessment: any) => {
    if (!assessment.applications || !assessment.applications.applicant) return false
    if (assessment.status === 'submitted' || assessment.status === 'scored') return true
    return Boolean(assessment.submitted_at || assessment.applications.coding_score)
  })

  const assessmentIds = relevantAssessments.map((assessment: any) => assessment.id)

  let submissionsByAssessment = new Map<string, any>()

  if (assessmentIds.length > 0) {
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('coding_submissions')
      .select(`
        assessment_id,
        language,
        submitted_at,
        problem:coding_problems (
          title
        )
      `)
      .in('assessment_id', assessmentIds)
      .eq('is_final', true)
      .order('submitted_at', { ascending: false })

    if (submissionsError) {
      console.error('Error fetching coding submissions:', submissionsError)
    } else {
      for (const submission of submissions || []) {
        if (!submissionsByAssessment.has(submission.assessment_id)) {
          submissionsByAssessment.set(submission.assessment_id, submission)
        }
      }
    }
  }

  const rounds = relevantAssessments.map((assessment: any) => {
    const application = assessment.applications
    const submission = submissionsByAssessment.get(assessment.id)
    const candidateName = `${application.applicant.first_name} ${application.applicant.last_name}`.trim()

    return {
      assessment_id: assessment.id,
      application_id: assessment.application_id,
      candidate_id: application.applicant.id,
      candidate_name: candidateName,
      job_title: application.job?.title || 'Role not available',
      submitted_at: assessment.submitted_at || null,
      language: submission?.language || null,
      problem_title: submission?.problem?.title || null,
      coding_score: application.coding_score ?? null,
    }
  })

  return res.status(200).json({ rounds })
}
