export type CodingLanguage =
	| 'python'
	| 'javascript'
	| 'typescript'
	| 'java'
	| 'cpp'
	| 'c'
	| 'go'
	| 'rust'
	| 'kotlin'
	| 'swift'
	| 'php'
	| 'ruby'
	| 'csharp'
	| 'scala'

export type CodingDifficulty = 'easy' | 'medium' | 'hard'

export interface CodingProblem {
	id: string
	organization_id: string | null
	title: string
	slug: string | null
	description: string
	difficulty: CodingDifficulty
	topic_tags: string[] | null
	supported_languages: CodingLanguage[] | null
	time_limit_ms: number | null
	memory_limit_mb: number | null
	max_score: number | null
	sample_input: string | null
	sample_output: string | null
	explanation: string | null
	optimal_complexity: string | null
	editorial_notes: string | null
	is_active: boolean | null
	created_at: string
	updated_at: string | null
}
