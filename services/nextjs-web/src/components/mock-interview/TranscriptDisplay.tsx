/**
 * TranscriptDisplay Component
 * Shows real-time transcripts of the conversation during the interview
 */

import { useEffect, useRef } from 'react'
import type { TranscriptEntry } from '@/hooks/useVapi'
import { User, Bot } from 'lucide-react'

interface TranscriptDisplayProps {
  transcripts: TranscriptEntry[]
  currentTranscript: string
  currentRole?: 'assistant' | 'user'
}

export function TranscriptDisplay({
  transcripts,
  currentTranscript,
  currentRole,
}: TranscriptDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [transcripts, currentTranscript])

  const isEmpty = transcripts.length === 0 && !currentTranscript

  return (
    <div
      ref={containerRef}
      className="w-full max-w-2xl h-64 sm:h-80 overflow-y-auto rounded-lg border p-4 bg-theme-input border-theme-border"
    >
      {isEmpty ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-text-secondary/60 text-center">
            Conversation transcripts will appear here in real-time...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Finalized transcripts */}
          {transcripts.map((entry) => (
            <TranscriptBubble
              key={entry.id}
              role={entry.role}
              text={entry.text}
            />
          ))}

          {/* Current (partial) transcript */}
          {currentTranscript && currentRole && (
            <TranscriptBubble
              role={currentRole}
              text={currentTranscript}
              isPartial
            />
          )}
        </div>
      )}
    </div>
  )
}

interface TranscriptBubbleProps {
  role: 'assistant' | 'user'
  text: string
  isPartial?: boolean
}

function TranscriptBubble({ role, text, isPartial }: TranscriptBubbleProps) {
  const isAssistant = role === 'assistant'

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isAssistant ? 'bg-accent-purple/20' : 'bg-accent-green/20'}
        `}
      >
        {isAssistant ? (
          <Bot size={14} className="text-accent-purple" />
        ) : (
          <User size={14} className="text-accent-green" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`
          max-w-[80%] px-4 py-2.5 rounded-lg text-sm leading-relaxed
          ${isAssistant
            ? 'bg-theme-card border border-theme-border text-text-primary'
            : 'bg-accent-purple/10 text-text-primary'
          }
          ${isPartial ? 'opacity-70' : ''}
        `}
      >
        {text}
        {isPartial && (
          <span className="inline-block w-1 h-4 ml-1 bg-accent-purple animate-pulse align-text-bottom" />
        )}
      </div>
    </div>
  )
}

/**
 * TranscriptDisplayMobile Component
 * Simplified version for mobile that shows only the most recent transcript
 */
export function TranscriptDisplayMobile({
  transcripts,
  currentTranscript,
}: TranscriptDisplayProps) {
  const lastTranscript = transcripts[transcripts.length - 1]
  const displayText = currentTranscript || lastTranscript?.text

  if (!displayText) {
    return (
      <div className="w-full px-4 py-3 rounded-lg border bg-theme-input border-theme-border">
        <p className="text-xs text-text-secondary/60 text-center">
          Listening...
        </p>
      </div>
    )
  }

  const role = currentTranscript
    ? (currentTranscript.length > 0 ? 'user' : 'assistant')
    : lastTranscript?.role

  return (
    <div className="w-full px-4 py-3 rounded-lg border bg-theme-input border-theme-border">
      <p className="text-xs text-text-secondary mb-1">
        {role === 'assistant' ? 'AI Interviewer' : 'You'}:
      </p>
      <p className="text-sm text-text-primary leading-relaxed line-clamp-3">
        {displayText}
        {currentTranscript && (
          <span className="inline-block w-1 h-3 ml-0.5 bg-accent-purple animate-pulse align-text-bottom" />
        )}
      </p>
    </div>
  )
}
