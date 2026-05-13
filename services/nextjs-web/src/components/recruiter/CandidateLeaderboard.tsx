'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { useRecruiterCandidates } from '@/hooks/useRecruiterCandidates'
import { getScoreClass } from '@/lib/scoreUtils'
import { StatusBadge } from '@/components/recruiter/StatusBadge'
import type { RecruiterCandidate } from '@/types/recruiterCandidate'

const roundOptions = ['All Rounds', 'Coding', 'Voice', 'All'] as const

interface CandidateRow {
  id: string
  applicantId: string
  name: string
  initials: string
  role: string
  status: string
  cvScore: number | null
  codingScore: number | null
  voiceScore: number | null
  overallScore: number | null
  rank: number
}

function formatScore(score: number | null): string {
  if (score === null || Number.isNaN(score)) return '--'
  return Math.round(score).toString()
}

function getScoreClassSafe(score: number | null): string {
  if (score === null || Number.isNaN(score)) return 'text-text-secondary'
  return getScoreClass(score)
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
}

function normalizeCandidates(candidates: RecruiterCandidate[]): CandidateRow[] {
  return candidates.map((candidate) => {
    const firstName = candidate.applicant?.first_name || 'Unknown'
    const lastName = candidate.applicant?.last_name || 'Candidate'
    const name = `${firstName} ${lastName}`.trim()

    return {
      id: candidate.application_id,
      applicantId: candidate.applicant?.id || candidate.application_id,
      name,
      initials: getInitials(firstName, lastName),
      role: candidate.job?.title || 'Unknown Role',
      status: candidate.status || 'not_started',
      cvScore: candidate.cv_score,
      codingScore: candidate.coding_score,
      voiceScore: candidate.voice_score,
      overallScore: candidate.composite_score,
      rank: 0,
    }
  })
}

export default function CandidateLeaderboard() {
  const router = useRouter()
  const { candidates, loading, error } = useRecruiterCandidates()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [roundFilter, setRoundFilter] = useState<(typeof roundOptions)[number]>('All Rounds')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const normalizedCandidates = useMemo(() => normalizeCandidates(candidates), [candidates])

  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(normalizedCandidates.map((c) => c.role))).filter(Boolean)
    roles.sort((a, b) => a.localeCompare(b))
    return ['All Roles', ...roles]
  }, [normalizedCandidates])

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()

    return normalizedCandidates.filter((candidate) => {
      const matchesSearch = !query || candidate.name.toLowerCase().includes(query)
      const matchesRole = roleFilter === 'All Roles' || candidate.role === roleFilter
      const matchesRound =
        roundFilter === 'All Rounds' ||
        roundFilter === 'All' ||
        (roundFilter === 'Coding' && candidate.codingScore !== null) ||
        (roundFilter === 'Voice' && candidate.voiceScore !== null)

      return matchesSearch && matchesRole && matchesRound
    })
  }, [normalizedCandidates, roleFilter, roundFilter, search])

  const rankedCandidates = useMemo(() => {
    const sorted = [...filteredCandidates].sort((a, b) => {
      const aScore = a.overallScore ?? -1
      const bScore = b.overallScore ?? -1
      return sortDir === 'desc' ? bScore - aScore : aScore - bScore
    })

    return sorted.map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }))
  }, [filteredCandidates, sortDir])

  const mobileCards = useMemo(() => {
    return rankedCandidates.map((candidate) => (
      <div
        key={candidate.id}
        className="rounded-lg p-4 border bg-theme-card border-theme-border shadow-theme-card"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-semibold text-text-secondary">#{candidate.rank}</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 bg-accent-purple">
            {candidate.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-text-primary">{candidate.name}</p>
            <p className="text-xs truncate text-text-secondary">{candidate.role}</p>
          </div>
          <StatusBadge status={candidate.status} />
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'CV', score: candidate.cvScore },
            { label: 'Code', score: candidate.codingScore },
            { label: 'Comm', score: candidate.voiceScore },
            { label: 'Overall', score: candidate.overallScore },
          ].map((item) => (
            <div key={item.label} className="text-center p-2 rounded bg-theme-input">
              <p className="text-xs text-text-secondary">{item.label}</p>
              <p className={`text-sm font-semibold ${getScoreClassSafe(item.score)}`}>
                {formatScore(item.score)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/recruiter/candidate/${candidate.applicantId}`)}
            className="flex-1 text-xs py-2 rounded border transition-colors cursor-pointer text-center border-accent-purple text-accent-purple hover:bg-theme-input"
          >
            View Profile
          </button>
          <button
            onClick={() => router.push(`/recruiter/candidate/${candidate.applicantId}/cv`)}
            className="flex-1 text-xs py-2 rounded border transition-colors cursor-pointer text-center border-theme-border text-text-secondary bg-theme-input hover:border-accent-purple hover:text-accent-purple"
          >
            View CV
          </button>
        </div>
      </div>
    ))
  }, [rankedCandidates, router])

  const tableRows = useMemo(() => {
    return rankedCandidates.map((candidate) => (
      <tr
        key={candidate.id}
        className="border-t border-theme-border hover:bg-white/[0.04] transition-colors"
      >
        <td className="px-5 py-3.5">
          <span className="text-sm font-semibold text-text-secondary">#{candidate.rank}</span>
        </td>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 bg-accent-purple">
              {candidate.initials}
            </div>
            <span className="text-sm font-medium text-text-primary">{candidate.name}</span>
          </div>
        </td>
        <td className="px-5 py-3.5 text-sm text-text-secondary">{candidate.role}</td>
        <td className="px-5 py-3.5">
          <span className={`text-sm font-semibold ${getScoreClassSafe(candidate.cvScore)}`}>
            {formatScore(candidate.cvScore)}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <span className={`text-sm font-semibold ${getScoreClassSafe(candidate.codingScore)}`}>
            {formatScore(candidate.codingScore)}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <span className={`text-sm font-semibold ${getScoreClassSafe(candidate.voiceScore)}`}>
            {formatScore(candidate.voiceScore)}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <span className={`text-sm font-semibold ${getScoreClassSafe(candidate.overallScore)}`}>
            {formatScore(candidate.overallScore)}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <StatusBadge status={candidate.status} />
        </td>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/recruiter/candidate/${candidate.applicantId}`)}
              className="text-xs px-3 py-1.5 rounded border transition-colors cursor-pointer border-accent-purple text-accent-purple hover:bg-theme-input"
            >
              View Profile
            </button>
            <button
              onClick={() => router.push(`/recruiter/candidate/${candidate.applicantId}/cv`)}
              className="text-xs px-3 py-1.5 rounded border transition-colors cursor-pointer border-theme-border text-text-secondary bg-theme-input hover:border-accent-purple hover:text-accent-purple"
            >
              View CV
            </button>
          </div>
        </td>
      </tr>
    ))
  }, [rankedCandidates, router])

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">
          Candidate Ranking Leaderboard
        </h1>
        <p className="text-sm mt-0.5 text-text-secondary">
          {rankedCandidates.length} candidates across all roles
        </p>
      </div>

      <div className="rounded-lg p-4 border mb-4 flex items-center gap-3 flex-wrap bg-theme-card border-theme-border shadow-theme-card">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidate name..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded border outline-none bg-theme-input border-theme-border text-text-primary placeholder:text-text-secondary focus:border-accent-purple focus:bg-theme-card transition-colors"
          />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="appearance-none w-full sm:w-auto pl-3 pr-7 py-2 text-sm rounded border outline-none cursor-pointer bg-theme-input border-theme-border text-text-primary"
          >
            {roleOptions.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" />
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            value={roundFilter}
            onChange={(event) => setRoundFilter(event.target.value as (typeof roundOptions)[number])}
            className="appearance-none w-full sm:w-auto pl-3 pr-7 py-2 text-sm rounded border outline-none cursor-pointer bg-theme-input border-theme-border text-text-primary"
          >
            {roundOptions.map((round) => (
              <option key={round}>{round}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" />
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded text-sm border bg-[var(--error-bg)] border-[var(--error-border)] text-[var(--error)]">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          Loading candidates...
        </div>
      )}

      {!loading && rankedCandidates.length === 0 && (
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          No candidates found for the selected filters.
        </div>
      )}

      {!loading && rankedCandidates.length > 0 && (
        <>
          <div className="md:hidden space-y-3">
            {mobileCards}
          </div>

          <div className="rounded-lg border overflow-hidden hidden md:block bg-theme-card border-theme-border shadow-theme-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-theme-input">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Rank</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Candidate</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Applied Role</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">CV Score</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Coding</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Communication</th>
                    <th
                      className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none text-text-secondary"
                      onClick={() => setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    >
                      <span className="flex items-center gap-1">
                        Overall
                        {sortDir === 'desc' ? <ChevronDown size={12} /> : sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronsUpDown size={12} />}
                      </span>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>{tableRows}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
