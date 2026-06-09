import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Store,
  Calendar,
  Paperclip,
  FileText,
  MoreVertical,
  Image as ImageIcon,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/date-utils'
import { StatusBadge as GlassStatusBadge, type Tone } from '@/components/glass/primitives'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import {
  getWarrantyStatus,
  getRemainingDays,
  type Warranty,
  type WarrantyFile,
} from '@/hooks/warranties/use-warranties'
import {
  deriveKindEmoji,
  kindColor,
  coveragePercent,
  formatRemaining,
  type WarrantyStatus,
} from '@/components/warranties/warranty-view'

/* ------------------------------------------------------------------ */
/* Status meta — the urgency language (badge + coverage-bar tint)      */
/* ------------------------------------------------------------------ */
const STATUS_ICON: Record<WarrantyStatus, LucideIcon> = {
  active: ShieldCheck,
  expiring: ShieldAlert,
  expired: ShieldX,
}
const STATUS_TONE: Record<WarrantyStatus, Tone> = {
  active: 'ok',
  expiring: 'warn',
  expired: 'danger',
}
const STATUS_TEXT: Record<WarrantyStatus, string> = {
  active: 'text-success-foreground',
  expiring: 'text-warning-foreground',
  expired: 'text-destructive',
}
const FILL_COLOR: Record<WarrantyStatus, string> = {
  active: 'oklch(from var(--success) 0.60 0.15 h)',
  expiring: 'oklch(from var(--warning) 0.72 0.16 h)',
  expired: 'oklch(from var(--destructive) 0.62 0.20 h)',
}

function isPdfFile(file: WarrantyFile): boolean {
  const url = file.url.toLowerCase()
  return file.type === 'pdf' || url.endsWith('.pdf') || url.includes('/raw/upload/')
}

function deliverImg(url: string): string {
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  return `${url}${url.includes('?') ? '&' : '?'}f_auto,q_auto`
}

/* ------------------------------------------------------------------ */
/* StatusBadge — short urgency pill, colour carries the meaning         */
/* ------------------------------------------------------------------ */
export function StatusBadge({ w, small, className }: { w: Warranty; small?: boolean; className?: string }) {
  const { t } = useTranslation()
  const status = getWarrantyStatus(w)
  const label =
    status === 'expiring'
      ? `${getRemainingDays(w)} ${t('warranties.status.daysLeft')}`
      : t(`warranties.status.${status}`)
  return (
    <GlassStatusBadge tone={STATUS_TONE[status]} icon={STATUS_ICON[status]} small={small} className={className}>
      {label}
    </GlassStatusBadge>
  )
}

/* ------------------------------------------------------------------ */
/* KindTile — emoji derived from the product name                       */
/* ------------------------------------------------------------------ */
export function KindTile({ name, size = 46, className }: { name?: string | null; size?: number; className?: string }) {
  const emoji = deriveKindEmoji(name)
  return (
    <span
      className={cn('grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size, borderRadius: 13, fontSize: size * 0.5, lineHeight: 1, background: kindColor(emoji) + '22' }}
    >
      {emoji}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* CoverageBar — the hero: purchase → expiry, today knob, remaining     */
/* ------------------------------------------------------------------ */
export function CoverageBar({ w }: { w: Warranty }) {
  const { t } = useTranslation()
  const status = getWarrantyStatus(w)
  const pct = coveragePercent(w)
  const fill = FILL_COLOR[status]
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-fg-faint">
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-[11px]" />
          {formatDate(w.purchaseDate)}
        </span>
        <span className={cn('font-semibold', STATUS_TEXT[status])}>{formatRemaining(w, t)}</span>
        <span className="inline-flex items-center gap-1">
          {formatDate(w.warrantyExpires)}
          <Shield className="size-[11px]" />
        </span>
      </div>
      <Progress
        value={pct * 100}
        className="mt-1.5 h-2 bg-bg-subtle"
        indicatorClassName="rounded-full"
        indicatorColor={fill}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* FileThumbStrip — attached docs (max 3) + count                       */
/* ------------------------------------------------------------------ */
export function FileThumbStrip({ files, onOpen }: { files: WarrantyFile[]; onOpen: (index: number) => void }) {
  const { t } = useTranslation()
  if (!files.length) {
    return (
      <div className="flex items-center gap-1.5 text-[12.5px] text-fg-faint">
        <Paperclip className="size-[13px]" />
        {t('warranties.noFilesAttached')}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      {files.map((file, i) => (
        <button
          key={file.url + i}
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(i)
          }}
          className="relative size-[54px] shrink-0 overflow-hidden rounded-xl border border-border transition-colors hover:border-primary/40"
        >
          {isPdfFile(file) ? (
            <span className="grid size-full place-items-center bg-bg-subtle text-muted-foreground">
              <FileText className="size-5" />
            </span>
          ) : (
            <img src={deliverImg(file.url)} alt="" className="size-full object-cover" loading="lazy" />
          )}
        </button>
      ))}
      <span className="text-[12px] text-fg-faint">{t('warranties.filesCount', { count: files.length })}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* StatusTabs — scrollable pill tabs with count chips                   */
/* ------------------------------------------------------------------ */
type TabKey = 'all' | 'active' | 'expiring' | 'expired'
const TAB_KEYS: TabKey[] = ['all', 'active', 'expiring', 'expired']

export function StatusTabs({
  value,
  counts,
  onChange,
}: {
  value: TabKey
  counts: Record<TabKey, number>
  onChange: (key: TabKey) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TAB_KEYS.map((key) => {
        const on = key === value
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors',
              on ? 'bg-card text-foreground shadow-glass-1' : 'text-muted-foreground hover:bg-bg-subtle',
            )}
          >
            {t(`warranties.tabs.${key}`)}
            <span
              className={cn(
                'min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px]',
                on ? 'bg-primary-soft text-primary' : 'bg-bg-subtle text-fg-faint',
              )}
            >
              {counts[key]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* CardActionList — shared by desktop kebab popover + mobile sheet       */
/* ------------------------------------------------------------------ */
export function CardActionList({
  hasFiles,
  onViewFiles,
  onEdit,
  onDelete,
}: {
  hasFiles?: boolean
  onViewFiles?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const { t } = useTranslation()
  const item =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-bg-subtle'
  const iconCls = 'size-[18px] shrink-0 text-muted-foreground'
  return (
    <div className="flex flex-col gap-0.5">
      {hasFiles && (
        <button type="button" className={item} onClick={onViewFiles}>
          <ImageIcon className={iconCls} />
          {t('warranties.actions.viewFiles')}
        </button>
      )}
      <button type="button" className={item} onClick={onEdit}>
        <Pencil className={iconCls} />
        {t('warranties.actions.edit')}
      </button>
      <button type="button" className={cn(item, 'text-destructive hover:bg-destructive/10')} onClick={onDelete}>
        <Trash2 className="size-[18px] shrink-0" />
        {t('warranties.actions.delete')}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* WarrantyCard — coverage-bar-hero card                                */
/* ------------------------------------------------------------------ */
export interface WarrantyCardHandlers {
  onEdit: (w: Warranty) => void
  onOpenFile: (w: Warranty, index: number) => void
  onViewFiles: (w: Warranty) => void
  onDelete: (w: Warranty) => void
  /** Mobile: open the page-level action sheet for this card. */
  onOpenActions: (w: Warranty) => void
}

export function WarrantyCard({
  w,
  wide,
  onEdit,
  onOpenFile,
  onViewFiles,
  onDelete,
  onOpenActions,
}: { w: Warranty; wide?: boolean } & WarrantyCardHandlers) {
  const { t } = useTranslation()
  const files = w.files || []
  const dim = getWarrantyStatus(w) === 'expired'
  const [menuOpen, setMenuOpen] = useState(false)
  const close = (fn: () => void) => () => {
    setMenuOpen(false)
    fn()
  }
  return (
    <div
      onClick={() => onEdit(w)}
      className={cn(
        'flex cursor-pointer flex-col rounded-[18px] border border-border bg-card p-[18px] shadow-glass-1 transition-[box-shadow,border-color] hover:border-primary/35 hover:shadow-glass-2',
        dim && 'opacity-[0.72]',
      )}
    >
      <div className="flex items-start gap-3">
        <KindTile name={w.productName} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-bold tracking-[-0.01em]" title={w.productName}>
            {w.productName}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[12.5px] font-semibold text-muted-foreground">
            {w.storeName ? (
              <>
                <Store className="size-3 shrink-0" />
                <span className="truncate">{w.storeName}</span>
              </>
            ) : (
              <span className="text-fg-faint">{t('warranties.modal.storeName')}</span>
            )}
          </div>
        </div>
        <StatusBadge w={w} />
      </div>

      <div className="mt-3.5">
        <CoverageBar w={w} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <FileThumbStrip files={files} onOpen={(i) => onOpenFile(w, i)} />
        {wide ? (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t('warranties.actions.edit')}
                onClick={(e) => e.stopPropagation()}
                className="grid size-[34px] shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
              >
                <MoreVertical className="size-[18px]" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="w-52 rounded-xl p-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <CardActionList
                hasFiles={files.length > 0}
                onViewFiles={close(() => onViewFiles(w))}
                onEdit={close(() => onEdit(w))}
                onDelete={close(() => onDelete(w))}
              />
            </PopoverContent>
          </Popover>
        ) : (
          <button
            type="button"
            aria-label={t('warranties.actions.edit')}
            onClick={(e) => {
              e.stopPropagation()
              onOpenActions(w)
            }}
            className="grid size-[34px] shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
          >
            <MoreVertical className="size-[18px]" />
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* WarrantyGrid — responsive auto-fill grid                             */
/* ------------------------------------------------------------------ */
export function WarrantyGrid({
  items,
  wide,
  ...handlers
}: { items: Warranty[]; wide?: boolean } & WarrantyCardHandlers) {
  return (
    <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
      {items.map((w) => (
        <WarrantyCard key={w.id} w={w} wide={wide} {...handlers} />
      ))}
    </div>
  )
}
