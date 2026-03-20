/**
 * JobStatusBadge Component
 * Status badge with optional inline editing
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { JobStatus } from '@/types/job'

interface JobStatusBadgeProps {
  status: JobStatus
  editable?: boolean
  onChange?: (status: JobStatus) => void
}

const statusConfig: Record<JobStatus, { label: string; color: string; bg: string }> = {
  draft: {
    label: 'Draft',
    color: 'text-text-secondary',
    bg: 'bg-theme-elevated',
  },
  published: {
    label: 'Published',
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
  },
  paused: {
    label: 'Paused',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  closed: {
    label: 'Closed',
    color: 'text-accent-red',
    bg: 'bg-accent-red/10',
  },
}

const allStatuses: JobStatus[] = ['draft', 'published', 'paused', 'closed']

export function JobStatusBadge({ status, editable, onChange }: JobStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const config = statusConfig[status]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (newStatus: JobStatus) => {
    if (onChange && newStatus !== status) {
      onChange(newStatus)
    }
    setIsOpen(false)
  }

  if (!editable) {
    return (
      <span
        className={`
          inline-flex items-center px-2.5 py-1 rounded text-xs font-medium
          border border-theme-border
          ${config.color} ${config.bg}
        `}
      >
        {config.label}
      </span>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`
          inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium
          border border-theme-border cursor-pointer
          hover:border-accent-purple/50 transition-colors
          ${config.color} ${config.bg}
        `}
      >
        {config.label}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 left-0 min-w-[120px] py-1 rounded-lg border
            bg-theme-card border-theme-border shadow-theme-elevated"
        >
          {allStatuses.map((s) => {
            const cfg = statusConfig[s]
            const isSelected = s === status

            return (
              <button
                key={s}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelect(s)
                }}
                className={`
                  w-full flex items-center justify-between gap-2 px-3 py-2 text-xs
                  hover:bg-theme-elevated transition-colors cursor-pointer
                  ${cfg.color}
                `}
              >
                <span>{cfg.label}</span>
                {isSelected && <Check size={12} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
