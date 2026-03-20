/**
 * Job Postings API
 * GET /api/v1/jobs - List all jobs for the authenticated recruiter
 * POST /api/v1/jobs - Create a new job posting
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import type { JobPosting, JobPostingCreate, JobPostingsResponse } from '@/types/job'

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

  // Get user profile to check role
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

  // Check if user has an organization
  if (!profile.organization_id) {
    return res.status(400).json({
      error: 'NO_ORGANIZATION',
      message: 'Please create an organization before posting jobs'
    })
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, profile as { id: string; organization_id: string })
    case 'POST':
      return handlePost(req, res, profile as { id: string; organization_id: string })
    default:
      res.setHeader('Allow', ['GET', 'POST'])
      return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<JobPostingsResponse | { error: string }>,
  profile: { id: string; organization_id: string }
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const {
    page = '1',
    limit = '10',
    search,
    status,
    employment_type,
    work_mode,
    sort_field = 'created_at',
    sort_direction = 'desc',
    created_after,
    created_before,
  } = req.query

  const pageNum = parseInt(page as string, 10)
  const limitNum = parseInt(limit as string, 10)
  const offset = (pageNum - 1) * limitNum

  // Build query - use job_skills table (not job_posting_skills)
  let query = supabaseAdmin
    .from('job_postings')
    .select('*, job_skills(skill_name)', { count: 'exact' })
    .eq('created_by', profile.id)

  // Apply filters
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (status) {
    const statuses = Array.isArray(status) ? status : [status]
    query = query.in('status', statuses)
  }

  if (employment_type) {
    query = query.eq('employment_type', employment_type)
  }

  if (work_mode) {
    query = query.eq('work_mode', work_mode)
  }

  if (created_after) {
    query = query.gte('created_at', created_after)
  }

  if (created_before) {
    query = query.lte('created_at', created_before)
  }

  // Apply sorting
  const validSortFields = ['title', 'status', 'created_at', 'application_deadline', 'updated_at']
  const sortField = validSortFields.includes(sort_field as string) ? sort_field : 'created_at'
  const ascending = sort_direction === 'asc'

  query = query.order(sortField as string, { ascending })

  // Apply pagination
  query = query.range(offset, offset + limitNum - 1)

  const { data: jobs, error, count } = await query

  if (error) {
    console.error('Error fetching jobs:', error)
    return res.status(500).json({ error: 'Failed to fetch job postings' })
  }

  // Transform the data to include skills array
  const transformedJobs: JobPosting[] = (jobs || []).map((job: any) => {
    const skills = job.job_skills?.map((js: any) => js.skill_name).filter(Boolean) || []
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { job_skills, ...jobData } = job
    return { ...jobData, skills }
  })

  const total = count || 0
  const totalPages = Math.ceil(total / limitNum)

  return res.status(200).json({
    jobs: transformedJobs,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
  })
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<JobPosting | { error: string }>,
  profile: { id: string; organization_id: string }
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const body: JobPostingCreate = req.body

  if (!body.title || !body.description) {
    return res.status(400).json({ error: 'Title and description are required' })
  }

  // Create the job posting
  const { skills, ...jobData } = body

  const { data: job, error } = await supabaseAdmin
    .from('job_postings')
    .insert({
      ...jobData,
      created_by: profile.id,
      organization_id: profile.organization_id,
      status: body.status || 'draft',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating job:', error)
    return res.status(500).json({ error: 'Failed to create job posting' })
  }

  // Handle skills if provided - insert directly into job_skills table
  if (skills && skills.length > 0 && job) {
    const skillInserts = skills.map(skillName => ({
      job_id: job.id,
      skill_name: skillName,
    }))

    const { error: skillsError } = await supabaseAdmin
      .from('job_skills')
      .insert(skillInserts)

    if (skillsError) {
      console.error('Error adding skills:', skillsError)
      // Don't fail the whole request, just log the error
    }
  }

  return res.status(201).json({ ...job, skills: skills || [] })
}
