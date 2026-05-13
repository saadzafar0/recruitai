export interface RecruiterCandidate {
  application_id: string
  applicant_id: string
  status: string
  created_at: string
  cv_score: number | null
  voice_score: number | null
  coding_score: number | null
  system_design_score: number | null
  composite_score: number | null
  applicant: {
    id: string
    first_name: string
    last_name: string
  } | null
  job: {
    id: string
    title: string
    organization: {
      name: string | null
    } | null
  } | null
}
