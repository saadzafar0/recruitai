import './config/loadEnv'
import {
	startCodeSubmissionWorker,
	CODE_SUBMISSIONS_QUEUE_NAME,
} from './jobs/runCode'

console.info('[executor-worker] Booting worker process...')

const workerHandles = startCodeSubmissionWorker()

let isShuttingDown = false

async function handleShutdown(signal: NodeJS.Signals): Promise<void> {
	if (isShuttingDown) return
	isShuttingDown = true
	console.info(`[executor-worker] Received ${signal}. Closing worker...`)

	try {
		await workerHandles.close()
		console.info('[executor-worker] Shutdown complete')
		process.exit(0)
	} catch (error) {
		console.error('[executor-worker] Failed graceful shutdown', error)
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
	console.error('[executor-worker] Unhandled rejection', reason)
})

process.on('uncaughtException', (error) => {
	console.error('[executor-worker] Uncaught exception', error)
	void handleShutdown('SIGTERM')
})

void workerHandles.worker
	.waitUntilReady()
	.then(() => {
		console.info(
			`[executor-worker] Listening on queue: "${CODE_SUBMISSIONS_QUEUE_NAME}"`,
		)
	})
	.catch((error) => {
		console.error('[executor-worker] Failed to initialize worker', error)
		process.exit(1)
	})
