'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Camera, CheckCircle, Code2, Globe, Layout, Mic, type LucideIcon } from 'lucide-react'

type UserTaskStatus = 'not_started' | 'in_progress' | 'completed'

export default function CandidateAssessmentSection() {
  const router = useRouter()
  const [micAvailable, setMicAvailable] = useState(true)

  const voiceStatus: UserTaskStatus = 'not_started'
  const codingStatus: UserTaskStatus = 'not_started'
  const designStatus: UserTaskStatus = 'not_started'

  return (
    <section className="space-y-8">
      <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[0.9375rem] font-semibold text-text-primary">System Check</h2>
          <button
            onClick={() => setMicAvailable((current) => !current)}
            className="text-xs underline cursor-pointer transition-colors text-text-secondary hover:text-accent-purple"
          >
            Toggle mic (demo)
          </button>
        </div>

        <div className="space-y-2">
          <HardwareStatus icon={Mic} label="Microphone" ok={micAvailable} />
          <HardwareStatus icon={Globe} label="Browser Compatibility" ok={true} />
          <HardwareStatus icon={Camera} label="Camera" ok={true} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AssessmentCard
          title="Voice Interview"
          icon={Mic}
          status={voiceStatus}
          disabled={!micAvailable}
          disabledReason="Microphone not detected"
          onClick={() => router.push('/interview/voice')}
        />
        <AssessmentCard
          title="Coding Test"
          icon={Code2}
          status={codingStatus}
          onClick={() => router.push('/interview/coding')}
        />
        <AssessmentCard
          title="System Design"
          icon={Layout}
          status={designStatus}
          onClick={() => router.push('/interview/design')}
        />
      </div>
    </section>
  )
}

function HardwareStatus({
  icon: Icon,
  label,
  ok,
}: {
  icon: LucideIcon
  label: string
  ok: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-theme-border bg-theme-input transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded flex items-center justify-center bg-theme-elevated">
          <Icon size={18} className="text-accent-purple" />
        </div>
        <span className="text-sm text-text-primary">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle size={16} className="text-accent-green" />
        ) : (
          <AlertCircle size={16} className="text-accent-red" />
        )}
        <span className={`text-xs ${ok ? 'text-accent-green' : 'text-accent-red'}`}>
          {ok ? 'OK' : 'Not available'}
        </span>
      </div>
    </div>
  )
}

function AssessmentCard({
  title,
  icon: Icon,
  status,
  disabled,
  disabledReason,
  onClick,
}: {
  title: string
  icon: LucideIcon
  status: UserTaskStatus
  disabled?: boolean
  disabledReason?: string
  onClick: () => void
}) {
  const config = {
    not_started: {
      badge: 'Not started',
      badgeClass: 'bg-theme-input text-text-secondary',
      buttonClass: 'bg-accent-purple text-white hover:bg-accent-purple-hover',
      buttonLabel: 'Begin',
    },
    in_progress: {
      badge: 'In progress',
      badgeClass: 'bg-accent-yellow/10 text-accent-yellow',
      buttonClass: 'bg-accent-purple text-white hover:bg-accent-purple-hover',
      buttonLabel: 'Continue',
    },
    completed: {
      badge: 'Completed',
      badgeClass: 'bg-accent-green/10 text-accent-green',
      buttonClass: 'bg-theme-input text-text-secondary border border-theme-border',
      buttonLabel: 'View',
    },
  }[status]

  return (
    <div className="rounded-lg border bg-theme-card border-theme-border shadow-theme-card transition-colors p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
          <span className={`inline-flex text-xs px-2 py-0.5 rounded ${config.badgeClass}`}>
            {disabled ? disabledReason || 'Disabled' : config.badge}
          </span>
        </div>
        <div className="w-10 h-10 rounded flex items-center justify-center bg-theme-elevated">
          <Icon size={18} className="text-accent-purple" />
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`w-full py-2.5 text-sm font-medium rounded transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${config.buttonClass}`}
      >
        {config.buttonLabel}
      </button>
    </div>
  )
}
