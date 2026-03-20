/**
 * MockInterviewCard Component
 * Card that appears on the candidate dashboard to start a mock interview
 * Styled similar to the TaskCard from AssessmentLobby prototype
 */

import { Mic, Sparkles, ArrowRight } from 'lucide-react'

interface MockInterviewCardProps {
  onBegin: () => void
}

export function MockInterviewCard({ onBegin }: MockInterviewCardProps) {
  return (
    <div className="rounded-lg p-6 border border-t-[3px] border-t-accent-purple bg-theme-card border-theme-border shadow-theme-card hover:border-accent-purple/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-accent-purple/10">
          <Mic size={22} className="text-accent-purple" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-accent-green/10 text-accent-green">
          <Sparkles size={12} />
          AI Powered
        </span>
      </div>

      <h3 className="text-base font-semibold mb-1 text-text-primary">
        Mock Interview
      </h3>
      <p className="text-sm mb-1 text-text-secondary">
        Practice with our AI interviewer
      </p>
      <p className="text-xs mb-5 text-text-secondary/60">
        Est. 10-15 minutes
      </p>

      <p className="text-xs leading-relaxed mb-5 text-text-secondary">
        Sharpen your interview skills with real-time AI feedback. Our voice-powered mock interview
        simulates real interview conditions to help you prepare for the real thing.
      </p>

      <button
        onClick={onBegin}
        className="w-full py-2.5 text-sm font-medium text-white rounded bg-accent-purple hover:bg-accent-purple-hover transition-colors cursor-pointer flex items-center justify-center gap-2"
      >
        Begin Practice
        <ArrowRight size={14} />
      </button>
    </div>
  )
}
