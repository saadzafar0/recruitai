/**
 * InterviewAvatar Component
 * Animated avatar that shows the current state of the interview
 * (idle, speaking, listening)
 */

import { Mic, Volume2 } from 'lucide-react'

interface InterviewAvatarProps {
  isSpeaking: boolean
  isListening: boolean
  volumeLevel: number
}

export function InterviewAvatar({ isSpeaking, isListening, volumeLevel }: InterviewAvatarProps) {
  // Generate wave bars for speaking animation
  const waveBars = [12, 20, 14, 22, 10, 18, 16]

  return (
    <div className="flex flex-col items-center">
      {/* Avatar circle */}
      <div
        className={`
          relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isSpeaking ? 'bg-accent-purple/20 ring-4 ring-accent-purple/30' : ''}
          ${isListening ? 'bg-accent-green/20 ring-4 ring-accent-green/30' : ''}
          ${!isSpeaking && !isListening ? 'bg-theme-elevated' : ''}
        `}
      >
        {/* Speaking animation */}
        {isSpeaking && (
          <div className="flex items-end gap-0.5 h-8">
            {waveBars.map((height, i) => (
              <div
                key={i}
                className="w-1 sm:w-1.5 rounded-full bg-accent-purple animate-pulse"
                style={{
                  height: `${height + volumeLevel * 10}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.5s',
                }}
              />
            ))}
          </div>
        )}

        {/* Listening animation */}
        {isListening && !isSpeaking && (
          <div className="flex items-end gap-0.5 h-8">
            {waveBars.map((height, i) => (
              <div
                key={i}
                className="w-1 sm:w-1.5 rounded-full bg-accent-green animate-pulse"
                style={{
                  height: `${height + volumeLevel * 10}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.5s',
                }}
              />
            ))}
          </div>
        )}

        {/* Idle state */}
        {!isSpeaking && !isListening && (
          <Mic size={36} className="text-text-secondary" />
        )}

        {/* Volume indicator ring */}
        {(isSpeaking || isListening) && (
          <div
            className={`
              absolute inset-0 rounded-full border-4 transition-all duration-150
              ${isSpeaking ? 'border-accent-purple' : 'border-accent-green'}
            `}
            style={{
              transform: `scale(${1 + volumeLevel * 0.15})`,
              opacity: 0.3 + volumeLevel * 0.5,
            }}
          />
        )}
      </div>

      {/* Status label */}
      <div className="mt-4 flex items-center gap-2">
        {isSpeaking && (
          <>
            <Volume2 size={14} className="text-accent-purple animate-pulse" />
            <span className="text-sm font-medium text-accent-purple">AI Speaking...</span>
          </>
        )}
        {isListening && !isSpeaking && (
          <>
            <Mic size={14} className="text-accent-green animate-pulse" />
            <span className="text-sm font-medium text-accent-green">Listening...</span>
          </>
        )}
        {!isSpeaking && !isListening && (
          <span className="text-sm text-text-secondary">Ready</span>
        )}
      </div>
    </div>
  )
}
