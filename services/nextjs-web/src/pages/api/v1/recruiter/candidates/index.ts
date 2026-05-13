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
    return res.status(403).json({ error: 'Only recruiters can access candidates' })
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
    return res.status(200).json({ candidates: [] })
  }

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('job_postings')
    .select('id')
    .in('organization_id', Array.from(allowedOrgIds))

  if (jobsError) {
    console.error('Error fetching job postings for candidates:', jobsError)
    return res.status(500).json({ error: 'Failed to load job postings' })
  }

  const jobIds = (jobs || []).map((job) => job.id).filter(Boolean)

  if (jobIds.length === 0) {
    return res.status(200).json({ candidates: [] })
  }

  const { data: candidates, error: candidatesError } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      cv_score,
      voice_score,
      coding_score,
      system_design_score,
      composite_score,
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
    `)
    .in('job_id', jobIds)
    .order('created_at', { ascending: false })

  if (candidatesError) {
    console.error('Error fetching recruiter candidates:', candidatesError)
    return res.status(500).json({ error: 'Failed to fetch candidates' })
  }

  const normalizedCandidates = (candidates || []).map((candidate) => ({
    application_id: candidate.id,
    applicant_id: candidate.applicant?.id || candidate.id,
    status: candidate.status,
    created_at: candidate.created_at,
    cv_score: candidate.cv_score,
    voice_score: candidate.voice_score,
    coding_score: candidate.coding_score,
    system_design_score: candidate.system_design_score,
    composite_score: candidate.composite_score,
    applicant: candidate.applicant || null,
    job: candidate.job || null,
  }))

  return res.status(200).json({ candidates: normalizedCandidates })
}
