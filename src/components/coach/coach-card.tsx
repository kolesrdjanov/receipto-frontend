import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { useCoach, type Insight } from '@/hooks/coach/use-coach'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('sr-RS').format(Math.round(amount))
}

function InsightIcon({ insight }: { insight: Insight }) {
  const iconProps = { className: 'h-3.5 w-3.5 shrink-0' }

  switch (insight.type) {
    case 'spending_increase':
      return <TrendingUp {...iconProps} />
    case 'spending_decrease':
      return <TrendingDown {...iconProps} />
    case 'budget_exceeded':
    case 'budget_warning':
      return <AlertTriangle {...iconProps} />
    case 'budget_on_track':
      return <CheckCircle2 {...iconProps} />
    case 'tip':
      return <Lightbulb {...iconProps} />
    default:
      return <Sparkles {...iconProps} />
  }
}

function InsightItem({ insight }: { insight: Insight }) {
  const navigate = useNavigate()

  const toneStyles = {
    positive: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    neutral: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    celebration: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-2.5 py-2 rounded-md border text-xs transition-all duration-200',
        toneStyles[insight.tone]
      )}
    >
      <div className="mt-0.5">
        <InsightIcon insight={insight} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{insight.title}</p>
        <p className="text-[11px] opacity-75 mt-0.5 line-clamp-2">{insight.message}</p>
      </div>
      {insight.actionRoute && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 shrink-0"
          onClick={() => navigate(insight.actionRoute!)}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

export function CoachCard() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useCoach()

  if (isLoading) {
    return (
      <Card className="coach-card h-full">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="h-5 w-28 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="h-14 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null
  }

  const { greeting, insights, summary, tip } = data

  return (
    <Card className="coach-card overflow-hidden h-full">
      <CardHeader className="pb-2 pt-4 px-4 coach-header">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <CardTitle className="text-sm font-semibold">
            {t('coach.title')}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{greeting}</p>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
        {/* Weekly Summary */}
        {summary && (
          <div className="p-2.5 rounded-lg bg-muted/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t('coach.thisWeek')}</span>
              {summary.weeklyChangePercent !== 0 && (
                <div
                  className={cn(
                    'flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded',
                    summary.weeklyChangePercent > 0
                      ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                      : 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                  )}
                >
                  {summary.weeklyChangePercent > 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(summary.weeklyChangePercent)}% {t('coach.vsLastWeek')}
                </div>
              )}
            </div>
            <p className="text-lg font-semibold">
              {formatAmount(summary.totalSpentThisWeek)} <span className="text-xs font-normal text-muted-foreground">RSD</span>
            </p>
            {summary.topCategory && (
              <p className="text-[11px] text-muted-foreground">
                {t('coach.topSpending')}: {summary.topCategory.name} ({formatAmount(summary.topCategory.amount)} RSD)
              </p>
            )}
          </div>
        )}

        {/* Insights with full messages */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            {insights.slice(0, 2).map((insight: Insight) => (
              <InsightItem key={insight.id} insight={insight} />
            ))}
          </div>
        )}

        {/* Tip */}
        {tip && insights.length === 0 && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/40 text-xs">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">{tip.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{tip.message}</p>
            </div>
          </div>
        )}

        {insights.length === 0 && !tip && (
          <p className="text-xs text-muted-foreground text-center py-2">
            {t('coach.noInsights')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
