import { createHash } from 'node:crypto'
import { supabaseAdmin } from './supabase'
import type { EvaluationResult } from './llmEvaluator'

export interface VoiceEvaluationOutput {
	kind: 'voice_interview'
	applicationId: string
	sessionId: string
	vapiCallId: string | null
	transcriptHash: string
	scores: {
		relevance: number
		clarity: number
		depth: number
		communication: number
		confidence: number
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

export interface PersistVoiceScoreInput {
	applicationId: string
	sessionId: string
	vapiCallId: string | null
	transcript: string
	evaluation: EvaluationResult
}

function sha256(value: string): string {
	return createHash('sha256').update(value, 'utf8').digest('hex')
}

export async function persistVoiceEvaluation(
	input: PersistVoiceScoreInput,
): Promise<VoiceEvaluationOutput> {
	const { evaluation } = input
	const s = evaluation.scores

	const output: VoiceEvaluationOutput = {
		kind: 'voice_interview',
		applicationId: input.applicationId,
		sessionId: input.sessionId,
		vapiCallId: input.vapiCallId,
		transcriptHash: sha256(input.transcript),
		scores: {
			relevance: s.relevance,
			clarity: s.clarity,
			depth: s.depth,
			communication: s.communication,
			confidence: s.confidence,
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

	const { error: scoreError } = await supabaseAdmin
		.from('voice_interview_scores')
		.upsert(
			{
				session_id: input.sessionId,
				application_id: input.applicationId,
				avg_relevance: s.relevance,
				avg_clarity: s.clarity,
				avg_depth: s.depth,
				avg_communication: s.communication,
				avg_confidence: s.confidence,
				total_score: evaluation.totalScore,
				ai_summary: evaluation.summary,
				strengths: evaluation.strengths,
				weaknesses: evaluation.weaknesses,
				recommendation: evaluation.recommendation,
				scoring_model_version: evaluation.scoringModelVersion,
				scored_at: evaluation.scoredAt,
			},
			{ onConflict: 'session_id' },
		)

	if (scoreError) {
		throw new Error(`Failed to upsert voice_interview_scores: ${scoreError.message}`)
	}

	const { error: appError } = await supabaseAdmin
		.from('applications')
		.update({
			voice_score: evaluation.totalScore,
			updated_at: new Date().toISOString(),
		})
		.eq('id', input.applicationId)

	if (appError) {
		throw new Error(`Failed to update applications.voice_score: ${appError.message}`)
	}

	console.info(
		`[evaluator-worker] Voice evaluation written: application=${input.applicationId} session=${input.sessionId} total=${evaluation.totalScore} provider=${evaluation.providerUsed}`,
	)

	// Trigger auto-scoring: check if all stages are now complete
	try {
		const { data: application } = await supabaseAdmin
			.from('applications')
			.select('job_id, cv_score, coding_score, system_design_score')
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
					((w.weight_coding ?? 30) === 0 || application.coding_score !== null) &&
					((w.weight_system_design ?? 10) === 0 || application.system_design_score !== null)

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
