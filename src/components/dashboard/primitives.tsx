import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================
   Shared Luma dashboard primitives — flat cards, hairline
   borders, monochrome text tiers. Composed by the dashboard
   modules so the cards stay consistent.
   ============================================================ */

/** Card header — leading icon + title, optional trailing slot. */
export function WidgetHead({
  icon: Icon,
  title,
  trailing,
  iconTone = 'muted',
  className,
}: {
  icon: LucideIcon
  title: ReactNode
  trailing?: ReactNode
  iconTone?: 'muted' | 'primary'
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      <h3 className="flex min-w-0 items-center gap-2 text-[16px] font-semibold leading-[1.25] tracking-[-0.01em]">
        <Icon
          className={cn('size-[17px] shrink-0', iconTone === 'primary' ? 'text-primary' : 'text-muted-foreground')}
        />
        <span className="truncate">{title}</span>
      </h3>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}

/** Centered "no data" voice inside a widget. */
export function WidgetEmpty({
  children,
  icon: Icon,
  hint,
  tall,
  className,
}: {
  children: ReactNode
  icon?: LucideIcon
  hint?: ReactNode
  tall?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center px-4 text-center text-[13px] text-muted-foreground',
        tall ? 'min-h-[180px]' : 'min-h-[110px]',
        className,
      )}
    >
      {Icon && (
        <span className="mb-3 grid size-[56px] place-items-center rounded-[18px] bg-bg-subtle text-muted-foreground">
          <Icon className="size-7" strokeWidth={1.75} />
        </span>
      )}
      <span>{children}</span>
      {hint && <span className="mt-1.5 text-[12px] text-fg-faint">{hint}</span>}
    </div>
  )
}

/** Masked amount placeholder. */
export function HiddenDots() {
  return <span className="tracking-[0.12em]">••••••</span>
}

/**
 * Up/down delta pill — neutral in both directions (Luma reserves red for
 * over-budget pace and overdue bills); the arrow + aria-label carry direction.
 */
export function TrendPill({
  value,
  className,
  label,
}: {
  value: number
  className?: string
  /** Accessible direction phrasing, e.g. "3% above last month". Falls back to a
   *  +/- prefixed value so screen readers still convey direction, not just color. */
  label?: string
}) {
  if (value === 0) return null
  const up = value > 0
  return (
    <span
      role="img"
      aria-label={label ?? `${up ? '+' : '-'}${Math.abs(value)}%`}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full bg-subtle px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground',
        className,
      )}
    >
      {up ? <ArrowUpRight className="size-3" aria-hidden="true" /> : <ArrowDownRight className="size-3" aria-hidden="true" />}
      {Math.abs(value)}%
    </span>
  )
}

/** Shimmer block for loading skeletons. */
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-bg-subtle', className)} />
}
