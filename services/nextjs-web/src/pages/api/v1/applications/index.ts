import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase'
import { cvProcessingQueue } from '../../../../lib/bull'
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
  cv_file_key: z.string().min(1).optional(),
}).refine(
  (data) => {
    if (data.cv_file_url && !data.cv_file_key) return false
    return true
  },
  { message: 'cv_file_key is required when cv_file_url is provided', path: ['cv_file_key'] },
)

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
  console.info('[API /api/v1/applications] Incoming request', {
    method: req.method,
    hasBody: Boolean(req.body),
  })

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.warn('[API /api/v1/applications] Invalid method', {
      method: req.method,
    })
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    })
  }

  if (!supabaseAdmin) {
    console.error('[API /api/v1/applications] Missing SUPABASE_SERVICE_ROLE_KEY')
    return res.status(500).json({
      success: false,
      error: 'Server is not configured with SUPABASE_SERVICE_ROLE_KEY',
    })
  }

  try {
    // Validate request body
    const body = req.body as ApplicationData
    console.info('[API /api/v1/applications] Validating body', {
      bodyKeys: Object.keys((body || {}) as Record<string, unknown>),
      job_id: body?.job_id,
      email: body?.email,
      hasCvFileUrl: Boolean(body?.cv_file_url),
      hasCvFileKey: Boolean(body?.cv_file_key),
    })
    const validatedData = ApplicationSchema.parse(body)

    // 1. Check if job exists and is published
    const { data: job, error: jobError } = await supabaseAdmin
      .from('job_postings')
      .select('id, status, organization_id')
      .eq('id', validatedData.job_id)
      .single()

    if (jobError || !job) {
      console.warn('[API /api/v1/applications] Job not found', {
        job_id: validatedData.job_id,
        jobError,
      })
      return res.status(404).json({
        success: false,
        error: 'Job posting not found',
      })
    }

    if (job.status !== 'published') {
      console.warn('[API /api/v1/applications] Job not published', {
        job_id: validatedData.job_id,
        status: job.status,
      })
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
        console.warn('[API /api/v1/applications] Duplicate application blocked', {
          job_id: validatedData.job_id,
          applicant_id: profileId,
        })
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
        console.error('[API /api/v1/applications] Failed to create auth user', authError)
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
        console.error('[API /api/v1/applications] Failed to create profile', profileError)
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
      console.error('[API /api/v1/applications] Failed to create application', applicationError)
      return res.status(500).json({
        success: false,
        error: 'Failed to create application',
        details: applicationError,
      })
    }

    // 6. Upsert candidate profile CV metadata and enqueue CV parsing job
    if (validatedData.cv_file_url) {
      const { data: existingCandidateProfile, error: existingCandidateProfileError } = await supabaseAdmin
        .from('candidate_profiles')
        .select('id')
        .eq('applicant_id', profileId)
        .maybeSingle()

      if (existingCandidateProfileError) {
        console.error(
          '[API /api/v1/applications] Failed to fetch existing candidate profile',
          existingCandidateProfileError,
        )
        return res.status(500).json({
          success: false,
          error: 'Failed to prepare candidate profile for CV parsing',
          details: existingCandidateProfileError,
        })
      }

      const candidateProfilePayload = {
        applicant_id: profileId,
        cv_file_url: validatedData.cv_file_url,
        cv_file_name: validatedData.cv_file_name || null,
      }

      const candidateProfileMutation = existingCandidateProfile
        ? supabaseAdmin
            .from('candidate_profiles')
            .update(candidateProfilePayload)
            .eq('id', existingCandidateProfile.id)
            .select('id')
            .single()
        : supabaseAdmin
            .from('candidate_profiles')
            .insert(candidateProfilePayload)
            .select('id')
            .single()

      const { data: candidateProfile, error: candidateProfileError } = await candidateProfileMutation

      if (candidateProfileError || !candidateProfile) {
        console.error(
          '[API /api/v1/applications] Failed to save candidate profile CV data',
          candidateProfileError,
        )
        return res.status(500).json({
          success: false,
          error: 'Failed to save candidate profile CV data',
          details: candidateProfileError,
        })
      }

      try {
        await cvProcessingQueue.add(
          'parse-cv',
          {
            candidateProfileId: candidateProfile.id,
            applicantId: profileId,
            applicationId: application.id,
            cvFileUrl: validatedData.cv_file_url,
            cvFileName: validatedData.cv_file_name,
            s3Key: validatedData.cv_file_key,
          },
          {
            jobId: `cv-parse-${application.id}`,
            attempts: 7,
            backoff: {
              type: 'exponential',
              delay: 3000,
            },
            removeOnComplete: 1000,
            removeOnFail: 5000,
          },
        )

        console.info('[API /api/v1/applications] CV parse job queued', {
          applicationId: application.id,
          candidateProfileId: candidateProfile.id,
        })
      } catch (queueError) {
        // Do not block application creation if queue is temporarily unavailable.
        console.error('[API /api/v1/applications] Failed to enqueue cv-processing job', {
          queueError,
          applicationId: application.id,
          candidateProfileId: candidateProfile.id,
        })
      }
    }

    // 7. Log status change
    const { error: statusLogError } = await supabaseAdmin
      .from('application_status_log')
      .insert({
        application_id: application.id,
        to_status: 'submitted',
        reason: 'Application submitted via API',
      })

    if (statusLogError) {
      console.error('[API /api/v1/applications] Failed to write status log', statusLogError)
    }

    // 8. Update job application count (optional, ignore errors)
    try {
      await supabaseAdmin.rpc('increment_application_count', {
        job_id: validatedData.job_id,
      })
    } catch (rpcError) {
      console.warn('[API /api/v1/applications] increment_application_count RPC failed', rpcError)
      // Ignore if RPC doesn't exist
    }

    console.info('[API /api/v1/applications] Application created', {
      application_id: application.id,
      applicant_id: profileId,
      job_id: validatedData.job_id,
    })

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
      console.warn('[API /api/v1/applications] Validation error', {
        issues: error.errors,
      })
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
