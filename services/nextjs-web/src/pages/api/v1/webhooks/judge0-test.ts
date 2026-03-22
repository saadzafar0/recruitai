import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Bridge test: POSTs a sample submission to Judge0 and returns stdout/stderr.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const judge0Url = process.env.JUDGE0_URL?.replace(/\/$/, '')
  if (!judge0Url) {
    return res.status(500).json({
      success: false,
      error: 'Missing JUDGE0_URL in environment. Set it in .env (see .env.example).',
    })
  }

  const languageId = Number(
    process.env.JUDGE0_TEST_LANGUAGE_ID ?? process.env.JUDGE0_DEFAULT_LANGUAGE_ID ?? '63',
  )
  if (Number.isNaN(languageId)) {
    return res.status(500).json({
      success: false,
      error: 'Invalid JUDGE0_TEST_LANGUAGE_ID or JUDGE0_DEFAULT_LANGUAGE_ID',
    })
  }

  const payload = {
    source_code: "console.log('Hello World from the RecruitAI execution engine!');",
    language_id: languageId,
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = process.env.JUDGE0_API_TOKEN
  if (token) {
    headers['X-Auth-Token'] = token
  }

  try {
    const response = await fetch(
      `${judge0Url}/submissions?base64_encoded=false&wait=true`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      throw new Error(`Judge0 responded with status: ${response.status}`)
    }

    const data = (await response.json()) as Record<string, unknown>

    // Judge0 may return stdout as "" (falsy) — don't treat as missing
    const stdout =
      data.stdout !== undefined && data.stdout !== null
        ? String(data.stdout).trimEnd()
        : null
    const stderr =
      data.stderr !== undefined && data.stderr !== null
        ? String(data.stderr).trimEnd()
        : null
    const compileOutput =
      data.compile_output !== undefined && data.compile_output !== null
        ? String(data.compile_output).trimEnd()
        : null

    const status = data.status as { id?: number; description?: string } | undefined
    const message = data.message != null ? String(data.message) : null

    return res.status(200).json({
      success: true,
      // null = Judge0 omitted the field; "" = ran but printed nothing
      output: stdout,
      stderr: stderr === '' ? null : stderr,
      compile_output: compileOutput === '' ? null : compileOutput,
      // Human-readable error line for quick checks
      error: stderr || compileOutput || message,
      // Why stdout can look "empty": wrong language_id, TLE, or Judge0 status
      status: status ?? null,
      message,
      exit_code: data.exit_code ?? null,
      time: data.time ?? null,
      memory: data.memory ?? null,
      token: typeof data.token === 'string' ? data.token : null,
      // Full payload for Postman debugging (remove in production if you prefer)
      judge0: data,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return res.status(500).json({ success: false, error: message })
  }
}
