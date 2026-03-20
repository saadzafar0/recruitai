interface AuthCardProps {
  children: React.ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="rounded-lg px-6 sm:px-10 py-8 sm:py-10 border bg-theme-card border-theme-border shadow-theme-card transition-colors">
      {children}
    </div>
  )
}
