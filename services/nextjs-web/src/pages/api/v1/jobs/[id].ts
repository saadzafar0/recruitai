/**
 * Individual Job Posting API
 * GET /api/v1/jobs/[id] - Get a single job posting
 * PUT /api/v1/jobs/[id] - Update a job posting
 * DELETE /api/v1/jobs/[id] - Delete a job posting
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import type { JobPosting, JobPostingUpdate } from '@/types/job'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Job ID is required' })
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
    return res.status(403).json({ error: 'Only recruiters can manage job postings' })
  }

  // Verify ownership of the job
  const { data: existingJob, error: fetchError } = await supabaseAdmin
    .from('job_postings')
    .select('id, created_by')
    .eq('id', id)
    .single()

  if (fetchError || !existingJob) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  if (existingJob.created_by !== profile.id && profile.role !== 'admin') {
    return res.status(403).json({ error: 'You do not have permission to access this job posting' })
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, id)
    case 'PUT':
      return handlePut(req, res, id)
    case 'DELETE':
      return handleDelete(req, res, id)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<JobPosting | { error: string }>,
  id: string
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const { data: job, error } = await supabaseAdmin
    .from('job_postings')
    .select('*, job_skills(skill_name)')
    .eq('id', id)
    .single()

  if (error || !job) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  // Transform the data to include skills array
  const skills = job.job_skills?.map((js: any) => js.skill_name).filter(Boolean) || []
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { job_skills, ...jobData } = job

  return res.status(200).json({ ...jobData, skills })
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse<JobPosting | { error: string }>,
  id: string
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const body: JobPostingUpdate = req.body
  const { skills, ...updateData } = body

  // Remove id from update data if present
  delete (updateData as any).id

  // Handle status changes
  if (updateData.status === 'published' && !updateData.published_at) {
    (updateData as any).published_at = new Date().toISOString()
  }
  if (updateData.status === 'closed' && !updateData.closed_at) {
    (updateData as any).closed_at = new Date().toISOString()
  }

  const { data: job, error } = await supabaseAdmin
    .from('job_postings')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating job:', error)
    return res.status(500).json({ error: 'Failed to update job posting' })
  }

  // Handle skills update if provided
  if (skills !== undefined) {
    // Remove existing skills
    await supabaseAdmin
      .from('job_skills')
      .delete()
      .eq('job_id', id)

    // Add new skills
    if (skills.length > 0) {
      const skillInserts = skills.map(skillName => ({
        job_id: id,
        skill_name: skillName,
      }))

      const { error: skillsError } = await supabaseAdmin
        .from('job_skills')
        .insert(skillInserts)

      if (skillsError) {
        console.error('Error updating skills:', skillsError)
      }
    }
  }

  return res.status(200).json({ ...job, skills: skills || [] })
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean } | { error: string }>,
  id: string
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const { error } = await supabaseAdmin
    .from('job_postings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting job:', error)
    return res.status(500).json({ error: 'Failed to delete job posting' })
  }

  return res.status(200).json({ success: true })
}
