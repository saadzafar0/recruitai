'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'

// Map frontend role names to database enum values
export type UserRole = 'recruiter' | 'applicant'

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  avatarUrl?: string
  organizationId?: string
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from profiles table
  const fetchProfile = async (supabaseUser: SupabaseUser): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, avatar_url, organization_id')
      .eq('id', supabaseUser.id)
      .single()

    if (error || !data) {
      console.error('Error fetching profile:', error)
      return null
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role as UserRole,
      avatarUrl: data.avatar_url,
      organizationId: data.organization_id,
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)

        if (initialSession?.user) {
          const profile = await fetchProfile(initialSession.user)
          setUser(profile)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)

        if (event === 'SIGNED_IN' && newSession?.user) {
          const profile = await fetchProfile(newSession.user)
          setUser(profile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Helper to map Supabase error codes to user-friendly messages
  const getAuthErrorMessage = (error: { message: string; code?: string }): string => {
    const code = error.code || ''
    const message = error.message.toLowerCase()

    if (code === 'over_email_send_rate_limit' || message.includes('rate limit')) {
      return 'Too many attempts. Please wait a few minutes before trying again.'
    }
    if (code === 'user_already_exists' || message.includes('already registered')) {
      return 'This email is already registered. Try logging in instead.'
    }
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address.'
    }
    if (message.includes('password')) {
      return 'Password must be at least 6 characters.'
    }
    return error.message
  }

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole
  ): Promise<{ error: string | null }> => {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { error: getAuthErrorMessage(authError as any) }
      }

      if (!authData.user) {
        return { error: 'Failed to create user account' }
      }

      // Check if user already exists (Supabase returns user with identities: [] for existing users)
      if (authData.user.identities && authData.user.identities.length === 0) {
        return { error: 'This email is already registered. Try logging in instead.' }
      }

      // 2. Create profile in profiles table
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
      })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Check if it's a duplicate key error (profile already exists)
        if (profileError.code === '23505') {
          return { error: 'This email is already registered. Try logging in instead.' }
        }
        return { error: 'Failed to create user profile. Please try again.' }
      }

      // 3. Set the user profile
      setUser({
        id: authData.user.id,
        email,
        firstName,
        lastName,
        role,
      })

      return { error: null }
    } catch (error) {
      console.error('Signup error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = getAuthErrorMessage(error as any)
        // Handle invalid credentials
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return { error: 'Invalid email or password.' }
        }
        return { error: errorMessage }
      }

      if (data.user) {
        const profile = await fetchProfile(data.user)
        if (!profile) {
          return { error: 'User profile not found. Please contact support.' }
        }
        setUser(profile)
      }

      return { error: null }
    } catch (error) {
      console.error('Signin error:', error)
      return { error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    let signOutError: Error | null = null

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        signOutError = new Error(error.message)
      }
    } catch (error) {
      signOutError = error instanceof Error ? error : new Error('Sign out failed')
    } finally {
      setUser(null)
      setSession(null)
    }

    if (signOutError) {
      throw signOutError
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
 