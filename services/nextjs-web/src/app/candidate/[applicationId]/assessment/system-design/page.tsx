'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Layout } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSystemDesignProblems } from '@/hooks/useSystemDesignProblems'

const PLACEHOLDER = `Start with a brief overview of your approach, then walk through:

1. Write path — how a long URL becomes a short one
2. Read path — how a short URL is resolved
3. Data model — what you store and how
4. Caching strategy — where and what you cache
5. Scalability — how you handle 100M requests/day
6. Trade-offs — what you're sacrificing and why`

export default function SystemDesignAssessmentPage() {
  const router = useRouter()
  const params = useParams<{ applicationId: string }>()
  const applicationId = params?.applicationId || ''
  const { user, loading: authLoading, session } = useAuth()
  const { activeProblem, loading, error } = useSystemDesignProblems(applicationId)

  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const wordCount = useMemo(() => (text.trim() ? text.trim().split(/\s+/).length : 0), [text])

  const handleSubmit = async () => {
    if (!text.trim() || !activeProblem?.id) return
    if (!session?.access_token) {
      setSubmitError('You must be signed in to submit.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/v1/candidate/system-design-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          applicationId,
          problemId: activeProblem.id,
          writtenResponse: text.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit response')
      }

      const queueResponse = await fetch('/api/v1/system-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          application_id: applicationId,
          assessment_id: data?.data?.assessmentId,
          response_id: data?.data?.responseId,
          question_id: activeProblem.id,
        }),
      })

      if (!queueResponse.ok) {
        const queueData = await queueResponse.json()
        console.warn('[System Design] Failed to enqueue evaluation job', queueData)
      }

      router.push(`/candidate/${applicationId}/assessment`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit response'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!authLoading && !user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-theme-bg transition-colors">
      <header className="border-b bg-theme-input border-theme-border transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push(`/candidate/${applicationId}/assessment`)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Assessment Lobby
          </button>

          <div className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded bg-accent-purple/10 text-accent-purple">
            <Layout size={14} />
            System Design
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="rounded-lg p-6 border bg-theme-card border-theme-border shadow-theme-card transition-colors">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-secondary">
            <Layout size={22} className="text-accent-purple" />
          </div>

          <h1 className="text-[1.375rem] font-semibold text-text-primary mb-2">System Design Assessment</h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-5">
            Capture your system design reasoning in a written response.
          </p>

          {loading && (
            <div className="rounded-lg border border-theme-border bg-theme-input p-4 text-sm text-text-secondary">
              Loading system design scenario...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error">
              {error}
            </div>
          )}

          {submitError && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error mb-5">
              {submitError}
            </div>
          )}


          {!loading && !error && activeProblem && (
            <div className="rounded-lg px-5 py-4 mb-6 border border-theme-border bg-secondary">
              <p className="text-xs font-semibold mb-1.5 text-accent-purple">SYSTEM DESIGN CHALLENGE</p>
              <h2 className="text-sm font-semibold text-text-primary mb-2">{activeProblem.title}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                {activeProblem.scenario}
              </p>
              {activeProblem.context && (
                <p className="text-xs text-text-secondary mt-3">
                  {activeProblem.context}
                </p>
              )}
            </div>
          )}

          <div>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={PLACEHOLDER}
              className="w-full h-[360px] rounded-lg p-5 text-sm border border-theme-border bg-theme-input text-text-primary outline-none resize-none leading-relaxed overflow-y-auto"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-text-secondary/70">
              {wordCount} words
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !text.trim() || !activeProblem?.id}
              className="px-6 py-2.5 text-sm text-white rounded disabled:opacity-60 cursor-pointer transition-colors bg-accent-purple hover:bg-accent-purple-hover"
            >
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
