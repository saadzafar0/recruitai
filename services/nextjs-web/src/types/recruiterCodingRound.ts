export interface RecruiterCodingRoundItem {
  assessment_id: string
  application_id: string
  candidate_id: string
  candidate_name: string
  job_title: string
  submitted_at: string | null
  language: string | null
  problem_title: string | null
  coding_score: number | null
}
