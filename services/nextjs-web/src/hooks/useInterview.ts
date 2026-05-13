import { useCallback, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { TranscriptEntry } from '@/hooks/useVapi'

export interface InterviewSavePayload {
  applicationId: string
  sessionId: string
  questionId: string
  orderIndex: number
  transcript: string
  audioDurationSeconds: number
  transcriptConfidence?: number
}

export interface InterviewSaveResult {
  responseId: string
  queued: boolean
  jobId?: string
}

export interface InterviewQuestion {
  id: string
  text: string
}

export interface InterviewSessionResult {
  sessionId: string
  questions: InterviewQuestion[]
}

export interface UseInterviewReturn {
  saving: boolean
  error: string | null
  preparing: boolean
  sessionError: string | null
  prepareInterviewSession: (applicationId: string) => Promise<InterviewSessionResult>
  saveInterviewResponse: (payload: InterviewSavePayload) => Promise<InterviewSaveResult>
  buildTranscript: (entries: TranscriptEntry[]) => string
  buildFourQuestions: (questions: InterviewQuestion[]) => string
}

function normalizeTranscript(entries: TranscriptEntry[]): string {
  return entries
    .filter((entry) => entry.text && entry.text.trim())
    .map((entry) => `${entry.role}: ${entry.text.trim()}`)
    .join('\n')
}

export function useInterview(): UseInterviewReturn {
  const { session } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const prepareInterviewSession = useCallback(async (applicationId: string): Promise<InterviewSessionResult> => {
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    setPreparing(true)
    setSessionError(null)

    try {
      const response = await fetch('/api/v1/interview/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          application_id: applicationId,
          question_count: 4,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to prepare interview session')
      }

      return data.data as InterviewSessionResult
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prepare interview session'
      setSessionError(message)
      throw err
    } finally {
      setPreparing(false)
    }
  }, [session?.access_token])

  const saveInterviewResponse = useCallback(async (payload: InterviewSavePayload) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          application_id: payload.applicationId,
          session_id: payload.sessionId,
          question_id: payload.questionId,
          order_index: payload.orderIndex,
          transcript: payload.transcript,
          audio_duration_seconds: payload.audioDurationSeconds,
          transcript_confidence: payload.transcriptConfidence,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save interview response')
      }

      return data.data as InterviewSaveResult
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save interview response'
      setError(message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [session?.access_token])

  return {
    saving,
    error,
    preparing,
    sessionError,
    prepareInterviewSession,
    saveInterviewResponse,
    buildTranscript: normalizeTranscript,
    buildFourQuestions: (questions) => {
      const formatted = questions
        .map((q, index) => `${index + 1}. ${q.text}`)
        .join('\n')
      return formatted
    },
  }
}
