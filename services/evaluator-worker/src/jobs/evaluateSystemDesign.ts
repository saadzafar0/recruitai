import { Job, QueueEvents, UnrecoverableError, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { createRedisConnection } from '../services/redisConnection'
import { supabaseAdmin } from '../services/supabase'
import { evaluateWithLlm } from '../services/llmEvaluator'
import {
	persistSystemDesignEvaluation,
	type SystemDesignEvaluationOutput,
} from '../services/systemDesignScoreUpdater'

export const SYSTEM_DESIGN_QUEUE_NAME =
	process.env.EVALUATOR_DESIGN_QUEUE_NAME || 'system-design-evaluation'

export interface SystemDesignEvaluationJobData {
	applicationId: string
	assessmentId?: string
	responseId?: string
}

function requireString(value: unknown, name: string): string {
	if (typeof value !== 'string' || !value.trim()) {
		throw new UnrecoverableError(`Missing required field "${name}" on system-design job`)
	}
	return value.trim()
}

interface AssessmentRow {
	id: string
	application_id: string
}

interface ResponseRow {
	id: string
	assessment_id: string
	problem_id: string | null
	written_response: string | null
	transcript: string | null
	diagram_url: string | null
}

interface ProblemRow {
	title: string | null
	scenario: string | null
	context: string | null
	evaluation_rubric: unknown
}

async function loadAssessment(applicationId: string, assessmentId?: string): Promise<AssessmentRow> {
	const baseQuery = supabaseAdmin
		.from('system_design_assessments')
		.select('id, application_id')
		.eq('application_id', applicationId)

	const { data, error } = assessmentId
		? await baseQuery.eq('id', assessmentId).maybeSingle()
		: await baseQuery.maybeSingle()

	if (error) {
		throw new Error(`Failed to load system_design_assessments: ${error.message}`)
	}
	if (!data) {
		throw new UnrecoverableError(
			`No system_design_assessments row for applicationId=${applicationId}${assessmentId ? ` assessmentId=${assessmentId}` : ''}`,
		)
	}
	return data as AssessmentRow
}

async function loadLatestResponse(assessmentId: string, responseId?: string): Promise<ResponseRow> {
	if (responseId) {
		const { data, error } = await supabaseAdmin
			.from('system_design_responses')
			.select('id, assessment_id, problem_id, written_response, transcript, diagram_url')
			.eq('id', responseId)
			.maybeSingle()
		if (error) throw new Error(`Failed to load system_design_responses: ${error.message}`)
		if (!data) throw new UnrecoverableError(`system_design_responses ${responseId} not found`)
		return data as ResponseRow
	}

	const { data, error } = await supabaseAdmin
		.from('system_design_responses')
		.select('id, assessment_id, problem_id, written_response, transcript, diagram_url, created_at')
		.eq('assessment_id', assessmentId)
		.order('created_at', { ascending: false })
		.limit(1)

	if (error) throw new Error(`Failed to query system_design_responses: ${error.message}`)
	if (!data || data.length === 0) {
		throw new UnrecoverableError(
			`No system_design_responses found for assessment ${assessmentId}`,
		)
	}
	return data[0] as ResponseRow
}

async function loadProblem(problemId: string | null): Promise<ProblemRow | null> {
	if (!problemId) return null
	const { data, error } = await supabaseAdmin
		.from('system_design_problems')
		.select('title, scenario, context, evaluation_rubric')
		.eq('id', problemId)
		.maybeSingle()
	if (error) {
		console.warn(`[evaluator-worker] Could not load system_design_problems ${problemId}: ${error.message}`)
		return null
	}
	return (data as ProblemRow) || null
}

function buildContext(problem: ProblemRow | null, response: ResponseRow): {
	contextLines: string[]
	primaryText: string
} {
	const contextLines: string[] = []
	if (problem) {
		if (problem.title) contextLines.push(`Problem title: ${problem.title}`)
		if (problem.scenario) contextLines.push(`Problem scenario:\n${problem.scenario}`)
		if (problem.context) contextLines.push(`Additional context:\n${problem.context}`)
		if (problem.evaluation_rubric && typeof problem.evaluation_rubric === 'object') {
			try {
				contextLines.push(`Recruiter rubric (use as guidance, but stick to the standard 0-10 dimensions):\n${JSON.stringify(problem.evaluation_rubric)}`)
			} catch {
				/* ignore */
			}
		}
	}

	const segments: string[] = []
	if (response.written_response?.trim()) {
		segments.push(`Written response:\n${response.written_response.trim()}`)
	}
	if (response.transcript?.trim()) {
		segments.push(`Verbal explanation transcript:\n${response.transcript.trim()}`)
	}
	if (response.diagram_url?.trim()) {
		segments.push(`Diagram URL (cannot be visually inspected — note its presence only): ${response.diagram_url.trim()}`)
	}

	const primaryText = segments.join('\n\n').trim()
	return { contextLines, primaryText }
}

async function processSystemDesignJob(
	job: Job<SystemDesignEvaluationJobData>,
): Promise<SystemDesignEvaluationOutput> {
	const applicationId = requireString(job.data.applicationId, 'applicationId')
	const assessmentIdHint = typeof job.data.assessmentId === 'string' ? job.data.assessmentId : undefined
	const responseIdHint = typeof job.data.responseId === 'string' ? job.data.responseId : undefined

	console.info(
		`[evaluator-worker] Processing system-design job ${job.id || 'unknown'} for application ${applicationId}`,
	)

	const assessment = await loadAssessment(applicationId, assessmentIdHint)
	const response = await loadLatestResponse(assessment.id, responseIdHint)
	const problem = await loadProblem(response.problem_id)

	const { contextLines, primaryText } = buildContext(problem, response)

	if (!primaryText) {
		throw new UnrecoverableError(
			`system_design_responses ${response.id} has no written_response or transcript — nothing to score`,
		)
	}

	const evaluation = await evaluateWithLlm({
		kind: 'system_design',
		primaryText,
		contextLines,
	})

	return persistSystemDesignEvaluation({
		applicationId,
		assessmentId: assessment.id,
		responseId: response.id,
		problemId: response.problem_id,
		evaluation,
	})
}

interface SystemDesignWorkerHandles {
	worker: Worker<SystemDesignEvaluationJobData, SystemDesignEvaluationOutput>
	queueEvents: QueueEvents
	close: () => Promise<void>
}

function getConcurrency(): number {
	const raw = Number(process.env.EVALUATOR_CONCURRENCY || '2')
	return Number.isFinite(raw) && raw > 0 ? raw : 2
}

export function startSystemDesignEvaluationWorker(): SystemDesignWorkerHandles {
	const workerConnection: IORedis = createRedisConnection()
	const eventsConnection: IORedis = createRedisConnection()

	const worker = new Worker<SystemDesignEvaluationJobData, SystemDesignEvaluationOutput>(
		SYSTEM_DESIGN_QUEUE_NAME,
		processSystemDesignJob,
		{
			connection: workerConnection,
			concurrency: getConcurrency(),
			maxStalledCount: 3,
		},
	)

	const queueEvents = new QueueEvents(SYSTEM_DESIGN_QUEUE_NAME, {
		connection: eventsConnection,
	})

	worker.on('completed', (job, result) => {
		console.info(
			`[evaluator-worker] System-design job ${job.id || 'unknown'} completed. application=${result.applicationId} total=${result.totalScore}`,
		)
	})

	worker.on('failed', (job, error) => {
		const attemptsMade = job?.attemptsMade || 0
		const maxAttempts = job?.opts?.attempts || 1
		console.error(
			`[evaluator-worker] System-design job ${job?.id || 'unknown'} failed on attempt ${attemptsMade}/${maxAttempts}: ${error.message}`,
		)
	})

	worker.on('error', (error) => {
		console.error('[evaluator-worker] System-design worker runtime error', error)
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
