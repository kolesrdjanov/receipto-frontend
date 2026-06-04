import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getDaysInMonth } from 'date-fns'
import { Calculator } from 'lucide-react'
import { WidgetCard, WidgetHead, WidgetEmpty, TrendPill } from './primitives'
import { formatMoney } from '@/lib/utils'
import { type CurrencyBreakdown, type DailyStatsByCurrency, type MonthlyStatsByCurrency } from '@/hooks/dashboard/use-dashboard'

interface MonthlyForecastProps {
  dailyStats: DailyStatsByCurrency[] | undefined
  monthlyStats: MonthlyStatsByCurrency[] | undefined
  selectedYear: number
  selectedMonth: number
  displayCurrency: string
  exchangeRates: Record<string, number> | undefined
}

export function MonthlyForecast({
  dailyStats,
  monthlyStats,
  selectedYear,
  selectedMonth,
  displayCurrency,
  exchangeRates,
}: MonthlyForecastProps) {
  const { t } = useTranslation()

  const convertBreakdown = (breakdown: CurrencyBreakdown[]): number => {
    if (!exchangeRates) return 0
    return breakdown.reduce((sum, item) => {
      if (item.currency === displayCurrency) return sum + item.totalAmount
      const rate = exchangeRates[item.currency]
      if (!rate || rate === 0) return sum + item.totalAmount
      return sum + item.totalAmount / rate
    }, 0)
  }

  const forecast = useMemo(() => {
    if (!dailyStats) return null

    const totalDaysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1))
    const now = new Date()
    const isCurrentMonth = now.getFullYear() === selectedYear && now.getMonth() + 1 === selectedMonth
    const daysSoFar = isCurrentMonth ? now.getDate() : totalDaysInMonth

    let spentSoFar = 0
    let daysWithSpending = 0

    for (const day of dailyStats) {
      const total = convertBreakdown(day.byCurrency)
      spentSoFar += total
      if (total > 0) daysWithSpending++
    }

    const dailyAvg = daysSoFar > 0 ? spentSoFar / daysSoFar : 0
    const projected = isCurrentMonth ? dailyAvg * totalDaysInMonth : spentSoFar

    // Get last month's total for comparison
    let lastMonthTotal = 0
    if (monthlyStats) {
      const lastMonth = selectedMonth === 1 ? 12 : selectedMonth - 1
      const lastYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear
      const lastMonthStr = `${lastYear}-${String(lastMonth).padStart(2, '0')}`
      const found = monthlyStats.find((m) => m.month === lastMonthStr)
      if (found) lastMonthTotal = convertBreakdown(found.byCurrency)
    }

    const vsLastMonth = lastMonthTotal > 0
      ? Math.round(((projected - lastMonthTotal) / lastMonthTotal) * 100)
      : 0

    return {
      spentSoFar,
      projected,
      dailyAvg,
      daysSoFar,
      totalDaysInMonth,
      daysWithSpending,
      lastMonthTotal,
      vsLastMonth,
      isCurrentMonth,
    }
  }, [dailyStats, monthlyStats, selectedYear, selectedMonth, exchangeRates, displayCurrency])

  if (!forecast || forecast.spentSoFar === 0) {
    return (
      <WidgetCard>
        <WidgetHead icon={Calculator} iconTone="primary" title={t('dashboard.forecast.title')} />
        <WidgetEmpty tall>{t('dashboard.noDataThisMonth')}</WidgetEmpty>
      </WidgetCard>
    )
  }

  return (
    <WidgetCard>
      <WidgetHead icon={Calculator} iconTone="primary" title={t('dashboard.forecast.title')} />

      {/* Projected total */}
      <div>
        <span className="t-xs text-muted-foreground">
          {forecast.isCurrentMonth
            ? t('dashboard.forecast.projectedTotal')
            : t('dashboard.forecast.monthTotal')}
        </span>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-[26px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">
            {formatMoney(forecast.projected, displayCurrency)}
          </p>
          <TrendPill value={forecast.vsLastMonth} />
        </div>
      </div>

      {/* Spent so far (only for current month) */}
      {forecast.isCurrentMonth && (
        <div className="mt-4 space-y-2 rounded-xl bg-bg-subtle p-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">{t('dashboard.forecast.spentSoFar')}</span>
            <span className="text-[13px] font-semibold tabular-nums">{formatMoney(forecast.spentSoFar, displayCurrency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">{t('dashboard.forecast.dailyAvg')}</span>
            <span className="text-[13px] font-semibold tabular-nums">{formatMoney(forecast.dailyAvg, displayCurrency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">{t('dashboard.forecast.daysProgress')}</span>
            <span className="text-[13px] font-semibold tabular-nums">
              {forecast.daysSoFar}/{forecast.totalDaysInMonth}
            </span>
          </div>
        </div>
      )}

      {/* Last month comparison */}
      {forecast.lastMonthTotal > 0 && (
        <div className="mt-auto flex items-center justify-between border-t border-hairline-soft pt-3 text-[13px] text-muted-foreground">
          <span>{t('dashboard.forecast.lastMonth')}</span>
          <span className="font-medium tabular-nums">{formatMoney(forecast.lastMonthTotal, displayCurrency)}</span>
        </div>
      )}
    </WidgetCard>
  )
}
