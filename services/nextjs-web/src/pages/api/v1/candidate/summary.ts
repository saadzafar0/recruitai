import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

interface CandidateSummaryResponse {
  appliedJobs: number
  inProgress: number
  completed: number
}

const completedStatuses = new Set([
  'offer_accepted',
  'offer_declined',
  'hired',
  'withdrawn',
])

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CandidateSummaryResponse | { error: string }>
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
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
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return res.status(403).json({ error: 'Profile not found' })
  }

  if (profile.role !== 'applicant') {
    return res.status(403).json({ error: 'Only candidates can access this summary' })
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0')

  const { data: applications, error } = await supabaseAdmin
    .from('applications')
    .select('status')
    .eq('applicant_id', profile.id)

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch applications' })
  }

  const appliedJobs = (applications || []).filter((app) => app.status !== 'draft').length
  const completed = (applications || []).filter((app) => completedStatuses.has(app.status)).length
  const inProgress = Math.max(appliedJobs - completed, 0)

  return res.status(200).json({
    appliedJobs,
    inProgress,
    completed,
  })
}
