import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================
   Shared "Glass" dashboard primitives.
   Frosted floating surfaces over the app wash; brand gradient
   reserved for the logo + primary CTA / FAB only. Composed by
   every dashboard widget so the cards stay consistent.
   ============================================================ */

/** Frosted content card — the surface every widget sits on. */
export function WidgetCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-glass-1',
        className,
      )}
    >
      {children}
    </section>
  )
}

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
      <h3 className="flex min-w-0 items-center gap-2 text-[16px] font-bold leading-[1.25] tracking-[-0.01em]">
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

/**
 * A single stat tile (its own glass surface): uppercase kicker + a trailing
 * icon or amounts eye toggle, then a big tabular value.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  iconAccent,
  eye,
  hidden,
  onToggleHidden,
  big,
  hero,
  primary,
  className,
}: {
  label: ReactNode
  value: ReactNode
  icon?: LucideIcon
  iconAccent?: boolean
  /** Render the trailing slot as the amounts eye toggle. */
  eye?: boolean
  hidden?: boolean
  onToggleHidden?: () => void
  /** 32px desktop hero value. */
  big?: boolean
  /** 36px full-width mobile hero value. */
  hero?: boolean
  primary?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-col rounded-2xl border border-border bg-card p-5 shadow-glass-1', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="t-xs truncate text-muted-foreground">{label}</span>
        {eye && onToggleHidden ? (
          <button
            type="button"
            onClick={onToggleHidden}
            className="-m-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
            aria-label={hidden ? 'Show amounts' : 'Hide amounts'}
          >
            {hidden ? <EyeOff className="size-[15px]" /> : <Eye className="size-[15px]" />}
          </button>
        ) : Icon ? (
          <Icon className={cn('size-[15px] shrink-0', iconAccent ? 'text-primary' : 'text-muted-foreground')} />
        ) : null}
      </div>
      <div
        className={cn(
          'font-display font-extrabold leading-[1.05] tracking-[-0.02em]',
          hero ? 'text-[36px]' : big ? 'text-[32px]' : 'text-[22px]',
          primary && 'text-primary',
        )}
      >
        {value}
      </div>
    </div>
  )
}

/** Masked amount placeholder. */
export function HiddenDots() {
  return <span className="tracking-[0.12em]">••••••</span>
}

/**
 * Up/down delta pill. Spending below the comparison reads positive (emerald,
 * down arrow); above reads cautionary (amber, up arrow).
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
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
        up ? 'bg-warning-soft text-warning-foreground' : 'bg-success-soft text-success-foreground',
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
