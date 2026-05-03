/**
 * E2E Test: Full Candidate Flow Verification
 *
 * Run: pnpm test:e2e
 *
 * Verifies: apply → voice interview → coding round → system design → score on dashboard
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

	if (testIds.scoreCardId) {
		await supabase.from('candidate_score_cards').delete().eq('id', testIds.scoreCardId)
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

	console.log('  Cleaned up test data')
}

interface TestIds {
	jobId?: string
	profileId?: string
	applicationId?: string
	scoreCardId?: string
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
			.single()

		const { data: recruiter } = await supabase
			.from('profiles')
			.select('id')
			.eq('role', 'recruiter')
			.limit(1)
			.single()

		assert(!!org, 'Organization exists in database')
		assert(!!recruiter, 'Recruiter profile exists in database')

		const { data: job, error: jobErr } = await supabase
			.from('job_postings')
			.insert({
				title: `E2E Test Job ${Date.now()}`,
				description: 'Test job for E2E flow verification',
				organization_id: org?.id,
				created_by: recruiter?.id,
				status: 'published',
				weight_cv: 25,
				weight_voice: 35,
				weight_coding: 30,
				weight_system_design: 10,
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

		// ── Step 4: Simulate CV score ─────────────────────────────────────────
		console.log('\n── Step 4: Simulate CV parsing score ──')

		if (ids.applicationId) {
			const { error: cvErr } = await supabase
				.from('applications')
				.update({ cv_score: 78.5 })
				.eq('id', ids.applicationId)

			assert(!cvErr, 'Set CV score', cvErr?.message)
		}

		// ── Step 5: Simulate voice interview score ───────────────────────────
		console.log('\n── Step 5: Simulate voice interview score ──')

		if (ids.applicationId) {
			const { error: voiceErr } = await supabase
				.from('applications')
				.update({ voice_score: 82.0 })
				.eq('id', ids.applicationId)

			assert(!voiceErr, 'Set voice score', voiceErr?.message)
		}

		// ── Step 6: Simulate coding score ─────────────────────────────────────
		console.log('\n── Step 6: Simulate coding round score ──')

		if (ids.applicationId) {
			const { error: codeErr } = await supabase
				.from('applications')
				.update({ coding_score: 90.0 })
				.eq('id', ids.applicationId)

			assert(!codeErr, 'Set coding score', codeErr?.message)
		}

		// ── Step 7: Simulate system design score ──────────────────────────────
		console.log('\n── Step 7: Simulate system design score ──')

		if (ids.applicationId) {
			const { error: sdErr } = await supabase
				.from('applications')
				.update({ system_design_score: 75.0 })
				.eq('id', ids.applicationId)

			assert(!sdErr, 'Set system design score', sdErr?.message)
		}

		// ── Step 8: Call scoring aggregate ────────────────────────────────────
		console.log('\n── Step 8: Aggregate scoring ──')

		if (ids.applicationId) {
			const { data: scoreResult, error: scoreErr } = await supabase
				.rpc('recalculate_composite_score', { p_application_id: ids.applicationId })

			assert(!scoreErr, 'Recalculate composite score via RPC', scoreErr?.message)

			const { data: refreshResult, error: refreshErr } = await supabase
				.rpc('refresh_job_rankings', { p_job_id: ids.jobId })

			assert(!refreshErr, 'Refresh job rankings via RPC', refreshErr?.message)
		}

		// ── Step 9: Verify composite score and rank ───────────────────────────
		console.log('\n── Step 9: Verify final scores ──')

		if (ids.applicationId) {
			const { data: finalApp } = await supabase
				.from('applications')
				.select('composite_score, rank, cv_score, voice_score, coding_score, system_design_score')
				.eq('id', ids.applicationId)
				.single()

			assert(!!finalApp?.composite_score, 'Composite score is set', `Got: ${finalApp?.composite_score}`)

			// Expected: 78.5*0.25 + 82*0.35 + 90*0.30 + 75*0.10 = 19.625 + 28.7 + 27 + 7.5 = 82.825 → 82.83
			const expected = Math.round((78.5 * 0.25 + 82 * 0.35 + 90 * 0.30 + 75 * 0.10) * 100) / 100
			const actualScore = finalApp?.composite_score ? Math.round(Number(finalApp.composite_score) * 100) / 100 : null
			assert(actualScore === expected, 'Composite score is correct', `Expected ${expected}, got ${actualScore}`)

			assert(finalApp?.rank !== null && finalApp?.rank !== undefined, 'Rank is set', `Got: ${finalApp?.rank}`)
		}

		// ── Step 10: Verify score card ────────────────────────────────────────
		console.log('\n── Step 10: Verify score card ──')

		if (ids.applicationId) {
			const { data: scoreCard } = await supabase
				.from('candidate_score_cards')
				.select('id, composite_score, recommendation_tier')
				.eq('application_id', ids.applicationId)
				.single()

			ids.scoreCardId = scoreCard?.id
			assert(!!scoreCard, 'Score card exists')
			assert(
				scoreCard?.recommendation_tier === 'yes',
				'Recommendation tier is correct',
				`Got: ${scoreCard?.recommendation_tier}`,
			)
		}

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
