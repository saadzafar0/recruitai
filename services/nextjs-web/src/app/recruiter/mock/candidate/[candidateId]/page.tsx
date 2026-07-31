'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import { StatusBadge } from '@/components/recruiter/StatusBadge'

interface ScoreCardProps {
  label: string
  score: number
}

function ScoreCard({ label, score }: ScoreCardProps) {
  const getScoreClass = (val: number) => {
    if (val >= 80) return 'text-accent-teal'
    if (val >= 65) return 'text-text-primary'
    return 'text-accent-red'
  }

  return (
    <div className="p-4 rounded-lg border bg-theme-card border-theme-border shadow-theme-card flex flex-col gap-1.5">
      <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">{label}</span>
      <div className="flex items-baseline justify-between">
        <span className={`text-2xl font-bold ${getScoreClass(score)}`}>{score}</span>
        <span className="text-xs text-text-secondary font-medium">/100</span>
      </div>
      <div className="h-1.5 w-full bg-theme-input rounded-full overflow-hidden mt-1">
        <div 
          className={`h-full rounded-full ${score >= 80 ? 'bg-accent-teal' : score >= 65 ? 'bg-accent-purple' : 'bg-accent-red'}`} 
          style={{ width: `${score}%` }} 
        />
      </div>
    </div>
  )
}

function CollapsibleSection({ title, score, summary }: { title: string; score: number; summary: string }) {
  const [open, setOpen] = useState(true)

  const getScoreClass = (val: number) => {
    if (val >= 80) return 'text-accent-teal'
    if (val >= 65) return 'text-text-primary'
    return 'text-accent-red'
  }

  return (
    <div className="border rounded-lg overflow-hidden border-theme-border shadow-theme-card bg-theme-card">
      <button
        className="w-full flex items-center justify-between px-5 py-4 transition-colors cursor-pointer hover:bg-white/[0.02] text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${getScoreClass(score)}`}>
            {score}/100
          </span>
          {open ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}
        </div>
      </button>
      {open && (
        <div className="px-5 py-5 border-t bg-theme-card/30 border-theme-border">
          <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">{summary}</p>
        </div>
      )}
    </div>
  )
}

export default function MockCandidateProfile() {
  const router = useRouter()
  const params = useParams<{ candidateId: string }>()
  const candidateId = params?.candidateId || 'adrian-sterling'

  // Mock candidates store
  const mockCandidates: Record<string, any> = {
    'elena-rostova': {
      name: 'Elena Rostova',
      initials: 'ER',
      role: 'Frontend Architect',
      status: 'advanced',
      percentile: '3.2',
      email: 'elena.rostova@designsystems.io',
      phone: '+44 7911 123456',
      appliedDate: 'June 14, 2026',
      skills: ['React', 'TypeScript', 'Next.js', 'Web Performance', 'Design Systems', 'CSS Grid', 'Tailwind', 'GraphQL', 'Webpack'],
      education: [
        { id: '1', degree: 'M.Sc. in Software Engineering', institution: 'University of Oxford', dates: '2018 - 2020' },
        { id: '2', degree: 'B.Sc. in Computer Science', institution: 'Saint Petersburg State University', dates: '2014 - 2018' }
      ],
      experience: [
        { id: '1', title: 'Lead Frontend Engineer', company: 'UI Core Systems Ltd', dates: '2022 - Present', desc: 'Led development of custom high-performance design library used by 12 internal business streams.' },
        { id: '2', title: 'Senior React Developer', company: 'Flow-State Technologies', dates: '2020 - 2022', desc: 'Optimized render cycles, improving Core Web Vitals (LCP) by 40% across SaaS products.' }
      ],
      scores: { cv: 88, coding: 95, voice: 90, overall: 91 },
      evaluations: {
        cv: 'Candidate demonstrates exceptional experience architecting enterprise UI frameworks. Strong educational background from Oxford and clear technical focus on TypeScript, compilation toolchains, and design systems token pipelines. Skills align perfectly with requirements.',
        coding: 'Outstanding performance. Completed a complex recursive AST parsing challenge in O(N) time complexity. Passed 14/14 validation cases. Code quality is exceptionally structured with clear types, unit-tested error boundaries, and optimal space complexity.',
        voice: 'Highly structured communicator. Addressed scalability, hydration mismatches, and web worker offloading with precision. Shows strong leadership potential, high collaborative resonance, and sub-500ms reactive dialog response.',
        design: 'Articulates micro-frontend orchestration, caching strategies (CDN edge rendering), and bundle splitting with complete system confidence. Addressed critical bottleneck tradeoffs accurately.'
      }
    },
    'adrian-sterling': {
      name: 'Adrian Sterling',
      initials: 'AS',
      role: 'Senior Systems Engineer',
      status: 'shortlisted',
      percentile: '5.8',
      email: 'adrian@sterling-systems.net',
      phone: '+1 (555) 019-2834',
      appliedDate: 'June 12, 2026',
      skills: ['Rust', 'Go', 'Kubernetes', 'Linux Kernels', 'Distributed Systems', 'Redis', 'Docker', 'gRPC', 'PostgreSQL'],
      education: [
        { id: '1', degree: 'B.Sc. in Computer Engineering', institution: 'Georgia Institute of Technology', dates: '2015 - 2019' }
      ],
      experience: [
        { id: '1', title: 'Senior Infrastructure Developer', company: 'Zenith Scale Corp', dates: '2021 - Present', desc: 'Designed high-throughput messaging bus in Rust, handling 50k+ websocket connections per node.' },
        { id: '2', title: 'Systems Engineer', company: 'Aether Cloud Solutions', dates: '2019 - 2021', desc: 'Maintained and scaled multi-tenant Kubernetes clusters. Re-architected Redis cluster configurations.' }
      ],
      scores: { cv: 85, coding: 92, voice: 78, overall: 85 },
      evaluations: {
        cv: 'Substantial distributed systems experience. Proficient in systems programming languages (Rust, Go) and infrastructure coordination. Professional resume layout with no gaps, demonstrating direct hands-on kernel-level tuning.',
        coding: 'Excellent coding output. Solved the concurrent thread-pool evaluation challenge using Go channels correctly. Fully thread-safe solution that passed 12/12 concurrency cases in record time.',
        voice: 'Clear, direct communicator. Discussed distributed consensus algorithms (Raft) and database replication limitations effectively. Addressed high-availability failovers with sound logic.',
        design: 'Strong architectural reasoning. Proposed an event-driven pub-sub queue utilizing Redis Streams and partitioned databases to handle spike traffic. Clean data-flow breakdown.'
      }
    },
    'marcus-vance': {
      name: 'Marcus Vance',
      initials: 'MV',
      role: 'DevOps Platform Engineer',
      status: 'under_review',
      percentile: '12.5',
      email: 'marcus.v@ops-foundry.com',
      phone: '+1 (555) 438-9901',
      appliedDate: 'June 15, 2026',
      skills: ['Terraform', 'AWS', 'Python', 'CI/CD Pipelines', 'Ansible', 'Bash scripting', 'Prometheus', 'Grafana', 'IAM Security'],
      education: [
        { id: '1', degree: 'B.Sc. in Network Security', institution: 'Purdue University', dates: '2016 - 2020' }
      ],
      experience: [
        { id: '1', title: 'DevOps Specialist', company: 'Helix Financial Software', dates: '2022 - Present', desc: 'Managed Gitlab CI/CD templates used by 200+ developers, decreasing build-to-deploy times by 35%.' },
        { id: '2', title: 'System Administrator', company: 'First National Bank', dates: '2020 - 2022', desc: 'Automated bare-metal server configurations using Ansible. Configured security and network firewalls.' }
      ],
      scores: { cv: 80, coding: 70, voice: 85, overall: 78 },
      evaluations: {
        cv: 'Solid cloud infrastructure and CI/CD foundation. Extensive automation skills with Terraform and Ansible. Strong focus on security compliance and network auditing.',
        coding: 'Solved the log-file parsing challenge using Python. Solution works correctly but uses nested loops that lead to O(N^2) complexity on large data files. Code is functional but could benefit from lookup map optimizations.',
        voice: 'Articulate and conversational speaker. Highly proficient in explaining deployment strategies (Blue-Green, Canary) and infrastructure-as-code state locking principles. Strong empathy and team alignment.',
        design: 'Good understanding of AWS global infrastructure, VPC peering, and secure IAM policies. Correctly designed a multi-region disaster recovery deployment.'
      }
    }
  }

  // Fallback to Adrian if not found
  const candidate = mockCandidates[candidateId] || mockCandidates['adrian-sterling']

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/recruiter/mock/candidates')}
        className="flex items-center gap-1.5 text-sm mb-5 text-text-secondary hover:text-accent-purple transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} />
        Back to Leaderboard
      </button>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar Left Column */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          {/* Identity Card */}
          <div className="rounded-lg p-6 border bg-theme-card border-theme-border shadow-theme-card">
            <div className="flex flex-col items-center mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold mb-3 bg-accent-purple">
                {candidate.initials}
              </div>
              <h2 className="text-center text-[1.0625rem] font-semibold text-text-primary">
                {candidate.name}
              </h2>
              <p className="text-sm mt-0.5 text-text-secondary">{candidate.role}</p>
              <div className="mt-2">
                <StatusBadge status={candidate.status} />
              </div>
              <div className="mt-4 w-full p-3 rounded-lg border border-accent-purple/20 bg-accent-purple/5 text-center">
                <p className="text-[0.625rem] font-bold text-text-secondary tracking-widest uppercase mb-1">
                  OVERALL STANDING
                </p>
                <p className="text-sm font-semibold text-accent-purple">
                  Top {candidate.percentile}% of Applicants
                </p>
              </div>
            </div>

            <div className="space-y-2.5 border-t border-theme-border pt-4">
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Mail size={13} className="text-text-secondary opacity-60" />
                <span className="truncate">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Phone size={13} className="text-text-secondary opacity-60" />
                <span>{candidate.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Calendar size={13} className="text-text-secondary opacity-60" />
                <span>Applied {candidate.appliedDate}</span>
              </div>
            </div>
          </div>

          {/* Skills Tags */}
          <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Skills from CV</h3>
            <div className="flex flex-wrap gap-1.5">
              {candidate.skills.map((skill: string) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded border border-theme-border text-text-secondary bg-theme-input"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Education</h3>
            <div className="space-y-3">
              {candidate.education.map((item: any, index: number) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0 bg-accent-purple" />
                    {index < candidate.education.length - 1 && (
                      <div className="w-px flex-1 mt-1 bg-theme-input" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-text-primary leading-snug">
                      {item.degree}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">{item.institution}</p>
                    <p className="text-xs text-text-secondary">{item.dates}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Experience</h3>
            <div className="space-y-4">
              {candidate.experience.map((item: any, index: number) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0 bg-accent-purple" />
                    {index < candidate.experience.length - 1 && (
                      <div className="w-px flex-1 mt-1 bg-theme-input" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-medium text-text-primary leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">{item.company}</p>
                    <p className="text-xs text-text-secondary">{item.dates}</p>
                    <p className="text-xs text-text-secondary/80 mt-1.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Details Area Right Column */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Scorecard Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ScoreCard label="CV Match" score={candidate.scores.cv} />
            <ScoreCard label="Coding" score={candidate.scores.coding} />
            <ScoreCard label="Voice Interview" score={candidate.scores.voice} />
            <ScoreCard label="Overall Score" score={candidate.scores.overall} />
          </div>

          {/* Detailed Sections */}
          <div className="space-y-4">
            <CollapsibleSection
              title="Resume Matching & Verification"
              score={candidate.scores.cv}
              summary={candidate.evaluations.cv}
            />
            <CollapsibleSection
              title="Coding Sandbox Assessment Report"
              score={candidate.scores.coding}
              summary={candidate.evaluations.coding}
            />
            <CollapsibleSection
              title="Voice Interview Dialogue Transcript Analytics"
              score={candidate.scores.voice}
              summary={candidate.evaluations.voice}
            />
            <CollapsibleSection
              title="Systems Design Architecture Rubric"
              score={candidate.scores.overall}
              summary={candidate.evaluations.design}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
