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
    <div className="min-h-screen bg-[#0F1117] text-[#E2E4EB]">
      <header className="border-b border-white/10 bg-[#13151D]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#7C6AEF]">
              <span className="text-sm font-semibold text-white">R</span>
            </div>
            <span className="text-lg font-semibold text-[#E2E4EB]">RecruitAI</span>
          </div>

          <div className="flex items-center gap-3">
            {/* TODO: Add /login page route if not present in pages directory */}
            <Button variant="outline" onClick={() => router.push('/login')}>
              Log In
            </Button>
            {/* TODO: Add /signup page route if not present in pages directory */}
            <Button onClick={() => router.push('/signup')}>Sign Up</Button>
          </div>
        </div>
      </header>

      <section className="flex items-center justify-center px-4 py-12 sm:px-6 sm:py-20">
        <div className="max-w-3xl text-center">
          <Badge className="mb-6 inline-flex gap-2">
            <CheckCircle size={13} />
            Trusted by 500+ companies worldwide
          </Badge>

          <h1 className="mb-4 text-[clamp(1.5rem,5vw,2.5rem)] font-semibold leading-tight text-[#E2E4EB]">
            Hire Smarter with AI-Powered Recruitment
          </h1>
          <p className="mb-2 text-lg leading-relaxed text-[#7E8494]">
            Automate your entire hiring pipeline — from CV parsing to voice interviews
          </p>
          <p className="mb-10 text-base text-[#7E8494]/75">
            Score candidates objectively, reduce time-to-hire by 70%, and focus on people who matter most.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {/* TODO: Add /signup page route if not present in pages directory */}
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
          <h2 className="mb-2 text-center text-[1.375rem] font-semibold text-[#E2E4EB]">
            Everything you need to hire better, faster
          </h2>
          <p className="mb-10 text-center text-sm text-[#7E8494]">Three assessment pillars, one unified platform.</p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description, metrics }) => (
              <Card key={title} className="cursor-pointer border-t-[3px] border-t-[#7C6AEF] hover:border-[#7C6AEF]">
                <CardHeader>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-[#7C6AEF]/10">
                    <Icon size={18} className="text-[#7C6AEF]" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm leading-relaxed text-[#7E8494]">{description}</p>
                  <ul className="space-y-1.5">
                    {metrics.map((metric) => (
                      <li key={metric} className="flex items-center gap-2 text-sm text-[#7E8494]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3ECF8E]" />
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

      <section className="border-y border-white/10 bg-[#171921] py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 text-center sm:grid-cols-4 sm:px-6">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className="mb-1 text-[1.75rem] font-semibold text-[#7C6AEF]">{value}</p>
              <p className="text-sm text-[#7E8494]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#0F1117] px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-semibold text-[#E2E4EB]">How RecruitAI Works</h2>
          <p className="mb-12 text-center text-sm text-[#7E8494]">
            From job posting to ranked results — fully automated, end-to-end.
          </p>

          <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-[#7C6AEF]/30 lg:block" />

            {steps.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#7C6AEF] bg-[#171921] shadow-[0_2px_8px_rgba(124,106,239,0.15)]">
                  <Icon size={22} className="text-[#7C6AEF]" />
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#7C6AEF] text-xs font-bold text-white">
                    {step}
                  </div>
                </div>
                <h3 className="mb-2 text-[0.9375rem] font-semibold text-[#E2E4EB]">{title}</h3>
                <p className="text-sm leading-relaxed text-[#7E8494]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#0B0D13] py-6 text-center">
        <p className="text-sm text-gray-400">© 2026 RecruitAI, Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
