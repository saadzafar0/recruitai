'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react'
import { useRecruiterCandidate } from '@/hooks/useRecruiterCandidate'
import { getScoreClass } from '@/lib/scoreUtils'
import { StatusBadge } from '@/components/recruiter/StatusBadge'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'

interface ScoreBarProps {
  label: string
  value: number | null
}

function formatDate(value: string | null | undefined): string {
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

function ScoreBar({ label, value }: ScoreBarProps) {
  const displayValue = formatScore(value)
  const numericValue = value ?? 0

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className={`text-sm font-semibold ${getScoreClass(value ?? 0)}`}>
          {displayValue}/100
        </span>
      </div>
      <div className="h-2 rounded-full bg-theme-input">
        <div
          className="h-full rounded-full bg-accent-purple"
          style={{ width: `${Math.max(0, Math.min(100, numericValue))}%` }}
        />
      </div>
    </div>
  )
}

function CollapsibleSection({
  title,
  score,
  summary,
}: {
  title: string
  score: number | null
  summary: string
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border rounded-lg overflow-hidden border-theme-border">
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors cursor-pointer bg-theme-card hover:bg-white/[0.03]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm font-medium text-text-primary">{title}</span>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${getScoreClass(score ?? 0)}`}>
            {formatScore(score)}/100
          </span>
          {open ? <ChevronUp size={14} className="text-text-secondary" /> : <ChevronDown size={14} className="text-text-secondary" />}
        </div>
      </button>
      {open && (
        <div className="px-5 py-4 border-t bg-theme-card border-theme-border">
          <p className="text-sm leading-relaxed text-text-secondary">{summary}</p>
        </div>
      )}
    </div>
  )
}

export default function CandidateProfile() {
  const router = useRouter()
  const params = useParams<{ candidateId: string }>()
  const candidateId = params?.candidateId || ''
  const { candidate, loading, error } = useRecruiterCandidate(candidateId)

  const [candidateStatus, setCandidateStatus] = useState('under_review')
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    if (candidate?.application?.status) {
      setCandidateStatus(candidate.application.status)
    }
  }, [candidate?.application?.status])

  const profile = candidate?.profile
  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : 'Candidate'
  const initials = profile ? `${profile.first_name[0] || ''}${profile.last_name[0] || ''}`.toUpperCase() : 'CA'
  const jobTitle = candidate?.application?.job?.title || 'Role not available'
  const organizationName = candidate?.application?.job?.organization?.name || 'Organization'

  const skillTags = useMemo(() => {
    if (candidate?.skills?.length) {
      return candidate.skills.map((skill) => skill.skill_name)
    }

    if (candidate?.candidateProfile?.skills_raw?.length) {
      return candidate.candidateProfile.skills_raw
    }

    return []
  }, [candidate?.candidateProfile?.skills_raw, candidate?.skills])

  const educationRows = candidate?.education || []
  const experienceRows = candidate?.experience || []

  const scoreCards = [
    { label: 'CV Match', score: candidate?.application?.cv_score ?? null },
    { label: 'Coding', score: candidate?.application?.coding_score ?? null },
    { label: 'Communication', score: candidate?.application?.voice_score ?? null },
    { label: 'Overall', score: candidate?.application?.composite_score ?? null },
  ]

  const handleAdvanceConfirm = () => {
    setCandidateStatus('advanced')
    setShowAdvanceModal(false)
  }

  const handleRejectConfirm = () => {
    setCandidateStatus('rejected')
    setShowRejectModal(false)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl">
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          Loading candidate profile...
        </div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl">
        <div className="rounded-lg border bg-theme-card border-theme-border p-6 text-sm text-text-secondary">
          {error || 'Candidate profile not found.'}
        </div>
      </div>
    )
  }

  return (
    <>
      <ConfirmationModal
        isOpen={showAdvanceModal}
        action="advance"
        entity={fullName}
        title={`Move ${fullName} to the next round?`}
        message={`You are about to advance ${fullName} to the next stage of the recruitment process.`}
        confirmLabel="Confirm"
        destructive={false}
        onConfirm={handleAdvanceConfirm}
        onClose={() => setShowAdvanceModal(false)}
      />

      <ConfirmationModal
        isOpen={showRejectModal}
        action="reject"
        entity={fullName}
        title={`Reject ${fullName}?`}
        message={`Are you sure you want to reject ${fullName}? This action cannot be undone.`}
        confirmLabel="Yes, Reject"
        onConfirm={handleRejectConfirm}
        onClose={() => setShowRejectModal(false)}
      />

      <div className="p-4 sm:p-6 max-w-6xl">
        <button
          onClick={() => router.push('/recruiter/candidate')}
          className="flex items-center gap-1.5 text-sm mb-5 text-text-secondary hover:text-accent-purple transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to Leaderboard
        </button>

        <div className="flex flex-col lg:flex-row gap-5">
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="rounded-lg p-6 border bg-theme-card border-theme-border shadow-theme-card">
              <div className="flex flex-col items-center mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold mb-3 bg-accent-purple">
                  {initials}
                </div>
                <h2 className="text-center text-[1.0625rem] font-semibold text-text-primary">
                  {fullName}
                </h2>
                <p className="text-sm mt-0.5 text-text-secondary">{jobTitle}</p>
                <div className="mt-2">
                  <StatusBadge status={candidateStatus} />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Mail size={13} className="text-text-secondary opacity-60" />
                  {profile?.email}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Phone size={13} className="text-text-secondary opacity-60" />
                  {profile?.phone || 'No phone listed'}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Calendar size={13} className="text-text-secondary opacity-60" />
                  Applied {formatDate(candidate?.application?.created_at)}
                </div>
              </div>
            </div>

            <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
              <h3 className="mb-3 text-sm font-semibold text-text-primary">Skills from CV</h3>
              {skillTags.length === 0 ? (
                <p className="text-xs text-text-secondary">No skills listed yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skillTags.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2.5 py-1 rounded border border-theme-border text-text-secondary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
              <h3 className="mb-3 text-sm font-semibold text-text-primary">Education</h3>
              {educationRows.length === 0 ? (
                <p className="text-xs text-text-secondary">No education history available.</p>
              ) : (
                <div className="space-y-3">
                  {educationRows.map((item, index) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0 bg-accent-purple" />
                        {index < educationRows.length - 1 && (
                          <div className="w-px flex-1 mt-1 bg-theme-input" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-text-primary">
                          {item.degree || 'Degree'} {item.field_of_study ? `in ${item.field_of_study}` : ''}
                        </p>
                        <p className="text-xs text-text-secondary">{item.institution}</p>
                        <p className="text-xs text-text-secondary">
                          {formatDate(item.start_date)} - {item.is_current ? 'Present' : formatDate(item.end_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
              <h3 className="mb-3 text-sm font-semibold text-text-primary">Experience</h3>
              {experienceRows.length === 0 ? (
                <p className="text-xs text-text-secondary">No experience history available.</p>
              ) : (
                <div className="space-y-4">
                  {experienceRows.map((item, index) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0 bg-accent-purple" />
                        {index < experienceRows.length - 1 && (
                          <div className="w-px flex-1 mt-1 bg-theme-input" />
                        )}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-secondary">{item.company}</p>
                        <p className="text-xs text-text-secondary">
                          {formatDate(item.start_date)} - {item.is_current ? 'Present' : formatDate(item.end_date)}
                        </p>
                        {item.description && (
                          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="rounded-lg p-6 border bg-theme-card border-theme-border shadow-theme-card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[0.9375rem] font-semibold text-text-primary">Assessment Scores</h3>
                  <p className="text-xs text-text-secondary">{organizationName}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-theme-input text-text-secondary">{jobTitle}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {scoreCards.map((item) => (
                  <div key={item.label} className="border rounded-lg p-4 text-center border-theme-border">
                    <p className={`mb-1 text-[1.625rem] font-semibold ${getScoreClass(item.score ?? 0)}`}>
                      {formatScore(item.score)}
                    </p>
                    <p className="text-xs text-text-secondary">{item.label}</p>
                  </div>
                ))}
              </div>

              <ScoreBar label="CV Match Score" value={candidate?.application?.cv_score ?? null} />
              <ScoreBar label="Coding Assessment" value={candidate?.application?.coding_score ?? null} />
              <ScoreBar label="Communication Score" value={candidate?.application?.voice_score ?? null} />
            </div>

            <CollapsibleSection
              title="Interview Summary"
              score={candidate?.application?.voice_score ?? null}
              summary={`${fullName} demonstrated clear communication for the role. The transcript shows thoughtful answers with strong articulation of technical concepts.`}
            />
            <CollapsibleSection
              title="Coding Assessment Summary"
              score={candidate?.application?.coding_score ?? null}
              summary={`Coding performance indicates an ability to solve algorithmic challenges with structured logic. The solutions were readable with acceptable complexity for ${jobTitle}.`}
            />
            <CollapsibleSection
              title="System Design Summary"
              score={candidate?.application?.system_design_score ?? null}
              summary={`System design response covered foundational architecture decisions with emphasis on scalability. Further depth on failure scenarios could elevate the design review.`}
            />

            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => router.push(`/recruiter/candidate/${candidateId}/interview`)}
                className="px-5 py-2.5 text-sm text-white rounded transition-colors cursor-pointer bg-accent-purple hover:bg-accent-purple-hover"
              >
                View Interview
              </button>
              <button
                onClick={() => router.push(`/recruiter/candidate/${candidateId}/assessment`)}
                className="px-5 py-2.5 text-sm rounded border transition-colors cursor-pointer border-accent-purple text-accent-purple hover:bg-theme-input"
              >
                View Assessment
              </button>
              <button
                onClick={() => router.push(`/recruiter/candidate/${candidateId}/system-design`)}
                className="px-5 py-2.5 text-sm rounded border transition-colors cursor-pointer border-accent-purple text-accent-purple hover:bg-theme-input"
              >
                System Design
              </button>
              <button
                onClick={() => router.push(`/recruiter/candidate/${candidateId}/cv`)}
                className="px-5 py-2.5 text-sm rounded border transition-colors cursor-pointer border-theme-border text-text-secondary bg-theme-input hover:border-accent-purple hover:text-accent-purple"
              >
                View CV
              </button>
              <div className="flex-1" />
              {candidateStatus !== 'advanced' && candidateStatus !== 'rejected' && (
                <>
                  <button
                    onClick={() => setShowAdvanceModal(true)}
                    className="px-5 py-2.5 text-sm text-white rounded transition-colors cursor-pointer bg-[var(--success)] hover:opacity-90"
                  >
                    Proceed to Next Round
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-5 py-2.5 text-sm rounded border transition-colors cursor-pointer border-[var(--error)] text-[var(--error)] hover:bg-[var(--error-bg)]"
                  >
                    Reject
                  </button>
                </>
              )}
              {candidateStatus === 'advanced' && (
                <span className="px-4 py-2.5 text-sm rounded bg-[var(--success-bg)] text-[var(--success)]">
                  ✓ Advanced to Next Round
                </span>
              )}
              {candidateStatus === 'rejected' && (
                <span className="px-4 py-2.5 text-sm rounded bg-[var(--error-bg)] text-[var(--error)]">
                  ✗ Rejected
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
