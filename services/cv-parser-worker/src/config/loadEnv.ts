import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'

const candidatePaths = [
  resolve(process.cwd(), '.env.local'),
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '..', '..', '.env.local'),
  resolve(__dirname, '..', '..', '.env'),
]

const loadedPaths = new Set<string>()

for (const envPath of candidatePaths) {
  if (!existsSync(envPath) || loadedPaths.has(envPath)) {
    continue
  }

  config({
    path: envPath,
    override: false,
  })

  loadedPaths.add(envPath)
}

if (loadedPaths.size === 0) {
  console.warn('[cv-parser-worker] No .env.local or .env file found for environment loading')
}
