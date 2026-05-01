'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import {
  AuthCard,
  AuthLogo,
  AuthError,
  AuthInput,
  AuthButton,
} from '@/components/auth'
import { ThemeToggleMobile } from '@/components/ui/theme-toggle'

export default function Login() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { showSuccess, showError } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    setLoading(false)

    if (signInError) {
      setError(signInError)
      showError(signInError)
      return
    }

    showSuccess('Welcome back!')
    setTimeout(() => router.push('/user'), 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-theme-bg transition-colors relative">
      <div className="absolute top-4 right-4">
        <ThemeToggleMobile />
      </div>

      <div className="w-full max-w-md">
        <AuthCard>
          <AuthLogo />

          <h2 className="text-center text-xl font-semibold text-text-primary mb-1">
            Welcome back
          </h2>
          <p className="text-center text-sm text-text-secondary/70 mb-8">
            Sign in to your account
          </p>

          <AuthError message={error} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthInput
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              icon={Mail}
            />

            <AuthInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              icon={Lock}
            />

            <AuthButton loading={loading} loadingText="Signing in...">
              Log In
            </AuthButton>
          </form>

          <p className="text-center text-sm mt-6 text-text-secondary/70">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-accent-purple hover:underline">
              Sign Up
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
