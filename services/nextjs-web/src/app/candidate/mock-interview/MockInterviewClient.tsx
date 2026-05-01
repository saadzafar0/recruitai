'use client'

/**
 * Mock Interview Page
 * Full-screen interview experience with VAPI integration
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useVapi } from '@/hooks/useVapi'
import {
  InterviewAvatar,
  TranscriptDisplay,
  TranscriptDisplayMobile,
  InterviewControls,
  InterviewControlsMobile,
} from '@/components/mock-interview'
import { ThemeToggleMobile } from '@/components/ui/theme-toggle'

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

export default function MockInterviewClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const applicationId = useMemo(() => {
    const q = searchParams?.get('applicationId')
    return q && q.trim() ? q.trim() : undefined
  }, [searchParams])
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
  }, [loading, user, router])

  const handleBack = () => {
    if (status === 'connected' || status === 'speaking' || status === 'listening') {
      endCall()
    }
    router.push('/user')
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
            Mock Interview
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
            <h2 className="text-lg font-semibold text-text-primary mb-2">Ready to practice?</h2>
            <p className="text-sm text-text-secondary max-w-md">
              Click &quot;Start Interview&quot; to begin your mock interview session.
              The AI interviewer will ask you questions and provide feedback.
            </p>
          </div>
        )}

        <TranscriptDisplay
          transcripts={transcripts}
          currentTranscript={currentTranscript}
          currentRole={currentRole}
        />

        <InterviewControls
          status={status}
          onStartCall={handleStartCall}
          onEndCall={endCall}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      </div>

      <div className="flex flex-col flex-1 sm:hidden">
        {showError && (
          <div className="px-4 pt-4">
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-accent-red/30 bg-accent-red/10">
              <AlertCircle size={18} className="text-accent-red flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-accent-red">Error</p>
                <p className="text-xs text-accent-red/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
          <InterviewAvatar
            isSpeaking={isSpeaking}
            isListening={isListening}
            volumeLevel={volumeLevel}
          />
          <TranscriptDisplayMobile
            transcripts={transcripts}
            currentTranscript={currentTranscript}
            currentRole={currentRole}
          />
        </div>

        <InterviewControlsMobile
          status={status}
          onStartCall={handleStartCall}
          onEndCall={endCall}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      </div>
    </div>
  )
}
