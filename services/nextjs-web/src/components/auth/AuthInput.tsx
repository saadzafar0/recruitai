import { LucideIcon } from 'lucide-react'

interface AuthInputProps {
  label: string
  type: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: LucideIcon
}

export function AuthInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: AuthInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50"
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none
            bg-theme-input text-text-primary border-theme-border-input
            focus:border-accent-purple focus:bg-theme-card
            placeholder:text-text-secondary/50
            transition-colors"
        />
      </div>
    </div>
  )
}
