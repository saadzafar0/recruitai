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

	return output
}
