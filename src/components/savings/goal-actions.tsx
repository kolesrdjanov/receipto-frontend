import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Zap, ArrowRight } from 'lucide-react'
import { formatAmount } from '@/lib/utils'
import { useSavingsIntelligenceActions } from '@/hooks/savings/use-savings-intelligence'
import { useGoalInsights } from '@/hooks/savings/use-savings'

interface GoalActionsProps {
  goalId: string
  year: number
  month: number
}

export function GoalActions({ goalId, year, month }: GoalActionsProps) {
  const { t } = useTranslation()
  const { data: actionsData, isLoading: actionsLoading } =
    useSavingsIntelligenceActions(year, month)
  const { data: insights } = useGoalInsights(goalId)

  const actions = actionsData?.actions?.slice(0, 3) ?? []
  const source = actionsData?.source
  const currency = actionsData?.currency ?? 'RSD'

  if (actionsLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2 p-3 rounded-lg border">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          {t('savings.goalDetail.reachFaster')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('savings.goalDetail.noSuggestions')}
          </p>
        ) : (
          <>
            {actions.map((action) => {
              const monthsToTarget = insights?.pace?.monthsToTarget
              const acceleration =
                monthsToTarget && action.expectedMonthlyImpact > 0
                  ? Math.max(1, Math.round(monthsToTarget * 0.15))
                  : null

              return (
                <div
                  key={action.id}
                  className="rounded-lg border p-3 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {action.message}
                      </p>
                    </div>
                    {action.expectedMonthlyImpact > 0 && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 whitespace-nowrap shrink-0">
                        +{formatAmount(Math.round(action.expectedMonthlyImpact))}{' '}
                        {currency}/{t('savings.goalDetail.mo')}
                      </span>
                    )}
                  </div>
                  {acceleration && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      {t('savings.goalDetail.reachFasterBy', {
                        count: acceleration,
                      })}
                    </p>
                  )}
                </div>
              )
            })}

            {/* Source footer */}
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
              {source === 'ai' ? (
                <>
                  <Sparkles className="h-3 w-3" />
                  <span>{t('savings.goalDetail.poweredByAi')}</span>
                </>
              ) : (
                <span>{t('savings.goalDetail.ruleBased')}</span>
              )}
              <span className="text-muted-foreground/50">·</span>
              <span>{t('savings.goalDetail.updatedDaily')}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
