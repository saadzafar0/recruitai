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
    return res.status(403).json({ error: 'Only recruiters can access interviews' })
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
    return res.status(200).json({ interviews: [] })
  }

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('job_postings')
    .select('id')
    .in('organization_id', Array.from(allowedOrgIds))

  if (jobsError) {
    console.error('Error fetching job postings for interviews:', jobsError)
    return res.status(500).json({ error: 'Failed to load job postings' })
  }

  const jobIds = (jobs || []).map((job) => job.id).filter(Boolean)

  if (jobIds.length === 0) {
    return res.status(200).json({ interviews: [] })
  }

  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('interview_sessions')
    .select(`
      id,
      application_id,
      completed_at,
      duration_seconds,
      applications:applications (
        id,
        created_at,
        submitted_at,
        voice_score,
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
    .eq('status', 'completed')
    .in('applications.job_id', jobIds)
    .order('completed_at', { ascending: false })

  if (sessionsError) {
    console.error('Error fetching recruiter interviews:', sessionsError)
    return res.status(500).json({ error: 'Failed to fetch interviews' })
  }

  const interviews = (sessions || [])
    .map((session: any) => {
      const application = session.applications
      if (!application || !application.applicant) return null

      const candidateName = `${application.applicant.first_name} ${application.applicant.last_name}`.trim()

      return {
        session_id: session.id,
        application_id: session.application_id,
        candidate_id: application.applicant.id,
        candidate_name: candidateName,
        job_title: application.job?.title || 'Role not available',
        organization_name: application.job?.organization?.name || null,
        completed_at: session.completed_at || null,
        duration_seconds: session.duration_seconds || null,
        voice_score: application.voice_score ?? null,
      }
    })
    .filter(Boolean)

  return res.status(200).json({ interviews })
}
