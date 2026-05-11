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

export type VapiDebugEvent = {
  type: 'call-start' | 'call-end' | 'speech-start' | 'speech-end' | 'message' | 'volume-level' | 'error' | 'status-change'
  payload?: unknown
}

export interface UseVapiOptions {
  onDebugEvent?: (event: VapiDebugEvent) => void
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

export function useVapi(options: UseVapiOptions = {}): UseVapiReturn {
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
  const assistantDraftRef = useRef('')
  const lastAssistantFinalRef = useRef('')

  const emitDebug = useCallback((event: VapiDebugEvent) => {
    options.onDebugEvent?.(event)
  }, [options])

  const setStatusSafe = useCallback((nextStatus: VapiCallStatus) => {
    statusRef.current = nextStatus
    setStatus(nextStatus)
    emitDebug({ type: 'status-change', payload: nextStatus })
  }, [emitDebug])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  // Initialize VAPI and setup event listeners
  useEffect(() => {
    let vapi: Vapi
    try {
      vapi = getVapiClient()
      vapiRef.current = vapi
    } catch (err) {
      setError(err instanceof Error ? err.message : 'VAPI initialization failed')
      return
    }

    // Call started
    const handleCallStart = () => {
      sessionEndedRef.current = false
      setStatusSafe('connected')
      setError(null)
      emitDebug({ type: 'call-start' })
    }

    // Call ended
    const handleCallEnd = () => {
      sessionEndedRef.current = true
      setStatusSafe('ended')
      setIsSpeaking(false)
      setIsListening(false)
      setCurrentTranscript('')
      assistantDraftRef.current = ''
      emitDebug({ type: 'call-end' })
    }

    // Speech start (assistant speaking)
    const handleSpeechStart = () => {
      if (sessionEndedRef.current) return
      setIsSpeaking(true)
      setIsListening(false)
      setStatusSafe('speaking')
      emitDebug({ type: 'speech-start' })
    }

    // Speech end (assistant stopped speaking)
    const handleSpeechEnd = () => {
      setIsSpeaking(false)
      emitDebug({ type: 'speech-end' })

      const currentStatus = statusRef.current
      if (currentStatus === 'connecting' || currentStatus === 'connected' || currentStatus === 'speaking' || currentStatus === 'listening') {
        setStatusSafe('connected')
      }
    }

    // Handle messages (transcripts, etc.)
    const handleMessage = (message: unknown) => {
      if (sessionEndedRef.current) return

      const msg = message as any
      emitDebug({ type: 'message', payload: msg })
      
      // 1. Handle Transcripts (User and Final Assistant)
      if (msg.type === 'transcript') {
        const transcriptMsg = msg as VapiTranscriptMessage
        if (transcriptMsg.transcriptType === 'partial') {
          if (transcriptMsg.role === 'user') {
            setCurrentTranscript(transcriptMsg.transcript)
            setIsListening(true)
            setStatusSafe('listening')
          } else if (transcriptMsg.role === 'assistant') {
            assistantDraftRef.current = transcriptMsg.transcript
            setCurrentTranscript(transcriptMsg.transcript)
            setIsSpeaking(true)
            setStatusSafe('speaking')
          }
        } else if (transcriptMsg.transcriptType === 'final') {
          const newEntry: TranscriptEntry = {
            id: `transcript-${++transcriptIdCounter.current}`,
            role: transcriptMsg.role,
            text: transcriptMsg.transcript,
            timestamp: Date.now(),
            isFinal: true,
          }
          setTranscripts(prev => [...prev, newEntry])
          if (transcriptMsg.role === 'user') {
            setCurrentTranscript('')
            setIsListening(false)
          } else {
            lastAssistantFinalRef.current = transcriptMsg.transcript
            assistantDraftRef.current = ''
            setCurrentTranscript('')
          }
        }
      }

      // 2. Handle Model Output (Assistant streaming text)
      if (msg.type === 'model-output' || msg.type === 'assistant-message') {
        const text = msg.output || msg.message || msg.content || ''
        if (text) {
          assistantDraftRef.current = `${assistantDraftRef.current}${text}`
          setIsSpeaking(true)
          setStatusSafe('speaking')
          setCurrentTranscript(assistantDraftRef.current)
        }
      }

      // 3. Handle Speech Updates (Low-level status changes)
      if (msg.type === 'speech-update') {
        if (msg.status === 'started') {
          if (msg.role === 'user') {
            setIsListening(true)
            setStatusSafe('listening')
          } else {
            setIsSpeaking(true)
            setStatusSafe('speaking')
          }
        } else if (msg.status === 'stopped') {
          if (msg.role === 'user') {
            setIsListening(false)
          } else {
            setIsSpeaking(false)
            const draft = assistantDraftRef.current.trim()
            if (draft && draft !== lastAssistantFinalRef.current) {
              const newEntry: TranscriptEntry = {
                id: `transcript-${++transcriptIdCounter.current}`,
                role: 'assistant',
                text: draft,
                timestamp: Date.now(),
                isFinal: true,
              }
              setTranscripts(prev => [...prev, newEntry])
              assistantDraftRef.current = ''
              setCurrentTranscript('')
            }
          }
        }
      }
    }

    // Volume level changes
    const handleVolumeLevel = (level: number) => {
      setVolumeLevel(level)
      emitDebug({ type: 'volume-level', payload: level })
    }

    // Error handling
    const handleError = (err: unknown) => {
      const errorMessage = getErrorText(err)
      emitDebug({ type: 'error', payload: errorMessage })

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
  }, [emitDebug, setStatusSafe])

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
      assistantDraftRef.current = ''
      lastAssistantFinalRef.current = ''
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
    assistantDraftRef.current = ''
    lastAssistantFinalRef.current = ''
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
