import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FolderOpen, Sparkles, Plus } from 'lucide-react'
import { cn, formatAmount } from '@/lib/utils'
import type { GoalInsights } from '@/hooks/savings/use-savings'

interface CategoryPerformanceProps {
  insights: GoalInsights | undefined
  goalCurrency: string
  isLoading: boolean
}

export function CategoryPerformance({
  insights,
  goalCurrency,
  isLoading,
}: CategoryPerformanceProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    )
  }

  const cat = insights?.categoryInsights
  if (!cat) return null

  const spentPercent =
    cat.budget > 0
      ? Math.min(100, Math.round((cat.spentThisMonth / cat.budget) * 100))
      : 0

  const barColor =
    spentPercent >= 100
      ? 'bg-red-500'
      : spentPercent >= 80
        ? 'bg-amber-500'
        : 'bg-emerald-500'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          <span className="truncate">
            {t('savings.goalDetail.linkedCategory')}:{' '}
            {cat.categoryIcon && (
              <span className="mr-1">{cat.categoryIcon}</span>
            )}
            {cat.categoryName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget vs spent */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {t('savings.goalDetail.budgetSpent')}
            </span>
            <span className="font-medium">
              {formatAmount(Math.round(cat.spentThisMonth))}{' '}
              <span className="text-muted-foreground font-normal">
                / {formatAmount(Math.round(cat.budget))} {cat.budgetCurrency}
              </span>
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                barColor,
              )}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
        </div>

        {/* Underspend potential */}
        {cat.potentialSavings > 0 && (
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {t('savings.goalDetail.underspendPotential')}
            </span>
            <span className="font-medium text-green-600 dark:text-green-400">
              +{formatAmount(Math.round(cat.potentialSavings))}{' '}
              {cat.budgetCurrency}
            </span>
          </div>
        )}

        {/* Auto-savings indicator */}
        {insights && insights.autoSavingsTotal > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-amber-700 dark:text-amber-400">
              {t('savings.goalDetail.autoSavingsActive')}
            </span>
          </div>
        )}

        {/* Manual vs auto breakdown */}
        {insights &&
          (insights.autoSavingsTotal > 0 || insights.manualTotal > 0) && (
            <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                {t('savings.insights.autoSavingsTotal')}:{' '}
                {formatAmount(Math.round(insights.autoSavingsTotal))}{' '}
                {goalCurrency}
              </span>
              <span className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                {t('savings.insights.manualTotal')}:{' '}
                {formatAmount(Math.round(insights.manualTotal))} {goalCurrency}
              </span>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
