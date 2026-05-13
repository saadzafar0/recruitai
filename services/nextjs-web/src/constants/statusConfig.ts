export const statusConfig = {
  shortlisted: { label: 'Shortlisted', className: 'text-[var(--primary)] bg-[var(--accent-bg-faint)]' },
  under_review: { label: 'Under Review', className: 'text-[var(--warning)] bg-[var(--warning-bg)]' },
  rejected: { label: 'Rejected', className: 'text-[var(--error)] bg-[var(--error-bg)]' },
  hired: { label: 'Hired', className: 'text-[var(--success)] bg-[var(--success-bg)]' },
  advanced: { label: 'Advanced', className: 'text-[var(--success)] bg-[var(--success-bg)]' },
  not_started: { label: 'Not Started', className: 'text-[var(--muted-foreground)] bg-[var(--secondary)]' },
  in_progress: { label: 'In Progress', className: 'text-[var(--warning)] bg-[var(--warning-bg)]' },
  completed: { label: 'Completed', className: 'text-[var(--success)] bg-[var(--success-bg)]' },
  submitted: { label: 'Submitted', className: 'text-[var(--warning)] bg-[var(--warning-bg)]' },
  draft: { label: 'Draft', className: 'text-[var(--muted-foreground)] bg-[var(--secondary)]' },
} as const

export type StatusConfigKey = keyof typeof statusConfig
