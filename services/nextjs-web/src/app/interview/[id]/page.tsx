'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Code2, Layout, Mic } from 'lucide-react'
import MockInterviewPage from '../../candidate/mock-interview/page'

type InterviewKind = 'voice' | 'coding' | 'design' | 'unknown'

function resolveInterviewKind(id: unknown): InterviewKind {
  const raw = Array.isArray(id) ? id[0] : id
  const normalized = typeof raw === 'string' ? raw.toLowerCase() : ''

  if (normalized === 'voice') return 'voice'
  if (normalized === 'coding') return 'coding'
  if (normalized === 'design') return 'design'
  return 'unknown'
}

export default function UserInterviewPage() {
  const router = useRouter()
  const params = useParams<{ id?: string | string[] }>()

  const interviewKind = useMemo(() => resolveInterviewKind(params?.id), [params])

  if (interviewKind === 'voice') {
    return <MockInterviewPage />
  }

  const isCoding = interviewKind === 'coding'
  const title = isCoding ? 'Coding Test Placeholder' : 'System Design Placeholder'
  const description = isCoding
    ? 'This round stays as a placeholder for now, matching the prototype flow before the full IDE is integrated.'
    : 'This round stays as a placeholder for now, matching the prototype flow before the design workspace is integrated.'
  const bullets = isCoding
    ? [
        'Problem statement and constraints panel',
        'Code editor and run-results area',
        'Submission and evaluation summary',
      ]
    : [
        'Architecture scenario callout',
        'Written response area',
        'Diagram tab and final submission step',
      ]

  const Icon = isCoding ? Code2 : Layout

  return (
    <div className="min-h-screen bg-theme-bg transition-colors">
      <header className="border-b bg-theme-input border-theme-border transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push('/user')}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1 rounded bg-accent-purple/10 text-accent-purple">
            {isCoding ? <Code2 size={14} /> : <Layout size={14} />}
            {isCoding ? 'Coding Test' : 'System Design'}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="rounded-lg p-6 border bg-theme-card border-theme-border shadow-theme-card transition-colors">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-secondary">
            <Icon size={22} className="text-accent-purple" />
          </div>

          <h1 className="text-[1.375rem] font-semibold text-text-primary mb-2">{title}</h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-5">{description}</p>

          <div className="rounded-lg border border-theme-border bg-theme-input p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-text-secondary mb-3">Planned Sections</p>
            <ul className="space-y-2">
              {bullets.map((item) => (
                <li key={item} className="text-sm text-text-secondary flex items-start gap-2">
                  <Mic size={12} className="text-accent-purple mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
