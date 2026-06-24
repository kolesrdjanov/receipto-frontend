import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  icon?: ReactNode
  active?: boolean
  /** 'dark' = quick-chips + rail date presets; 'soft' = sheet chips. */
  tone?: 'dark' | 'soft'
  onClick?: () => void
  className?: string
}

export function FilterChip({ label, icon, active, tone = 'dark', onClick, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'hit-area inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
        active
          ? tone === 'soft'
            ? 'border-transparent bg-primary-soft text-primary'
            : 'border-transparent bg-foreground text-background'
          : 'border-border bg-card text-fg-2 hover:bg-bg-subtle hover:text-foreground',
        className,
      )}
    >
      {icon}
      {label}
    </button>
  )
}
