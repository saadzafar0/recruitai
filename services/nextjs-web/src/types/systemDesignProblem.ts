/**
 * System Design Problem Types
 */

export type SystemDesignDifficulty = 'easy' | 'medium' | 'hard'

export interface SystemDesignProblem {
  id: string
  organization_id: string | null
  title: string
  scenario: string
  context: string | null
  difficulty: SystemDesignDifficulty
  topic_tags: string[] | null
  time_limit_minutes: number | null
  is_active: boolean | null
  order_index?: number
}
