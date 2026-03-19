import { useRouter } from 'next/router'
import {
  Mic,
  Code2,
  FileText,
  ArrowRight,
  CheckCircle,
  Briefcase,
  Users,
  Award,
  Layers,
} from 'lucide-react'
import styles from './Homepage.module.css'

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

export default function Homepage() {
  const router = useRouter()

  const scrollToHowItWorks = () => {
    const section = document.getElementById('how-it-works')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className={styles.pageRoot}>
      <header className={styles.topNav}>
        <div className={styles.navContainer}>
          <div className={styles.brandWrap}>
            <div className={styles.brandBadge}>
              <span className={styles.brandBadgeText}>R</span>
            </div>
            <span className={styles.brandText}>RecruitAI</span>
          </div>

          <div className={styles.navActions}>
            {/* TODO: Add /login page route if not present in pages directory */}
            <button onClick={() => router.push('/login')} className={styles.loginButton}>
              Log In
            </button>
            {/* TODO: Add /signup page route if not present in pages directory */}
            <button onClick={() => router.push('/signup')} className={styles.signupButton}>
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.trustedBadge}>
            <CheckCircle size={13} />
            Trusted by 500+ companies worldwide
          </div>

          <h1 className={styles.heroTitle}>Hire Smarter with AI-Powered Recruitment</h1>

          <p className={styles.heroSubtitle}>
            Automate your entire hiring pipeline — from CV parsing to voice interviews
          </p>
          <p className={styles.heroDescription}>
            Score candidates objectively, reduce time-to-hire by 70%, and focus on people who matter most.
          </p>

          <div className={styles.heroButtons}>
            {/* TODO: Add /signup page route if not present in pages directory */}
            <button onClick={() => router.push('/signup')} className={styles.primaryButton}>
              Get Started
              <ArrowRight size={15} />
            </button>
            <button onClick={scrollToHowItWorks} className={styles.secondaryButton}>
              See How It Works
            </button>
          </div>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.sectionTitle}>Everything you need to hire better, faster</h2>
          <p className={styles.sectionSubtitle}>Three assessment pillars, one unified platform.</p>

          <div className={styles.featuresGrid}>
            {featureCards.map(({ icon: Icon, title, description, metrics }) => (
              <div key={title} className={styles.featureCard}>
                <div className={styles.featureIconWrap}>
                  <Icon size={18} color="#7C6AEF" />
                </div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDescription}>{description}</p>
                <ul className={styles.metricsList}>
                  {metrics.map((metric) => (
                    <li key={metric} className={styles.metricItem}>
                      <span className={styles.metricDot} />
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          {stats.map(({ value, label }) => (
            <div key={label}>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className={styles.howItWorksSection}>
        <div className={styles.howItWorksContainer}>
          <h2 className={styles.sectionTitle}>How RecruitAI Works</h2>
          <p className={styles.sectionSubtitle}>
            From job posting to ranked results — fully automated, end-to-end.
          </p>

          <div className={styles.stepsGrid}>
            <div className={styles.connectorLine} />
            {steps.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className={styles.stepCard}>
                <div className={styles.stepIconWrap}>
                  <Icon size={22} color="#7C6AEF" />
                  <div className={styles.stepBadge}>{step}</div>
                </div>
                <h3 className={styles.stepTitle}>{title}</h3>
                <p className={styles.stepDescription}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerText}>© 2026 RecruitAI, Inc. All rights reserved.</p>
      </footer>
    </div>
  )
}
