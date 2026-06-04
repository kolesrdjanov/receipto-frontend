import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Target, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { WidgetCard, WidgetHead, WidgetEmpty } from './primitives'
import { useCategories } from '@/hooks/categories/use-categories'
import { cn, formatMoney } from '@/lib/utils'
import { type CategoryStatsByCurrency } from '@/hooks/dashboard/use-dashboard'

interface CategoryBudgetProgressProps {
  aggCategoryStats: CategoryStatsByCurrency[] | undefined
  exchangeRates: Record<string, number> | undefined
  /** Accepted for a consistent widget signature; spending is shown in each budget's own currency. */
  displayCurrency?: string
  selectedYear: number
  selectedMonth: number
}

export function CategoryBudgetProgress({
  aggCategoryStats,
  exchangeRates,
  selectedYear,
  selectedMonth,
}: CategoryBudgetProgressProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: categories = [] } = useCategories()

  const categoriesWithBudget = categories.filter(
    (c) => c.monthlyBudget && c.monthlyBudget > 0 && c.budgetCurrency
  )

  const getConvertedSpending = (categoryName: string, budgetCurrency: string): number => {
    if (!aggCategoryStats) return 0
    const categoryStats = aggCategoryStats.find((s) => s.categoryName === categoryName)
    if (!categoryStats?.byCurrency) return 0

    return categoryStats.byCurrency.reduce((sum, item) => {
      if (item.currency === budgetCurrency) return sum + item.totalAmount
      if (!exchangeRates) return sum + item.totalAmount

      const itemRate = exchangeRates[item.currency]
      const targetRate = exchangeRates[budgetCurrency]

      if (!itemRate || itemRate === 0) return sum + item.totalAmount
      const amountInDisplay = item.totalAmount / itemRate
      if (!targetRate || targetRate === 0) return sum + amountInDisplay
      return sum + amountInDisplay * targetRate
    }, 0)
  }

  return (
    <WidgetCard>
      <WidgetHead icon={Target} iconTone="primary" title={t('dashboard.budgetProgress.title')} />

      {categoriesWithBudget.length === 0 ? (
        <WidgetEmpty
          tall
          icon={Target}
          hint={t('dashboard.budgetProgress.setBudgetHint')}
        >
          {t('dashboard.budgetProgress.noCategoriesWithBudget')}
        </WidgetEmpty>
      ) : (
        <div
          className={cn(
            'space-y-3',
            categoriesWithBudget.length > 4 && 'max-h-[21.5rem] overflow-y-auto pr-1',
          )}
        >
          {categoriesWithBudget.map((category) => {
            const budgetCurrency = category.budgetCurrency!
            const budgetAmount = category.monthlyBudget!
            const spentAmount = getConvertedSpending(category.name, budgetCurrency)
            const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0
            const isOver = percentage >= 100
            const isWarning = percentage >= 80 && percentage < 100

            const barColor = isOver ? 'bg-destructive' : isWarning ? 'bg-warning' : 'bg-success'
            const textColor = isOver
              ? 'text-destructive'
              : isWarning
                ? 'text-warning-foreground'
                : 'text-success-foreground'

            return (
              <button
                type="button"
                key={category.id}
                className="-mx-1.5 block w-full rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-bg-subtle"
                onClick={() => {
                  const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
                  const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
                  const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
                  navigate(`/receipts?startDate=${startDate}&endDate=${endDate}&categoryId=${category.id}`)
                }}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {category.icon && <span className="text-sm">{category.icon}</span>}
                    <span className="truncate text-[13.5px] font-medium">{category.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {isOver ? (
                      <XCircle className="size-3.5 text-destructive" />
                    ) : isWarning ? (
                      <AlertTriangle className="size-3.5 text-warning-foreground" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-success-foreground" />
                    )}
                    <span className={cn('text-xs font-semibold tabular-nums', textColor)}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="relative h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
                  <div
                    className={cn('h-full rounded-full transition-all', barColor)}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground tabular-nums">
                  <span>{formatMoney(spentAmount, budgetCurrency)}</span>
                  <span>{formatMoney(budgetAmount, budgetCurrency)}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </WidgetCard>
  )
}
