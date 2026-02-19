import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  Bot,
  FlaskConical,
  Gauge,
  PiggyBank,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  useSavingsIntelligenceActions,
  useSavingsIntelligenceOverview,
  useSimulateSavingsScenario,
} from '@/hooks/savings/use-savings-intelligence'

interface SavingsCopilotProps {
  year: number
  month: number
}

function formatAmount(amount: number, currency: string, locale: string) {
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))} ${currency}`
}

function getActionIcon(type: 'budget' | 'price' | 'goal' | 'habit') {
  switch (type) {
    case 'budget':
      return Wallet
    case 'price':
      return TrendingUp
    case 'goal':
      return Target
    default:
      return Sparkles
  }
}

export function SavingsCopilot({ year, month }: SavingsCopilotProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'sr' ? 'sr-RS' : 'en-US'
  const [reductionPercent, setReductionPercent] = useState(12)
  const [horizonMonths, setHorizonMonths] = useState(6)

  const { data: overview, isLoading: overviewLoading } = useSavingsIntelligenceOverview(year, month)
  const { data: actionData, isLoading: actionsLoading } = useSavingsIntelligenceActions(year, month)
  const scenarioMutation = useSimulateSavingsScenario()

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1)),
    [locale, year, month]
  )

  const runScenario = () => {
    scenarioMutation.mutate({
      reductionPercent: Math.min(80, Math.max(1, reductionPercent)),
      horizonMonths: Math.min(24, Math.max(1, horizonMonths)),
    })
  }

  const scenario = scenarioMutation.data
  const acceleratedGoals = scenario?.goalForecasts?.filter((goal) => (goal.timeSavedMonths || 0) > 0) || []

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-amber-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {t('savings.copilot.title')}
          </CardTitle>
          {actionData?.source && (
            <Badge variant={actionData.source === 'ai' ? 'default' : 'outline'}>
              {actionData.source === 'ai'
                ? t('savings.copilot.sourceAi')
                : t('savings.copilot.sourceRule')}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t('savings.copilot.subtitle', { month: monthLabel })}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {overviewLoading && actionsLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : (
          <>
            {overview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" />
                    {t('savings.copilot.healthScore')}
                  </p>
                  <p className="text-xl font-bold">{overview.healthScore}</p>
                  <Progress value={overview.healthScore} className="mt-2 h-1.5" />
                </div>

                <div className="rounded-lg border bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1">
                    <PiggyBank className="h-3.5 w-3.5" />
                    {t('savings.copilot.projectedSavings')}
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {overview.projectedSavings
                      ? formatAmount(overview.projectedSavings.amount, overview.currency, locale)
                      : '-'}
                  </p>
                </div>

                <div className="rounded-lg border bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('savings.copilot.potential')}
                  </p>
                  <p className="text-xl font-bold">
                    {formatAmount(overview.opportunities.totalPotential, overview.currency, locale)}
                  </p>
                </div>

                <div className="rounded-lg border bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('savings.copilot.leakage')}
                  </p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {formatAmount(overview.opportunities.overspendLeakage, overview.currency, locale)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">{t('savings.copilot.actionsTitle')}</div>
              {actionData?.actions?.length ? (
                <div className="space-y-2">
                  {actionData.actions.map((action) => {
                    const ActionIcon = getActionIcon(action.type)
                    return (
                      <div key={action.id} className="rounded-lg border bg-background/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold flex items-center gap-1.5">
                              <ActionIcon className="h-4 w-4 text-primary shrink-0" />
                              <span className="truncate">{action.title}</span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{action.message}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">{t('savings.copilot.impact')}</p>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatAmount(action.expectedMonthlyImpact, actionData.currency, locale)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('savings.copilot.noActions')}</p>
              )}
            </div>
          </>
        )}

        <div className="rounded-lg border bg-background/80 p-3 space-y-3">
          <div className="text-sm font-medium flex items-center gap-1.5">
            <FlaskConical className="h-4 w-4 text-primary" />
            {t('savings.copilot.scenarioTitle')}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <Label htmlFor="copilot-reduction" className="text-xs text-muted-foreground">
                {t('savings.copilot.reductionPercent')}
              </Label>
              <Input
                id="copilot-reduction"
                type="number"
                min={1}
                max={80}
                value={reductionPercent}
                onChange={(e) => setReductionPercent(Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="copilot-horizon" className="text-xs text-muted-foreground">
                {t('savings.copilot.horizonMonths')}
              </Label>
              <Input
                id="copilot-horizon"
                type="number"
                min={1}
                max={24}
                value={horizonMonths}
                onChange={(e) => setHorizonMonths(Number(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={runScenario} disabled={scenarioMutation.isPending}>
                {scenarioMutation.isPending
                  ? t('savings.copilot.runningScenario')
                  : t('savings.copilot.runScenario')}
              </Button>
            </div>
          </div>

          {scenarioMutation.isError && (
            <p className="text-xs text-red-500">{t('savings.copilot.scenarioError')}</p>
          )}

          {scenario && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="rounded-md bg-muted/50 p-2.5">
                <p className="text-xs text-muted-foreground">{t('savings.copilot.monthlySaved')}</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatAmount(scenario.monthlyDelta, scenario.currency, locale)}
                </p>
              </div>
              <div className="rounded-md bg-muted/50 p-2.5">
                <p className="text-xs text-muted-foreground">{t('savings.copilot.horizonSaved')}</p>
                <p className="font-semibold">
                  {formatAmount(scenario.projectedHorizonSavings, scenario.currency, locale)}
                </p>
              </div>
              <div className="rounded-md bg-muted/50 p-2.5">
                <p className="text-xs text-muted-foreground">{t('savings.copilot.newMonthlySpent')}</p>
                <p className="font-semibold">
                  {formatAmount(scenario.scenarioMonthlySpent, scenario.currency, locale)}
                </p>
              </div>
            </div>
          )}

          {acceleratedGoals.length > 0 ? (
            <div className="rounded-md border border-dashed p-2.5">
              <p className="text-xs text-muted-foreground mb-1">{t('savings.copilot.goalsAcceleration')}</p>
              <div className="space-y-1">
                {acceleratedGoals
                  .slice(0, 2)
                  .map((goal) => {
                    const timeSaved = goal.timeSavedMonths ?? 0
                    return (
                      <p key={goal.goalId} className="text-sm">
                        <span className="font-medium">{goal.goalName}</span>
                        {' · '}
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t('savings.copilot.monthsFaster', { count: timeSaved })}
                        </span>
                      </p>
                    )
                  })}
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
