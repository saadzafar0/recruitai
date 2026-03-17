import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase'
import { z } from 'zod'

// Validation schema for application submission
const ApplicationSchema = z.object({
  // Job information
  job_id: z.string().uuid(),

  // Applicant personal info
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  portfolio_url: z.string().url().optional().or(z.literal('')),

  // Optional cover letter
  cover_letter: z.string().optional(),

  // CV file URL (if already uploaded)
  cv_file_url: z.string().url().optional(),
  cv_file_name: z.string().optional(),
})

type ApplicationData = z.infer<typeof ApplicationSchema>

type ApiResponse = {
  success: boolean
  data?: {
    profile_id: string
    application_id: string
    status: string
  }
  error?: string
  details?: unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    })
  }

  try {
    // Validate request body
    const body = req.body as ApplicationData
    const validatedData = ApplicationSchema.parse(body)

    // 1. Check if job exists and is published
    const { data: job, error: jobError } = await supabaseAdmin
      .from('job_postings')
      .select('id, status, organization_id')
      .eq('id', validatedData.job_id)
      .single()

    if (jobError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Job posting not found',
      })
    }

    if (job.status !== 'published') {
      return res.status(400).json({
        success: false,
        error: 'This job posting is not accepting applications',
      })
    }

    // 2. Check if applicant already exists by email
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    let profileId: string

    if (existingProfile) {
      // Use existing profile
      profileId = existingProfile.id

      // Check if already applied to this job
      const { data: existingApplication } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('job_id', validatedData.job_id)
        .eq('applicant_id', profileId)
        .single()

      if (existingApplication) {
        return res.status(409).json({
          success: false,
          error: 'You have already applied to this job',
        })
      }
    } else {
      // 3. Create new auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: validatedData.email,
        email_confirm: true,
        user_metadata: {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
        },
      })

      if (authError || !authUser.user) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create user account',
          details: authError,
        })
      }

      profileId = authUser.user.id

      // 4. Create profile record
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: profileId,
          role: 'applicant',
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          linkedin_url: validatedData.linkedin_url || null,
          github_url: validatedData.github_url || null,
          portfolio_url: validatedData.portfolio_url || null,
        })

      if (profileError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create applicant profile',
          details: profileError,
        })
      }
    }

    // 5. Create application
    const { data: application, error: applicationError } = await supabaseAdmin
      .from('applications')
      .insert({
        job_id: validatedData.job_id,
        applicant_id: profileId,
        status: 'submitted',
        cover_letter: validatedData.cover_letter || null,
        submitted_at: new Date().toISOString(),
      })
      .select('id, status')
      .single()

    if (applicationError || !application) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create application',
        details: applicationError,
      })
    }

    // 6. Create candidate profile (CV data placeholder)
    if (validatedData.cv_file_url) {
      await supabaseAdmin
        .from('candidate_profiles')
        .insert({
          applicant_id: profileId,
          cv_file_url: validatedData.cv_file_url,
          cv_file_name: validatedData.cv_file_name || null,
        })
    }

    // 7. Log status change
    await supabaseAdmin
      .from('application_status_log')
      .insert({
        application_id: application.id,
        to_status: 'submitted',
        reason: 'Application submitted via API',
      })

    // 8. Update job application count (optional, ignore errors)
    try {
      await supabaseAdmin.rpc('increment_application_count', {
        job_id: validatedData.job_id,
      })
    } catch {
      // Ignore if RPC doesn't exist
    }

    return res.status(201).json({
      success: true,
      data: {
        profile_id: profileId,
        application_id: application.id,
        status: application.status,
      },
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      })
    }

    console.error('Application submission error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
