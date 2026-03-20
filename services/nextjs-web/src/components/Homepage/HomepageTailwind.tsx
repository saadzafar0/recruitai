import { useRouter } from 'next/router'
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle,
  Code2,
  FileText,
  Layers,
  Mic,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle, ThemeToggleMobile } from '@/components/ui/theme-toggle'

const featureCards = [
  {
    icon: Mic,
    title: 'AI Voice Interviews',
    description:
      'Conduct structured voice interviews with AI scoring on communication clarity, confidence, and relevance. Full transcripts with per-line insights.',
    metrics: ['7-question structured format', 'Real-time transcription', 'Communication scoring'],
  },
  {
    icon: Code2,
    title: 'Coding Assessments',
    description:
      'Evaluate technical skills with live coding challenges. AI reviews correctness, efficiency, and coding standards — no manual grading needed.',
    metrics: ['50+ problem library', 'Multi-language support', 'Automated evaluation'],
  },
  {
    icon: FileText,
    title: 'Intelligent CV Parsing',
    description:
      'Automatically extract skills, experience, and education from CVs. Score candidates against job requirements with configurable keyword weights.',
    metrics: ['95% extraction accuracy', 'Custom keyword rules', 'Instant ranking'],
  },
]

const stats = [
  { value: '70%', label: 'Reduction in time-to-hire' },
  { value: '500+', label: 'Companies using RecruitAI' },
  { value: '98%', label: 'Candidate satisfaction rate' },
  { value: '2M+', label: 'Assessments completed' },
]

const steps = [
  {
    icon: Briefcase,
    step: 1,
    title: 'Post a Job',
    desc: 'Recruiter creates a job posting and sets assessment weights for CV, coding, and voice scores.',
  },
  {
    icon: Users,
    step: 2,
    title: 'Candidates Apply & Assess',
    desc: 'Applicants complete the voice interview, coding test, and system design challenge on their own time.',
  },
  {
    icon: Layers,
    step: 3,
    title: 'AI Evaluates',
    desc: 'RecruitAI automatically scores CVs, code quality, and communication — no manual grading needed.',
  },
  {
    icon: Award,
    step: 4,
    title: 'Ranked Results',
    desc: 'Recruiters receive a ranked leaderboard and review detailed candidate profiles with full insights.',
  },
]

export default function HomepageTailwind() {
  const router = useRouter()

  const scrollToHowItWorks = () => {
    const section = document.getElementById('how-it-works')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors">
      <header className="border-b border-theme-border bg-theme-input transition-colors">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent-purple">
              <span className="text-sm font-semibold text-white">R</span>
            </div>
            <span className="text-lg font-semibold text-theme-text">RecruitAI</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle - mobile version (visible on small screens) */}
            <ThemeToggleMobile className="sm:hidden" />
            {/* Theme toggle - desktop version (hidden on small screens) */}
            <ThemeToggle className="hidden sm:flex" />
            <Button variant="outline" onClick={() => router.push('/login')}>
              Log In
            </Button>
            <Button onClick={() => router.push('/signup')} className="hidden sm:inline-flex">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
        <div className="max-w-3xl text-center">
          <Badge className="mb-6 inline-flex gap-2">
            <CheckCircle size={13} />
            Trusted by 500+ companies worldwide
          </Badge>

          <h1 className="mb-4 text-[clamp(1.5rem,5vw,2.5rem)] font-semibold leading-tight text-theme-text">
            Hire Smarter with AI-Powered Recruitment
          </h1>
          <p className="mb-2 text-lg leading-relaxed text-theme-text-secondary">
            Automate your entire hiring pipeline — from CV parsing to voice interviews
          </p>
          <p className="mb-10 text-base text-theme-text-secondary/75">
            Score candidates objectively, reduce time-to-hire by 70%, and focus on people who matter most.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button size="lg" onClick={() => router.push('/signup')}>
              Get Started
              <ArrowRight size={15} />
            </Button>
            <Button size="lg" variant="subtle" onClick={scrollToHowItWorks}>
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-[1.375rem] font-semibold text-theme-text">
            Everything you need to hire better, faster
          </h2>
          <p className="mb-10 text-center text-sm text-theme-text-secondary">Three assessment pillars, one unified platform.</p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description, metrics }) => (
              <Card key={title} className="cursor-pointer border-t-[3px] border-t-accent-purple hover:border-accent-purple">
                <CardHeader>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-accent-purple/10">
                    <Icon size={18} className="text-accent-purple" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm leading-relaxed text-theme-text-secondary">{description}</p>
                  <ul className="space-y-1.5">
                    {metrics.map((metric) => (
                      <li key={metric} className="flex items-center gap-2 text-sm text-theme-text-secondary">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                        {metric}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-theme-border bg-theme-card py-10 transition-colors">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 text-center sm:grid-cols-4 sm:px-6">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="mb-1 text-[1.75rem] font-semibold text-accent-purple">{value}</p>
              <p className="text-sm text-theme-text-secondary">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-theme-bg px-4 py-12 sm:px-6 sm:py-20 transition-colors">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-semibold text-theme-text">How RecruitAI Works</h2>
          <p className="mb-12 text-center text-sm text-theme-text-secondary">
            From job posting to ranked results — fully automated, end-to-end.
          </p>

          <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-accent-purple/30 lg:block" />

            {steps.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-purple bg-theme-card shadow-[0_2px_8px_rgba(124,106,239,0.15)] transition-colors">
                  <Icon size={22} className="text-accent-purple" />
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent-purple text-xs font-bold text-white">
                    {step}
                  </div>
                </div>
                <h3 className="mb-2 text-[0.9375rem] font-semibold text-theme-text">{title}</h3>
                <p className="text-sm leading-relaxed text-theme-text-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-theme-elevated py-6 text-center transition-colors border-t border-theme-border">
        <p className="text-sm text-theme-text-secondary">&copy; 2026 RecruitAI, Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
