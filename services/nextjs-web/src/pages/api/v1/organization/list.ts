/**
 * Organization API
 * GET /api/v1/organization/list - List organizations for the current user
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import type { Organization } from '@/types/organization'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Organization[] | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
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
    return res.status(403).json({ error: 'Only recruiters can manage organizations' })
  }

  const orgIds = new Set<string>()
  if (profile.organization_id) {
    orgIds.add(profile.organization_id)
  }

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', profile.id)

  if (membershipError) {
    return res.status(500).json({ error: 'Failed to load organization memberships' })
  }

  for (const row of memberships || []) {
    const orgId = (row as { organization_id?: string }).organization_id
    if (orgId) orgIds.add(orgId)
  }

  if (orgIds.size === 0) {
    return res.status(200).json([])
  }

  const { data: organizations, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .in('id', Array.from(orgIds))
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch organizations' })
  }

  return res.status(200).json(organizations as Organization[])
}
