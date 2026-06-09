import { type HTMLAttributes, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt as ReceiptIcon, Check, type LucideIcon } from 'lucide-react'
import { cn, formatMoney } from '@/lib/utils'

/**
 * Cross-feature Glass list primitives. These are shared by every list feature
 * (receipts, recurring, …) and intentionally carry no domain logic — keep
 * feature-specific maps (status→tone, palettes, emoji derivation) in the
 * feature's own `primitives.tsx`.
 */

/** Tabular formatted amount. Delegates to the canonical `formatMoney` so rows, totals and
 *  detail screens never disagree on how a currency renders (single source of truth). */
export function Amount({
  value, currency = 'RSD', size = 15.5, weight = 700, muted = false, className,
}: { value: number | string; currency?: string; size?: number; weight?: number; muted?: boolean; className?: string }) {
  return (
    <span
      className={cn('shrink-0', muted ? 'text-muted-foreground' : 'text-foreground', className)}
      style={{ fontSize: size, fontWeight: weight, lineHeight: 1 }}
    >
      {formatMoney(value, currency)}
    </span>
  )
}

/** Shared tone vocabulary for status pills/badges. Features map their own statuses to a Tone. */
export type Tone = 'ok' | 'info' | 'warn' | 'danger' | 'violet' | 'primary' | 'neutral' | 'muted' | 'outline'

const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-success-soft text-success-foreground',
  info: 'bg-info-soft text-info-foreground',
  warn: 'bg-warning-soft text-warning-foreground',
  danger: 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]',
  violet: 'bg-brand-violet-soft text-brand-violet-foreground',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-bg-subtle text-muted-foreground',
  muted: 'bg-bg-subtle text-fg-faint',
  outline: 'border border-border text-fg-faint',
}

/**
 * Canonical status/urgency pill — tone carries the meaning. The single shared shell behind
 * every feature's badge (receipts status, recurring due, warranty urgency, …); features keep
 * their own status→{tone,icon,label} map and render through this instead of re-deriving the
 * pill markup + tone→class table.
 */
export function StatusBadge({
  tone = 'neutral',
  icon: Icon,
  small,
  className,
  children,
}: {
  tone?: Tone
  icon?: LucideIcon
  small?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full font-semibold',
        small ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-0.5 text-[11px]',
        TONE_CLASS[tone],
        className,
      )}
    >
      {Icon && <Icon className={small ? 'size-[10px]' : 'size-3'} />}
      {children}
    </span>
  )
}

/** Category emoji tile; uncategorized → dashed neutral tile + receipt glyph. */
export function CatTile({
  category, size = 42, radius = 13, font = 20, className,
}: { category?: { color?: string; icon?: string } | null; size?: number; radius?: number; font?: number; className?: string }) {
  if (category?.icon) {
    return (
      <div
        className={cn('grid shrink-0 place-items-center', className)}
        style={{ width: size, height: size, borderRadius: radius, fontSize: font, lineHeight: 1, background: (category.color || '#888') + '1f' }}
      >
        <span>{category.icon}</span>
      </div>
    )
  }
  return (
    <div
      className={cn('grid shrink-0 place-items-center border border-dashed border-border bg-bg-subtle text-fg-faint', className)}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <ReceiptIcon style={{ width: font, height: font }} />
    </div>
  )
}

/** Category name as plain muted text (list rows). */
export function CatName({ name, className }: { name?: string | null; className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={cn('truncate text-[13px] font-medium text-muted-foreground', className)} style={{ maxWidth: 140 }}>
      {name || t('receipts.uncategorized', { defaultValue: 'Uncategorized' })}
    </span>
  )
}

/** Selection checkbox (on / off). */
export function SelectCheck({ on, className }: { on?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors',
        on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
        className,
      )}
    >
      <Check className={cn('size-3.5', on ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
    </span>
  )
}

/**
 * The glass list-card shell — one rounded card whose direct children are hairline-separated
 * rows. The single source of truth for every flat feature list (receipts feed, categories,
 * templates, recurring, …) so they can't drift on radius/border/shadow/divider.
 */
export function ListCard({
  className,
  children,
  ...props
}: { className?: string; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card shadow-glass-1 [&>div+div]:border-t [&>div+div]:border-hairline-soft',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * One action row inside a kebab popover / mobile action sheet — icon + label, full-width,
 * left-aligned. `danger` recolours it as a destructive action. The shared shell behind every
 * feature's RowActionList/CardActionList so the action-item markup stays in one place.
 */
export function RowActionItem({
  icon: Icon,
  label,
  onClick,
  danger,
  className,
  'data-testid': testId,
}: {
  icon: LucideIcon
  label: ReactNode
  onClick?: () => void
  danger?: boolean
  className?: string
  'data-testid'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-bg-subtle',
        danger && 'text-destructive hover:bg-destructive/10',
        className,
      )}
    >
      <Icon className="size-[18px] shrink-0" /> {label}
    </button>
  )
}
