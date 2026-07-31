'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, ArrowLeft } from 'lucide-react'
import { StatusBadge } from '@/components/recruiter/StatusBadge'

interface MockCandidateRow {
  id: string
  name: string
  initials: string
  role: string
  cvScore: number
  codingScore: number
  voiceScore: number
  overallScore: number
  status: string
}

export default function MockCandidates() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const candidates: MockCandidateRow[] = [
    {
      id: 'elena-rostova',
      name: 'Elena Rostova',
      initials: 'ER',
      role: 'Frontend Architect',
      cvScore: 88,
      codingScore: 95,
      voiceScore: 90,
      overallScore: 91,
      status: 'advanced'
    },
    {
      id: 'adrian-sterling',
      name: 'Adrian Sterling',
      initials: 'AS',
      role: 'Senior Systems Engineer',
      cvScore: 85,
      codingScore: 92,
      voiceScore: 78,
      overallScore: 85,
      status: 'shortlisted'
    },
    {
      id: 'courtney-henry',
      name: 'Courtney Henry',
      initials: 'CH',
      role: 'Frontend Architect',
      cvScore: 85,
      codingScore: 80,
      voiceScore: 82,
      overallScore: 82,
      status: 'shortlisted'
    },
    {
      id: 'marcus-vance',
      name: 'Marcus Vance',
      initials: 'MV',
      role: 'DevOps Platform Engineer',
      cvScore: 80,
      codingScore: 70,
      voiceScore: 85,
      overallScore: 78,
      status: 'under_review'
    },
    {
      id: 'devon-lane',
      name: 'Devon Lane',
      initials: 'DL',
      role: 'Data Infrastructure Engineer',
      cvScore: 60,
      codingScore: 65,
      voiceScore: 68,
      overallScore: 64,
      status: 'rejected'
    }
  ]

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()
    return candidates.filter((c) => !query || c.name.toLowerCase().includes(query) || c.role.toLowerCase().includes(query))
  }, [candidates, search])

  const sortedCandidates = useMemo(() => {
    const sorted = [...filteredCandidates].sort((a, b) => {
      return sortDir === 'desc' ? b.overallScore - a.overallScore : a.overallScore - b.overallScore
    })
    return sorted
  }, [filteredCandidates, sortDir])

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'text-accent-teal'
    if (score >= 65) return 'text-text-primary'
    return 'text-accent-red'
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div>
          <button
            onClick={() => router.push('/recruiter/mock')}
            className="flex items-center gap-1.5 text-xs mb-3 text-text-secondary hover:text-accent-purple transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            Back to Dashboard
          </button>
          <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">
            Candidate Ranking Leaderboard
          </h1>
          <p className="text-sm mt-0.5 text-text-secondary">
            {sortedCandidates.length} candidates across all openings.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg p-4 border flex items-center gap-3 flex-wrap bg-theme-card border-theme-border shadow-theme-card">
        <div className="relative flex-1 min-w-0 sm:min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name or role..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded border outline-none bg-theme-input border-theme-border text-text-primary placeholder:text-text-secondary focus:border-accent-purple focus:bg-theme-card transition-colors"
          />
        </div>
      </div>

      {/* Desktop Leaderboard */}
      <div className="rounded-lg border overflow-hidden bg-theme-card border-theme-border shadow-theme-card">
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
                    {sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                  </span>
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((candidate, index) => (
                <tr
                  key={candidate.id}
                  className="border-t border-theme-border hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-text-secondary">#{index + 1}</span>
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
                    <span className={`text-sm font-semibold ${getScoreClass(candidate.cvScore)}`}>
                      {candidate.cvScore}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-semibold ${getScoreClass(candidate.codingScore)}`}>
                      {candidate.codingScore}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-semibold ${getScoreClass(candidate.voiceScore)}`}>
                      {candidate.voiceScore}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-semibold ${getScoreClass(candidate.overallScore)}`}>
                      {candidate.overallScore}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={candidate.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/recruiter/mock/candidate/${candidate.id}`)}
                        className="text-xs px-3 py-1.5 rounded border transition-colors cursor-pointer border-accent-purple text-accent-purple hover:bg-theme-input"
                      >
                        View Profile
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
