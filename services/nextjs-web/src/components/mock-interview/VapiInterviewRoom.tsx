/**
 * VapiInterviewRoom Component
 * Reusable Vapi-powered interview room used by interview routes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useVapi, type UseVapiOptions } from '@/hooks/useVapi'
import { useInterview } from '@/hooks/useInterview'
import { ThemeToggleMobile } from '@/components/ui/theme-toggle'
import { InterviewAvatar } from './InterviewAvatar'
import { InterviewControls, InterviewControlsMobile } from './InterviewControls'
import { TranscriptDisplay, TranscriptDisplayMobile } from './TranscriptDisplay'


interface VapiInterviewRoomProps {
  backPath?: string
  badgeLabel?: string
  onDebugEvent?: UseVapiOptions['onDebugEvent']
}

function shouldDisplayInterviewError(error: string | null): boolean {
  if (!error) return false

  const normalized = error.toLowerCase()
  return !(
    normalized.includes('meeting has ended') ||
    normalized.includes('meeting ended') ||
    normalized.includes('due to ejection') ||
    normalized.includes('ejection')
  )
}

export function VapiInterviewRoom({ backPath = '/candidate', badgeLabel = 'Mock Interview', onDebugEvent }: VapiInterviewRoomProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = useMemo(() => {
    const q = searchParams?.get('applicationId')
    return q && q.trim() ? q.trim() : undefined
  }, [searchParams])
  const { user, loading, session } = useAuth()
  const {
    status,
    isSpeaking,
    isListening,
    transcripts,
    currentTranscript,
    error,
    volumeLevel,
    startCall,
    endCall,
    toggleMute,
    isMuted,
  } = useVapi({ onDebugEvent })
  const {
    preparing,
    sessionError,
    prepareInterviewSession,
    buildFourQuestions,
    buildTranscript,
  } = useInterview()
  const [localError, setLocalError] = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const startTimestampRef = useRef<number | null>(null)
  const completionSentRef = useRef(false)
  const redirectSentRef = useRef(false)

  const handleStartCall = useCallback(async () => {
    if (!applicationId) {
      setLocalError('Missing application id for interview session')
      return
    }

    try {
      setLocalError(null)
      const session = await prepareInterviewSession(applicationId)
      setActiveSessionId(session.sessionId)
      completionSentRef.current = false
      startTimestampRef.current = Date.now()
      const fourQuestions = buildFourQuestions(session.questions)
      await startCall({
        applicationId,
        interviewSessionId: session.sessionId,
        questionIds: session.questions.map((q) => q.id),
        questionTexts: session.questions.map((q) => q.text),
        fourQuestions,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prepare interview session'
      setLocalError(message)
    }
  }, [applicationId, buildFourQuestions, prepareInterviewSession, startCall])

  useEffect(() => {
    if (!applicationId || !activeSessionId) return
    if (status !== 'ended') return
    if (completionSentRef.current) return

    const transcript = buildTranscript(transcripts)
    if (!transcript.trim()) return

    const startedAt = startTimestampRef.current
    const durationSeconds = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : undefined

    completionSentRef.current = true

    if (!session?.access_token) {
      completionSentRef.current = false
      return
    }

    fetch('/api/v1/interview/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        application_id: applicationId,
        session_id: activeSessionId,
        full_transcript: transcript,
        duration_seconds: durationSeconds,
      }),
    }).catch((err) => {
      console.error('[Interview Complete] Failed to persist transcript', err)
      completionSentRef.current = false
    })
  }, [applicationId, activeSessionId, buildTranscript, session?.access_token, status, transcripts])

  useEffect(() => {
    if (!applicationId) return
    if (status !== 'ended') return
    if (redirectSentRef.current) return

    redirectSentRef.current = true

    try {
      localStorage.setItem(`voiceStatus:${applicationId}`, 'completed')
    } catch {
      // Ignore storage failures.
    }

    router.push(`/candidate/${applicationId}/assessment`)
  }, [applicationId, router, status])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role !== 'applicant') {
      router.push('/candidate')
    }
  }, [loading, router, user])

  const handleBack = () => {
    if (status === 'connected' || status === 'speaking' || status === 'listening') {
      endCall()
    }
    router.push(backPath)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'applicant') return null

  const currentRole = isListening ? 'user' : (isSpeaking ? 'assistant' : undefined)
  const showError = shouldDisplayInterviewError(error)
  const sessionMessage = localError || sessionError

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg transition-colors">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-theme-border bg-theme-input transition-colors">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Dashboard</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-sm font-medium px-3 py-1 rounded bg-accent-purple/10 text-accent-purple">
            {badgeLabel}
          </div>
        </div>

        <ThemeToggleMobile />
      </header>

      <div className="hidden sm:flex flex-1 flex-col items-center justify-center px-6 py-8 gap-8">
        {showError && (
          <div className="w-full max-w-md flex items-start gap-3 px-4 py-3 rounded-lg border border-accent-red/30 bg-accent-red/10">
            <AlertCircle size={18} className="text-accent-red flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-accent-red">Error</p>
              <p className="text-xs text-accent-red/80">{error}</p>
            </div>
          </div>
        )}

        {sessionMessage && (
          <div className="w-full max-w-md flex items-start gap-3 px-4 py-3 rounded-lg border border-accent-red/30 bg-accent-red/10">
            <AlertCircle size={18} className="text-accent-red flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-accent-red">Session Error</p>
              <p className="text-xs text-accent-red/80">{sessionMessage}</p>
            </div>
          </div>
        )}

        <InterviewAvatar
          isSpeaking={isSpeaking}
          isListening={isListening}
          volumeLevel={volumeLevel}
        />

        {(status === 'idle' || status === 'ended') && (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Ready to practice?
            </h2>
            <p className="text-sm text-text-secondary max-w-md">
              Click &quot;Start Interview&quot; to begin your mock interview session.
              The AI interviewer will ask you questions and provide feedback.
            </p>
          </div>
        )}

        {(status === 'connected' || status === 'speaking' || status === 'listening' || status === 'connecting') && (
          <TranscriptDisplay
            transcripts={transcripts}
            currentTranscript={currentTranscript}
            currentRole={currentRole}
          />
        )}

        <InterviewControls
          status={status}
          isMuted={isMuted}
          onEndCall={endCall}
          onToggleMute={toggleMute}
          onStartCall={handleStartCall}
        />

        {(status === 'connected' || status === 'speaking' || status === 'listening') && (
          <p className="text-xs text-text-secondary/60 text-center">
            Speak clearly into your microphone. The AI will respond after you finish speaking.
          </p>
        )}
      </div>

      <div className="flex sm:hidden flex-1 flex-col px-4 py-6 gap-6">
        {showError && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-accent-red/30 bg-accent-red/10">
            <AlertCircle size={16} className="text-accent-red flex-shrink-0 mt-0.5" />
            <p className="text-xs text-accent-red/80">{error}</p>
          </div>
        )}

        {sessionMessage && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-accent-red/30 bg-accent-red/10">
            <AlertCircle size={16} className="text-accent-red flex-shrink-0 mt-0.5" />
            <p className="text-xs text-accent-red/80">{sessionMessage}</p>
          </div>
        )}

        <div className="flex justify-center">
          <InterviewAvatar
            isSpeaking={isSpeaking}
            isListening={isListening}
            volumeLevel={volumeLevel}
          />
        </div>

        {(status === 'idle' || status === 'ended') && (
          <div className="text-center flex-1 flex flex-col justify-center">
            <h2 className="text-base font-semibold text-text-primary mb-2">
              Ready to practice?
            </h2>
            <p className="text-xs text-text-secondary px-4">
              Tap &quot;Start&quot; to begin your mock interview. Speak clearly into your device.
            </p>
          </div>
        )}

        {(status === 'connected' || status === 'speaking' || status === 'listening' || status === 'connecting') && (
          <div className="flex-1">
            <TranscriptDisplayMobile
              transcripts={transcripts}
              currentTranscript={currentTranscript}
              currentRole={currentRole}
            />
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-theme-border">
          <InterviewControlsMobile
            status={status}
            isMuted={isMuted}
            onEndCall={endCall}
            onToggleMute={toggleMute}
            onStartCall={handleStartCall}
          />
        </div>
      </div>
    </div>
  )
}
