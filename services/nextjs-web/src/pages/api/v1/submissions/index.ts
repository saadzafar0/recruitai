import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { supabaseAdmin } from '../../../../lib/supabase'
import { addSubmissionJob } from '../../../../lib/bull'

const SubmissionSchema = z.object({
  application_id: z.string().uuid(),
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
    const validatedData = SubmissionSchema.parse(req.body)

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

    // Push job to BullMQ queue
    const job_id = await addSubmissionJob(validatedData)

    console.info('[Submissions] New submission queued', {
      job_id,
      application_id: validatedData.application_id,
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
