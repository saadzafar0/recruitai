interface SubmitApplicationPayload {
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
}

interface SubmitApplicationResponse {
  success: boolean
  data?: {
    profile_id: string
    application_id: string
    status: string
  }
  error?: string
}

export async function submitApplication(
  payload: SubmitApplicationPayload,
): Promise<SubmitApplicationResponse> {
  const res = await fetch('/api/v1/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data: SubmitApplicationResponse = await res.json()
  return data
}
