import './config/loadEnv'
import { cvParserWorker, shutdownCvParserWorker } from './jobs/parseCV'

console.info('[cv-parser-worker] Booting worker process...')

let isShuttingDown = false

async function handleShutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  console.info(`[cv-parser-worker] Received ${signal}. Closing worker...`)

  try {
    await shutdownCvParserWorker()
    console.info('[cv-parser-worker] Shutdown complete')
    process.exit(0)
  } catch (error) {
    console.error('[cv-parser-worker] Failed graceful shutdown', error)
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
  console.error('[cv-parser-worker] Unhandled rejection', reason)
})

process.on('uncaughtException', (error) => {
  console.error('[cv-parser-worker] Uncaught exception', error)
  void handleShutdown('SIGTERM')
})

void cvParserWorker
  .waitUntilReady()
  .then(() => {
    console.info('[cv-parser-worker] Worker is ready and listening on queue: cv-processing')
  })
  .catch((error) => {
    console.error('[cv-parser-worker] Failed to initialize worker', error)
    process.exit(1)
  })
