import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded border px-3 py-1.5 text-sm font-medium transition-colors', {
  variants: {
    variant: {
      default: 'border-theme-border bg-accent-purple/10 text-accent-purple',
      outline: 'border-theme-border text-theme-text-secondary',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
