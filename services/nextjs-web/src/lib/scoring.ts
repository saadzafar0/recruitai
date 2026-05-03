import { supabaseAdmin } from './supabase'

interface ApplicationScores {
	cv_score: number | null
	voice_score: number | null
	coding_score: number | null
	system_design_score: number | null
}

interface JobWeights {
	weight_cv: number
	weight_voice: number
	weight_coding: number
	weight_system_design: number
}

interface AggregateResult {
	success: boolean
	composite_score?: number
	rank?: number
	recommendation_tier?: string
	scores_complete: boolean
	error?: string
}

function determineRecommendationTier(score: number): string {
	if (score >= 85) return 'strong_yes'
	if (score >= 70) return 'yes'
	if (score >= 50) return 'maybe'
	return 'no'
}

function calculateWeightedComposite(
	scores: ApplicationScores,
	weights: JobWeights,
): number {
	const composite =
		(scores.cv_score ?? 0) * weights.weight_cv / 100 +
		(scores.voice_score ?? 0) * weights.weight_voice / 100 +
		(scores.coding_score ?? 0) * weights.weight_coding / 100 +
		(scores.system_design_score ?? 0) * weights.weight_system_design / 100

	return Math.round(composite * 100) / 100
}

function areAllStageScoresPresent(
	scores: ApplicationScores,
	weights: JobWeights,
): boolean {
	if (weights.weight_cv > 0 && scores.cv_score === null) return false
	if (weights.weight_voice > 0 && scores.voice_score === null) return false
	if (weights.weight_coding > 0 && scores.coding_score === null) return false
	if (weights.weight_system_design > 0 && scores.system_design_score === null) return false
	return true
}

export async function aggregateScores(
	applicationId: string,
): Promise<AggregateResult> {
	if (!supabaseAdmin) {
		return { success: false, scores_complete: false, error: 'Supabase admin client not configured' }
	}

	// Fetch application with all stage scores
	const { data: application, error: appError } = await supabaseAdmin
		.from('applications')
		.select('id, job_id, cv_score, voice_score, coding_score, system_design_score, status')
		.eq('id', applicationId)
		.single()

	if (appError || !application) {
		return { success: false, scores_complete: false, error: 'Application not found' }
	}

	if (application.status === 'draft' || application.status === 'withdrawn') {
		return { success: false, scores_complete: false, error: `Cannot score application in '${application.status}' status` }
	}

	// Fetch job posting for weights
	const { data: job, error: jobError } = await supabaseAdmin
		.from('job_postings')
		.select('id, weight_cv, weight_voice, weight_coding, weight_system_design')
		.eq('id', application.job_id)
		.single()

	if (jobError || !job) {
		return { success: false, scores_complete: false, error: 'Job posting not found' }
	}

	const scores: ApplicationScores = {
		cv_score: application.cv_score,
		voice_score: application.voice_score,
		coding_score: application.coding_score,
		system_design_score: application.system_design_score,
	}

	const weights: JobWeights = {
		weight_cv: job.weight_cv ?? 25,
		weight_voice: job.weight_voice ?? 35,
		weight_coding: job.weight_coding ?? 30,
		weight_system_design: job.weight_system_design ?? 10,
	}

	const allComplete = areAllStageScoresPresent(scores, weights)

	if (!allComplete) {
		const present = [
			scores.cv_score !== null && 'cv' ,
			scores.voice_score !== null && 'voice',
			scores.coding_score !== null && 'coding',
			scores.system_design_score !== null && 'system_design',
		].filter(Boolean)

		return {
			success: true,
			scores_complete: false,
			error: `Not all stage scores are present. Have: ${present.join(', ')}`,
		}
	}

	const compositeScore = calculateWeightedComposite(scores, weights)
	const tier = determineRecommendationTier(compositeScore)

	// Update application composite score
	const { error: updateError } = await supabaseAdmin
		.from('applications')
		.update({ composite_score: compositeScore, updated_at: new Date().toISOString() })
		.eq('id', applicationId)

	if (updateError) {
		return { success: false, scores_complete: true, error: `Failed to update composite score: ${updateError.message}` }
	}

	// Upsert candidate score card
	const scoreBreakdown = {
		cv: { score: scores.cv_score, weight: weights.weight_cv, weighted: Math.round((scores.cv_score ?? 0) * weights.weight_cv / 100 * 100) / 100 },
		voice: { score: scores.voice_score, weight: weights.weight_voice, weighted: Math.round((scores.voice_score ?? 0) * weights.weight_voice / 100 * 100) / 100 },
		coding: { score: scores.coding_score, weight: weights.weight_coding, weighted: Math.round((scores.coding_score ?? 0) * weights.weight_coding / 100 * 100) / 100 },
		system_design: { score: scores.system_design_score, weight: weights.weight_system_design, weighted: Math.round((scores.system_design_score ?? 0) * weights.weight_system_design / 100 * 100) / 100 },
	}

	const { error: cardError } = await supabaseAdmin
		.from('candidate_score_cards')
		.upsert({
			application_id: applicationId,
			cv_score: scores.cv_score,
			voice_interview_score: scores.voice_score,
			coding_score: scores.coding_score,
			system_design_score: scores.system_design_score,
			composite_score: compositeScore,
			recommendation_tier: tier,
			is_recommended: tier === 'strong_yes' || tier === 'yes',
			score_breakdown_json: scoreBreakdown,
			score_explanation: generateScoreExplanation(scores, weights, compositeScore, tier),
			scored_at: new Date().toISOString(),
			last_recalculated_at: new Date().toISOString(),
		}, { onConflict: 'application_id' })

	if (cardError) {
		console.error('[Scoring] Failed to upsert score card:', cardError)
	}

	// Refresh rankings for this job
	try {
		const { error: rankError } = await supabaseAdmin.rpc('refresh_job_rankings', {
			p_job_id: application.job_id,
		})

		if (rankError) {
			console.error('[Scoring] refresh_job_rankings RPC failed:', rankError)
		}
	} catch (rpcErr) {
		console.error('[Scoring] refresh_job_rankings RPC error:', rpcErr)
	}

	// Fetch updated rank
	const { data: updatedApp } = await supabaseAdmin
		.from('applications')
		.select('rank')
		.eq('id', applicationId)
		.single()

	return {
		success: true,
		composite_score: compositeScore,
		rank: updatedApp?.rank ?? undefined,
		recommendation_tier: tier,
		scores_complete: true,
	}
}

function generateScoreExplanation(
	scores: ApplicationScores,
	weights: JobWeights,
	composite: number,
	tier: string,
): string {
	const parts: string[] = []

	if (scores.cv_score !== null && weights.weight_cv > 0) {
		parts.push(`CV screening: ${scores.cv_score}/100 (weight ${weights.weight_cv}%)`)
	}
	if (scores.voice_score !== null && weights.weight_voice > 0) {
		parts.push(`Voice interview: ${scores.voice_score}/100 (weight ${weights.weight_voice}%)`)
	}
	if (scores.coding_score !== null && weights.weight_coding > 0) {
		parts.push(`Coding round: ${scores.coding_score}/100 (weight ${weights.weight_coding}%)`)
	}
	if (scores.system_design_score !== null && weights.weight_system_design > 0) {
		parts.push(`System design: ${scores.system_design_score}/100 (weight ${weights.weight_system_design}%)`)
	}

	return `Composite score: ${composite}/100 (${tier}). ${parts.join('. ')}.`
}

export { determineRecommendationTier, calculateWeightedComposite }
export type { AggregateResult, ApplicationScores, JobWeights }
