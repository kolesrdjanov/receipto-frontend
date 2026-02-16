import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getDaysInMonth } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, Calculator } from 'lucide-react'
import { cn } from '@/lib/utils'
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
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

  if (!forecast) {
    return (
      <Card className="card-interactive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4 text-primary" />
            {t('dashboard.forecast.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            {t('dashboard.noDataThisMonth')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-interactive">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 text-primary" />
          {t('dashboard.forecast.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Projected total */}
        <div>
          <span className="text-xs text-muted-foreground font-medium">
            {forecast.isCurrentMonth
              ? t('dashboard.forecast.projectedTotal')
              : t('dashboard.forecast.monthTotal')}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <p className="text-2xl font-bold">{formatAmount(forecast.projected)}</p>
            {forecast.vsLastMonth !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full',
                  forecast.vsLastMonth > 0
                    ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                    : 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                )}
              >
                {forecast.vsLastMonth > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(forecast.vsLastMonth)}%
              </div>
            )}
          </div>
        </div>

        {/* Spent so far (only for current month) */}
        {forecast.isCurrentMonth && (
          <div className="p-2.5 rounded-lg bg-muted/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('dashboard.forecast.spentSoFar')}</span>
              <span className="text-sm font-semibold">{formatAmount(forecast.spentSoFar)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('dashboard.forecast.dailyAvg')}</span>
              <span className="text-sm font-semibold">{formatAmount(forecast.dailyAvg)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('dashboard.forecast.daysProgress')}</span>
              <span className="text-sm font-semibold">
                {forecast.daysSoFar}/{forecast.totalDaysInMonth}
              </span>
            </div>
          </div>
        )}

        {/* Last month comparison */}
        {forecast.lastMonthTotal > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
            <span>{t('dashboard.forecast.lastMonth')}</span>
            <span className="font-medium">{formatAmount(forecast.lastMonthTotal)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
