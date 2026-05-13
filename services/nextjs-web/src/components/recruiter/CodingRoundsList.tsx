'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Code2 } from 'lucide-react'
import { useRecruiterCodingRounds } from '@/hooks/useRecruiterCodingRounds'
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

export default function CodingRoundsList() {
  const router = useRouter()
  const { rounds, loading, error } = useRecruiterCodingRounds()

  const roundCards = useMemo(() => {
    return rounds.map((round) => {
      const initials = getInitials(round.candidate_name)
      return (
        <div
          key={round.assessment_id}
          onClick={() => router.push(`/recruiter/candidate/${round.candidate_id}/assessment`)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              router.push(`/recruiter/candidate/${round.candidate_id}/assessment`)
            }
          }}
          role="button"
          tabIndex={0}
          className="w-full text-left rounded-lg p-4 sm:p-5 border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 transition-all cursor-pointer bg-theme-card border-theme-border shadow-theme-card hover:border-accent-purple hover:shadow-[0_2px_8px_rgba(124,106,239,0.12)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 bg-[#0D1017]">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{round.candidate_name}</p>
              <p className="text-sm text-text-secondary">{round.job_title}</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <Calendar size={12} />
              {formatDate(round.submitted_at)}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-[#0D1017] text-[#7DA4D4] font-mono">
                {round.language || 'N/A'}
              </span>
              <span className="text-text-secondary">{round.problem_title || 'Coding Assessment'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Code2 size={13} className="text-accent-purple" />
              <span className={`text-sm font-semibold ${getScoreClassSafe(round.coding_score)}`}>
                {formatScore(round.coding_score)}/100
              </span>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                router.push(`/recruiter/candidate/${round.candidate_id}/assessment`)
              }}
              className="px-3 py-1.5 text-xs border rounded transition-colors border-accent-purple text-accent-purple hover:bg-accent-purple hover:text-white"
            >
              View Code
            </button>
          </div>
        </div>
      )
    })
  }, [rounds, router])

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">Coding Round</h1>
        <p className="text-sm mt-0.5 text-text-secondary">
          {rounds.length} submitted coding assessments
        </p>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded text-sm border bg-[var(--error-bg)] border-[var(--error-border)] text-[var(--error)]">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          Loading coding rounds...
        </div>
      )}

      {!loading && rounds.length === 0 && (
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          No submitted coding assessments yet.
        </div>
      )}

      {!loading && rounds.length > 0 && (
        <div className="space-y-3">{roundCards}</div>
      )}
    </div>
  )
}
