export interface ApplicationRequest {
  job_id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  cover_letter?: string
  cv_file_url?: string
  cv_file_name?: string
  cv_file_key?: string
}

export interface ApplicationResponse {
  success: boolean
  data?: {
    profile_id: string
    application_id: string
    status: string
  }
  error?: string
  details?: unknown
}

export async function submitApplication(payload: ApplicationRequest): Promise<ApplicationResponse> {
  console.info('[applications.submitApplication] Sending request', {
    job_id: payload.job_id,
    email: payload.email,
    hasCvFileUrl: Boolean(payload.cv_file_url),
    hasCvFileKey: Boolean(payload.cv_file_key),
  })

  const response = await fetch('/api/v1/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  console.info('[applications.submitApplication] Response received', {
    status: response.status,
    ok: response.ok,
    success: data?.success,
    error: data?.error,
  })

  if (!response.ok) {
    return {
      success: false,
      error: data?.error || 'Failed to submit application',
      details: data?.details,
    }
  }

  return data as ApplicationResponse
}
