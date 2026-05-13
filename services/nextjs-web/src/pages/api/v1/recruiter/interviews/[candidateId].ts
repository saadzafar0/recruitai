import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

type TranscriptQuality = 'high' | 'medium' | 'low' | 'neutral'

function toScore(value: number | null): number {
  if (value === null || Number.isNaN(value)) return 0
  const normalized = Math.round(value * 10)
  return Math.max(0, Math.min(100, normalized))
}

function getQuality(score: number | null): TranscriptQuality {
  if (score === null || Number.isNaN(score)) return 'neutral'
  if (score >= 8) return 'high'
  if (score >= 6) return 'medium'
  return 'low'
}

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
    return res.status(200).json(null)
  }

  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('job_postings')
    .select('id')
    .in('organization_id', Array.from(allowedOrgIds))

  if (jobsError) {
    console.error('Error fetching job postings for interview detail:', jobsError)
    return res.status(500).json({ error: 'Failed to load job postings' })
  }

  const jobIds = (jobs || []).map((job) => job.id).filter(Boolean)

  if (jobIds.length === 0) {
    return res.status(200).json(null)
  }

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('interview_sessions')
    .select(`
      id,
      application_id,
      completed_at,
      full_transcript,
      applications:applications (
        id,
        created_at,
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
    .eq('applications.applicant_id', applicantId)
    .in('applications.job_id', jobIds)
    .order('completed_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionError) {
    console.error('Error fetching interview session detail:', sessionError)
    return res.status(500).json({ error: 'Failed to load interview session' })
  }

  if (!session || !session.applications || !session.applications.applicant) {
    return res.status(404).json({ error: 'Interview session not found' })
  }

  const { data: responses, error: responsesError } = await supabaseAdmin
    .from('interview_responses')
    .select('id, order_index, transcript, score_clarity, score_relevance, score_confidence, score_communication')
    .eq('session_id', session.id)
    .order('order_index', { ascending: true })

  if (responsesError) {
    console.error('Error fetching interview responses:', responsesError)
    return res.status(500).json({ error: 'Failed to load interview transcript' })
  }

  const transcript = (responses || [])
    .filter((line) => line.transcript)
    .map((line, index) => ({
      id: line.id || `${index}`,
      speaker: 'Candidate',
      text: line.transcript || '',
      quality: getQuality(line.score_communication ?? null),
    }))

  if (transcript.length === 0 && session.full_transcript) {
    transcript.push({
      id: 'full-transcript',
      speaker: 'Candidate',
      text: session.full_transcript,
      quality: 'neutral',
    })
  }

  const clarity = (responses || []).map((line, index) => ({
    q: `Q${line.order_index ?? index + 1}`,
    score: toScore(line.score_clarity ?? null),
  }))

  const relevance = (responses || []).map((line, index) => ({
    q: `Q${line.order_index ?? index + 1}`,
    score: toScore(line.score_relevance ?? null),
  }))

  const confidence = (responses || []).map((line, index) => ({
    q: `Q${line.order_index ?? index + 1}`,
    score: toScore(line.score_confidence ?? null),
  }))

  const candidateName = `${session.applications.applicant.first_name} ${session.applications.applicant.last_name}`.trim()

  return res.status(200).json({
    candidate_id: session.applications.applicant.id,
    candidate_name: candidateName,
    job_title: session.applications.job?.title || 'Role not available',
    completed_at: session.completed_at || null,
    voice_score: session.applications.voice_score ?? null,
    transcript,
    clarity,
    relevance,
    confidence,
  })
}
