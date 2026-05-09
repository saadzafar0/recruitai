import { supabaseAdmin } from './supabase'

const DEFAULT_WEIGHTS = {
	weight_cv: 25,
	weight_voice: 35,
	weight_coding: 30,
	weight_system_design: 10,
}

/**
 * Checks if all required stage scores are present for an application
 * and, if so, calculates and persists the composite score.
 *
 * Called by score updaters (executor-worker, evaluator-worker) after
 * writing a stage score. Safe to call multiple times — only computes
 * when all weighted stages have scores.
 */
export async function tryAggregateScores(applicationId: string): Promise<{
	aggregated: boolean
	composite_score?: number
	recommendation_tier?: string
	rank?: number
	error?: string
}> {
	if (!supabaseAdmin) {
		return { aggregated: false, error: 'Supabase not configured' }
	}

	const { data: application } = await supabaseAdmin
		.from('applications')
		.select('id, job_id, cv_score, voice_score, coding_score, system_design_score, status')
		.eq('id', applicationId)
		.single()

	if (!application) {
		return { aggregated: false, error: 'Application not found' }
	}

	if (application.status === 'draft' || application.status === 'withdrawn') {
		return { aggregated: false, error: `Cannot score '${application.status}' application` }
	}

	const { data: job } = await supabaseAdmin
		.from('job_postings')
		.select('weight_cv, weight_voice, weight_coding, weight_system_design')
		.eq('id', application.job_id)
		.single()

	if (!job) {
		return { aggregated: false, error: 'Job not found' }
	}

	const weights = {
		weight_cv: job.weight_cv ?? DEFAULT_WEIGHTS.weight_cv,
		weight_voice: job.weight_voice ?? DEFAULT_WEIGHTS.weight_voice,
		weight_coding: job.weight_coding ?? DEFAULT_WEIGHTS.weight_coding,
		weight_system_design: job.weight_system_design ?? DEFAULT_WEIGHTS.weight_system_design,
	}

	// Check all weighted stages have scores
	if (weights.weight_cv > 0 && application.cv_score === null) return { aggregated: false }
	if (weights.weight_voice > 0 && application.voice_score === null) return { aggregated: false }
	if (weights.weight_coding > 0 && application.coding_score === null) return { aggregated: false }
	if (weights.weight_system_design > 0 && application.system_design_score === null) return { aggregated: false }

	// All scores present — calculate composite
	const composite =
		(application.cv_score ?? 0) * weights.weight_cv / 100 +
		(application.voice_score ?? 0) * weights.weight_voice / 100 +
		(application.coding_score ?? 0) * weights.weight_coding / 100 +
		(application.system_design_score ?? 0) * weights.weight_system_design / 100
	const compositeScore = Math.round(composite * 100) / 100

	const tier = compositeScore >= 85 ? 'strong_yes'
		: compositeScore >= 70 ? 'yes'
		: compositeScore >= 50 ? 'maybe'
		: 'no'

	// Update application composite score
	const { error: updateError } = await supabaseAdmin
		.from('applications')
		.update({ composite_score: compositeScore, updated_at: new Date().toISOString() })
		.eq('id', applicationId)

	if (updateError) {
		return { aggregated: false, error: updateError.message }
	}

	// Upsert score card
	const scoreBreakdown = {
		cv: { score: application.cv_score, weight: weights.weight_cv },
		voice: { score: application.voice_score, weight: weights.weight_voice },
		coding: { score: application.coding_score, weight: weights.weight_coding },
		system_design: { score: application.system_design_score, weight: weights.weight_system_design },
	}

	await supabaseAdmin
		.from('candidate_score_cards')
		.upsert({
			application_id: applicationId,
			cv_score: application.cv_score,
			voice_interview_score: application.voice_score,
			coding_score: application.coding_score,
			system_design_score: application.system_design_score,
			composite_score: compositeScore,
			recommendation_tier: tier,
			is_recommended: tier === 'strong_yes' || tier === 'yes',
			score_breakdown_json: scoreBreakdown,
			score_explanation: `Composite score: ${compositeScore}/100 (${tier}).`,
			scored_at: new Date().toISOString(),
			last_recalculated_at: new Date().toISOString(),
		}, { onConflict: 'application_id' })

	// Refresh rankings
	try {
		await supabaseAdmin.rpc('refresh_job_rankings', { p_job_id: application.job_id })
	} catch {
		// RPC may not exist yet
	}

	// Fetch updated rank
	const { data: updatedApp } = await supabaseAdmin
		.from('applications')
		.select('rank')
		.eq('id', applicationId)
		.single()

	return {
		aggregated: true,
		composite_score: compositeScore,
		recommendation_tier: tier,
		rank: updatedApp?.rank ?? undefined,
	}
}
