import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

interface ApiSystemDesignProblem {
  id: string
  organization_id: string | null
  title: string
  scenario: string
  context: string | null
  difficulty: string
  topic_tags: string[] | null
  time_limit_minutes: number | null
  is_active: boolean | null
  order_index?: number
}

interface ApiResponse {
  success: boolean
  data?: {
    systemDesignProblems: ApiSystemDesignProblem[]
  }
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' })
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'Server is not configured with SUPABASE_SERVICE_ROLE_KEY' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'applicant') {
    return res.status(403).json({ success: false, error: 'Access denied' })
  }

  const applicationId = typeof req.query.applicationId === 'string'
    ? req.query.applicationId.trim()
    : ''

  if (!applicationId) {
    return res.status(400).json({ success: false, error: 'Missing applicationId' })
  }

  const { data: application, error: applicationError } = await supabaseAdmin
    .from('applications')
    .select('id, job_id')
    .eq('id', applicationId)
    .eq('applicant_id', profile.id)
    .single()

  if (applicationError || !application) {
    return res.status(404).json({ success: false, error: 'Application not found' })
  }

  const { data: mappedProblems, error: mappedError } = await supabaseAdmin
    .from('job_system_design_problems')
    .select('order_index, problem:system_design_problems (id, organization_id, title, scenario, context, difficulty, topic_tags, time_limit_minutes, is_active)')
    .eq('job_id', application.job_id)
    .order('order_index', { ascending: true })

  if (mappedError) {
    return res.status(500).json({ success: false, error: 'Failed to fetch system design problems' })
  }

  const mapped = (mappedProblems || [])
    .map((row: any) => ({
      ...(row.problem || {}),
      order_index: row.order_index,
    }))
    .filter((problem: ApiSystemDesignProblem) => problem && problem.is_active !== false)

  if (mapped.length > 0) {
    return res.status(200).json({
      success: true,
      data: { systemDesignProblems: mapped },
    })
  }

  const { data: fallbackProblems, error: fallbackError } = await supabaseAdmin
    .from('system_design_problems')
    .select('id, organization_id, title, scenario, context, difficulty, topic_tags, time_limit_minutes, is_active')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)

  if (fallbackError) {
    return res.status(500).json({ success: false, error: 'Failed to fetch system design problems' })
  }

  return res.status(200).json({
    success: true,
    data: { systemDesignProblems: (fallbackProblems || []) as ApiSystemDesignProblem[] },
  })
}
