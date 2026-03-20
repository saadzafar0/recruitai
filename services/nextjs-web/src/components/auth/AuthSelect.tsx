import { ChevronDown } from 'lucide-react'

interface AuthSelectOption {
  value: string
  label: string
}

interface AuthSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: AuthSelectOption[]
}

export function AuthSelect({ label, value, onChange, options }: AuthSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded border outline-none cursor-pointer
            bg-dark-input text-text-primary border-border-input
            focus:border-accent-purple focus:bg-dark-card
            transition-colors"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary"
        />
      </div>
    </div>
  )
}
