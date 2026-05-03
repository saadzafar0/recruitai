/**
 * LLM-driven evaluator. Same provider precedence (Gemini -> Grok fallback) as
 * services/cv-parser-worker/src/services/geminiParser.ts so the two workers
 * share env-var conventions (EVALUATOR_PROVIDER / EVALUATOR_FALLBACK_PROVIDER /
 * EVALUATOR_DISABLE_FALLBACK).
 */

export type EvaluatorProvider = 'gemini' | 'grok'

export type EvaluationKind = 'voice_interview' | 'system_design'

export interface EvaluationDimension {
	key: string
	label: string
	description: string
}

export const VOICE_INTERVIEW_DIMENSIONS: EvaluationDimension[] = [
	{ key: 'relevance', label: 'Relevance', description: "Did the candidate's answers stay on-topic and address what was asked?" },
	{ key: 'clarity', label: 'Clarity', description: 'Were the answers easy to follow, well-structured, and free of rambling?' },
	{ key: 'depth', label: 'Depth', description: 'Did the candidate go past surface-level explanations with concrete details, examples, or trade-offs?' },
	{ key: 'communication', label: 'Communication', description: 'Pacing, vocabulary, and overall verbal expression quality.' },
	{ key: 'confidence', label: 'Confidence', description: 'Assertiveness, low filler-word density, willingness to commit to an answer.' },
]

export const SYSTEM_DESIGN_DIMENSIONS: EvaluationDimension[] = [
	{ key: 'requirements', label: 'Requirements', description: 'Did the candidate capture functional and non-functional requirements before designing?' },
	{ key: 'scalability', label: 'Scalability', description: 'Did they reason about throughput, growth, partitioning, caching, and bottlenecks?' },
	{ key: 'architecture', label: 'Architecture', description: 'Were their component, datastore, and protocol choices sensible and justified?' },
	{ key: 'trade_offs', label: 'Trade-offs', description: 'Did they articulate trade-offs and consider alternatives, not just one solution?' },
	{ key: 'communication', label: 'Communication', description: 'Was the explanation clear, structured, and easy for a reviewer to follow?' },
]

export interface RawEvaluationResult {
	scores: Record<string, number>
	summary: string
	strengths: string[]
	weaknesses: string[]
	recommendation: 'strong_pass' | 'pass' | 'borderline' | 'fail'
}

export interface EvaluationResult extends RawEvaluationResult {
	totalScore: number
	providerUsed: EvaluatorProvider
	scoringModelVersion: string
	scoredAt: string
}

export class InvalidLlmEvaluationError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'InvalidLlmEvaluationError'
	}
}

interface GeminiGenerateContentResponse {
	candidates?: Array<{
		content?: { parts?: Array<{ text?: string }> }
	}>
	error?: { message?: string }
}

interface GrokChatResponse {
	choices?: Array<{
		message?: { content?: string | Array<{ text?: string; type?: string }> }
	}>
	error?: { message?: string }
}

function normalizeProvider(provider?: string): EvaluatorProvider | null {
	if (!provider) return null
	const normalized = provider.trim().toLowerCase()
	if (normalized === 'gemini' || normalized === 'grok') return normalized
	return null
}

function getProviderOrder(preferredProvider?: EvaluatorProvider): EvaluatorProvider[] {
	const envPrimary = normalizeProvider(process.env.EVALUATOR_PROVIDER)
	const envFallback = normalizeProvider(process.env.EVALUATOR_FALLBACK_PROVIDER)
	const disableFallback = (process.env.EVALUATOR_DISABLE_FALLBACK || '').toLowerCase() === 'true'

	const primaryProvider = preferredProvider || envPrimary || 'gemini'
	const fallbackProvider = envFallback || (primaryProvider === 'gemini' ? 'grok' : 'gemini')

	if (disableFallback) return [primaryProvider]
	return Array.from(new Set<EvaluatorProvider>([primaryProvider, fallbackProvider]))
}

function getMaxChars(): number {
	const raw = Number(process.env.EVALUATOR_MAX_TEXT_CHARS || '24000')
	return Number.isFinite(raw) && raw > 0 ? raw : 24000
}

function getTimeoutMs(): number {
	const raw = Number(process.env.EVALUATOR_TIMEOUT_MS || '45000')
	return Number.isFinite(raw) && raw > 0 ? raw : 45000
}

function buildSystemInstruction(kind: EvaluationKind, dimensions: EvaluationDimension[]): string {
	const role =
		kind === 'voice_interview'
			? 'You are a senior technical interviewer scoring a transcript from an automated voice screening.'
			: 'You are a senior software architect scoring a candidate response to a system-design problem.'

	const rubric = dimensions
		.map((d, i) => `${i + 1}. "${d.key}" (${d.label}): ${d.description}`)
		.join('\n')

	return [
		role,
		'Score each dimension on a 0-10 scale where 0 = absent / nonsense, 5 = average junior, 8 = solid mid-level, 10 = exceptional senior.',
		'Be calibrated and skeptical: only award above 7 when the evidence in the text clearly justifies it.',
		'',
		'Rubric:',
		rubric,
		'',
		'Return ONLY a single valid JSON object — no markdown, no commentary.',
	].join('\n')
}

function buildSchemaHint(dimensions: EvaluationDimension[]): string {
	const scoreShape = dimensions.map((d) => `        "${d.key}": <number 0-10>`).join(',\n')
	return [
		'JSON shape (return EXACTLY this structure):',
		'{',
		'    "scores": {',
		scoreShape,
		'    },',
		'    "summary": "<2-4 sentence narrative for a recruiter>",',
		'    "strengths": ["<short bullet>", "..."],',
		'    "weaknesses": ["<short bullet>", "..."],',
		'    "recommendation": "<strong_pass | pass | borderline | fail>"',
		'}',
	].join('\n')
}

function buildUserPrompt(
	kind: EvaluationKind,
	dimensions: EvaluationDimension[],
	contextLines: string[],
	primaryText: string,
): string {
	const truncated = primaryText.slice(0, getMaxChars())
	const heading =
		kind === 'voice_interview'
			? 'Vapi voice-interview transcript starts below:'
			: 'Candidate system-design response starts below:'

	return [
		buildSchemaHint(dimensions),
		'',
		...contextLines,
		'',
		heading,
		'---',
		truncated,
		'---',
	]
		.filter(Boolean)
		.join('\n')
}

function stripCodeFences(rawText: string): string {
	return rawText
		.trim()
		.replace(/^```json\s*/i, '')
		.replace(/^```\s*/i, '')
		.replace(/```$/i, '')
		.trim()
}

function parseJsonSafely(rawText: string): unknown {
	const normalized = stripCodeFences(rawText)
	try {
		return JSON.parse(normalized)
	} catch {
		const startIndex = normalized.indexOf('{')
		const endIndex = normalized.lastIndexOf('}')
		if (startIndex >= 0 && endIndex > startIndex) {
			return JSON.parse(normalized.slice(startIndex, endIndex + 1))
		}
		throw new InvalidLlmEvaluationError('LLM response is not valid JSON')
	}
}

function ensureObject(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new InvalidLlmEvaluationError('Expected JSON object in LLM response')
	}
	return value as Record<string, unknown>
}

function clampScore(value: unknown): number | null {
	const n = typeof value === 'number' ? value : Number(value)
	if (!Number.isFinite(n)) return null
	if (n < 0) return 0
	if (n > 10) return 10
	return Math.round(n * 100) / 100
}

function ensureStringArray(value: unknown, max: number): string[] {
	if (!Array.isArray(value)) return []
	const cleaned = value
		.filter((v): v is string => typeof v === 'string')
		.map((v) => v.trim())
		.filter(Boolean)
	return Array.from(new Set(cleaned)).slice(0, max)
}

function normalizeRecommendation(value: unknown): RawEvaluationResult['recommendation'] {
	const allowed: RawEvaluationResult['recommendation'][] = ['strong_pass', 'pass', 'borderline', 'fail']
	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase().replace(/[\s-]/g, '_')
		const mapped = allowed.find((r) => r === normalized)
		if (mapped) return mapped
		// Map common synonyms
		if (normalized === 'strong' || normalized === 'strongpass') return 'strong_pass'
		if (normalized === 'reject') return 'fail'
		if (normalized === 'maybe') return 'borderline'
	}
	return 'borderline'
}

function normalizeRawResult(
	dimensions: EvaluationDimension[],
	raw: unknown,
): RawEvaluationResult {
	const obj = ensureObject(raw)
	const scoresRaw = obj.scores
	if (!scoresRaw || typeof scoresRaw !== 'object' || Array.isArray(scoresRaw)) {
		throw new InvalidLlmEvaluationError('LLM JSON missing "scores" object')
	}
	const scoresObj = scoresRaw as Record<string, unknown>

	const scores: Record<string, number> = {}
	for (const dim of dimensions) {
		const v = clampScore(scoresObj[dim.key])
		if (v === null) {
			throw new InvalidLlmEvaluationError(`LLM JSON missing or invalid score for "${dim.key}"`)
		}
		scores[dim.key] = v
	}

	const summary = typeof obj.summary === 'string' ? obj.summary.trim() : ''
	if (!summary) {
		throw new InvalidLlmEvaluationError('LLM JSON missing "summary"')
	}

	return {
		scores,
		summary,
		strengths: ensureStringArray(obj.strengths, 8),
		weaknesses: ensureStringArray(obj.weaknesses, 8),
		recommendation: normalizeRecommendation(obj.recommendation),
	}
}

function computeTotalScore(scores: Record<string, number>): number {
	const values = Object.values(scores)
	if (values.length === 0) return 0
	const mean = values.reduce((acc, v) => acc + v, 0) / values.length
	return Math.round(mean * 10 * 100) / 100
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	let timeoutHandle: NodeJS.Timeout | undefined
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutHandle = setTimeout(() => {
			reject(new Error(`LLM request timed out after ${timeoutMs}ms`))
		}, timeoutMs)
	})
	try {
		return await Promise.race([promise, timeoutPromise])
	} finally {
		if (timeoutHandle) clearTimeout(timeoutHandle)
	}
}

interface CallParams {
	systemInstruction: string
	userPrompt: string
}

async function callGemini(params: CallParams): Promise<string> {
	const apiKey = process.env.GEMINI_API_KEY
	if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

	const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
	const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

	const response = await withTimeout(
		fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				systemInstruction: { parts: [{ text: params.systemInstruction }] },
				contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
				generationConfig: {
					temperature: 0.2,
					responseMimeType: 'application/json',
				},
			}),
		}),
		getTimeoutMs(),
	)

	const responseJson = (await response.json()) as GeminiGenerateContentResponse

	if (!response.ok) {
		throw new Error(responseJson.error?.message || `Gemini request failed with status ${response.status}`)
	}

	const content = responseJson.candidates?.[0]?.content?.parts
		?.map((part) => part.text || '')
		.join('\n')
		.trim()

	if (!content) throw new InvalidLlmEvaluationError('Gemini returned empty content')
	return content
}

async function callGrok(params: CallParams): Promise<string> {
	const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
	if (!apiKey) throw new Error('Missing GROK_API_KEY (or XAI_API_KEY)')

	const model = process.env.GROK_MODEL || 'grok-2-latest'

	const response = await withTimeout(
		fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				temperature: 0.2,
				response_format: { type: 'json_object' },
				messages: [
					{ role: 'system', content: params.systemInstruction },
					{ role: 'user', content: params.userPrompt },
				],
			}),
		}),
		getTimeoutMs(),
	)

	const responseJson = (await response.json()) as GrokChatResponse

	if (!response.ok) {
		throw new Error(responseJson.error?.message || `Grok request failed with status ${response.status}`)
	}

	const rawContent = responseJson.choices?.[0]?.message?.content
	const content = Array.isArray(rawContent)
		? rawContent.map((part) => part.text || '').join('\n').trim()
		: typeof rawContent === 'string'
			? rawContent.trim()
			: ''

	if (!content) throw new InvalidLlmEvaluationError('Grok returned empty content')
	return content
}

function getModelVersion(provider: EvaluatorProvider): string {
	const base = process.env.EVALUATOR_MODEL_VERSION || 'evaluator-worker@1.0.0'
	const model =
		provider === 'gemini'
			? process.env.GEMINI_MODEL || 'gemini-2.5-flash'
			: process.env.GROK_MODEL || 'grok-2-latest'
	return `${base}+${model}`
}

export interface EvaluateOptions {
	kind: EvaluationKind
	primaryText: string
	contextLines?: string[]
	preferredProvider?: EvaluatorProvider
}

export async function evaluateWithLlm(opts: EvaluateOptions): Promise<EvaluationResult> {
	const dimensions = opts.kind === 'voice_interview' ? VOICE_INTERVIEW_DIMENSIONS : SYSTEM_DESIGN_DIMENSIONS
	const systemInstruction = buildSystemInstruction(opts.kind, dimensions)
	const userPrompt = buildUserPrompt(opts.kind, dimensions, opts.contextLines || [], opts.primaryText)

	const providers = getProviderOrder(opts.preferredProvider)
	const failures: string[] = []

	for (const provider of providers) {
		try {
			const rawText = provider === 'gemini'
				? await callGemini({ systemInstruction, userPrompt })
				: await callGrok({ systemInstruction, userPrompt })

			const raw = normalizeRawResult(dimensions, parseJsonSafely(rawText))
			const totalScore = computeTotalScore(raw.scores)

			return {
				...raw,
				totalScore,
				providerUsed: provider,
				scoringModelVersion: getModelVersion(provider),
				scoredAt: new Date().toISOString(),
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			failures.push(`${provider}: ${message}`)
			console.warn(`[evaluator-worker] ${provider} evaluator failed, trying next provider if available — ${message}`)
		}
	}

	throw new Error(`All configured evaluators failed. ${failures.join(' | ')}`)
}
