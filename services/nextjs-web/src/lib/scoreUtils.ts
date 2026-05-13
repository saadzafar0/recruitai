export function getScoreColorVar(score: number): string {
  if (score >= 80) return 'var(--success)'
  if (score >= 65) return 'var(--warning)'
  return 'var(--error)'
}

export function getScoreClass(score: number): string {
  if (score >= 80) return 'text-[var(--success)]'
  if (score >= 65) return 'text-[var(--warning)]'
  return 'text-[var(--error)]'
}
