export type CvParserProvider = 'gemini' | 'grok'

export interface ParsedCandidateCvData {
	name: string
	email: string
	topTechnicalSkills: string[]
	summary: string
}

export class InvalidLlmResponseError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'InvalidLlmResponseError'
	}
}

const SYSTEM_INSTRUCTION =
	"Extract the candidate's name, email, top 5 technical skills, and a 2-sentence summary. Return ONLY valid JSON."

const JSON_SCHEMA_HINT = `
Return JSON only with this shape:
{
	"name": "Candidate Name",
	"email": "candidate@example.com",
	"top_technical_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
	"summary": "Exactly two concise sentences."
}
`.trim()

interface ParseCandidateCvResult {
	parsed: ParsedCandidateCvData
	providerUsed: CvParserProvider
}

interface GeminiGenerateContentResponse {
	candidates?: Array<{
		content?: {
			parts?: Array<{
				text?: string
			}>
		}
	}>
	error?: {
		message?: string
	}
}

interface GrokChatResponse {
	choices?: Array<{
		message?: {
			content?: string | Array<{ text?: string; type?: string }>
		}
	}>
	error?: {
		message?: string
	}
}

function normalizeProvider(provider?: string): CvParserProvider | null {
	if (!provider) {
		return null
	}

	const normalized = provider.trim().toLowerCase()
	if (normalized === 'gemini' || normalized === 'grok') {
		return normalized
	}

	return null
}

function getProviderOrder(preferredProvider?: CvParserProvider): CvParserProvider[] {
	const envPrimary = normalizeProvider(process.env.CV_PARSER_PROVIDER)
	const envFallback = normalizeProvider(process.env.CV_PARSER_FALLBACK_PROVIDER)
	const disableFallback = (process.env.CV_PARSER_DISABLE_FALLBACK || '').toLowerCase() === 'true'

	const primaryProvider = preferredProvider || envPrimary || 'gemini'
	const fallbackProvider = envFallback || (primaryProvider === 'gemini' ? 'grok' : 'gemini')

	if (disableFallback) {
		return [primaryProvider]
	}

	return Array.from(new Set<CvParserProvider>([primaryProvider, fallbackProvider]))
}

function buildUserPrompt(rawCvText: string): string {
	const maxCharsRaw = Number(process.env.CV_PARSER_MAX_TEXT_CHARS || '20000')
	const maxChars = Number.isFinite(maxCharsRaw) && maxCharsRaw > 0 ? maxCharsRaw : 20000
	const truncatedText = rawCvText.slice(0, maxChars)

	return [
		JSON_SCHEMA_HINT,
		'',
		'CV raw text starts below:',
		'---',
		truncatedText,
		'---',
	].join('\n')
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

		throw new InvalidLlmResponseError('LLM response is not valid JSON')
	}
}

function ensureObject(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new InvalidLlmResponseError('Expected JSON object in LLM response')
	}

	return value as Record<string, unknown>
}

function getStringValue(obj: Record<string, unknown>, keys: string[]): string {
	for (const key of keys) {
		const value = obj[key]
		if (typeof value === 'string' && value.trim()) {
			return value.trim()
		}
	}

	return ''
}

function getSkillsValue(obj: Record<string, unknown>): string[] {
	const skillCandidates = [
		obj.top_technical_skills,
		obj.topSkills,
		obj.skills,
	]

	for (const candidate of skillCandidates) {
		if (Array.isArray(candidate)) {
			const cleaned = candidate
				.filter((value): value is string => typeof value === 'string')
				.map((value) => value.trim())
				.filter(Boolean)

			if (cleaned.length > 0) {
				return Array.from(new Set(cleaned)).slice(0, 5)
			}
		}
	}

	return []
}

function normalizeParsedCandidateData(raw: unknown): ParsedCandidateCvData {
	const obj = ensureObject(raw)
	const name = getStringValue(obj, ['name', 'candidate_name', 'candidateName'])
	const email = getStringValue(obj, ['email', 'candidate_email', 'candidateEmail'])
	const summary = getStringValue(obj, ['summary', 'candidate_summary', 'candidateSummary'])
	const topTechnicalSkills = getSkillsValue(obj)

	if (!name) {
		throw new InvalidLlmResponseError('LLM JSON does not include candidate name')
	}

	if (!email || !email.includes('@')) {
		throw new InvalidLlmResponseError('LLM JSON does not include a valid candidate email')
	}

	if (!summary) {
		throw new InvalidLlmResponseError('LLM JSON does not include candidate summary')
	}

	if (topTechnicalSkills.length === 0) {
		throw new InvalidLlmResponseError('LLM JSON does not include top technical skills')
	}

	return {
		name,
		email,
		topTechnicalSkills,
		summary,
	}
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
		if (timeoutHandle) {
			clearTimeout(timeoutHandle)
		}
	}
}

async function callGemini(rawCvText: string): Promise<ParsedCandidateCvData> {
	const apiKey = process.env.GEMINI_API_KEY
	if (!apiKey) {
		throw new Error('Missing GEMINI_API_KEY')
	}

	const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
	const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

	const timeoutMsRaw = Number(process.env.CV_PARSER_TIMEOUT_MS || '30000')
	const timeoutMs = Number.isFinite(timeoutMsRaw) ? timeoutMsRaw : 30000

	const response = await withTimeout(
		fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				systemInstruction: {
					parts: [
						{
							text: SYSTEM_INSTRUCTION,
						},
					],
				},
				contents: [
					{
						role: 'user',
						parts: [
							{
								text: buildUserPrompt(rawCvText),
							},
						],
					},
				],
				generationConfig: {
					temperature: 0.1,
					responseMimeType: 'application/json',
				},
			}),
		}),
		timeoutMs,
	)

	const responseJson = (await response.json()) as GeminiGenerateContentResponse

	if (!response.ok) {
		throw new Error(responseJson.error?.message || `Gemini request failed with status ${response.status}`)
	}

	const content = responseJson.candidates?.[0]?.content?.parts
		?.map((part) => part.text || '')
		.join('\n')
		.trim()

	if (!content) {
		throw new InvalidLlmResponseError('Gemini returned empty content')
	}

	return normalizeParsedCandidateData(parseJsonSafely(content))
}

async function callGrok(rawCvText: string): Promise<ParsedCandidateCvData> {
	const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
	if (!apiKey) {
		throw new Error('Missing GROK_API_KEY (or XAI_API_KEY)')
	}

	const model = process.env.GROK_MODEL || 'grok-2-latest'

	const timeoutMsRaw = Number(process.env.CV_PARSER_TIMEOUT_MS || '30000')
	const timeoutMs = Number.isFinite(timeoutMsRaw) ? timeoutMsRaw : 30000

	const response = await withTimeout(
		fetch('https://api.x.ai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				temperature: 0.1,
				response_format: {
					type: 'json_object',
				},
				messages: [
					{
						role: 'system',
						content: SYSTEM_INSTRUCTION,
					},
					{
						role: 'user',
						content: buildUserPrompt(rawCvText),
					},
				],
			}),
		}),
		timeoutMs,
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

	if (!content) {
		throw new InvalidLlmResponseError('Grok returned empty content')
	}

	return normalizeParsedCandidateData(parseJsonSafely(content))
}

export async function parseCandidateCvWithLlm(
	rawCvText: string,
	preferredProvider?: CvParserProvider,
): Promise<ParseCandidateCvResult> {
	const providers = getProviderOrder(preferredProvider)
	const failures: string[] = []

	for (const provider of providers) {
		try {
			const parsed = provider === 'gemini' ? await callGemini(rawCvText) : await callGrok(rawCvText)

			return {
				parsed,
				providerUsed: provider,
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			failures.push(`${provider}: ${message}`)
			console.warn(`[cv-parser-worker] ${provider} parser failed, trying next provider if available`)
		}
	}

	throw new Error(`All configured CV parsers failed. ${failures.join(' | ')}`)
}

