import { useTheme } from '@/context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center justify-center w-10 h-10 rounded-lg
        bg-theme-card border border-theme-border
        hover:border-theme-border-hover hover:bg-theme-elevated
        transition-all duration-300 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple
        ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon */}
      <Sun
        size={18}
        className={`absolute transition-all duration-300 ease-in-out text-amber-500
          ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
      />
      {/* Moon icon */}
      <Moon
        size={18}
        className={`absolute transition-all duration-300 ease-in-out text-accent-purple
          ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
      />
    </button>
  )
}

export function ThemeToggleMobile({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center justify-center w-9 h-9 rounded-md
        bg-theme-card border border-theme-border
        hover:border-theme-border-hover hover:bg-theme-elevated
        active:scale-95
        transition-all duration-300 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple
        ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon */}
      <Sun
        size={16}
        className={`absolute transition-all duration-300 ease-in-out text-amber-500
          ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
      />
      {/* Moon icon */}
      <Moon
        size={16}
        className={`absolute transition-all duration-300 ease-in-out text-accent-purple
          ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
      />
    </button>
  )
}

// Animated pill-style toggle for more prominent placement
export function ThemeTogglePill({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center gap-1 h-9 px-3 rounded-full
        bg-theme-card border border-theme-border
        hover:border-theme-border-hover hover:bg-theme-elevated
        transition-all duration-300 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple
        ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative w-4 h-4">
        <Sun
          size={16}
          className={`absolute inset-0 transition-all duration-300 ease-in-out text-amber-500
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
        />
        <Moon
          size={16}
          className={`absolute inset-0 transition-all duration-300 ease-in-out text-accent-purple
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`}
        />
      </div>
      <span className="text-xs font-medium text-theme-text-secondary">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  )
}
