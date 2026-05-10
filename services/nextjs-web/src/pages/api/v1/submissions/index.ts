import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '../../../../lib/supabase'
import { addSubmissionJob } from '../../../../lib/bull'

const SubmissionSchema = z.object({
  application_id: z.string().uuid(),
  coding_problem_id: z.string().uuid().optional(),
  code: z.string().min(1),
  language: z.string().min(1),
  test_cases: z.unknown().optional(),
  time_limit: z.number().int().positive().optional(),
})

type ApiResponse = {
  success: boolean
  data?: {
    job_id: string
    status: string
  }
  error?: string
  details?: unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    })
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      error: 'Server is not configured with SUPABASE_SERVICE_ROLE_KEY',
    })
  }

  try {
    console.log('[Submissions API] Received submission request:', {
      body_keys: Object.keys(req.body),
      application_id: req.body.application_id,
      coding_problem_id: req.body.coding_problem_id,
      language: req.body.language,
      code_length: req.body.code?.length,
    })

    const validatedData = SubmissionSchema.parse(req.body)

    console.log('[Submissions API] Validated submission data:', {
      application_id: validatedData.application_id,
      coding_problem_id: validatedData.coding_problem_id,
      language: validatedData.language,
    })

    // Verify application exists
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, status')
      .eq('id', validatedData.application_id)
      .single()

    if (appError || !application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
      })
    }

   
    const blockedStatuses = ['draft', 'withdrawn', 'rejected']

    if (blockedStatuses.includes(application.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot submit code for applications in '${application.status}' status`,
      })
    }

    console.log('[Submissions API] Pushing job to BullMQ with payload:', validatedData)

    // Push job to BullMQ queue
    const job_id = await addSubmissionJob(validatedData)

    console.info('[Submissions] New submission queued', {
      job_id,
      application_id: validatedData.application_id,
      coding_problem_id: validatedData.coding_problem_id,
      language: validatedData.language,
    })

    return res.status(201).json({
      success: true,
      data: {
        job_id,
        status: 'queued',
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

    console.error('[Submissions] Error processing submission:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
