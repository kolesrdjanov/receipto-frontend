import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Lock,
  Crown,
  Sparkles,
  Compass,
  Star,
  Camera,
  type LucideIcon,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
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
/* Rank chip — tinted tier pill folded into the profile hero            */
/* ------------------------------------------------------------------ */
const RANK_CHIP: Record<ReceiptRank, { tone: string; icon: LucideIcon }> = {
  status_a: { tone: 'bg-warning-soft text-warning-foreground', icon: Crown },
  status_b: { tone: 'bg-info-soft text-info-foreground', icon: Sparkles },
  status_c: { tone: 'bg-success-soft text-success-foreground', icon: Compass },
  none: { tone: 'bg-bg-subtle text-muted-foreground', icon: Compass },
}

export function RankChip({ rank, name }: { rank: ReceiptRank; name: string }) {
  const { t } = useTranslation()
  const { tone, icon: Icon } = RANK_CHIP[rank] ?? RANK_CHIP.none
  return (
    <span
      title={`${t('settings.profile.rank.title')} — ${name}`}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full pl-[9px] pr-3 text-[12.5px] font-bold',
        tone,
      )}
    >
      <Icon className="size-[14px]" />
      {name}
    </span>
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
      <Button type="button" onClick={onSave} disabled={!dirty || saving}>
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

/* ------------------------------------------------------------------ */
/* Profile avatar — 92px gradient avatar with a camera affordance       */
/* ------------------------------------------------------------------ */
export function ProfileAvatar({
  firstName,
  lastName,
  imageUrl,
  label,
  onPick,
}: {
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
  label: string
  onPick: () => void
}) {
  return (
    <div className="relative shrink-0">
      <Avatar firstName={firstName} lastName={lastName} imageUrl={imageUrl} size="2xl" className="size-[92px] text-[31px]" />
      <button
        type="button"
        onClick={onPick}
        aria-label={label}
        className="absolute -bottom-[3px] -right-[3px] grid size-8 place-items-center rounded-full border border-border bg-card text-fg-2 shadow-glass-2 transition-[transform,background-color] hover:scale-105 hover:bg-bg-subtle hover:text-foreground"
      >
        <Camera className="size-[15px]" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Desktop section-nav rail — sticky, scroll-spied, click-to-jump       */
/* ------------------------------------------------------------------ */
export function SettingsNavRail<Id extends string>({
  items,
  active,
  onJump,
}: {
  items: { id: Id; label: string; icon: LucideIcon; danger?: boolean }[]
  active: Id
  onJump: (id: Id) => void
}) {
  return (
    <aside className="sticky top-[112px] flex w-[212px] shrink-0 flex-col gap-0.5">
      {items.map((item) => {
        const on = active === item.id
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onJump(item.id)}
            aria-current={on ? 'true' : undefined}
            className={cn(
              'flex min-h-[42px] items-center gap-[11px] rounded-xl px-[13px] text-left text-[13.5px] font-semibold transition-colors',
              item.danger
                ? on
                  ? 'bg-destructive-soft text-destructive'
                  : 'text-destructive/85 hover:bg-destructive-soft/60'
                : on
                  ? 'bg-primary-soft font-bold text-primary'
                  : 'text-fg-2 hover:bg-bg-subtle hover:text-foreground',
            )}
          >
            <Icon className={cn('size-[17px] shrink-0', !item.danger && (on ? 'text-primary' : 'text-muted-foreground'))} />
            <span className="flex-1">{item.label}</span>
          </button>
        )
      })}
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile segmented tab strip (Profile / App / Account)                 */
/* ------------------------------------------------------------------ */
export function SettingsTabStrip<Id extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: Id; label: string }[]
  active: Id
  onChange: (id: Id) => void
}) {
  return (
    <div className="flex gap-1 rounded-full border border-hairline-soft bg-bg-subtle p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-pressed={active === tab.id}
          className={cn(
            'h-[38px] flex-1 rounded-full text-[13.5px] font-semibold transition-colors',
            active === tab.id ? 'bg-card text-foreground shadow-glass-1' : 'text-muted-foreground',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
