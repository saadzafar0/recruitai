import { supabaseAdmin } from './supabase'
import type { EvaluationResult } from './llmEvaluator'

export interface SystemDesignEvaluationOutput {
	kind: 'system_design'
	applicationId: string
	assessmentId: string
	responseId: string
	problemId: string | null
	scores: {
		requirements: number
		scalability: number
		architecture: number
		trade_offs: number
		communication: number
	}
	totalScore: number
	summary: string
	strengths: string[]
	weaknesses: string[]
	recommendation: 'strong_pass' | 'pass' | 'borderline' | 'fail'
	providerUsed: 'gemini' | 'grok'
	scoringModelVersion: string
	scoredAt: string
}

export interface PersistSystemDesignScoreInput {
	applicationId: string
	assessmentId: string
	responseId: string
	problemId: string | null
	evaluation: EvaluationResult
}

export async function persistSystemDesignEvaluation(
	input: PersistSystemDesignScoreInput,
): Promise<SystemDesignEvaluationOutput> {
	const { evaluation } = input
	const s = evaluation.scores

	const output: SystemDesignEvaluationOutput = {
		kind: 'system_design',
		applicationId: input.applicationId,
		assessmentId: input.assessmentId,
		responseId: input.responseId,
		problemId: input.problemId,
		scores: {
			requirements: s.requirements,
			scalability: s.scalability,
			architecture: s.architecture,
			trade_offs: s.trade_offs,
			communication: s.communication,
		},
		totalScore: evaluation.totalScore,
		summary: evaluation.summary,
		strengths: evaluation.strengths,
		weaknesses: evaluation.weaknesses,
		recommendation: evaluation.recommendation,
		providerUsed: evaluation.providerUsed,
		scoringModelVersion: evaluation.scoringModelVersion,
		scoredAt: evaluation.scoredAt,
	}

	const { error: responseError } = await supabaseAdmin
		.from('system_design_responses')
		.update({
			score_requirements: s.requirements,
			score_scalability: s.scalability,
			score_architecture: s.architecture,
			score_trade_offs: s.trade_offs,
			score_communication: s.communication,
			total_score: evaluation.totalScore,
			ai_feedback: evaluation.summary,
			scored_at: evaluation.scoredAt,
		})
		.eq('id', input.responseId)

	if (responseError) {
		throw new Error(`Failed to update system_design_responses: ${responseError.message}`)
	}

	const { error: scoreError } = await supabaseAdmin
		.from('system_design_scores')
		.upsert(
			{
				assessment_id: input.assessmentId,
				application_id: input.applicationId,
				total_score: evaluation.totalScore,
				avg_requirements: s.requirements,
				avg_scalability: s.scalability,
				avg_architecture: s.architecture,
				avg_trade_offs: s.trade_offs,
				avg_communication: s.communication,
				ai_summary: evaluation.summary,
				strengths: evaluation.strengths,
				weaknesses: evaluation.weaknesses,
				recommendation: evaluation.recommendation,
				scored_at: evaluation.scoredAt,
			},
			{ onConflict: 'assessment_id' },
		)

	if (scoreError) {
		throw new Error(`Failed to upsert system_design_scores: ${scoreError.message}`)
	}

	const { error: appError } = await supabaseAdmin
		.from('applications')
		.update({
			system_design_score: evaluation.totalScore,
			updated_at: new Date().toISOString(),
		})
		.eq('id', input.applicationId)

	if (appError) {
		throw new Error(`Failed to update applications.system_design_score: ${appError.message}`)
	}

	console.info(
		`[evaluator-worker] System-design evaluation written: application=${input.applicationId} assessment=${input.assessmentId} total=${evaluation.totalScore} provider=${evaluation.providerUsed}`,
	)

	// Trigger auto-scoring: check if all stages are now complete
	try {
		const { data: application } = await supabaseAdmin
			.from('applications')
			.select('job_id, cv_score, voice_score, coding_score')
			.eq('id', input.applicationId)
			.maybeSingle()

		if (application) {
			const { data: job } = await supabaseAdmin
				.from('job_postings')
				.select('weight_cv, weight_voice, weight_coding, weight_system_design')
				.eq('id', application.job_id)
				.maybeSingle()

			if (job) {
				const w = job
				const allPresent =
					((w.weight_cv ?? 25) === 0 || application.cv_score !== null) &&
					((w.weight_voice ?? 35) === 0 || application.voice_score !== null) &&
					((w.weight_coding ?? 30) === 0 || application.coding_score !== null)

				if (allPresent) {
					console.info(`[evaluator-worker] All stage scores present for application ${input.applicationId}, triggering aggregation via scoring API`)

					const scoringUrl = process.env.SCORING_API_URL || 'http://localhost:3000/api/v1/scoring/aggregate'
					const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

					await fetch(scoringUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							...(serviceKey ? { Authorization: `Bearer ${serviceKey}` } : {}),
						},
						body: JSON.stringify({ application_id: input.applicationId }),
					}).catch((err) => {
						console.warn(`[evaluator-worker] Failed to trigger scoring API: ${err instanceof Error ? err.message : err}`)
					})
				}
			}
		}
	} catch (err) {
		console.warn(`[evaluator-worker] Auto-scoring check failed: ${err instanceof Error ? err.message : err}`)
	}

	return output
}
