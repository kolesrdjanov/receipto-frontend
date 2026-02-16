import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCategories } from '@/hooks/categories/use-categories'
import { Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type CategoryStatsByCurrency } from '@/hooks/dashboard/use-dashboard'

interface CategoryBudgetProgressProps {
  aggCategoryStats: CategoryStatsByCurrency[] | undefined
  exchangeRates: Record<string, number> | undefined
  displayCurrency: string
}

export function CategoryBudgetProgress({
  aggCategoryStats,
  exchangeRates,
  displayCurrency,
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

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          {t('dashboard.budgetProgress.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categoriesWithBudget.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Target className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">{t('dashboard.budgetProgress.noCategoriesWithBudget')}</p>
            <p className="text-xs mt-1">{t('dashboard.budgetProgress.setBudgetHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoriesWithBudget.map((category) => {
              const budgetCurrency = category.budgetCurrency!
              const budgetAmount = category.monthlyBudget!
              const spentAmount = getConvertedSpending(category.name, budgetCurrency)
              const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0
              const isOver = percentage >= 100
              const isWarning = percentage >= 80 && percentage < 100

              const progressColor = isOver
                ? 'bg-red-500'
                : isWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'

              const textColor = isOver
                ? 'text-red-500'
                : isWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'

              return (
                <div
                  key={category.id}
                  className="group cursor-pointer rounded-lg p-2.5 -mx-1 hover:bg-muted/40 transition-colors"
                  onClick={() => navigate(`/receipts?categoryId=${category.id}`)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {category.icon && <span className="text-sm">{category.icon}</span>}
                      <span className="text-sm font-medium truncate">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOver ? (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      ) : isWarning ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      <span className={cn('text-xs font-semibold', textColor)}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn('h-full rounded-full transition-all', progressColor)}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {formatAmount(spentAmount, budgetCurrency)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatAmount(budgetAmount, budgetCurrency)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
