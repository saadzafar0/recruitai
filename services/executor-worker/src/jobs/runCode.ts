/**
 * BullMQ processor for the `code-submissions` queue.
 *
 * Job payload matches the SubmissionJobPayload interface from nextjs-web/lib/bull.ts:
 *   { application_id, code, language, test_cases?, time_limit? }
 *
 * Flow:
 *   1. Resolve the coding assessment + problem for the application
 *   2. Create (or find) a coding_submissions row
 *   3. Load test cases from coding_test_cases
 *   4. Submit each test case to Judge0 and collect results
 *   5. Calculate score and persist everything to Supabase
 */

import { Job, QueueEvents, UnrecoverableError, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { createRedisConnection } from '../services/redisConnection'
import { supabaseAdmin } from '../services/supabase'
import {
	getJudge0LanguageId,
	submitToJudge0,
	pollSubmissionResult,
	type Judge0SubmissionResult,
	type SubmissionVerdict,
} from '../services/judge0'
import {
	persistExecutionResults,
	type TestCaseResult,
	type SubmissionScoreOutput,
} from '../services/scoreUpdater'

// ---------------------------------------------------------------------------
// Queue config
// ---------------------------------------------------------------------------

export const CODE_SUBMISSIONS_QUEUE_NAME =
	process.env.EXECUTOR_QUEUE_NAME || 'code-submissions'

// ---------------------------------------------------------------------------
// Job payload (mirrors nextjs-web/lib/bull.ts SubmissionJobPayload)
// ---------------------------------------------------------------------------

export interface CodeSubmissionJobData {
	application_id: string
	coding_problem_id?: string
	code: string
	language: string
	test_cases?: unknown
	time_limit?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireString(value: unknown, name: string): string {
	if (typeof value !== 'string' || !value.trim()) {
		throw new UnrecoverableError(`Missing required field "${name}" on code-submission job`)
	}
	return value.trim()
}

// ---------------------------------------------------------------------------
// DB types
// ---------------------------------------------------------------------------

interface CodingAssessmentRow {
	id: string
	application_id: string
}

interface CodingSubmissionRow {
	id: string
	assessment_id: string
	problem_id: string
}

interface TestCaseRow {
	id: string
	input: string
	expected_output: string
	weight: number
	is_sample: boolean
	is_hidden: boolean
}

interface JobProblemRow {
	problem_id: string
}

interface CodingProblemRow {
	id: string
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

async function findOrCreateAssessment(applicationId: string): Promise<CodingAssessmentRow> {
	// Check if an assessment already exists
	const { data: existing, error: selErr } = await supabaseAdmin
		.from('coding_assessments')
		.select('id, application_id')
		.eq('application_id', applicationId)
		.maybeSingle()

	if (selErr) {
		throw new Error(`Failed to load coding_assessments: ${selErr.message}`)
	}

	if (existing) {
		// Mark as in_progress if not already
		if ((existing as { status?: string }).status !== 'in_progress') {
			await supabaseAdmin
				.from('coding_assessments')
				.update({ status: 'in_progress', started_at: new Date().toISOString() })
				.eq('id', (existing as CodingAssessmentRow).id)
		}
		return existing as CodingAssessmentRow
	}

	// Create new assessment
	const { data: created, error: insErr } = await supabaseAdmin
		.from('coding_assessments')
		.insert({
			application_id: applicationId,
			status: 'in_progress',
			started_at: new Date().toISOString(),
		})
		.select('id, application_id')
		.single()

	if (insErr) {
		throw new Error(`Failed to create coding_assessments: ${insErr.message}`)
	}

	return created as CodingAssessmentRow
}

async function findProblemForApplication(applicationId: string): Promise<string | null> {
	// Find the job_id for this application
	const { data: appRow } = await supabaseAdmin
		.from('applications')
		.select('job_id')
		.eq('id', applicationId)
		.maybeSingle()

	const jobId = (appRow as { job_id?: string } | null)?.job_id
	if (!jobId) return null

	// Find the first coding problem linked to this job
	const { data: problemRow } = await supabaseAdmin
		.from('job_coding_problems')
		.select('problem_id')
		.eq('job_id', jobId)
		.order('order_index', { ascending: true })
		.limit(1)
		.maybeSingle()

	return (problemRow as JobProblemRow | null)?.problem_id || null
}

async function validateProvidedProblem(problemId: string): Promise<string | null> {
	console.log('[executor-worker] Validating provided problem ID:', problemId)
	
	const { data, error } = await supabaseAdmin
		.from('coding_problems')
		.select('id')
		.eq('id', problemId)
		.maybeSingle()

	if (error) {
		console.error('[executor-worker] Error validating problem:', error.message)
		throw new Error(`Failed to validate coding_problem_id: ${error.message}`)
	}

	if (data) {
		console.log('[executor-worker] Problem ID validation SUCCESS:', problemId)
	} else {
		console.warn('[executor-worker] Problem ID validation FAILED - ID not found:', problemId)
	}

	return (data as CodingProblemRow | null)?.id || null
}

async function resolveProblemId(applicationId: string, preferredProblemId?: string): Promise<string | null> {
	console.log('[executor-worker] resolveProblemId called with:', {
		applicationId,
		preferredProblemId: preferredProblemId || 'NONE',
	})

	if (preferredProblemId) {
		console.log('[executor-worker] Attempting to validate provided problem ID...')
		const validatedProblemId = await validateProvidedProblem(preferredProblemId)
		if (validatedProblemId) {
			console.log('[executor-worker] Provided problem ID validated and will be used')
			return validatedProblemId
		}

		console.warn(
			`[executor-worker] Provided coding_problem_id ${preferredProblemId} was not found for application ${applicationId}. Falling back to job mapping.`,
		)
	}

	console.log('[executor-worker] No provided problem ID, falling back to job mapping...')
	const result = await findProblemForApplication(applicationId)
	console.log('[executor-worker] Job mapping result:', result || 'NO PROBLEM FOUND')
	return result
}

async function findOrCreateSubmission(
	assessmentId: string,
	problemId: string,
	language: string,
	sourceCode: string,
): Promise<CodingSubmissionRow> {
	const { data: created, error } = await supabaseAdmin
		.from('coding_submissions')
		.insert({
			assessment_id: assessmentId,
			problem_id: problemId,
			language,
			source_code: sourceCode,
			verdict: 'pending',
			is_final: true,
		})
		.select('id, assessment_id, problem_id')
		.single()

	if (error) {
		throw new Error(`Failed to create coding_submissions: ${error.message}`)
	}

	return created as CodingSubmissionRow
}

async function loadTestCases(problemId: string): Promise<TestCaseRow[]> {
	const { data, error } = await supabaseAdmin
		.from('coding_test_cases')
		.select('id, input, expected_output, weight, is_sample, is_hidden')
		.eq('problem_id', problemId)
		.order('order_index', { ascending: true })

	if (error) {
		throw new Error(`Failed to load coding_test_cases: ${error.message}`)
	}

	return (data || []) as TestCaseRow[]
}

// ---------------------------------------------------------------------------
// Inline test case handling (when test_cases are provided in the job payload)
// ---------------------------------------------------------------------------

interface InlineTestCase {
	input: string
	expected_output: string
}

function parseInlineTestCases(raw: unknown): InlineTestCase[] {
	if (!Array.isArray(raw)) return []

	return raw
		.filter((tc): tc is Record<string, unknown> =>
			tc !== null && typeof tc === 'object' && !Array.isArray(tc),
		)
		.map((tc) => ({
			input: typeof tc.input === 'string' ? tc.input : String(tc.input ?? ''),
			expected_output: typeof tc.expected_output === 'string'
				? tc.expected_output
				: String(tc.expected_output ?? ''),
		}))
		.filter((tc) => tc.input || tc.expected_output)
}

// ---------------------------------------------------------------------------
// Core execution
// ---------------------------------------------------------------------------

function normalizeOutput(value: string): string {
	const trimmed = value.trim()
	if (!trimmed) return ''

	try {
		const parsed = JSON.parse(trimmed)
		return JSON.stringify(parsed)
	} catch {
		return trimmed.replace(/\s+/g, '')
	}
}

async function executeTestCase(
	sourceCode: string,
	languageId: number,
	stdin: string,
	expectedOutput: string,
	timeLimitSeconds?: number,
): Promise<Judge0SubmissionResult> {
	const { token, mode } = await submitToJudge0({
		sourceCode,
		languageId,
		stdin,
		// Do NOT pass expectedOutput to Judge0 — its string comparison is whitespace-sensitive
		// and will false-fail correct solutions (e.g. "[24, 12, 8, 6]" vs "[24,12,8,6]").
		// We compare outputs ourselves below.
		cpuTimeLimit: timeLimitSeconds,
	})

	// In callback mode the webhook updates the DB directly; but since we're
	// processing per-test-case in a tight loop we always poll for simplicity.
	// The webhook is for the async/batch path (future enhancement).
	return pollSubmissionResult(token)
}

// ---------------------------------------------------------------------------
// Job processor
// ---------------------------------------------------------------------------

async function processCodeSubmission(
	job: Job<CodeSubmissionJobData>,
): Promise<SubmissionScoreOutput> {
	const applicationId = requireString(job.data.application_id, 'application_id')
	const preferredProblemId = typeof job.data.coding_problem_id === 'string'
		? job.data.coding_problem_id.trim()
		: ''
	const sourceCode = requireString(job.data.code, 'code')
	const language = requireString(job.data.language, 'language')
	const timeLimitHint = typeof job.data.time_limit === 'number' ? job.data.time_limit : undefined

	console.info(
		`[executor-worker] Processing job ${job.id || 'unknown'} for application ${applicationId} (${language})`,
	)

	console.log('[executor-worker] Job data received:', {
		job_id: job.id,
		application_id: applicationId,
		coding_problem_id: preferredProblemId || 'NOT PROVIDED',
		language: language,
		code_length: sourceCode.length,
	})

	// Resolve Judge0 language ID
	const languageId = getJudge0LanguageId(language)
	if (languageId === null) {
		throw new UnrecoverableError(
			`Unsupported language "${language}". Supported: python, javascript, typescript, java, cpp, c, csharp, go, rust, ruby, swift, kotlin, php, sql, r`,
		)
	}

	// Set up assessment + submission in Supabase
	const assessment = await findOrCreateAssessment(applicationId)
	
	console.log('[executor-worker] Resolving problem ID:', {
		provided_problem_id: preferredProblemId || 'NONE',
		application_id: applicationId,
	})
	
	let problemId = await resolveProblemId(applicationId, preferredProblemId || undefined)

	// If no problem linked to the job, create a placeholder problem so FK won't fail
	async function createPlaceholderProblem(): Promise<string> {
		const title = `Auto-generated placeholder problem for application ${applicationId}`
		const { data: created, error: insErr } = await supabaseAdmin
			.from('coding_problems')
			.insert({
				title,
				description: 'Placeholder problem created automatically by executor-worker',
				difficulty: 'easy',
				supported_languages: ['python','javascript','typescript','java','c','cpp'],
				is_active: false,
				created_at: new Date().toISOString(),
			})
			.select('id')
			.single()

		if (insErr || !created) {
			throw new Error(`Failed to create placeholder coding_problem: ${insErr?.message || 'unknown'}`)
		}
		return (created as { id: string }).id
	}

	if (!problemId) {
		console.warn('[executor-worker] No problem ID resolved, creating placeholder')
		problemId = await createPlaceholderProblem()
		console.info(`[executor-worker] Created placeholder problem ${problemId} for application ${applicationId}`)
	} else {
		console.log('[executor-worker] Problem ID resolved:', problemId)
	}

	console.log('[executor-worker] About to create submission with:', {
		assessment_id: assessment.id,
		problem_id: problemId,
		language: language,
		code_length: sourceCode.length,
	})

	const submission = await findOrCreateSubmission(
		assessment.id,
		problemId,
		language,
		sourceCode,
	)

	// Load test cases — prefer DB test cases, fall back to inline from job payload
	let testCases: { id: string | null; input: string; expectedOutput: string }[]

	if (problemId) {
		const dbTestCases = await loadTestCases(problemId)
		testCases = dbTestCases.map((tc) => ({
			id: tc.id,
			input: tc.input,
			expectedOutput: tc.expected_output,
		}))
	} else {
		testCases = []
	}

	// Fall back to inline test cases from job payload
	if (testCases.length === 0) {
		const inline = parseInlineTestCases(job.data.test_cases)
		testCases = inline.map((tc) => ({
			id: null,
			input: tc.input,
			expectedOutput: tc.expected_output,
		}))
	}

	// If still no test cases, run the code once with no stdin to at least check compilation
	if (testCases.length === 0) {
		testCases = [{ id: null, input: '', expectedOutput: '' }]
	}

	// Execute each test case
	const testCaseResults: TestCaseResult[] = []
	let overallVerdict: SubmissionVerdict = 'accepted'
	let totalRuntimeMs = 0
	let maxMemoryKb = 0

	for (const tc of testCases) {
		try {
			console.log(`[executor-worker] Executing test case ${tc.id || 'synthetic'} (input length: ${tc.input.length})`)
			const result = await executeTestCase(
				sourceCode,
				languageId,
				tc.input,
				tc.expectedOutput,
				10
				//timeLimitHint ? timeLimitHint / 1000 : undefined,
			)

			// Judge0 verdict is 'accepted' only when we pass expected_output to it.
			// Since we deliberately omit it (to avoid whitespace false-failures), we
			// do the comparison ourselves: normalise both sides by trimming whitespace.
			const actualNorm = normalizeOutput(result.stdout)
			const expectedNorm = normalizeOutput(tc.expectedOutput)
			const outputMatches =
				!tc.expectedOutput // no expected = just check it ran without error
					? result.verdict !== 'runtime_error' &&
					  result.verdict !== 'compilation_error' &&
					  result.verdict !== 'time_limit_exceeded'
					: actualNorm === expectedNorm

			const passed =
				(result.verdict === 'accepted' || result.verdict === 'wrong_answer') &&
				outputMatches

			if (!passed && overallVerdict === 'accepted') {
				// Use Judge0's verdict only for execution errors; for output mismatches use wrong_answer
				const execVerdict = result.verdict === 'pending' ? 'runtime_error' : result.verdict
				overallVerdict =
					execVerdict === 'wrong_answer' || execVerdict === 'accepted'
						? 'wrong_answer'   // output mismatch
						: execVerdict      // TLE, runtime_error, etc.
			}

			if (result.time !== null) {
				totalRuntimeMs += Math.round(result.time * 1000)
			}
			if (result.memory !== null && result.memory > maxMemoryKb) {
				maxMemoryKb = result.memory
			}

			// Always push — synthetic test cases (null id) still count toward the score.
			testCaseResults.push({
				testCaseId: tc.id ?? null,
				passed,
				actualOutput: result.stdout.trim(),
				errorMessage: result.stderr || result.compileOutput || result.message || '',
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			console.warn(`[executor-worker] Test case execution failed: ${message}`)

			if (overallVerdict === 'accepted') {
				overallVerdict = 'runtime_error'
			}

			testCaseResults.push({
				testCaseId: tc.id ?? null,
				passed: false,
				actualOutput: '',
				errorMessage: message,
			})
		}
	}

	// Calculate score
	const totalTests = testCases.length
	const passedTests = testCaseResults.filter((r) => r.passed).length
	// If there were no DB test cases (all inline/synthetic), use overall verdict
	const effectivePassedTests = testCaseResults.length > 0
		? passedTests
		: (overallVerdict === 'accepted' ? totalTests : 0)
	const scoreCorrectness = totalTests > 0
		? Math.round((effectivePassedTests / totalTests) * 100 * 100) / 100
		: (overallVerdict === 'accepted' ? 100 : 0)

	// Persist results
	return persistExecutionResults({
		submissionId: submission.id,
		assessmentId: assessment.id,
		applicationId,
		problemId,
		verdict: overallVerdict,
		testCasesTotal: totalTests,
		testCasesPassed: effectivePassedTests,
		testCasesFailed: totalTests - effectivePassedTests,
		runtimeMs: totalRuntimeMs || null,
		memoryUsedMb: maxMemoryKb > 0 ? Math.round((maxMemoryKb / 1024) * 100) / 100 : null,
		scoreCorrectness,
		testCaseResults,
	})
}

// ---------------------------------------------------------------------------
// Worker lifecycle
// ---------------------------------------------------------------------------

function getConcurrency(): number {
	const raw = Number(process.env.EXECUTOR_CONCURRENCY || '2')
	return Number.isFinite(raw) && raw > 0 ? raw : 2
}

export interface CodeWorkerHandles {
	worker: Worker<CodeSubmissionJobData, SubmissionScoreOutput>
	queueEvents: QueueEvents
	close: () => Promise<void>
}

export function startCodeSubmissionWorker(): CodeWorkerHandles {
	const workerConnection: IORedis = createRedisConnection()
	const eventsConnection: IORedis = createRedisConnection()

	const worker = new Worker<CodeSubmissionJobData, SubmissionScoreOutput>(
		CODE_SUBMISSIONS_QUEUE_NAME,
		processCodeSubmission,
		{
			connection: workerConnection,
			concurrency: getConcurrency(),
			maxStalledCount: 3,
		},
	)

	const queueEvents = new QueueEvents(CODE_SUBMISSIONS_QUEUE_NAME, {
		connection: eventsConnection,
	})

	worker.on('completed', (job, result) => {
		console.info(
			`[executor-worker] Job ${job.id || 'unknown'} completed. application=${result.applicationId} verdict=${result.verdict} score=${result.scoreCorrectness}`,
		)
	})

	worker.on('failed', (job, error) => {
		const attemptsMade = job?.attemptsMade || 0
		const maxAttempts = job?.opts?.attempts || 1
		console.error(
			`[executor-worker] Job ${job?.id || 'unknown'} failed on attempt ${attemptsMade}/${maxAttempts}: ${error.message}`,
		)
	})

	worker.on('error', (error) => {
		console.error('[executor-worker] Worker runtime error', error)
	})

	return {
		worker,
		queueEvents,
		close: async () => {
			await Promise.allSettled([
				worker.close(),
				queueEvents.close(),
				workerConnection.quit(),
				eventsConnection.quit(),
			])
		},
	}
}