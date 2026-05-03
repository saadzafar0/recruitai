import './config/loadEnv'
import {
	startVoiceEvaluationWorker,
	VOICE_EVALUATION_QUEUE_NAME,
} from './jobs/evaluateVoiceInterview'
import {
	startSystemDesignEvaluationWorker,
	SYSTEM_DESIGN_QUEUE_NAME,
} from './jobs/evaluateSystemDesign'
import { startEvaluatorSweeper } from './services/sweeper'

console.info('[evaluator-worker] Booting worker process...')

const voiceHandles = startVoiceEvaluationWorker()
const designHandles = startSystemDesignEvaluationWorker()
const sweeperHandles = startEvaluatorSweeper()

let isShuttingDown = false

async function handleShutdown(signal: NodeJS.Signals): Promise<void> {
	if (isShuttingDown) return
	isShuttingDown = true
	console.info(`[evaluator-worker] Received ${signal}. Closing workers...`)

	try {
		await Promise.allSettled([
			voiceHandles.close(),
			designHandles.close(),
			sweeperHandles.close(),
		])
		console.info('[evaluator-worker] Shutdown complete')
		process.exit(0)
	} catch (error) {
		console.error('[evaluator-worker] Failed graceful shutdown', error)
		process.exit(1)
	}
}

process.on('SIGINT', () => {
	void handleShutdown('SIGINT')
})

process.on('SIGTERM', () => {
	void handleShutdown('SIGTERM')
})

process.on('unhandledRejection', (reason) => {
	console.error('[evaluator-worker] Unhandled rejection', reason)
})

process.on('uncaughtException', (error) => {
	console.error('[evaluator-worker] Uncaught exception', error)
	void handleShutdown('SIGTERM')
})

void Promise.all([
	voiceHandles.worker.waitUntilReady(),
	designHandles.worker.waitUntilReady(),
])
	.then(() => {
		console.info(
			`[evaluator-worker] Listening on queues: "${VOICE_EVALUATION_QUEUE_NAME}", "${SYSTEM_DESIGN_QUEUE_NAME}"`,
		)
	})
	.catch((error) => {
		console.error('[evaluator-worker] Failed to initialize workers', error)
		process.exit(1)
	})
