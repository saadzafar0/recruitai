interface AuthErrorProps {
  message: string
}

export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null

  return (
    <div className="mb-4 px-3 py-2.5 rounded text-sm border bg-accent-red/10 border-accent-red/20 text-accent-red">
      {message}
    </div>
  )
}
