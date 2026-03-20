/**
 * useVapi Hook
 * Manages VAPI call state, events, and transcripts
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getVapiClient, getAssistantId, VapiCallStatus, VapiTranscriptMessage } from '@/lib/vapi'
import type Vapi from '@vapi-ai/web'

export interface TranscriptEntry {
  id: string
  role: 'assistant' | 'user'
  text: string
  timestamp: number
  isFinal: boolean
}

export interface UseVapiReturn {
  status: VapiCallStatus
  isSpeaking: boolean
  isListening: boolean
  transcripts: TranscriptEntry[]
  currentTranscript: string
  error: string | null
  volumeLevel: number
  startCall: () => Promise<void>
  endCall: () => void
  toggleMute: () => void
  isMuted: boolean
}

export function useVapi(): UseVapiReturn {
  const [status, setStatus] = useState<VapiCallStatus>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const vapiRef = useRef<Vapi | null>(null)
  const transcriptIdCounter = useRef(0)

  // Initialize VAPI and setup event listeners
  useEffect(() => {
    const vapi = getVapiClient()
    vapiRef.current = vapi

    // Call started
    const handleCallStart = () => {
      setStatus('connected')
      setError(null)
    }

    // Call ended
    const handleCallEnd = () => {
      setStatus('ended')
      setIsSpeaking(false)
      setIsListening(false)
      setCurrentTranscript('')
    }

    // Speech start (assistant speaking)
    const handleSpeechStart = () => {
      setIsSpeaking(true)
      setIsListening(false)
      setStatus('speaking')
    }

    // Speech end (assistant stopped speaking)
    const handleSpeechEnd = () => {
      setIsSpeaking(false)
      setStatus('connected')
    }

    // Handle messages (transcripts, etc.)
    const handleMessage = (message: unknown) => {
      const msg = message as VapiTranscriptMessage
      if (msg.type === 'transcript') {
        if (msg.transcriptType === 'partial') {
          setCurrentTranscript(msg.transcript)
          if (msg.role === 'user') {
            setIsListening(true)
            setStatus('listening')
          }
        } else if (msg.transcriptType === 'final') {
          // Add to transcripts list
          const newEntry: TranscriptEntry = {
            id: `transcript-${++transcriptIdCounter.current}`,
            role: msg.role,
            text: msg.transcript,
            timestamp: Date.now(),
            isFinal: true,
          }
          setTranscripts(prev => [...prev, newEntry])
          setCurrentTranscript('')
          if (msg.role === 'user') {
            setIsListening(false)
          }
        }
      }
    }

    // Volume level changes
    const handleVolumeLevel = (level: number) => {
      setVolumeLevel(level)
    }

    // Error handling
    const handleError = (err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      setStatus('error')
    }

    // Register event listeners
    vapi.on('call-start', handleCallStart)
    vapi.on('call-end', handleCallEnd)
    vapi.on('speech-start', handleSpeechStart)
    vapi.on('speech-end', handleSpeechEnd)
    vapi.on('message', handleMessage)
    vapi.on('volume-level', handleVolumeLevel)
    vapi.on('error', handleError)

    // Cleanup
    return () => {
      vapi.off('call-start', handleCallStart)
      vapi.off('call-end', handleCallEnd)
      vapi.off('speech-start', handleSpeechStart)
      vapi.off('speech-end', handleSpeechEnd)
      vapi.off('message', handleMessage)
      vapi.off('volume-level', handleVolumeLevel)
      vapi.off('error', handleError)
    }
  }, [])

  // Start a call with the configured assistant
  const startCall = useCallback(async () => {
    const vapi = vapiRef.current
    if (!vapi) {
      setError('VAPI not initialized')
      return
    }

    const assistantId = getAssistantId()
    if (!assistantId) {
      setError('Assistant ID not configured')
      return
    }

    try {
      setStatus('connecting')
      setError(null)
      setTranscripts([])
      setCurrentTranscript('')
      await vapi.start(assistantId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start call'
      setError(errorMessage)
      setStatus('error')
    }
  }, [])

  // End the current call
  const endCall = useCallback(() => {
    const vapi = vapiRef.current
    if (vapi) {
      vapi.stop()
      setStatus('ended')
    }
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const vapi = vapiRef.current
    if (vapi) {
      const newMuted = !isMuted
      vapi.setMuted(newMuted)
      setIsMuted(newMuted)
    }
  }, [isMuted])

  return {
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
  }
}
