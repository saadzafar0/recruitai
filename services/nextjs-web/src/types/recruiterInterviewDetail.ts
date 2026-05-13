export interface InterviewTranscriptLine {
  id: string
  speaker: 'AI' | 'Candidate'
  text: string
  quality: 'high' | 'medium' | 'low' | 'neutral'
}

export interface InterviewChartPoint {
  q: string
  score: number
}

export interface RecruiterInterviewDetail {
  candidate_id: string
  candidate_name: string
  job_title: string
  completed_at: string | null
  voice_score: number | null
  transcript: InterviewTranscriptLine[]
  clarity: InterviewChartPoint[]
  relevance: InterviewChartPoint[]
  confidence: InterviewChartPoint[]
}
