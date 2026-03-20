/**
 * JobsFilters Component
 * Filter controls for the job postings table
 */

import { Search, Filter, X } from 'lucide-react'
import type { JobStatus, EmploymentType, WorkMode } from '@/types/job'

export interface JobsFiltersState {
  search: string
  status: JobStatus | ''
  employment_type: EmploymentType | ''
  work_mode: WorkMode | ''
}

interface JobsFiltersProps {
  filters: JobsFiltersState
  onChange: (filters: JobsFiltersState) => void
  onClear: () => void
}

const statusOptions: { value: JobStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
]

const employmentOptions: { value: EmploymentType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const workModeOptions: { value: WorkMode | ''; label: string }[] = [
  { value: '', label: 'All Modes' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

export function JobsFilters({ filters, onChange, onClear }: JobsFiltersProps) {
  const hasActiveFilters = filters.status || filters.employment_type || filters.work_mode

  const updateFilter = <K extends keyof JobsFiltersState>(
    key: K,
    value: JobsFiltersState[K]
  ) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search by job title..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border outline-none
            bg-theme-input text-text-primary border-theme-border-input
            focus:border-accent-purple focus:bg-theme-card
            placeholder:text-text-secondary/50
            transition-colors"
        />
      </div>

      {/* Filter dropdowns - responsive grid */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-text-secondary">
          <Filter size={14} />
          <span className="text-xs font-medium">Filters:</span>
        </div>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value as JobStatus | '')}
          className="px-3 py-2 text-sm rounded-lg border outline-none appearance-none cursor-pointer
            bg-theme-input text-text-primary border-theme-border-input
            focus:border-accent-purple focus:bg-theme-card
            transition-colors min-w-[120px]"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Employment type filter */}
        <select
          value={filters.employment_type}
          onChange={(e) => updateFilter('employment_type', e.target.value as EmploymentType | '')}
          className="px-3 py-2 text-sm rounded-lg border outline-none appearance-none cursor-pointer
            bg-theme-input text-text-primary border-theme-border-input
            focus:border-accent-purple focus:bg-theme-card
            transition-colors min-w-[120px]"
        >
          {employmentOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Work mode filter */}
        <select
          value={filters.work_mode}
          onChange={(e) => updateFilter('work_mode', e.target.value as WorkMode | '')}
          className="px-3 py-2 text-sm rounded-lg border outline-none appearance-none cursor-pointer
            bg-theme-input text-text-primary border-theme-border-input
            focus:border-accent-purple focus:bg-theme-card
            transition-colors min-w-[120px]"
        >
          {workModeOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={12} />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * JobsFiltersMobile Component
 * Compact filter controls for mobile view
 */
export function JobsFiltersMobile({ filters, onChange, onClear }: JobsFiltersProps) {
  const hasActiveFilters = filters.status || filters.employment_type || filters.work_mode

  const updateFilter = <K extends keyof JobsFiltersState>(
    key: K,
    value: JobsFiltersState[K]
  ) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search jobs..."
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none
            bg-theme-input text-text-primary border-theme-border-input
            focus:border-accent-purple
            placeholder:text-text-secondary/50
            transition-colors"
        />
      </div>

      {/* Filters row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value as JobStatus | '')}
          className="px-2 py-1.5 text-xs rounded border outline-none appearance-none cursor-pointer
            bg-theme-input text-text-primary border-theme-border-input
            focus:border-accent-purple
            transition-colors flex-shrink-0"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={filters.employment_type}
          onChange={(e) => updateFilter('employment_type', e.target.value as EmploymentType | '')}
          className="px-2 py-1.5 text-xs rounded border outline-none appearance-none cursor-pointer
            bg-theme-input text-text-primary border-theme-border-input
            focus:border-accent-purple
            transition-colors flex-shrink-0"
        >
          {employmentOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="px-2 py-1.5 text-xs text-accent-red rounded transition-colors cursor-pointer flex-shrink-0"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
