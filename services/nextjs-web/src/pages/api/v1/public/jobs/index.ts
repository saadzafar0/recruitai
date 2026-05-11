import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

interface PublicJobPosting {
  id: string
  title: string
  location: string | null
  employment_type: string | null
  work_mode: string | null
  application_deadline: string | null
  created_at: string
  organization_name: string | null
  description: string | null
  responsibilities: string | null
  requirements: string | null
  benefits: string | null
  status: string | null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ jobs: PublicJobPosting[] } | { error: string }>
) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0')

  const { data: jobs, error } = await supabaseAdmin
    .from('job_postings')
    .select('id, title, location, employment_type, work_mode, application_deadline, created_at, description, responsibilities, requirements, benefits,status, organizations(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch jobs' })
  }

  const mapped = (jobs || []).map((job: any) => ({
    id: job.id,
    title: job.title,
    location: job.location ?? null,
    employment_type: job.employment_type ?? null,
    work_mode: job.work_mode ?? null,
    application_deadline: job.application_deadline ?? null,
    created_at: job.created_at,
    organization_name: job.organizations?.name ?? null,
    description: job.description ?? null,
    responsibilities: job.responsibilities ?? null,
    requirements: job.requirements ?? null,
    benefits: job.benefits ?? null,
    status: job.status ?? null,
  }))

  return res.status(200).json({ jobs: mapped })
}
