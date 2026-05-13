import { statusConfig, type StatusConfigKey } from '@/constants/statusConfig'

const fallbackStatus = {
  label: 'Unknown',
  className: 'text-[var(--muted-foreground)] bg-[var(--secondary)]',
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as StatusConfigKey] || {
    ...fallbackStatus,
    label: formatStatusLabel(status),
  }

  return (
    <span className={`text-xs px-2 py-1 rounded ${config.className}`}>
      {config.label}
    </span>
  )
}
