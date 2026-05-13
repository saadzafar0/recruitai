export interface RecruiterCodingRoundDetail {
  candidate_id: string
  candidate_name: string
  job_title: string
  submitted_at: string | null
  language: string | null
  problem_title: string | null
  coding_score: number | null
  submission: {
    id: string
    source_code: string
    total_score: number | null
    score_correctness: number | null
    score_efficiency: number | null
    score_code_quality: number | null
    score_best_practices: number | null
    ai_feedback: string | null
  } | null
  test_results: Array<{
    id: string
    input: string
    expected_output: string
    actual_output: string | null
    passed: boolean
    error_message: string | null
  }>
}
