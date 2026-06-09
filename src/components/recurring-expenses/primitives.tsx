import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  CircleAlert,
  Clock,
  Calendar,
  Check,
  Pause,
  Play,
  CircleSlash,
  CreditCard,
  Pencil,
  History,
  Trash2,
  MoreVertical,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Amount, CatTile, CatName, StatusBadge as GlassStatusBadge, type Tone } from '@/components/glass/primitives'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { relativeDueLabel, type RecurringStatus, type RecurringRowData } from '@/components/recurring-expenses/status'
import type { RecurringExpense } from '@/hooks/recurring-expenses/use-recurring-expenses'

const STATUS_TONE: Record<RecurringStatus, Tone> = {
  overdue: 'danger',
  duesoon: 'warn',
  upcoming: 'neutral',
  paid: 'ok',
  paused: 'muted',
  ended: 'outline',
}
const STATUS_ICON: Record<RecurringStatus, LucideIcon> = {
  overdue: CircleAlert,
  duesoon: Clock,
  upcoming: Calendar,
  paid: Check,
  paused: Pause,
  ended: CircleSlash,
}

/** The relative urgency pill — colour carries the meaning. */
export function DueBadge({
  status,
  label,
  small,
  className,
}: {
  status: RecurringStatus
  label: string
  small?: boolean
  className?: string
}) {
  return (
    <GlassStatusBadge tone={STATUS_TONE[status]} icon={STATUS_ICON[status]} small={small} className={className}>
      {label}
    </GlassStatusBadge>
  )
}

export interface RowActions {
  onMarkPaid?: (e: RecurringExpense) => void
  onEdit?: (e: RecurringExpense) => void
  onHistory?: (e: RecurringExpense) => void
  onTogglePause?: (e: RecurringExpense) => void
  onDelete?: (e: RecurringExpense) => void
}

/** Shared action list — used by the desktop kebab popover and the mobile action sheet. */
export function RowActionList({
  expense,
  status,
  onMarkPaid,
  onEdit,
  onHistory,
  onTogglePause,
  onDelete,
}: { expense: RecurringExpense; status: RecurringStatus } & RowActions) {
  const { t } = useTranslation()
  // Offer "Mark paid" whenever there's an outstanding due date — including `upcoming`
  // bills (pay early). Hidden only when already caught up / paused / ended.
  const canMarkPaid = status === 'overdue' || status === 'duesoon' || status === 'upcoming'
  const item = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition-colors hover:bg-bg-subtle'
  const iconCls = 'size-[18px] shrink-0 text-muted-foreground'
  return (
    <div className="flex flex-col gap-0.5">
      {canMarkPaid && (
        <button type="button" className={cn(item, 'text-primary')} onClick={() => onMarkPaid?.(expense)}>
          <CreditCard className="size-[18px] shrink-0" />
          {t('recurring.actions.markPaid')}
        </button>
      )}
      <button type="button" className={item} onClick={() => onEdit?.(expense)}>
        <Pencil className={iconCls} />
        {t('recurring.actions.edit')}
      </button>
      <button type="button" className={item} onClick={() => onHistory?.(expense)}>
        <History className={iconCls} />
        {t('recurring.actions.history')}
      </button>
      <button type="button" className={item} onClick={() => onTogglePause?.(expense)}>
        {expense.isPaused ? <Play className={iconCls} /> : <Pause className={iconCls} />}
        {expense.isPaused ? t('recurring.actions.resume') : t('recurring.actions.pause')}
      </button>
      <button
        type="button"
        className={cn(item, 'text-destructive hover:bg-destructive/10')}
        onClick={() => onDelete?.(expense)}
      >
        <Trash2 className="size-[18px] shrink-0" />
        {t('recurring.actions.delete')}
      </button>
    </div>
  )
}

interface RecurringRowProps extends RowActions {
  data: RecurringRowData
  wide?: boolean
  /** Mobile: open the action sheet for this row (whole-row tap + kebab). */
  onOpenActions?: (e: RecurringExpense) => void
}

export function RecurringRow({
  data,
  wide,
  onOpenActions,
  onMarkPaid,
  onEdit,
  onHistory,
  onTogglePause,
  onDelete,
}: RecurringRowProps) {
  const { t } = useTranslation()
  const { expense: e, status } = data
  const dim = status === 'paused' || status === 'ended'
  const actionable = status === 'overdue' || status === 'duesoon'
  const label = relativeDueLabel(status, e.nextDueDate, t)
  const [menuOpen, setMenuOpen] = useState(false)
  const close = (fn?: (x: RecurringExpense) => void) => () => {
    setMenuOpen(false)
    fn?.(e)
  }
  const rowClick = !wide && onOpenActions ? () => onOpenActions(e) : undefined

  return (
    <div
      className={cn(
        'flex items-center gap-3.5 px-4 py-3 transition-colors',
        wide && 'px-[18px] py-[15px]',
        dim && 'opacity-60',
        rowClick && 'cursor-pointer hover:bg-bg-subtle',
      )}
      onClick={rowClick}
    >
      <CatTile category={e.category} size={wide ? 44 : 42} radius={14} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2.5">
          <span className="truncate text-[15px] font-semibold">{e.name}</span>
          <span className="flex shrink-0 items-baseline gap-1">
            {!e.isFixed && (
              <span className="text-[13px] text-fg-faint" title="Variable amount">
                ~
              </span>
            )}
            <Amount value={e.amount} currency={e.currency || 'RSD'} size={wide ? 16 : 15.5} muted={dim} />
          </span>
        </div>
        <div className="mt-[5px] flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 text-[13px] font-medium text-muted-foreground">
              {t(`recurring.frequency.${e.frequency}`)}
            </span>
            <span className="text-fg-faint">·</span>
            <CatName name={e.category?.name} />
          </div>
          <DueBadge status={status} label={label} />
        </div>
      </div>

      {wide ? (
        <div className="flex shrink-0 items-center gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          {actionable && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onMarkPaid?.(e)}
              className="h-auto gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary hover:bg-primary/[0.16] hover:text-primary [&_svg]:size-[15px]"
            >
              <CreditCard />
              {t('recurring.actions.markPaid')}
            </Button>
          )}
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t('recurring.table.actions')}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
              >
                <MoreVertical className="size-[18px]" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={6} className="w-56 rounded-xl p-1.5">
              <RowActionList
                expense={e}
                status={status}
                onMarkPaid={close(onMarkPaid)}
                onEdit={close(onEdit)}
                onHistory={close(onHistory)}
                onTogglePause={close(onTogglePause)}
                onDelete={close(onDelete)}
              />
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <button
          type="button"
          aria-label={t('recurring.table.actions')}
          onClick={(ev) => {
            ev.stopPropagation()
            onOpenActions?.(e)
          }}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          <MoreVertical className="size-[18px]" />
        </button>
      )}
    </div>
  )
}

/** Flat, urgency-sorted list — one glass card, hairline-separated rows. */
export function RecurringList({
  rows,
  wide,
  onOpenActions,
  onMarkPaid,
  onEdit,
  onHistory,
  onTogglePause,
  onDelete,
}: { rows: RecurringRowData[]; wide?: boolean; onOpenActions?: (e: RecurringExpense) => void } & RowActions) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-glass-1 [&>div+div]:border-t [&>div+div]:border-hairline-soft">
      {rows.map((r) => (
        <RecurringRow
          key={r.expense.id}
          data={r}
          wide={wide}
          onOpenActions={onOpenActions}
          onMarkPaid={onMarkPaid}
          onEdit={onEdit}
          onHistory={onHistory}
          onTogglePause={onTogglePause}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
