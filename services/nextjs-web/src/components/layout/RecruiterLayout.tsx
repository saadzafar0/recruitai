/**
 * RecruiterLayout Component
 * Layout wrapper for all recruiter pages with sidebar and header
 */

import { useState, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { RecruiterSidebar } from './RecruiterSidebar'
import { ThemeToggle, ThemeToggleMobile } from '@/components/ui/theme-toggle'

interface RecruiterLayoutProps {
  children: ReactNode
  title?: string
}

export function RecruiterLayout({ children, title }: RecruiterLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Redirect if not logged in or not a recruiter
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role !== 'recruiter') {
      router.push('/user')
    }
  }, [loading, user, router])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recruiter-sidebar-collapsed')
    if (saved === 'true') {
      setSidebarCollapsed(true)
    }
  }, [])

  const handleToggleCollapse = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('recruiter-sidebar-collapsed', String(newState))
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  // Guard clause
  if (!user || user.role !== 'recruiter') return null

  const getInitials = () => {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-theme-bg transition-colors">
      {/* Sidebar */}
      <RecruiterSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-theme-border bg-theme-input transition-colors flex-shrink-0">
          {/* Left side - mobile menu + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            {title && (
              <h1 className="text-base sm:text-lg font-semibold text-text-primary">
                {title}
              </h1>
            )}
          </div>

          {/* Right side - theme toggle, notifications, user */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle - mobile */}
            <ThemeToggleMobile className="sm:hidden" />
            {/* Theme toggle - desktop */}
            <ThemeToggle className="hidden sm:flex" />

            <button
              className="p-2 rounded text-text-secondary hover:text-accent-purple transition-colors cursor-pointer"
            >
              <Bell size={18} />
            </button>

            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-accent-purple cursor-pointer hover:ring-2 hover:ring-accent-purple-hover transition-all"
              title="View profile"
            >
              {getInitials()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
