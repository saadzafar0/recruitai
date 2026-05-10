/**
 * Judge0 API client.
 *
 * Supports two execution modes:
 *   1. **Callback mode** — submit with `callback_url`; Judge0 POSTs the result
 *      to our webhook when done. Preferred in production.
 *   2. **Polling mode** — submit with `wait=false`, then poll `GET /submissions/:token`
 *      until the status is terminal. Used as a fallback.
 *
 * All payloads are base64-encoded to avoid encoding issues with special chars.
 *
 * @see https://judge0.com/#submissions-submission-post
 */

// ---------------------------------------------------------------------------
// Language mapping
// ---------------------------------------------------------------------------

/**
 * Maps the `coding_language` enum values used in the database
 * to Judge0 language IDs (v1.13.1 — CE variant).
 */
const LANGUAGE_TO_JUDGE0_ID: Record<string, number> = {
	python: 71,       // Python (3.8.1)
	javascript: 63,   // JavaScript (Node.js 12.14.0)
	typescript: 74,   // TypeScript (3.7.4)
	java: 62,         // Java (OpenJDK 13.0.1)
	cpp: 54,          // C++ (GCC 9.2.0)
	c: 50,            // C (GCC 9.2.0)
	csharp: 51,       // C# (Mono 6.6.0.161)
	go: 60,           // Go (1.13.5)
	rust: 73,         // Rust (1.40.0)
	ruby: 72,         // Ruby (2.7.0)
	swift: 83,        // Swift (5.2.3)
	kotlin: 78,       // Kotlin (1.3.70)
	php: 68,          // PHP (7.4.1)
	sql: 82,          // SQL (SQLite 3.27.2)
	r: 80,            // R (4.0.0)
}

export function getJudge0LanguageId(language: string): number | null {
	const normalized = language.trim().toLowerCase().replace(/[^a-z#+ ]/g, '')
	return LANGUAGE_TO_JUDGE0_ID[normalized] ?? null
}

// ---------------------------------------------------------------------------
// Judge0 status mapping
// ---------------------------------------------------------------------------

/**
 * Judge0 status IDs → our `submission_verdict` enum.
 *
 * Judge0 statuses:
 *   1  = In Queue
 *   2  = Processing
 *   3  = Accepted
 *   4  = Wrong Answer
 *   5  = Time Limit Exceeded
 *   6  = Compilation Error
 *   7  = Runtime Error (SIGSEGV)
 *   8  = Runtime Error (SIGXFSZ)
 *   9  = Runtime Error (SIGFPE)
 *   10 = Runtime Error (SIGABRT)
 *   11 = Runtime Error (NZEC)
 *   12 = Runtime Error (Other)
 *   13 = Internal Error
 *   14 = Exec Format Error
 */
export type SubmissionVerdict =
	| 'pending'
	| 'accepted'
	| 'wrong_answer'
	| 'time_limit_exceeded'
	| 'compilation_error'
	| 'runtime_error'
	| 'internal_error'

export function mapJudge0StatusToVerdict(statusId: number): SubmissionVerdict {
	switch (statusId) {
		case 1:
		case 2:
			return 'pending'
		case 3:
			return 'accepted'
		case 4:
			return 'wrong_answer'
		case 5:
			return 'time_limit_exceeded'
		case 6:
			return 'compilation_error'
		case 7:
		case 8:
		case 9:
		case 10:
		case 11:
		case 12:
			return 'runtime_error'
		case 13:
		case 14:
		default:
			// Map to runtime_error for now to avoid DB enum conflicts if 'internal_error' is missing
			return 'runtime_error'
	}
}

export function isTerminalStatus(statusId: number): boolean {
	return statusId >= 3
}

// ---------------------------------------------------------------------------
// Base64 helpers
// ---------------------------------------------------------------------------

function toBase64(value: string): string {
	return Buffer.from(value, 'utf8').toString('base64')
}

export function fromBase64(value: string | null | undefined): string {
	if (!value) return ''
	try {
		return Buffer.from(value, 'base64').toString('utf8')
	} catch {
		return value
	}
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function getJudge0Url(): string {
	const url = process.env.JUDGE0_URL
	if (!url) throw new Error('Missing JUDGE0_URL environment variable')
	return url.replace(/\/+$/, '')
}

function getAuthHeaders(): Record<string, string> {
	const token = process.env.JUDGE0_API_TOKEN
	if (!token) return {}
	return { 'X-Auth-Token': token }
}

function getCallbackUrl(): string | null {
	return process.env.JUDGE0_CALLBACK_URL || null
}

function getTimeoutMs(): number {
	const raw = Number(process.env.EXECUTOR_SUBMISSION_TIMEOUT_MS || '30000')
	return Number.isFinite(raw) && raw > 0 ? raw : 30000
}

function getPollIntervalMs(): number {
	const raw = Number(process.env.EXECUTOR_POLL_INTERVAL_MS || '2000')
	return Number.isFinite(raw) && raw > 0 ? raw : 2000
}

function getPollMaxAttempts(): number {
	const raw = Number(process.env.EXECUTOR_POLL_MAX_ATTEMPTS || '60')
	return Number.isFinite(raw) && raw > 0 ? raw : 60
}

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

export interface Judge0SubmissionParams {
	sourceCode: string
	languageId: number
	stdin?: string
	expectedOutput?: string
	cpuTimeLimit?: number   // seconds (float)
	memoryLimit?: number    // KB
}

export interface Judge0SubmissionResult {
	token: string
	statusId: number
	verdict: SubmissionVerdict
	stdout: string
	stderr: string
	compileOutput: string
	message: string
	time: number | null         // seconds
	memory: number | null       // KB
}

interface Judge0CreateResponse {
	token?: string
	status?: { id: number }
	stdout?: string | null
	stderr?: string | null
	compile_output?: string | null
	message?: string | null
	time?: string | null
	memory?: number | null
}

interface Judge0GetResponse {
	token: string
	status: { id: number; description: string }
	stdout: string | null
	stderr: string | null
	compile_output: string | null
	message: string | null
	time: string | null
	memory: number | null
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Submit code to Judge0.
 *
 * When a callback URL is configured, Judge0 will POST the result to it
 * and we return immediately with just the token.
 *
 * When no callback URL is configured, we use polling mode.
 */
export async function submitToJudge0(
	params: Judge0SubmissionParams,
): Promise<{ token: string; mode: 'callback' | 'polling' }> {
	const baseUrl = getJudge0Url()
	const callbackUrl = getCallbackUrl()

	const body: Record<string, unknown> = {
		source_code: toBase64(params.sourceCode),
		language_id: params.languageId,
		base64_encoded: true,
	}

	if (params.stdin) {
		body.stdin = toBase64(params.stdin)
	}
	if (params.expectedOutput) {
		body.expected_output = toBase64(params.expectedOutput)
	}
	if (params.cpuTimeLimit) {
		body.cpu_time_limit = params.cpuTimeLimit
	}
	if (params.memoryLimit) {
		body.memory_limit = params.memoryLimit
	}
	if (callbackUrl) {
		body.callback_url = callbackUrl
	}

	const endpoint = `${baseUrl}/submissions?base64_encoded=true&wait=false`
	console.log(`[executor-worker] Submitting to Judge0: ${endpoint}`)
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...getAuthHeaders(),
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(getTimeoutMs()),
	})

	if (!response.ok) {
		const text = await response.text().catch(() => '')
		throw new Error(`Judge0 submission failed (${response.status}): ${text}`)
	}

	const data = (await response.json()) as Judge0CreateResponse

	if (!data.token) {
		throw new Error('Judge0 did not return a submission token')
	}

	return {
		token: data.token,
		mode: callbackUrl ? 'callback' : 'polling',
	}
}

/**
 * Poll Judge0 until the submission reaches a terminal state.
 * Used when no callback URL is configured.
 */
export async function pollSubmissionResult(
	token: string,
): Promise<Judge0SubmissionResult> {
	const baseUrl = getJudge0Url()
	const intervalMs = getPollIntervalMs()
	const maxAttempts = getPollMaxAttempts()

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const endpoint = `${baseUrl}/submissions/${token}?base64_encoded=true&fields=token,status,stdout,stderr,compile_output,message,time,memory`

		const response = await fetch(endpoint, {
			method: 'GET',
			headers: getAuthHeaders(),
			signal: AbortSignal.timeout(getTimeoutMs()),
		})

		if (!response.ok) {
			const text = await response.text().catch(() => '')
			throw new Error(`Judge0 poll failed (${response.status}): ${text}`)
		}

		const data = (await response.json()) as Judge0GetResponse
		const statusId = data.status?.id ?? 0

		if (isTerminalStatus(statusId)) {
			return parseJudge0Response(data as unknown as Record<string, unknown>)
		}

		// Wait before next poll
		await new Promise((resolve) => setTimeout(resolve, intervalMs))
	}

	throw new Error(`Judge0 submission ${token} did not complete after ${maxAttempts} poll attempts`)
}

/**
 * Parse a Judge0 response (from either polling or webhook callback) into our
 * standardized result format.
 */
export function parseJudge0Response(data: Record<string, unknown>): Judge0SubmissionResult {
	const status = data.status as { id: number; description?: string } | undefined
	const statusId = status?.id ?? 0

	return {
		token: (data.token as string) || '',
		statusId,
		verdict: mapJudge0StatusToVerdict(statusId),
		stdout: fromBase64(data.stdout as string | null),
		stderr: fromBase64(data.stderr as string | null),
		compileOutput: fromBase64(data.compile_output as string | null),
		message: (data.message as string) || '',
		time: data.time !== null && data.time !== undefined ? parseFloat(String(data.time)) : null,
		memory: data.memory !== null && data.memory !== undefined ? Number(data.memory) : null,
	}
}
