/**
 * VAPI Client Service
 * Handles VAPI Web SDK initialization and provides singleton instance
 *
 * Required environment variables in .env.local:
 * - NEXT_PUBLIC_VAPI_PUBLIC_KEY: Your VAPI public key (get from https://dashboard.vapi.ai/account)
 * - NEXT_PUBLIC_VAPI_ASSISTANT_ID: Your VAPI assistant ID
 */

import Vapi from '@vapi-ai/web'

let vapiInstance: Vapi | null = null

/**
 * Get or create the VAPI client instance
 * Uses singleton pattern to ensure only one instance exists
 */
export function getVapiClient(): Vapi {
  if (!vapiInstance) {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    if (!publicKey) {
      console.warn(
        'VAPI: NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set.',
        'Get your public key from https://dashboard.vapi.ai/account'
      )
    }
    // Initialize VAPI with the public key for browser-based calls
    vapiInstance = new Vapi(publicKey || '')
  }
  return vapiInstance
}

/**
 * Get the configured assistant ID from environment
 */
export function getAssistantId(): string {
  return process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID || ''
}

/**
 * VAPI Call States
 */
export type VapiCallStatus =
  | 'idle'           // Not connected
  | 'connecting'     // Connecting to VAPI
  | 'connected'      // Connected, call in progress
  | 'speaking'       // Assistant is speaking
  | 'listening'      // User is speaking / assistant listening
  | 'ended'          // Call has ended
  | 'error'          // Error occurred

/**
 * VAPI Message Types
 */
export interface VapiTranscriptMessage {
  type: 'transcript'
  role: 'assistant' | 'user'
  transcriptType: 'partial' | 'final'
  transcript: string
}

export interface VapiSpeechStartMessage {
  type: 'speech-start'
}

export interface VapiSpeechEndMessage {
  type: 'speech-end'
}

export interface VapiFunctionCallMessage {
  type: 'function-call'
  functionCall: {
    name: string
    parameters: Record<string, unknown>
  }
}

export type VapiMessage =
  | VapiTranscriptMessage
  | VapiSpeechStartMessage
  | VapiSpeechEndMessage
  | VapiFunctionCallMessage
