/**
 * VapiInterviewRoom Component
 * Reusable Vapi-powered interview room used by interview routes.
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useVapi } from '@/hooks/useVapi'
import { ThemeToggleMobile } from '@/components/ui/theme-toggle'
import { InterviewAvatar } from './InterviewAvatar'
import { InterviewControls, InterviewControlsMobile } from './InterviewControls'
import { TranscriptDisplay, TranscriptDisplayMobile } from './TranscriptDisplay'

interface VapiInterviewRoomProps {
  backPath?: string
  badgeLabel?: string
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

export function VapiInterviewRoom({ backPath = '/user', badgeLabel = 'Mock Interview' }: VapiInterviewRoomProps) {
  const router = useRouter()
  const applicationId = useMemo(() => {
    const q = router.query.applicationId
    if (typeof q === 'string' && q.trim()) return q.trim()
    if (Array.isArray(q) && q[0]?.trim()) return q[0].trim()
    return undefined
  }, [router.query.applicationId])
  const { user, loading } = useAuth()
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
  } = useVapi()

  const handleStartCall = useCallback(() => {
    void startCall(applicationId)
  }, [applicationId, startCall])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role !== 'applicant') {
      router.push('/user')
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
