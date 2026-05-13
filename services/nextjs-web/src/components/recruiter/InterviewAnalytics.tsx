'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { useRecruiterInterviewDetail } from '@/hooks/useRecruiterInterviewDetail'
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

function Waveform({ progress }: { progress: number }) {
  const bars = useMemo(() => {
    return Array.from({ length: 80 }, (_, index) => {
      const height = 6 + Math.abs(Math.sin(index * 0.4) * 18 + Math.sin(index * 0.7) * 10)
      const isPlayed = index < (progress / 100) * 80

      return (
        <div
          key={index}
          className={`flex-1 rounded-sm ${isPlayed ? 'bg-accent-purple' : 'bg-theme-input'}`}
          style={{ height: `${height}px` }}
        />
      )
    })
  }, [progress])

  return <div className="w-full flex items-center gap-px">{bars}</div>
}

function MiniBarChart({
  label,
  data,
  barClass,
}: {
  label: string
  data: { q: string; score: number }[]
  barClass: string
}) {
  const maxScore = 100

  return (
    <div className="rounded-lg p-4 border bg-theme-card border-theme-border shadow-theme-card">
      <p className="text-xs font-medium mb-2 text-text-secondary">{label}</p>
      <div className="flex items-end gap-2 h-[90px]">
        {data.map((item) => (
          <div key={item.q} className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full bg-theme-input rounded-sm flex items-end justify-center">
              <div
                className={`w-full rounded-sm ${barClass}`}
                style={{ height: `${Math.max(0, Math.min(100, (item.score / maxScore) * 100))}%` }}
              />
            </div>
            <span className="text-[0.65rem] text-text-secondary">{item.q}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InterviewAnalytics() {
  const router = useRouter()
  const params = useParams<{ candidateId: string }>()
  const candidateId = params?.candidateId || ''
  const { detail, loading, error } = useRecruiterInterviewDetail(candidateId)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(37)

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl">
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          Loading interview analytics...
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl">
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          {error || 'Interview analytics not available.'}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl">
      <button
        onClick={() => router.push(`/recruiter/candidate/${candidateId}`)}
        className="flex items-center gap-1.5 text-sm mb-5 text-text-secondary hover:text-accent-purple transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} />
        Back to Profile
      </button>

      <div className="mb-5">
        <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">
          Interview Analytics
        </h1>
        <p className="text-sm mt-0.5 text-text-secondary">
          {detail.candidate_name} · {detail.job_title} · Completed {formatDate(detail.completed_at)}
        </p>
      </div>

      <div className="rounded-lg p-5 border mb-5 bg-theme-card border-theme-border shadow-theme-card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="transition-colors cursor-pointer text-text-secondary hover:text-accent-purple">
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => setPlaying((prev) => !prev)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer bg-accent-purple hover:bg-accent-purple-hover"
            >
              {playing ? <Pause size={16} /> : <Play size={15} />}
            </button>
            <button className="transition-colors cursor-pointer text-text-secondary hover:text-accent-purple">
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs w-10 text-text-secondary">08:14</span>
            <div className="flex-1 relative h-10 flex items-center">
              <Waveform progress={progress} />
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-xs w-10 text-right text-text-secondary">22:05</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 rounded-lg border overflow-hidden bg-theme-card border-theme-border shadow-theme-card">
          <div className="px-5 py-4 border-b border-theme-border">
            <h3 className="text-[0.9375rem] font-semibold text-text-primary">Full Transcript</h3>
          </div>
          <div className="overflow-y-auto max-h-[480px]">
            {detail.transcript.length === 0 ? (
              <div className="px-5 py-4 text-sm text-text-secondary">
                No transcript available yet.
              </div>
            ) : (
              detail.transcript.map((line) => (
                <div
                  key={line.id}
                  className={`px-5 py-3 border-b border-theme-border border-l-4 ${
                    line.quality === 'high'
                      ? 'border-l-[var(--success)]'
                      : line.quality === 'medium'
                        ? 'border-l-[var(--warning)]'
                        : line.quality === 'low'
                          ? 'border-l-[var(--error)]'
                          : 'border-l-transparent'
                  }`}
                >
                  <p className="text-xs mb-1 uppercase font-medium text-accent-purple">
                    {line.speaker}
                  </p>
                  <p className="text-sm leading-relaxed text-text-primary">{line.text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          <MiniBarChart label="Clarity Score by Question" data={detail.clarity} barClass="bg-accent-purple" />
          <MiniBarChart label="Relevance Score by Question" data={detail.relevance} barClass="bg-[#E2E4EB]" />
          <MiniBarChart label="Confidence Score by Question" data={detail.confidence} barClass="bg-[#9585F5]" />

          <div className="rounded-lg p-4 border bg-theme-card border-theme-border shadow-theme-card border-l-4 border-accent-purple">
            <p className="text-xs font-semibold mb-2 text-accent-purple">AI INSIGHT SUMMARY</p>
            <p className="text-sm leading-relaxed text-text-secondary">
              {detail.candidate_name} demonstrated consistent communication clarity with a total score of{' '}
              <span className={`font-semibold ${getScoreClassSafe(detail.voice_score)}`}>
                {formatScore(detail.voice_score)}/100
              </span>.
              The responses show structured storytelling and strong articulation on technical concepts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
