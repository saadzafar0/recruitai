import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../../lib/supabase'

type ApiCodingProblem = {
	id: string
	organization_id: string | null
	title: string
	slug: string | null
	description: string
	difficulty: string
	topic_tags: string[] | null
	supported_languages: string[] | null
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

type ApiResponse = {
	success: boolean
	data?: {
		codingProblems: ApiCodingProblem[]
	}
	error?: string
}

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<ApiResponse>,
) {
	if (req.method !== 'GET') {
		return res.status(405).json({ success: false, error: 'Method not allowed. Use GET.' })
	}

	if (!supabaseAdmin) {
		return res.status(500).json({ success: false, error: 'Server is not configured with SUPABASE_SERVICE_ROLE_KEY' })
	}

	const problemId = typeof req.query.problem_id === 'string' ? req.query.problem_id.trim() : ''

	let query = supabaseAdmin
		.from('coding_problems')
		.select('id, organization_id, title, slug, description, difficulty, topic_tags, supported_languages, time_limit_ms, memory_limit_mb, max_score, sample_input, sample_output, explanation, optimal_complexity, editorial_notes, is_active, created_at, updated_at')
		.order('created_at', { ascending: true })

	if (problemId) {
		query = query.eq('id', problemId).limit(1)
	} else {
		query = query.eq('is_active', true)
	}

	const { data, error } = await query

	if (error) {
		return res.status(500).json({ success: false, error: 'Failed to fetch coding problems' })
	}

	return res.status(200).json({
		success: true,
		data: {
			codingProblems: (data || []) as ApiCodingProblem[],
		},
	})
}
