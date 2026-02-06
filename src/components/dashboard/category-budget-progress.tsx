import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  displayCurrency
}: CategoryBudgetProgressProps) {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  const categoriesWithBudget = categories.filter((c) => c.monthlyBudget && c.monthlyBudget > 0 && c.budgetCurrency)

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const budgetCurrency = selectedCategory?.budgetCurrency || displayCurrency

  // Convert spending TO the budget's currency
  const getConvertedSpending = (): number => {
    if (!selectedCategory || !aggCategoryStats || !selectedCategory.budgetCurrency) return 0

    const categoryStats = aggCategoryStats.find((s) => s.categoryName === selectedCategory.name)
    if (!categoryStats?.byCurrency) return 0

    const targetCurrency = selectedCategory.budgetCurrency

    return categoryStats.byCurrency.reduce((sum, item) => {
      if (item.currency === targetCurrency) {
        // Same currency, no conversion needed
        return sum + item.totalAmount
      }
      if (!exchangeRates) return sum + item.totalAmount

      // Convert from item.currency to targetCurrency
      // exchangeRates are based on displayCurrency (the dashboard's selected currency)
      // Convert: item.currency -> displayCurrency -> targetCurrency (budget currency)

      const itemRate = exchangeRates[item.currency] // item.currency to displayCurrency
      const targetRate = exchangeRates[targetCurrency] // targetCurrency to displayCurrency

      if (!itemRate || itemRate === 0) return sum + item.totalAmount

      // Convert to displayCurrency first (intermediate step)
      const amountInDisplay = item.totalAmount / itemRate

      // Then convert to target currency (budget currency)
      if (!targetRate || targetRate === 0) return sum + amountInDisplay
      const amountInTarget = amountInDisplay * targetRate

      return sum + amountInTarget
    }, 0)
  }

  const spentAmount = getConvertedSpending()
  const budgetAmount = selectedCategory?.monthlyBudget ?? 0

  const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0
  const isOverBudget = percentage >= 100
  const isWarning = percentage >= 80 && percentage < 100

  const formatAmount = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return '0'
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency || budgetCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatBudgetInDropdown = (cat: typeof categories[0]) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: cat.budgetCurrency || displayCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cat.monthlyBudget || 0)
  }

  const getStatusColor = () => {
    if (isOverBudget) return 'text-red-500'
    if (isWarning) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500'
    if (isWarning) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusIcon = () => {
    if (isOverBudget) return <XCircle className="h-5 w-5 text-red-500" />
    if (isWarning) return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }

  const getStatusText = () => {
    if (isOverBudget) return t('dashboard.budgetProgress.overBudget')
    if (isWarning) return t('dashboard.budgetProgress.nearingLimit')
    return t('dashboard.budgetProgress.onTrack')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          {t('dashboard.budgetProgress.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder={t('dashboard.budgetProgress.selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              {categoriesWithBudget.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {t('dashboard.budgetProgress.noCategoriesWithBudget')}
                </div>
              ) : (
                categoriesWithBudget.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      {category.icon && <span>{category.icon}</span>}
                      <span>{category.name}</span>
                      <span className="text-muted-foreground">
                        ({formatBudgetInDropdown(category)})
                      </span>
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {selectedCategoryId && selectedCategory ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedCategory.icon && (
                    <span className="text-lg">{selectedCategory.icon}</span>
                  )}
                  <span className="font-medium">{selectedCategory.name}</span>
                </div>
                {getStatusIcon()}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('dashboard.budgetProgress.spent')}</span>
                  <span className={cn('font-medium', getStatusColor())}>
                    {formatAmount(spentAmount)} / {formatAmount(budgetAmount)}
                  </span>
                </div>

                <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full transition-all', getProgressColor())}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className={cn('text-sm font-medium', getStatusColor())}>
                    {percentage.toFixed(0)}%
                  </span>
                  <span className={cn('text-xs', getStatusColor())}>
                    {getStatusText()}
                  </span>
                </div>

                {budgetAmount > spentAmount && (
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.budgetProgress.remaining', {
                      amount: formatAmount(budgetAmount - spentAmount),
                    })}
                  </p>
                )}

                {isOverBudget && (
                  <p className="text-xs text-red-500">
                    {t('dashboard.budgetProgress.exceededBy', {
                      amount: formatAmount(spentAmount - budgetAmount),
                    })}
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground border-t pt-2">
                {t('dashboard.budgetProgress.currencyNote', { currency: budgetCurrency })}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <Target className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">{t('dashboard.budgetProgress.selectToView')}</p>
              {categoriesWithBudget.length === 0 && (
                <p className="text-xs mt-1">{t('dashboard.budgetProgress.setBudgetHint')}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
