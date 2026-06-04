import { useTranslation } from 'react-i18next'
import { Receipt as ReceiptIcon, Check, QrCode, Pencil, Clock, X, Repeat, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Tabular formatted amount (sr-RS dinar style, rounded). */
export function Amount({
  value, currency = 'RSD', size = 15.5, weight = 700, muted = false, className,
}: { value: number | string; currency?: string; size?: number; weight?: number; muted?: boolean; className?: string }) {
  const n = Math.round(Number(value) || 0).toLocaleString('sr-RS')
  return (
    <span
      className={cn('t-num shrink-0 tabular-nums', muted ? 'text-muted-foreground' : 'text-foreground', className)}
      style={{ fontSize: size, fontWeight: weight, lineHeight: 1 }}
    >
      {n} {currency}
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

type Tone = 'ok' | 'info' | 'warn' | 'danger' | 'violet'
const STATUS: Record<string, { tone: Tone; icon: LucideIcon; key: string }> = {
  scraped:   { tone: 'ok',     icon: QrCode, key: 'receipts.status.completed' },
  completed: { tone: 'ok',     icon: QrCode, key: 'receipts.status.completed' },
  manual:    { tone: 'info',   icon: Pencil, key: 'receipts.status.manual' },
  pending:   { tone: 'warn',   icon: Clock,  key: 'receipts.status.pending' },
  failed:    { tone: 'danger', icon: X,      key: 'receipts.status.failed' },
  recurring: { tone: 'violet', icon: Repeat, key: 'receipts.status.recurring' },
}
const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-success-soft text-success-foreground',
  info: 'bg-info-soft text-info-foreground',
  warn: 'bg-warning-soft text-warning-foreground',
  danger: 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]',
  violet: 'bg-brand-violet-soft text-brand-violet-foreground',
}
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useTranslation()
  const s = STATUS[status]
  if (!s) return null
  const Icon = s.icon
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TONE_CLASS[s.tone], className)}>
      <Icon className="size-3" />
      {t(s.key)}
    </span>
  )
}
