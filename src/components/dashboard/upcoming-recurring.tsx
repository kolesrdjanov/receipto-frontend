import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkPaidModal } from '@/components/recurring-expenses/mark-paid-modal'
import {
  useUpcomingExpenses,
  type UpcomingExpense,
} from '@/hooks/recurring-expenses/use-recurring-expenses'
import { CalendarClock, CreditCard, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

interface UpcomingRecurringProps {
  displayCurrency: string
  exchangeRates?: Record<string, number> | null
}

export function UpcomingRecurring({ displayCurrency, exchangeRates }: UpcomingRecurringProps) {
  const { t } = useTranslation()
  const { data: upcoming, isLoading } = useUpcomingExpenses(30)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [expenseToPay, setExpenseToPay] = useState<UpcomingExpense | null>(null)

  const convertAmount = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === displayCurrency || !exchangeRates) return amount
    const rate = exchangeRates[fromCurrency]
    if (!rate || rate === 0) return amount
    return amount / rate
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
      <Card className="card-interactive">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const totalItems = (upcoming?.overdue?.length ?? 0) + (upcoming?.dueSoon?.length ?? 0) + (upcoming?.upcoming?.length ?? 0)

  if (totalItems === 0) {
    return (
      <Card className="card-interactive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-primary" />
            {t('recurring.dashboard.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            {t('recurring.dashboard.allCaughtUp')}
          </div>
          <Link to="/recurring" className="inline-flex items-center gap-1 text-sm text-primary mt-3 hover:underline">
            {t('recurring.dashboard.manageExpenses')}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Calculate total upcoming in display currency
  const allItems = [...(upcoming?.overdue ?? []), ...(upcoming?.dueSoon ?? []), ...(upcoming?.upcoming ?? [])]
  const totalUpcoming = allItems.reduce((sum, item) => sum + convertAmount(item.amount, item.currency), 0)

  const renderItems = (items: UpcomingExpense[], variant: 'overdue' | 'dueSoon' | 'upcoming') => {
    if (items.length === 0) return null

    const variantStyles = {
      overdue: 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20',
      dueSoon: 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20',
      upcoming: '',
    }

    const labelKey = {
      overdue: 'recurring.dashboard.overdue',
      dueSoon: 'recurring.dashboard.dueSoon',
      upcoming: 'recurring.dashboard.upcoming',
    }

    return (
      <div className="space-y-1.5">
        <Badge
          variant={variant === 'overdue' ? 'destructive' : variant === 'dueSoon' ? 'secondary' : 'outline'}
          className="text-xs"
        >
          {t(labelKey[variant])} ({items.length})
        </Badge>
        {items.slice(0, 3).map((item, idx) => (
          <div
            key={`${item.id}-${item.dueDate}-${idx}`}
            className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${variantStyles[variant]}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {item.category?.icon && <span className="text-sm shrink-0">{item.category.icon}</span>}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatDueDate(item.dueDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold">
                {formatAmount(convertAmount(item.amount, item.currency))}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handlePay(item)}
                title={t('recurring.actions.pay')}
              >
                <CreditCard className="h-3.5 w-3.5 text-primary" />
              </Button>
            </div>
          </div>
        ))}
        {items.length > 3 && (
          <p className="text-xs text-muted-foreground pl-2">
            +{items.length - 3} {t('recurring.dashboard.more')}
          </p>
        )}
      </div>
    )
  }

  return (
    <Card className="card-interactive">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            {t('recurring.dashboard.title')}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {formatAmount(totalUpcoming)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {renderItems(upcoming?.overdue ?? [], 'overdue')}
        {renderItems(upcoming?.dueSoon ?? [], 'dueSoon')}
        {renderItems(upcoming?.upcoming ?? [], 'upcoming')}

        <Link to="/recurring" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          {t('recurring.dashboard.viewAll')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>

      <MarkPaidModal
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        expense={expenseToPay}
      />
    </Card>
  )
}
