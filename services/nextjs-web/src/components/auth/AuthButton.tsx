import { Loader2 } from 'lucide-react'

interface AuthButtonProps {
  loading: boolean
  loadingText: string
  children: React.ReactNode
}

export function AuthButton({ loading, loadingText, children }: AuthButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 text-sm text-white rounded mt-2 cursor-pointer
        flex items-center justify-center gap-2
        bg-accent-purple hover:bg-accent-purple-hover
        disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-accent-purple
        transition-colors"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? loadingText : children}
    </button>
  )
}
