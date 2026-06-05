import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Lock,
  Crown,
  Sparkles,
  Compass,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReceiptRank } from '@/lib/rank'

/* ------------------------------------------------------------------ */
/* Glass settings card — icon + title + description head, optional danger */
/* ------------------------------------------------------------------ */
export function SettingsCard({
  icon: Icon,
  title,
  desc,
  danger,
  children,
  className,
}: {
  icon?: LucideIcon
  title?: string
  desc?: string
  danger?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-card p-5 shadow-glass-1 sm:p-[22px]',
        danger ? 'border-destructive/40' : 'border-border',
        className,
      )}
    >
      {title && (
        <header className="mb-4">
          <h3
            className={cn(
              'flex items-center gap-2 text-[17px] font-bold tracking-[-0.01em]',
              danger && 'text-destructive',
            )}
          >
            {Icon && (
              <Icon className={cn('size-[18px]', danger ? 'text-destructive' : 'text-muted-foreground')} />
            )}
            {title}
          </h3>
          {desc && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Settings row — label/help left, control right; stacks on mobile      */
/* ------------------------------------------------------------------ */
export function SettingRow({
  label,
  help,
  htmlFor,
  children,
}: {
  label: string
  help?: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
        </label>
        {help && <p className="text-[13px] text-muted-foreground">{help}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Accent color — retired note (the picker is gone; app is emerald-locked) */
/* ------------------------------------------------------------------ */
export function AccentRetired() {
  const { t } = useTranslation()
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-bg-subtle/60 p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-bg-subtle text-muted-foreground">
        <Lock className="size-[15px]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {t('settings.accentColor.retiredTitle')}
          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-foreground">
            {t('settings.accentColor.retiredTag')}
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {t('settings.accentColor.retiredHelp')}
        </p>
      </div>
      <span
        aria-hidden
        title="Brand accent (emerald)"
        className="mt-0.5 size-[26px] shrink-0 rounded-full bg-brand-gradient shadow-sm"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Notification list — iOS-style switch rows                            */
/* ------------------------------------------------------------------ */
export function NotifList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-hairline-soft overflow-hidden rounded-xl border border-border">{children}</div>
}

export function NotifRow({
  title,
  help,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string
  help: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className="min-w-0">
        <div className="text-[15px] font-semibold">{title}</div>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{help}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Rank crest — restyled Glass tier card                                */
/* ------------------------------------------------------------------ */
const RANK_TONE: Record<ReceiptRank, { tile: string; fill: string; card: string; icon: LucideIcon }> = {
  status_a: { tile: 'bg-warning-soft text-warning-foreground', fill: 'var(--warning)', card: 'border-warning/30', icon: Crown },
  status_b: { tile: 'bg-info-soft text-info-foreground', fill: 'var(--info)', card: 'border-info/30', icon: Sparkles },
  status_c: { tile: 'bg-success-soft text-success-foreground', fill: 'var(--success)', card: 'border-success/30', icon: Compass },
  none: { tile: 'bg-bg-subtle text-muted-foreground', fill: 'var(--muted-foreground)', card: 'border-border', icon: Compass },
}

export function RankCard({
  count,
  rank,
  name,
  description,
  progress,
  nextRankName,
  receiptsToNextRank,
}: {
  count: number
  rank: ReceiptRank
  name: string
  description: string
  progress: number
  nextRankName: string
  receiptsToNextRank: number
}) {
  const { t } = useTranslation()
  const tone = RANK_TONE[rank] ?? RANK_TONE.none
  const TierIcon = tone.icon
  return (
    <div className={cn('rounded-2xl border bg-card p-5 shadow-glass-1 sm:p-[22px]', tone.card)}>
      <div className="flex items-start gap-3.5">
        <span className={cn('grid size-[54px] shrink-0 place-items-center rounded-2xl', tone.tile)}>
          <TierIcon className="size-[26px]" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="t-xs text-fg-faint">{t('settings.profile.rank.title')}</span>
          <div className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]">{name}</div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {t('settings.profile.rank.receiptsTracked', { count })}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[12.5px] text-muted-foreground">
          <span>{t('settings.profile.rank.progress')}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-subtle">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: tone.fill }} />
        </div>
        <div className="mt-1.5 text-[13px] text-muted-foreground">
          {receiptsToNextRank > 0
            ? t('settings.profile.rank.nextTarget', { count: receiptsToNextRank, rank: nextRankName })
            : t('settings.profile.rank.topTier')}
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dirty-gated save bar (profile)                                       */
/* ------------------------------------------------------------------ */
export function SaveBar({
  dirty,
  saving,
  onSave,
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-end gap-3">
      {dirty && !saving && (
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-warning-foreground">
          <span className="size-1.5 rounded-full bg-warning" />
          {t('settings.profile.unsavedChanges')}
        </span>
      )}
      <Button type="button" className="rounded-xl" onClick={onSave} disabled={!dirty || saving}>
        {saving ? t('common.saving') : t('common.save')}
      </Button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Star picker — rate-app modal                                         */
/* ------------------------------------------------------------------ */
export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex justify-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star className={cn('size-[34px] transition-colors', n <= shown ? 'fill-warning text-warning' : 'text-border')} />
        </button>
      ))}
    </div>
  )
}
