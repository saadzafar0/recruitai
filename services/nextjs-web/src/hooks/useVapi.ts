/**
 * useVapi Hook
 * Manages VAPI call state, events, and transcripts
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getVapiClient, getAssistantId, VapiCallStatus, VapiTranscriptMessage } from '@/lib/vapi'
import type Vapi from '@vapi-ai/web'

function getErrorText(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string') return err

  if (err && typeof err === 'object') {
    const maybeMessage = Reflect.get(err, 'message')
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage
    }

    const maybeError = Reflect.get(err, 'error')
    if (typeof maybeError === 'string' && maybeError.trim().length > 0) {
      return maybeError
    }

    try {
      return JSON.stringify(err)
    } catch {
      return 'An error occurred'
    }
  }

  return 'An error occurred'
}

function isExpectedEndError(message: string): boolean {
  const normalizedMessage = message.toLowerCase()
  return (
    normalizedMessage.includes('meeting has ended') ||
    normalizedMessage.includes('meeting ended') ||
    normalizedMessage.includes('due to ejection') ||
    normalizedMessage.includes('ejection')
  )
}

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
  startCall: (applicationId?: string) => Promise<void>
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
  const statusRef = useRef<VapiCallStatus>('idle')
  const sessionEndedRef = useRef(false)

  const setStatusSafe = useCallback((nextStatus: VapiCallStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
  }, [])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  // Initialize VAPI and setup event listeners
  useEffect(() => {
    const vapi = getVapiClient()
    vapiRef.current = vapi

    // Call started
    const handleCallStart = () => {
      sessionEndedRef.current = false
      setStatusSafe('connected')
      setError(null)
    }

    // Call ended
    const handleCallEnd = () => {
      sessionEndedRef.current = true
      setStatusSafe('ended')
      setIsSpeaking(false)
      setIsListening(false)
      setCurrentTranscript('')
    }

    // Speech start (assistant speaking)
    const handleSpeechStart = () => {
      if (sessionEndedRef.current) return
      setIsSpeaking(true)
      setIsListening(false)
      setStatusSafe('speaking')
    }

    // Speech end (assistant stopped speaking)
    const handleSpeechEnd = () => {
      setIsSpeaking(false)

      const currentStatus = statusRef.current
      if (currentStatus === 'connecting' || currentStatus === 'connected' || currentStatus === 'speaking' || currentStatus === 'listening') {
        setStatusSafe('connected')
      }
    }

    // Handle messages (transcripts, etc.)
    const handleMessage = (message: unknown) => {
      if (sessionEndedRef.current) return

      const msg = message as VapiTranscriptMessage
      if (msg.type === 'transcript') {
        if (msg.transcriptType === 'partial') {
          setCurrentTranscript(msg.transcript)
          if (msg.role === 'user') {
            setIsListening(true)
            setStatusSafe('listening')
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
      const errorMessage = getErrorText(err)

      if (sessionEndedRef.current) {
        return
      }

      const isExpectedCallEnd = isExpectedEndError(errorMessage)

      if (isExpectedCallEnd) {
        sessionEndedRef.current = true
        setStatusSafe('ended')
        setIsSpeaking(false)
        setIsListening(false)
        setCurrentTranscript('')
        setError(null)
        return
      }

      if (statusRef.current === 'ended' || statusRef.current === 'idle') {
        return
      }

      setError(errorMessage)
      setStatusSafe('error')
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
  }, [setStatusSafe])

  // Start a call with the configured assistant
  const startCall = useCallback(async (applicationId?: string) => {
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

    const trimmed = applicationId?.trim()
    const assistantOverrides = trimmed
      ? { variableValues: { applicationId: trimmed } }
      : undefined

    try {
      sessionEndedRef.current = false
      setStatusSafe('connecting')
      setError(null)
      setTranscripts([])
      setCurrentTranscript('')
      await vapi.start(assistantId, assistantOverrides)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start call'
      setError(errorMessage)
      setStatusSafe('error')
    }
  }, [setStatusSafe])

  // End the current call
  const endCall = useCallback(() => {
    sessionEndedRef.current = true
    setStatusSafe('ended')

    const vapi = vapiRef.current
    if (vapi) {
      vapi.stop()
    }

    setIsSpeaking(false)
    setIsListening(false)
    setCurrentTranscript('')
    setError(null)
  }, [setStatusSafe])

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
