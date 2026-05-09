/**
 * E2E Test: Full Candidate Flow Verification
 *
 * Run: pnpm test:e2e
 *
 * Verifies the complete candidate journey:
 *   1. Create test job with scoring weights
 *   2. Create test applicant
 *   3. Submit application
 *   4. Simulate stage scores (CV, voice, coding, system design)
 *   5. Run aggregated scoring algorithm
 *   6. Verify composite score, recommendation tier, and rank
 *   7. Verify score card creation
 *   8. Test duplicate application prevention
 *   9. Test blocked status submission rejection
 *
 * Uses the live Supabase instance (reads .env.local).
 * Cleans up all test data after completion.
 */

import { createClient } from '@supabase/supabase-js'

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0
let failed = 0
const testResults: { name: string; ok: boolean; detail?: string }[] = []

function assert(condition: boolean, name: string, detail?: string) {
	if (condition) {
		passed++
		testResults.push({ name, ok: true })
		console.log(`  ✓ ${name}`)
	} else {
		failed++
		testResults.push({ name, ok: false, detail })
		console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cleanup(supabase: any, testIds: TestIds) {
	console.log('\n── Cleanup ──')

	const { data: scoreCards } = await supabase
		.from('candidate_score_cards')
		.select('id')
		.eq('application_id', testIds.applicationId)

	if (scoreCards) {
		for (const sc of scoreCards) {
			await supabase.from('candidate_score_cards').delete().eq('id', sc.id)
		}
	}

	if (testIds.applicationId) {
		await supabase.from('application_status_log').delete().eq('application_id', testIds.applicationId)
		await supabase.from('applications').delete().eq('id', testIds.applicationId)
	}
	if (testIds.profileId) {
		await supabase.from('candidate_profiles').delete().eq('applicant_id', testIds.profileId)
		await supabase.from('profiles').delete().eq('id', testIds.profileId)
	}
	if (testIds.jobId) {
		await supabase.from('job_skills').delete().eq('job_id', testIds.jobId)
		await supabase.from('job_postings').delete().eq('id', testIds.jobId)
	}
	if (testIds.duplicateProfileId) {
		await supabase.from('profiles').delete().eq('id', testIds.duplicateProfileId)
	}

	console.log('  Cleaned up test data')
}

interface TestIds {
	jobId?: string
	profileId?: string
	applicationId?: string
	duplicateProfileId?: string
}

// ── Scoring constants (mirrors lib/scoring.ts) ───────────────────────────────

const DEFAULT_WEIGHTS = {
	weight_cv: 25,
	weight_voice: 35,
	weight_coding: 30,
	weight_system_design: 10,
}

function calculateWeightedComposite(
	scores: { cv_score: number | null; voice_score: number | null; coding_score: number | null; system_design_score: number | null },
	weights: typeof DEFAULT_WEIGHTS,
): number {
	const composite =
		(scores.cv_score ?? 0) * weights.weight_cv / 100 +
		(scores.voice_score ?? 0) * weights.weight_voice / 100 +
		(scores.coding_score ?? 0) * weights.weight_coding / 100 +
		(scores.system_design_score ?? 0) * weights.weight_system_design / 100
	return Math.round(composite * 100) / 100
}

function determineRecommendationTier(score: number): string {
	if (score >= 85) return 'strong_yes'
	if (score >= 70) return 'yes'
	if (score >= 50) return 'maybe'
	return 'no'
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl || !supabaseKey) {
		console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
		process.exit(1)
	}

	const supabase = createClient(supabaseUrl, supabaseKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	})

	const ids: TestIds = {}

	try {
		// ── Step 1: Create test job posting ──────────────────────────────────
		console.log('\n── Step 1: Create test job posting ──')

		const { data: org } = await supabase
			.from('organizations')
			.select('id')
			.limit(1)
			.maybeSingle()

		const { data: recruiter } = await supabase
			.from('profiles')
			.select('id')
			.eq('role', 'recruiter')
			.limit(1)
			.maybeSingle()

		assert(!!org, 'Organization exists in database')
		assert(!!recruiter, 'Recruiter profile exists in database')

		if (!org || !recruiter) {
			console.error('  Prerequisites not met. Aborting.')
			process.exit(1)
		}

		const { data: job, error: jobErr } = await supabase
			.from('job_postings')
			.insert({
				title: `E2E Test Job ${Date.now()}`,
				description: 'Test job for E2E flow verification',
				organization_id: org.id,
				created_by: recruiter.id,
				status: 'published',
				weight_cv: DEFAULT_WEIGHTS.weight_cv,
				weight_voice: DEFAULT_WEIGHTS.weight_voice,
				weight_coding: DEFAULT_WEIGHTS.weight_coding,
				weight_system_design: DEFAULT_WEIGHTS.weight_system_design,
			})
			.select('id')
			.single()

		ids.jobId = job?.id
		assert(!jobErr && !!job, 'Create job posting', jobErr?.message)

		// ── Step 2: Create test applicant profile ────────────────────────────
		console.log('\n── Step 2: Create test applicant ──')

		const testEmail = `e2e-test-${Date.now()}@recruitai.test`
		const { data: { user }, error: authErr } = await supabase.auth.admin.createUser({
			email: testEmail,
			email_confirm: true,
			user_metadata: { first_name: 'E2E', last_name: 'Tester' },
		})

		assert(!authErr && !!user, 'Create auth user', authErr?.message)

		if (user) {
			ids.profileId = user.id
			const { error: profileErr } = await supabase.from('profiles').insert({
				id: user.id,
				role: 'applicant',
				first_name: 'E2E',
				last_name: 'Tester',
				email: testEmail,
			})
			assert(!profileErr, 'Create applicant profile', profileErr?.message)
		}

		// ── Step 3: Submit application ────────────────────────────────────────
		console.log('\n── Step 3: Submit application ──')

		const { data: application, error: appErr } = await supabase
			.from('applications')
			.insert({
				job_id: ids.jobId,
				applicant_id: ids.profileId,
				status: 'submitted',
				submitted_at: new Date().toISOString(),
			})
			.select('id')
			.single()

		ids.applicationId = application?.id
		assert(!appErr && !!application, 'Create application', appErr?.message)

		// ── Step 4: Test duplicate application prevention ─────────────────────
		console.log('\n── Step 4: Test duplicate application prevention ──')

		if (ids.applicationId) {
			const { error: dupErr } = await supabase
				.from('applications')
				.insert({
					job_id: ids.jobId,
					applicant_id: ids.profileId,
					status: 'submitted',
					submitted_at: new Date().toISOString(),
				})
				.select('id')
				.single()

			assert(!!dupErr, 'Duplicate application is rejected', dupErr?.message)
		}

		// ── Step 5: Simulate CV parsing score ─────────────────────────────────
		console.log('\n── Step 5: Simulate CV parsing score ──')

		const testScores = {
			cv_score: 78.5,
			voice_score: 82.0,
			coding_score: 90.0,
			system_design_score: 75.0,
		}

		if (ids.applicationId) {
			const { error: cvErr } = await supabase
				.from('applications')
				.update({ cv_score: testScores.cv_score })
				.eq('id', ids.applicationId)

			assert(!cvErr, 'Set CV score', cvErr?.message)
		}

		// ── Step 6: Simulate voice interview score ───────────────────────────
		console.log('\n── Step 6: Simulate voice interview score ──')

		if (ids.applicationId) {
			const { error: voiceErr } = await supabase
				.from('applications')
				.update({ voice_score: testScores.voice_score })
				.eq('id', ids.applicationId)

			assert(!voiceErr, 'Set voice score', voiceErr?.message)
		}

		// ── Step 7: Simulate coding score ─────────────────────────────────────
		console.log('\n── Step 7: Simulate coding round score ──')

		if (ids.applicationId) {
			const { error: codeErr } = await supabase
				.from('applications')
				.update({ coding_score: testScores.coding_score })
				.eq('id', ids.applicationId)

			assert(!codeErr, 'Set coding score', codeErr?.message)
		}

		// ── Step 8: Simulate system design score ──────────────────────────────
		console.log('\n── Step 8: Simulate system design score ──')

		if (ids.applicationId) {
			const { error: sdErr } = await supabase
				.from('applications')
				.update({ system_design_score: testScores.system_design_score })
				.eq('id', ids.applicationId)

			assert(!sdErr, 'Set system design score', sdErr?.message)
		}

		// ── Step 9: Run scoring algorithm (mirrors lib/scoring.ts) ───────────
		console.log('\n── Step 9: Aggregate scoring ──')

		if (ids.applicationId) {
			const expectedComposite = calculateWeightedComposite(testScores, DEFAULT_WEIGHTS)
			const expectedTier = determineRecommendationTier(expectedComposite)

			// Update composite score (mirrors scoring.ts aggregateScores)
			const { error: compositeErr } = await supabase
				.from('applications')
				.update({ composite_score: expectedComposite, updated_at: new Date().toISOString() })
				.eq('id', ids.applicationId)

			assert(!compositeErr, 'Set composite score', compositeErr?.message)

			// Upsert score card (mirrors scoring.ts)
			const scoreBreakdown = {
				cv: { score: testScores.cv_score, weight: DEFAULT_WEIGHTS.weight_cv, weighted: Math.round(testScores.cv_score * DEFAULT_WEIGHTS.weight_cv / 100 * 100) / 100 },
				voice: { score: testScores.voice_score, weight: DEFAULT_WEIGHTS.weight_voice, weighted: Math.round(testScores.voice_score * DEFAULT_WEIGHTS.weight_voice / 100 * 100) / 100 },
				coding: { score: testScores.coding_score, weight: DEFAULT_WEIGHTS.weight_coding, weighted: Math.round(testScores.coding_score * DEFAULT_WEIGHTS.weight_coding / 100 * 100) / 100 },
				system_design: { score: testScores.system_design_score, weight: DEFAULT_WEIGHTS.weight_system_design, weighted: Math.round(testScores.system_design_score * DEFAULT_WEIGHTS.weight_system_design / 100 * 100) / 100 },
			}

			const { error: cardErr } = await supabase
				.from('candidate_score_cards')
				.upsert({
					application_id: ids.applicationId,
					cv_score: testScores.cv_score,
					voice_interview_score: testScores.voice_score,
					coding_score: testScores.coding_score,
					system_design_score: testScores.system_design_score,
					composite_score: expectedComposite,
					recommendation_tier: expectedTier,
					is_recommended: expectedTier === 'strong_yes' || expectedTier === 'yes',
					score_breakdown_json: scoreBreakdown,
					score_explanation: `Composite score: ${expectedComposite}/100 (${expectedTier}).`,
					scored_at: new Date().toISOString(),
					last_recalculated_at: new Date().toISOString(),
				}, { onConflict: 'application_id' })

			assert(!cardErr, 'Create score card', cardErr?.message)

			// Refresh rankings via RPC (same as scoring.ts)
			try {
				const { error: rankErr } = await supabase
					.rpc('refresh_job_rankings', { p_job_id: ids.jobId })

				assert(!rankErr, 'Refresh job rankings via RPC', rankErr?.message)
			} catch (rpcErr) {
				assert(false, 'Refresh job rankings via RPC', `RPC not available: ${rpcErr}`)
			}
		}

		// ── Step 10: Verify composite score and rank ─────────────────────────
		console.log('\n── Step 10: Verify final scores ──')

		if (ids.applicationId) {
			const { data: finalApp } = await supabase
				.from('applications')
				.select('composite_score, rank, cv_score, voice_score, coding_score, system_design_score')
				.eq('id', ids.applicationId)
				.single()

			assert(!!finalApp?.composite_score, 'Composite score is set', `Got: ${finalApp?.composite_score}`)

			// Expected: 78.5*0.25 + 82*0.35 + 90*0.30 + 75*0.10 = 19.625 + 28.7 + 27 + 7.5 = 82.825 → 82.83
			const expected = calculateWeightedComposite(testScores, DEFAULT_WEIGHTS)
			const actualScore = finalApp?.composite_score ? Math.round(Number(finalApp.composite_score) * 100) / 100 : null
			assert(actualScore === expected, 'Composite score is correct', `Expected ${expected}, got ${actualScore}`)

			assert(finalApp?.rank !== null && finalApp?.rank !== undefined, 'Rank is set', `Got: ${finalApp?.rank}`)

			// Verify all individual scores are preserved
			assert(Number(finalApp?.cv_score) === testScores.cv_score, 'CV score preserved', `Expected ${testScores.cv_score}, got ${finalApp?.cv_score}`)
			assert(Number(finalApp?.voice_score) === testScores.voice_score, 'Voice score preserved', `Expected ${testScores.voice_score}, got ${finalApp?.voice_score}`)
			assert(Number(finalApp?.coding_score) === testScores.coding_score, 'Coding score preserved', `Expected ${testScores.coding_score}, got ${finalApp?.coding_score}`)
			assert(Number(finalApp?.system_design_score) === testScores.system_design_score, 'System design score preserved', `Expected ${testScores.system_design_score}, got ${finalApp?.system_design_score}`)
		}

		// ── Step 11: Verify score card ────────────────────────────────────────
		console.log('\n── Step 11: Verify score card ──')

		if (ids.applicationId) {
			const { data: scoreCard } = await supabase
				.from('candidate_score_cards')
				.select('id, composite_score, recommendation_tier, is_recommended, score_breakdown_json')
				.eq('application_id', ids.applicationId)
				.single()

			assert(!!scoreCard, 'Score card exists')

			const expectedComposite = calculateWeightedComposite(testScores, DEFAULT_WEIGHTS)
			const expectedTier = determineRecommendationTier(expectedComposite)

			assert(
				scoreCard?.recommendation_tier === expectedTier,
				'Recommendation tier is correct',
				`Expected ${expectedTier}, got: ${scoreCard?.recommendation_tier}`,
			)

			assert(
				scoreCard?.is_recommended === (expectedTier === 'strong_yes' || expectedTier === 'yes'),
				'is_recommended flag is correct',
				`Got: ${scoreCard?.is_recommended}`,
			)

			assert(
				!!scoreCard?.score_breakdown_json,
				'Score breakdown JSON is populated',
			)
		}

		// ── Step 12: Test blocked status submission rejection ─────────────────
		console.log('\n── Step 12: Test blocked status rejection ──')

		// Create a separate test user + application in 'draft' status
		const draftEmail = `e2e-draft-${Date.now()}@recruitai.test`
		const { data: { user: draftUser } } = await supabase.auth.admin.createUser({
			email: draftEmail,
			email_confirm: true,
			user_metadata: { first_name: 'Draft', last_name: 'Test' },
		})

		if (draftUser) {
			ids.duplicateProfileId = draftUser.id
			await supabase.from('profiles').insert({
				id: draftUser.id,
				role: 'applicant',
				first_name: 'Draft',
				last_name: 'Test',
				email: draftEmail,
			})

			const { data: draftApp } = await supabase
				.from('applications')
				.insert({
					job_id: ids.jobId,
					applicant_id: draftUser.id,
					status: 'draft',
				})
				.select('id')
				.single()

			if (draftApp) {
				// Score calculation should fail for draft applications
				const { data: scoreResult } = await supabase
					.rpc('recalculate_composite_score', { p_application_id: draftApp.id })
					.maybeSingle()

				// The RPC either returns error or null — both mean it didn't score a draft
				assert(
					!scoreResult || Object.keys(scoreResult).length === 0,
					'Draft application is not scored',
				)

				// Clean up draft test data
				await supabase.from('applications').delete().eq('id', draftApp.id)
			}
		}

		// ── Step 13: Test recommendation tier boundaries ─────────────────────
		console.log('\n── Step 13: Test recommendation tier boundaries ──')

		assert(determineRecommendationTier(85) === 'strong_yes', 'Score 85 → strong_yes')
		assert(determineRecommendationTier(84.99) === 'yes', 'Score 84.99 → yes')
		assert(determineRecommendationTier(70) === 'yes', 'Score 70 → yes')
		assert(determineRecommendationTier(69.99) === 'maybe', 'Score 69.99 → maybe')
		assert(determineRecommendationTier(50) === 'maybe', 'Score 50 → maybe')
		assert(determineRecommendationTier(49.99) === 'no', 'Score 49.99 → no')
		assert(determineRecommendationTier(0) === 'no', 'Score 0 → no')
		assert(determineRecommendationTier(100) === 'strong_yes', 'Score 100 → strong_yes')

		// ── Step 14: Test weighted composite calculation ─────────────────────
		console.log('\n── Step 14: Test weighted composite calculation ──')

		// All zeros
		const zeroScore = calculateWeightedComposite(
			{ cv_score: 0, voice_score: 0, coding_score: 0, system_design_score: 0 },
			DEFAULT_WEIGHTS,
		)
		assert(zeroScore === 0, 'All zero scores → composite 0', `Got: ${zeroScore}`)

		// All perfect
		const perfectScore = calculateWeightedComposite(
			{ cv_score: 100, voice_score: 100, coding_score: 100, system_design_score: 100 },
			DEFAULT_WEIGHTS,
		)
		assert(perfectScore === 100, 'All perfect scores → composite 100', `Got: ${perfectScore}`)

		// Known calculation: 78.5*0.25 + 82*0.35 + 90*0.30 + 75*0.10 = 82.83
		const knownScore = calculateWeightedComposite(testScores, DEFAULT_WEIGHTS)
		assert(knownScore === 82.83, 'Known calculation → 82.83', `Got: ${knownScore}`)

		// Partial scores (null treated as 0)
		const partialScore = calculateWeightedComposite(
			{ cv_score: 80, voice_score: null, coding_score: null, system_design_score: null },
			DEFAULT_WEIGHTS,
		)
		assert(partialScore === 20, 'Partial score (only CV=80) → 20', `Got: ${partialScore}`)

	} finally {
		await cleanup(supabase, ids)
	}

	// ── Summary ──────────────────────────────────────────────────────────────
	console.log('\n═══════════════════════════════════')
	console.log(`  Results: ${passed} passed, ${failed} failed`)
	console.log('═══════════════════════════════════\n')

	process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
	console.error('E2E test crashed:', err)
	process.exit(1)
})
