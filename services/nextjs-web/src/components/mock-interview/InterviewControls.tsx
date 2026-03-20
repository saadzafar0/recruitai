/**
 * InterviewControls Component
 * Control buttons for the mock interview (end, mute, etc.)
 */

import { MicOff, Mic, PhoneOff, Loader2 } from 'lucide-react'
import type { VapiCallStatus } from '@/lib/vapi'

interface InterviewControlsProps {
  status: VapiCallStatus
  isMuted: boolean
  onEndCall: () => void
  onToggleMute: () => void
  onStartCall: () => void
}

export function InterviewControls({
  status,
  isMuted,
  onEndCall,
  onToggleMute,
  onStartCall,
}: InterviewControlsProps) {
  const isConnected = status === 'connected' || status === 'speaking' || status === 'listening'
  const isConnecting = status === 'connecting'
  const isIdle = status === 'idle' || status === 'ended' || status === 'error'

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Start button (shown when idle) */}
      {isIdle && (
        <button
          onClick={onStartCall}
          className="px-8 py-3 text-sm font-medium text-white rounded-lg bg-accent-purple hover:bg-accent-purple-hover transition-colors cursor-pointer flex items-center gap-2"
        >
          <Mic size={18} />
          Start Interview
        </button>
      )}

      {/* Connecting state */}
      {isConnecting && (
        <div className="flex items-center gap-3 px-8 py-3 rounded-lg bg-theme-card border border-theme-border">
          <Loader2 size={18} className="text-accent-purple animate-spin" />
          <span className="text-sm text-text-secondary">Connecting...</span>
        </div>
      )}

      {/* Controls when connected */}
      {isConnected && (
        <>
          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className={`
              w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center
              transition-all cursor-pointer
              ${isMuted
                ? 'bg-accent-red/20 text-accent-red hover:bg-accent-red/30'
                : 'bg-theme-card border border-theme-border text-text-secondary hover:text-text-primary hover:border-theme-border-hover'
              }
            `}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* End call button */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-accent-red hover:bg-accent-red/90 transition-colors cursor-pointer"
            title="End interview"
          >
            <PhoneOff size={22} className="text-white" />
          </button>
        </>
      )}
    </div>
  )
}

/**
 * InterviewControlsMobile Component
 * Compact version for mobile screens
 */
export function InterviewControlsMobile({
  status,
  isMuted,
  onEndCall,
  onToggleMute,
  onStartCall,
}: InterviewControlsProps) {
  const isConnected = status === 'connected' || status === 'speaking' || status === 'listening'
  const isConnecting = status === 'connecting'
  const isIdle = status === 'idle' || status === 'ended' || status === 'error'

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Start button (shown when idle) */}
      {isIdle && (
        <button
          onClick={onStartCall}
          className="px-6 py-2.5 text-sm font-medium text-white rounded-lg bg-accent-purple hover:bg-accent-purple-hover transition-colors cursor-pointer flex items-center gap-2"
        >
          <Mic size={16} />
          Start
        </button>
      )}

      {/* Connecting state */}
      {isConnecting && (
        <div className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-theme-card border border-theme-border">
          <Loader2 size={16} className="text-accent-purple animate-spin" />
          <span className="text-sm text-text-secondary">Connecting...</span>
        </div>
      )}

      {/* Controls when connected */}
      {isConnected && (
        <>
          {/* Mute button */}
          <button
            onClick={onToggleMute}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all cursor-pointer
              ${isMuted
                ? 'bg-accent-red/20 text-accent-red'
                : 'bg-theme-card border border-theme-border text-text-secondary'
              }
            `}
          >
            {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* End call button */}
          <button
            onClick={onEndCall}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-accent-red transition-colors cursor-pointer"
          >
            <PhoneOff size={18} className="text-white" />
          </button>
        </>
      )}
    </div>
  )
}
