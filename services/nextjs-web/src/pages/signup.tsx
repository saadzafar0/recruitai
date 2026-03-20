import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Mail, Lock, User } from 'lucide-react'
import { useAuth, UserRole } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import {
  AuthCard,
  AuthLogo,
  AuthError,
  AuthInput,
  AuthSelect,
  AuthButton,
} from '@/components/auth'
import { ThemeToggleMobile } from '@/components/ui/theme-toggle'

const ROLE_OPTIONS = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'applicant', label: 'Candidate' },
]

export default function SignUp() {
  const router = useRouter()
  const { signUp } = useAuth()
  const { showSuccess, showError } = useToast()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    role: 'recruiter' as UserRole,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirm) {
      setError('Please fill in all fields.')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: signUpError } = await signUp(
      form.email,
      form.password,
      form.firstName,
      form.lastName,
      form.role
    )

    setLoading(false)

    if (signUpError) {
      setError(signUpError)
      showError(signUpError)
      return
    }

    showSuccess('Account created successfully!')
    setTimeout(() => router.push('/user'), 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-theme-bg transition-colors relative">
      {/* Theme toggle - positioned in top right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggleMobile />
      </div>

      <div className="w-full max-w-md">
        <AuthCard>
          <AuthLogo />

          <h2 className="text-center text-xl font-semibold text-text-primary mb-1">
            Create your account
          </h2>
          <p className="text-center text-sm text-text-secondary/70 mb-8">
            Join RecruitAI today
          </p>

          <AuthError message={error} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="First Name"
              type="text"
              value={form.firstName}
              onChange={(v) => updateField('firstName', v)}
              placeholder="Gojo"
              icon={User}
            />

            <AuthInput
              label="Last Name"
              type="text"
              value={form.lastName}
              onChange={(v) => updateField('lastName', v)}
              placeholder="Lipa"
              icon={User}
            />

            <AuthInput
              label="Email address"
              type="email"
              value={form.email}
              onChange={(v) => updateField('email', v)}
              placeholder="you@company.com"
              icon={Mail}
            />

            <AuthInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => updateField('password', v)}
              placeholder="••••••••"
              icon={Lock}
            />

            <AuthInput
              label="Confirm Password"
              type="password"
              value={form.confirm}
              onChange={(v) => updateField('confirm', v)}
              placeholder="••••••••"
              icon={Lock}
            />

            <AuthSelect
              label="I am a"
              value={form.role}
              onChange={(v) => updateField('role', v)}
              options={ROLE_OPTIONS}
            />

            <AuthButton loading={loading} loadingText="Creating Account...">
              Create Account
            </AuthButton>
          </form>

          <p className="text-center text-sm mt-6 text-text-secondary/70">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-accent-purple hover:underline">
              Log In
            </Link>
          </p>
        </AuthCard>

        <p className="text-center text-xs mt-4 text-text-secondary/60">
          <Link href="/" className="text-accent-purple hover:underline">
            &larr; Back to homepage
          </Link>
        </p>
      </div>
    </div>
  )
}
