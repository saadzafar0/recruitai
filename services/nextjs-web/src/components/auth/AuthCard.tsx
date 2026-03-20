interface AuthCardProps {
  children: React.ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="rounded-lg px-6 sm:px-10 py-8 sm:py-10 border bg-dark-card border-border-subtle shadow-md">
      {children}
    </div>
  )
}
