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
    return res.status(200).json({
      profile: null,
      candidateProfile: null,
      skills: [],
      education: [],
      experience: [],
      application: null,
    })
  }

  const { data: candidateProfile, error: candidateProfileError } = await supabaseAdmin
    .from('profiles')
    .select('id, first_name, last_name, email, phone')
    .eq('id', applicantId)
    .single()

  if (candidateProfileError || !candidateProfile) {
    return res.status(404).json({ error: 'Candidate not found' })
  }

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('job_postings')
    .select('id')
    .in('organization_id', Array.from(allowedOrgIds))

  if (jobsError) {
    console.error('Error fetching job postings for candidate:', jobsError)
    return res.status(500).json({ error: 'Failed to load job postings' })
  }

  const jobIds = (jobs || []).map((job) => job.id).filter(Boolean)

  const { data: application } = await supabaseAdmin
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
      job:job_postings (
        id,
        title,
        organization:organizations (
          name
        )
      )
    `)
    .eq('applicant_id', applicantId)
    .in('job_id', jobIds)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: candidateProfileRow, error: candidateProfileRowError } = await supabaseAdmin
    .from('candidate_profiles')
    .select(`
      id,
      applicant_id,
      headline,
      summary,
      total_experience_months,
      highest_degree,
      university,
      graduation_year,
      skills_raw,
      cv_file_url,
      cv_file_name,
      cv_parsed_at
    `)
    .eq('applicant_id', applicantId)
    .maybeSingle()

  if (candidateProfileRowError) {
    console.error('Error fetching candidate profile:', candidateProfileRowError)
    return res.status(500).json({ error: 'Failed to load candidate profile' })
  }

  let skills: any[] = []
  let education: any[] = []
  let experience: any[] = []

  if (candidateProfileRow?.id) {
    const { data: skillsData } = await supabaseAdmin
      .from('candidate_skills')
      .select('id, skill_name, proficiency, years_used')
      .eq('profile_id', candidateProfileRow.id)
      .order('skill_name')

    const { data: educationData } = await supabaseAdmin
      .from('candidate_education')
      .select('id, institution, degree, field_of_study, gpa, start_date, end_date, is_current')
      .eq('profile_id', candidateProfileRow.id)
      .order('start_date', { ascending: false })

    const { data: experienceData } = await supabaseAdmin
      .from('candidate_experience')
      .select('id, company, title, location, employment_type, start_date, end_date, is_current, description')
      .eq('profile_id', candidateProfileRow.id)
      .order('start_date', { ascending: false })

    skills = skillsData || []
    education = educationData || []
    experience = experienceData || []
  }

  return res.status(200).json({
    profile: candidateProfile,
    candidateProfile: candidateProfileRow || null,
    skills,
    education,
    experience,
    application: application || null,
  })
}
