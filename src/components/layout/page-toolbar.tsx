import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageToolbarProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}

/** Sticky frosted toolbar for desktop screens (mobile uses a page-level header). */
export function PageToolbar({ title, subtitle, actions, className }: PageToolbarProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-border px-8 py-[18px] md:flex',
        'bg-card/72 [backdrop-filter:blur(22px)_saturate(1.5)] [-webkit-backdrop-filter:blur(22px)_saturate(1.5)]',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="t-h2 truncate">{title}</h1>
        {subtitle && <div className="t-sm mt-0.5 text-muted-foreground">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
