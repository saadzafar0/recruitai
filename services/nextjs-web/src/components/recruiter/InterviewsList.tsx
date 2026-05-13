'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Mic } from 'lucide-react'
import { useRecruiterInterviews } from '@/hooks/useRecruiterInterviews'
import { getScoreClass } from '@/lib/scoreUtils'

function formatDate(value: string | null): string {
  if (!value) return 'N/A'
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function formatScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return '--'
  return Math.round(score).toString()
}

function getScoreClassSafe(score: number | null): string {
  if (score === null || Number.isNaN(score)) return 'text-text-secondary'
  return getScoreClass(score)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function InterviewsList() {
  const router = useRouter()
  const { interviews, loading, error } = useRecruiterInterviews()

  const interviewCards = useMemo(() => {
    return interviews.map((interview) => {
      const initials = getInitials(interview.candidate_name)
      return (
        <button
          key={interview.session_id}
          type="button"
          onClick={() => router.push(`/recruiter/candidate/${interview.candidate_id}/interview`)}
          className="w-full text-left rounded-lg p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 transition-all cursor-pointer bg-theme-card border-theme-border shadow-theme-card hover:border-accent-purple hover:shadow-[0_2px_8px_rgba(124,106,239,0.12)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 bg-accent-purple">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{interview.candidate_name}</p>
              <p className="text-sm text-text-secondary">{interview.job_title}</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Calendar size={12} />
              {formatDate(interview.completed_at)}
            </div>
            <div className="flex items-center gap-1.5">
              <Mic size={13} className="text-accent-purple" />
              <span className={`text-sm font-semibold ${getScoreClassSafe(interview.voice_score)}`}>
                {formatScore(interview.voice_score)}/100
              </span>
            </div>
            <span className="px-3 py-1.5 text-xs border rounded transition-colors cursor-pointer border-accent-purple text-accent-purple">
              View Analytics
            </span>
          </div>
        </button>
      )
    })
  }, [interviews, router])

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">Interviews</h1>
        <p className="text-sm mt-0.5 text-text-secondary">
          {interviews.length} completed voice interviews
        </p>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded text-sm border bg-[var(--error-bg)] border-[var(--error-border)] text-[var(--error)]">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          Loading interviews...
        </div>
      )}

      {!loading && interviews.length === 0 && (
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          No completed interviews yet.
        </div>
      )}

      {!loading && interviews.length > 0 && (
        <div className="space-y-3">{interviewCards}</div>
      )}
    </div>
  )
}
