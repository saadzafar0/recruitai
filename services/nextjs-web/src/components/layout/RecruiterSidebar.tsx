/**
 * RecruiterSidebar Component
 * Collapsible sidebar navigation for recruiter dashboard
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Mic,
  Code2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

interface NavItem {
  label: string
  icon: typeof LayoutDashboard
  href: string
  active?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/recruiter', active: true },
  { label: 'Organization', icon: Building2, href: '/recruiter/organization', active: true },
  { label: 'Job Postings', icon: Briefcase, href: '/recruiter/jobs', active: true },
  { label: 'Candidates', icon: Users, href: '/recruiter/candidates' },
  { label: 'Interviews', icon: Mic, href: '/recruiter/interviews' },
  { label: 'Assessments', icon: Code2, href: '/recruiter/assessments' },
  { label: 'Settings', icon: Settings, href: '/recruiter/settings' },
]

interface RecruiterSidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
}

export function RecruiterSidebar({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onClose,
}: RecruiterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const { user, signOut } = useAuth()
  const { showSuccess, showError } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
      showSuccess('Signed out successfully')
    } catch {
      showError('Could not complete server sign out, but your local session was cleared.')
    } finally {
      await router.replace('/login')
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const isActiveRoute = (href: string) => {
    if (href === '/recruiter') {
      return pathname === '/recruiter'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/60 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col h-full
          bg-theme-card border-r border-theme-border
          dark:bg-[#0B0D13]
          transform transition-all duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-16' : 'w-60'}
        `}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-theme-border flex items-center justify-between">
          <Link
            href="/recruiter"
            className="flex items-center gap-2 cursor-pointer"
            onClick={onClose}
          >
            <div className="w-8 h-8 rounded flex items-center justify-center bg-accent-purple flex-shrink-0">
              <span className="text-white text-xs font-semibold">R</span>
            </div>
            {!isCollapsed && (
              <span className="text-text-primary text-base font-semibold tracking-tight">
                RecruitAI
              </span>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded transition-colors cursor-pointer text-text-secondary hover:text-text-primary hover:bg-theme-card"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ label, icon: Icon, href, active }) => {
            const isActive = isActiveRoute(href)
            const isDisabled = !active

            return (
              <Link
                key={href}
                href={isDisabled ? '#' : href}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault()
                    return
                  }
                  onClose()
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all cursor-pointer
                  ${isCollapsed ? 'justify-center' : ''}
                  ${isActive
                    ? 'text-text-primary bg-accent-purple/15 border-l-2 border-accent-purple pl-2.5'
                    : isDisabled
                      ? 'text-text-secondary/50 cursor-not-allowed'
                      : 'text-text-secondary hover:text-text-primary hover:bg-accent-purple/10 hover:border-l-2 hover:border-accent-purple hover:pl-2.5'
                  }
                `}
                title={isCollapsed ? label : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User at bottom */}
        <div className="px-3 py-4 border-t border-theme-border">
          <div className={`flex items-center gap-3 px-3 py-2 ${isCollapsed ? 'justify-center' : ''}`}>
            {user && (
              <>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold bg-accent-purple cursor-pointer hover:ring-2 hover:ring-accent-purple-hover transition-all"
                  title="View profile"
                >
                  {getInitials(user.firstName, user.lastName)}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-text-secondary text-xs truncate">
                      {user.email}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`
                    text-text-secondary hover:text-accent-red transition-colors cursor-pointer
                    ${isCollapsed ? 'absolute bottom-4 left-1/2 -translate-x-1/2 mb-12' : ''}
                  `}
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

/**
 * Mobile sidebar toggle button
 */
export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded text-text-secondary hover:text-text-primary hover:bg-theme-card transition-colors cursor-pointer"
    >
      <LayoutDashboard size={20} />
    </button>
  )
}
