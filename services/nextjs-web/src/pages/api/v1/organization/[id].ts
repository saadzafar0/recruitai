/**
 * Organization API - Single Organization
 * GET /api/v1/organization/[id] - Get organization by ID
 * PUT /api/v1/organization/[id] - Update organization
 * DELETE /api/v1/organization/[id] - Delete organization
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import type { Organization, OrganizationUpdate } from '@/types/organization'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Organization ID is required' })
  }

  // Get auth token from header
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  // Verify user
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return res.status(403).json({ error: 'Profile not found' })
  }

  // Check if user belongs to this organization
  if (profile.organization_id !== id && profile.role !== 'admin') {
    return res.status(403).json({ error: 'You do not have access to this organization' })
  }

  switch (req.method) {
    case 'GET':
      return handleGet(res, id)
    case 'PUT':
      return handlePut(req, res, id)
    case 'DELETE':
      return handleDelete(res, id, profile)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}

async function handleGet(
  res: NextApiResponse<Organization | { error: string }>,
  id: string
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !org) {
    return res.status(404).json({ error: 'Organization not found' })
  }

  return res.status(200).json(org)
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<Organization | { error: string }>,
  id: string
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const body: OrganizationUpdate = req.body

  // Build update object (only include provided fields)
  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.logo_url !== undefined) updateData.logo_url = body.logo_url
  if (body.website_url !== undefined) updateData.website_url = body.website_url
  if (body.industry !== undefined) updateData.industry = body.industry
  if (body.size_range !== undefined) updateData.size_range = body.size_range
  if (body.country !== undefined) updateData.country = body.country
  if (body.city !== undefined) updateData.city = body.city
  updateData.updated_at = new Date().toISOString()

  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating organization:', error)
    return res.status(500).json({ error: 'Failed to update organization' })
  }

  return res.status(200).json(org)
}

async function handleDelete(
  res: NextApiResponse<{ success: boolean } | { error: string }>,
  id: string,
  profile: { id: string; organization_id: string | null }
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // First, remove organization_id from all profiles that belong to this org
  await supabaseAdmin
    .from('profiles')
    .update({ organization_id: null })
    .eq('organization_id', id)

  // Delete the organization (this will cascade delete job_postings due to FK)
  const { error } = await supabaseAdmin
    .from('organizations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting organization:', error)
    return res.status(500).json({ error: 'Failed to delete organization' })
  }

  return res.status(200).json({ success: true })
}
