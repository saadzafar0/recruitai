/**
 * Organization API
 * GET /api/v1/organization - Get current user's organization
 * POST /api/v1/organization - Create a new organization
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import type { Organization, OrganizationCreate } from '@/types/organization'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
}

async function getUniqueSlug(baseSlug: string): Promise<string> {
  if (!supabaseAdmin) throw new Error('Server configuration error')

  let slug = baseSlug
  let counter = 1

  while (true) {
    const { data } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) break
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
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

  if (profile.role !== 'recruiter' && profile.role !== 'admin') {
    return res.status(403).json({ error: 'Only recruiters can manage organizations' })
  }

  switch (req.method) {
    case 'GET':
      return handleGet(res, profile)
    case 'POST':
      return handlePost(req, res, profile)
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}

async function handleGet(
  res: NextApiResponse<Organization | { error: string } | null>,
  profile: { id: string; organization_id: string | null }
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  if (!profile.organization_id) {
    return res.status(200).json(null)
  }

  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return res.status(500).json({ error: 'Failed to fetch organization' })
  }

  return res.status(200).json(org)
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<Organization | { error: string }>,
  profile: { id: string; organization_id: string | null }
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  // Check if user already has an organization
  if (profile.organization_id) {
    return res.status(400).json({ error: 'You already have an organization' })
  }

  const body: OrganizationCreate = req.body

  if (!body.name) {
    return res.status(400).json({ error: 'Organization name is required' })
  }

  // Generate unique slug
  const baseSlug = body.slug || generateSlug(body.name)
  const slug = await getUniqueSlug(baseSlug)

  // Create the organization
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: body.name,
      slug,
      logo_url: body.logo_url || null,
      website_url: body.website_url || null,
      industry: body.industry || null,
      size_range: body.size_range || null,
      country: body.country || 'PK',
      city: body.city || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating organization:', error)
    return res.status(500).json({ error: 'Failed to create organization' })
  }

  // Update user's profile with organization_id
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ organization_id: org.id })
    .eq('id', profile.id)

  if (updateError) {
    console.error('Error updating profile:', updateError)
    // Rollback: delete the organization
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
    return res.status(500).json({ error: 'Failed to link organization to profile' })
  }

  return res.status(201).json(org)
}
