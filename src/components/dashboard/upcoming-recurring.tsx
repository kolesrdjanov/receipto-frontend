import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CalendarClock, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react'
import { WidgetCard, WidgetHead, WidgetEmpty, Shimmer } from './primitives'
import { MarkPaidModal } from '@/components/recurring-expenses/mark-paid-modal'
import {
  useUpcomingExpenses,
  type UpcomingExpense,
} from '@/hooks/recurring-expenses/use-recurring-expenses'
import { cn } from '@/lib/utils'

interface UpcomingRecurringProps {
  displayCurrency: string
  exchangeRates?: Record<string, number> | null
}

const VARIANT = {
  overdue: {
    row: 'border-destructive-soft bg-destructive-soft/40',
    badge: 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]',
  },
  dueSoon: {
    row: 'border-warning-soft bg-warning-soft/40',
    badge: 'bg-warning-soft text-warning-foreground',
  },
  upcoming: {
    row: 'border-hairline-soft',
    badge: 'bg-bg-subtle text-muted-foreground',
  },
} as const

export function UpcomingRecurring({ displayCurrency, exchangeRates }: UpcomingRecurringProps) {
  const { t } = useTranslation()
  const { data: upcoming, isLoading } = useUpcomingExpenses(30)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [expenseToPay, setExpenseToPay] = useState<UpcomingExpense | null>(null)

  const convertAmount = (amount: number, fromCurrency: string): number => {
    const num = Number(amount)
    if (fromCurrency === displayCurrency || !exchangeRates) return num
    const rate = exchangeRates[fromCurrency]
    if (!rate || rate === 0) return num
    return num / rate
  }

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const handlePay = (expense: UpcomingExpense) => {
    setExpenseToPay(expense)
    setMarkPaidOpen(true)
  }

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  if (isLoading) {
    return (
      <WidgetCard>
        <WidgetHead icon={CalendarClock} iconTone="primary" title={t('recurring.dashboard.title')} />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </WidgetCard>
    )
  }

  const totalItems =
    (upcoming?.overdue?.length ?? 0) + (upcoming?.dueSoon?.length ?? 0) + (upcoming?.upcoming?.length ?? 0)

  if (totalItems === 0) {
    return (
      <WidgetCard>
        <WidgetHead icon={CalendarClock} iconTone="primary" title={t('recurring.dashboard.title')} />
        <WidgetEmpty tall>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" />
            {t('recurring.dashboard.allCaughtUp')}
          </span>
          <Link
            to="/recurring"
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
          >
            {t('recurring.dashboard.manageExpenses')}
            <ArrowRight className="size-3" />
          </Link>
        </WidgetEmpty>
      </WidgetCard>
    )
  }

  // Total upcoming in display currency
  const allItems = [...(upcoming?.overdue ?? []), ...(upcoming?.dueSoon ?? []), ...(upcoming?.upcoming ?? [])]
  const totalUpcoming = allItems.reduce((sum, item) => sum + convertAmount(item.amount, item.currency), 0)

  const renderGroup = (items: UpcomingExpense[], variant: keyof typeof VARIANT) => {
    if (items.length === 0) return null
    const labelKey = {
      overdue: 'recurring.dashboard.overdue',
      dueSoon: 'recurring.dashboard.dueSoon',
      upcoming: 'recurring.dashboard.upcoming',
    }[variant]

    return (
      <div className="space-y-1.5">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            VARIANT[variant].badge,
          )}
        >
          {t(labelKey)} ({items.length})
        </span>
        {items.slice(0, 3).map((item, idx) => (
          <div
            key={`${item.id}-${item.dueDate}-${idx}`}
            className={cn('flex items-center gap-2.5 rounded-xl border p-2', VARIANT[variant].row)}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-bg-subtle text-fg-2">
              {item.category?.icon ? (
                <span className="text-sm">{item.category.icon}</span>
              ) : (
                <CreditCard className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium">{item.name}</p>
              <p className="text-[12px] text-muted-foreground">{formatDueDate(item.dueDate)}</p>
            </div>
            <span className="shrink-0 text-[13.5px] font-semibold tabular-nums">
              {formatAmount(convertAmount(item.amount, item.currency))}
            </span>
            <button
              type="button"
              onClick={() => handlePay(item)}
              title={t('recurring.actions.pay')}
              aria-label={t('recurring.actions.pay')}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-primary transition-colors hover:bg-bg-subtle"
            >
              <CreditCard className="size-[15px]" />
            </button>
          </div>
        ))}
        {items.length > 3 && (
          <p className="pl-1 text-[12px] text-muted-foreground">
            +{items.length - 3} {t('recurring.dashboard.more')}
          </p>
        )}
      </div>
    )
  }

  return (
    <WidgetCard>
      <WidgetHead
        icon={CalendarClock}
        iconTone="primary"
        title={t('recurring.dashboard.title')}
        trailing={<span className="text-[13.5px] font-semibold tabular-nums">{formatAmount(totalUpcoming)}</span>}
      />
      <div className="space-y-3">
        {renderGroup(upcoming?.overdue ?? [], 'overdue')}
        {renderGroup(upcoming?.dueSoon ?? [], 'dueSoon')}
        {renderGroup(upcoming?.upcoming ?? [], 'upcoming')}

        <Link
          to="/recurring"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          {t('recurring.dashboard.viewAll')}
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <MarkPaidModal open={markPaidOpen} onOpenChange={setMarkPaidOpen} expense={expenseToPay} />
    </WidgetCard>
  )
}
