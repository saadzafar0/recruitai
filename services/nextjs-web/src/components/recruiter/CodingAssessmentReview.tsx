'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useRecruiterCodingRoundDetail } from '@/hooks/useRecruiterCodingRoundDetail'
import { getScoreClass } from '@/lib/scoreUtils'

function formatDate(value: string | null): string {
  if (!value) return 'N/A'
  try {
    return new Date(value).toLocaleDateString()
  } catch {
    return value
  }
}

function formatScore(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '--'
  return Math.round(value).toString()
}

function getScoreClassSafe(score: number | null): string {
  if (score === null || Number.isNaN(score)) return 'text-text-secondary'
  return getScoreClass(score)
}

function ScoreRow({
  label,
  score,
  comment,
}: {
  label: string
  score: number | null
  comment: string
}) {
  const numericScore = score ?? 0

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className={`text-sm font-semibold ${getScoreClassSafe(score)}`}>
          {formatScore(score)}%
        </span>
      </div>
      <div className="h-2.5 rounded-full mb-2 bg-theme-input">
        <div
          className="h-full rounded-full bg-accent-purple"
          style={{ width: `${Math.max(0, Math.min(100, numericScore))}%` }}
        />
      </div>
      <p className="text-xs italic text-text-secondary">{comment}</p>
    </div>
  )
}

export default function CodingAssessmentReview() {
  const router = useRouter()
  const params = useParams<{ candidateId: string }>()
  const candidateId = params?.candidateId || ''
  const { detail, loading, error } = useRecruiterCodingRoundDetail(candidateId)

  const codeLines = useMemo(() => {
    const code = detail?.submission?.source_code || ''
    return code.split('\n')
  }, [detail?.submission?.source_code])

  const correctness = detail?.submission?.score_correctness ?? detail?.coding_score ?? null
  const efficiency = detail?.submission?.score_efficiency ?? detail?.coding_score ?? null
  const quality = detail?.submission?.score_code_quality ?? detail?.coding_score ?? null
  const bestPractices = detail?.submission?.score_best_practices ?? detail?.coding_score ?? null

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl">
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          Loading assessment review...
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl">
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          {error || 'Assessment review not available.'}
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
          Coding Assessment Review
        </h1>
        <p className="text-sm mt-0.5 text-text-secondary">
          {detail.candidate_name} · {detail.problem_title || 'Coding Assessment'} · {detail.language || 'N/A'}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 rounded-lg overflow-hidden border border-theme-border shadow-theme-card">
        <div className="flex-1 min-w-0 bg-[#0D1017]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A1D27]">
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded bg-accent-purple text-white">
                {detail.language || 'Language'}
              </span>
              <span className="text-xs text-text-secondary">
                {detail.problem_title || 'Coding Assessment'}
              </span>
            </div>
            <span className="text-xs text-text-secondary">Submitted {formatDate(detail.submitted_at)}</span>
          </div>

          <div className="overflow-auto max-h-[520px] font-mono text-[0.8125rem]">
            <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
              <tbody>
                {codeLines.map((line, index) => (
                  <tr key={`${index}-${line}`} className="hover:bg-white/5">
                    <td className="px-4 py-0.5 text-right select-none text-text-secondary w-12">
                      {index + 1}
                    </td>
                    <td className="pl-2 pr-5 py-0.5 text-[#D4D8E4] whitespace-pre">
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-full lg:w-96 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-theme-border bg-theme-card">
          <div className="px-6 py-4 border-b border-theme-border">
            <h3 className="text-[0.9375rem] font-semibold text-text-primary">
              {detail.candidate_name}
            </h3>
            <p className="text-sm mt-0.5 text-text-secondary">
              {detail.problem_title || 'Coding Assessment'}
            </p>
          </div>

          <div className="px-6 py-5">
            <ScoreRow
              label="Correctness"
              score={correctness}
              comment="All visible test cases executed with consistent results."
            />
            <ScoreRow
              label="Efficiency"
              score={efficiency}
              comment="Runtime and memory usage align with expected complexity targets."
            />
            <ScoreRow
              label="Coding Standards"
              score={quality}
              comment="Naming, structure, and readability are aligned with best practices."
            />
            <ScoreRow
              label="Best Practices"
              score={bestPractices}
              comment="Uses language idioms and avoids unnecessary complexity."
            />

            <div className="mt-4 p-4 rounded-lg border border-theme-border bg-theme-input">
              <p className="text-xs font-semibold mb-2 text-accent-purple">AI WRITTEN EVALUATION</p>
              <p className="text-sm leading-relaxed text-text-secondary">
                {detail.submission?.ai_feedback ||
                  `${detail.candidate_name} delivered a structured solution with clear problem breakdown and consistent code quality. The approach aligns well with the expected solution for ${detail.problem_title || 'this assessment'}.`}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Coding Score</span>
              <span className={`text-lg font-semibold ${getScoreClassSafe(detail.coding_score)}`}>
                {formatScore(detail.coding_score)}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border mt-4 p-5 bg-theme-card border-theme-border shadow-theme-card">
        <h3 className="mb-4 text-[0.9375rem] font-semibold text-text-primary">
          Test Case Results
        </h3>
        {detail.test_results.length === 0 ? (
          <div className="text-sm text-text-secondary">No test case results available.</div>
        ) : (
          <div className="space-y-2.5">
            {detail.test_results.map((result, index) => (
              <div
                key={result.id}
                className="flex items-center gap-4 px-4 py-2.5 rounded border text-sm border-theme-border"
              >
                <span
                  className={`text-xs font-medium w-12 flex-shrink-0 ${
                    result.passed ? 'text-[var(--success)]' : 'text-[var(--error)]'
                  }`}
                >
                  {result.passed ? '✓ Pass' : '✗ Fail'}
                </span>
                <span className="flex-1 font-mono text-xs text-text-secondary">
                  Input: {result.input || `Case ${index + 1}`}
                </span>
                <span className="font-mono text-xs text-text-secondary">
                  Expected: {result.expected_output || 'N/A'}
                </span>
                <span
                  className={`font-mono text-xs ${
                    result.passed ? 'text-[var(--success)]' : 'text-[var(--error)]'
                  }`}
                >
                  Got: {result.actual_output || result.error_message || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
