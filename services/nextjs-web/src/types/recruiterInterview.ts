export interface RecruiterInterviewItem {
  session_id: string
  application_id: string
  candidate_id: string
  candidate_name: string
  job_title: string
  organization_name: string | null
  completed_at: string | null
  duration_seconds: number | null
  voice_score: number | null
}
