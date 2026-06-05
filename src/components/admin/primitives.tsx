import { type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'

/**
 * Shared "Glass" primitives for the admin back-office (Users · User details ·
 * App settings · Ratings · Announcements). Frosted floating surfaces over the app
 * wash; near-monochrome neutrals; the brand gradient stays reserved for the logo +
 * primary CTA. Keep feature-specific maps in the page that needs them — this file
 * only holds the cross-admin building blocks.
 *
 * Raw <button> is intentional here (the primitive layer is exempt from the
 * one-shared-Button rule) for the bespoke tappable status pills.
 */

/* ------------------------------------------------------------------ */
/* Glass card + padded head (table cards keep their body flush)        */
/* ------------------------------------------------------------------ */
export function AdminCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card shadow-glass-1', className)}>
      {children}
    </section>
  )
}

export function AdminCardHead({
  icon: Icon,
  title,
  desc,
  trailing,
  className,
}: {
  icon?: LucideIcon
  title: ReactNode
  desc?: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5 sm:px-[22px]', className)}>
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-[17px] font-bold leading-[1.25] tracking-[-0.01em]">
          {Icon && <Icon className="size-[18px] shrink-0 text-primary" />}
          <span className="truncate">{title}</span>
        </h3>
        {desc && <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{desc}</p>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Status / toggle pill — tone-tinted; clickable when `onClick` given   */
/* ------------------------------------------------------------------ */
export type PillTone =
  | 'neutral'
  | 'success'
  | 'emerald'
  | 'warn'
  | 'violet'
  | 'info'
  | 'danger'

const PILL_TONE: Record<PillTone, string> = {
  neutral: 'bg-bg-subtle text-muted-foreground',
  success: 'bg-success-soft text-success-foreground',
  emerald: 'bg-primary-soft text-primary',
  warn: 'bg-warning-soft text-warning-foreground',
  violet: 'bg-brand-violet-soft text-brand-violet-foreground',
  info: 'bg-info-soft text-info-foreground',
  danger: 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]',
}

export function Pill({
  tone = 'neutral',
  icon: Icon,
  children,
  onClick,
  disabled,
  title,
  className,
}: {
  tone?: PillTone
  icon?: LucideIcon
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  className?: string
}) {
  const base = cn(
    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold transition-colors',
    PILL_TONE[tone],
    onClick && 'cursor-pointer hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:brightness-110',
    className,
  )
  const inner = (
    <>
      {Icon && <Icon className="size-3" />}
      {children}
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} title={title} className={base}>
        {inner}
      </button>
    )
  }
  return (
    <span title={title} className={base}>
      {inner}
    </span>
  )
}

/** Role pill — admin reads violet, everyone else neutral. */
export function RoleBadge({ role, adminLabel, userLabel }: { role: string; adminLabel: string; userLabel: string }) {
  return role === 'admin'
    ? <Pill tone="violet">{adminLabel}</Pill>
    : <Pill tone="neutral">{userLabel}</Pill>
}

/* ------------------------------------------------------------------ */
/* Feature/AI switch row — tinted glyph tile + label/help + Switch      */
/* ------------------------------------------------------------------ */
export type TileTone = 'info' | 'success' | 'violet' | 'warn' | 'primary'

const TILE_TONE: Record<TileTone, string> = {
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
  violet: 'bg-brand-violet-soft text-brand-violet-foreground',
  warn: 'bg-warning-soft text-warning-foreground',
  primary: 'bg-primary-soft text-primary',
}

export function FeatureSwitchRow({
  icon: Icon,
  tone = 'info',
  title,
  desc,
  checked,
  onCheckedChange,
  disabled,
}: {
  icon: LucideIcon
  tone?: TileTone
  title: string
  desc: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3.5 py-4 first:pt-0 last:pb-0">
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', TILE_TONE[tone])}>
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold">{title}</div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="shrink-0" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sortable table header — label + direction caret                      */
/* ------------------------------------------------------------------ */
export function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: ReactNode
  active: boolean
  dir: 'ASC' | 'DESC'
  onClick: () => void
}) {
  const Caret = !active ? ArrowUpDown : dir === 'ASC' ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 transition-colors hover:text-foreground',
        active && 'text-foreground',
      )}
    >
      {label}
      <Caret className={cn('size-3', !active && 'text-muted-foreground/50')} />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Inset stat tile — bordered subtle fill inside a card                 */
/* ------------------------------------------------------------------ */
export function InsetStat({
  label,
  value,
  children,
  className,
}: {
  label: ReactNode
  value?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-bg-subtle/50 p-4', className)}>
      <div className="t-xs text-muted-foreground">{label}</div>
      {value !== undefined && (
        <div className="mt-1 text-[22px] font-extrabold leading-none tracking-[-0.02em]">{value}</div>
      )}
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Identity info row — leading icon + label/value pair                  */
/* ------------------------------------------------------------------ */
export function InfoItem({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: LucideIcon
  label: ReactNode
  value: ReactNode
  muted?: boolean
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="t-xs text-muted-foreground">{label}</div>
        <div className={cn('mt-0.5 text-sm font-medium', muted && 'text-muted-foreground')}>{value}</div>
      </div>
    </div>
  )
}
