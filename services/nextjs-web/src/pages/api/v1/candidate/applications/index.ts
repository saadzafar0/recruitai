import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
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

  // Get candidate profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'applicant') {
    return res.status(403).json({ error: 'Access denied' })
  }

  // Fetch applications with job details
  const { data: applications, error: applicationsError } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      job:job_postings (
        id,
        title,
        organization:organizations (
          name
        )
      )
    `)
    .eq('applicant_id', profile.id)
    .order('created_at', { ascending: false })

  if (applicationsError) {
    console.error('Error fetching candidate applications:', applicationsError)
    return res.status(500).json({ error: 'Failed to fetch applications' })
  }

  return res.status(200).json({ applications })
}
