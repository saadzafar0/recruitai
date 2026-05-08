/**
 * Persists code execution results to Supabase.
 *
 * Updates:
 *   - coding_submissions: verdict, runtime, memory, test pass/fail counts, score
 *   - coding_test_results: per-test-case pass/fail, actual output, errors
 *   - applications: coding_score (0-100)
 */

import { supabaseAdmin } from './supabase'
import type { SubmissionVerdict } from './judge0'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestCaseResult {
	testCaseId: string
	passed: boolean
	actualOutput: string
	errorMessage: string
}

export interface SubmissionScoreInput {
	submissionId: string
	assessmentId: string
	applicationId: string
	problemId: string
	verdict: SubmissionVerdict
	testCasesTotal: number
	testCasesPassed: number
	testCasesFailed: number
	runtimeMs: number | null
	memoryUsedMb: number | null
	scoreCorrectness: number
	testCaseResults: TestCaseResult[]
}

export interface SubmissionScoreOutput {
	submissionId: string
	applicationId: string
	verdict: SubmissionVerdict
	scoreCorrectness: number
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function persistExecutionResults(
	input: SubmissionScoreInput,
): Promise<SubmissionScoreOutput> {
	// 1. Update the coding_submissions row
	const { error: subError } = await supabaseAdmin
		.from('coding_submissions')
		.update({
			verdict: input.verdict,
			test_cases_total: input.testCasesTotal,
			test_cases_passed: input.testCasesPassed,
			test_cases_failed: input.testCasesFailed,
			runtime_ms: input.runtimeMs,
			memory_used_mb: input.memoryUsedMb,
			score_correctness: input.scoreCorrectness,
			total_score: input.scoreCorrectness, // correctness is the primary score dimension for auto-grading
		})
		.eq('id', input.submissionId)

	if (subError) {
		throw new Error(`Failed to update coding_submissions: ${subError.message}`)
	}

	// 2. Insert per-test-case results (upsert-style: delete old results first to handle re-runs)
	if (input.testCaseResults.length > 0) {
		// Clean up any stale results from previous runs of the same submission
		await supabaseAdmin
			.from('coding_test_results')
			.delete()
			.eq('submission_id', input.submissionId)

		const rows = input.testCaseResults.map((tc) => ({
			submission_id: input.submissionId,
			test_case_id: tc.testCaseId,
			passed: tc.passed,
			actual_output: tc.actualOutput,
			error_message: tc.errorMessage || null,
		}))

		const { error: tcError } = await supabaseAdmin
			.from('coding_test_results')
			.insert(rows)

		if (tcError) {
			console.warn(`[executor-worker] Failed to insert coding_test_results: ${tcError.message}`)
			// Non-fatal — the submission itself is still updated
		}
	}

	// 3. Update applications.coding_score
	const { error: appError } = await supabaseAdmin
		.from('applications')
		.update({
			coding_score: input.scoreCorrectness,
			updated_at: new Date().toISOString(),
		})
		.eq('id', input.applicationId)

	if (appError) {
		throw new Error(`Failed to update applications.coding_score: ${appError.message}`)
	}

	console.info(
		`[executor-worker] Results persisted: submission=${input.submissionId} application=${input.applicationId} verdict=${input.verdict} score=${input.scoreCorrectness}`,
	)

	return {
		submissionId: input.submissionId,
		applicationId: input.applicationId,
		verdict: input.verdict,
		scoreCorrectness: input.scoreCorrectness,
	}
}
