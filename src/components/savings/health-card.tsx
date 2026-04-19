import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Settings, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatAmount } from '@/lib/utils'
import { useSavingsIntelligenceOverview } from '@/hooks/savings/use-savings-intelligence'
import { useSavingsOverview } from '@/hooks/savings/use-savings'
import { useMe } from '@/hooks/users/use-me'

function HealthScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(score, 0), 100)
  const offset = circumference - (progress / 100) * circumference

  const color =
    score >= 70
      ? 'text-emerald-400'
      : score >= 50
        ? 'text-amber-400'
        : 'text-red-400'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(color, 'transition-all duration-700 ease-out')}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-white">{score}</span>
      </div>
    </div>
  )
}

function HealthCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-gradient-to-br from-blue-950 to-indigo-950 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <Skeleton className="h-24 w-24 rounded-full bg-white/10 shrink-0 mx-auto sm:mx-0" />
        <div className="flex-1 space-y-3 min-w-0">
          <Skeleton className="h-5 w-40 bg-white/10" />
          <Skeleton className="h-4 w-56 bg-white/10" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28 rounded-full bg-white/10" />
            <Skeleton className="h-6 w-32 rounded-full bg-white/10" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-12 bg-white/10" />
            <Skeleton className="h-5 w-20 bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HealthCard() {
  const { t } = useTranslation()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: me, isLoading: meLoading } = useMe()
  const { data: intelligence, isLoading: intelligenceLoading } =
    useSavingsIntelligenceOverview(year, month)
  const { data: overview, isLoading: overviewLoading } =
    useSavingsOverview(year, month)

  const isLoading = intelligenceLoading || overviewLoading || meLoading

  if (isLoading) {
    return <HealthCardSkeleton />
  }

  // No income set — prompt to set it
  if (!me?.monthlyIncome) {
    return (
      <div className="rounded-xl border border-white/5 bg-gradient-to-br from-blue-950 to-indigo-950 p-6 text-center space-y-3">
        <Settings className="h-8 w-8 mx-auto text-blue-300/50" />
        <p className="text-sm text-blue-200/70">
          {t('savings.snapshot.noIncome', 'Set your monthly income in Settings to see your savings rate and health score.')}
        </p>
        <Button
          asChild
          size="sm"
          className="bg-white/10 text-white hover:bg-white/20 border-0"
        >
          <Link to="/settings/profile">
            <Settings className="h-4 w-4" />
            {t('savings.snapshot.goToSettings', 'Go to Settings')}
          </Link>
        </Button>
      </div>
    )
  }

  const healthScore = intelligence?.healthScore ?? 0
  const savingsRate = intelligence?.savingsRate ?? 0
  const currency = intelligence?.currency ?? overview?.incomeCurrency ?? 'RSD'
  const currentSavings = intelligence?.currentSavings?.amount ?? 0
  const spent = intelligence?.spent?.amount ?? 0
  const income = intelligence?.income?.amount ?? overview?.monthlyIncome ?? 0

  // Health label
  const healthLabel =
    healthScore >= 70
      ? t('savings.health.good', 'Good financial health')
      : healthScore >= 50
        ? t('savings.health.fair', 'Fair financial health')
        : t('savings.health.needsAttention', 'Needs attention')

  // Goal signals
  const goalSignals = intelligence?.goalSignals ?? []
  const totalGoals = goalSignals.length
  const onTrackGoals = goalSignals.filter(
    (s) => s.isOnTrack === true || s.isOnTrack === null
  ).length

  return (
    <div className="rounded-xl border border-white/5 bg-gradient-to-br from-blue-950 to-indigo-950 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Score ring */}
        <div className="shrink-0 mx-auto sm:mx-0">
          <HealthScoreRing score={healthScore} />
        </div>

        {/* Summary */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h3 className="text-lg font-semibold text-white">{healthLabel}</h3>
          <p className="text-sm text-blue-200/70 mt-0.5">
            {savingsRate !== null && savingsRate !== undefined
              ? t('savings.health.savingsRateText', '{{rate}}% savings rate', { rate: Math.round(savingsRate) })
              : ''}
            {currentSavings > 0 && savingsRate !== null
              ? ` · ${formatAmount(Math.round(currentSavings))} ${currency} ${t('savings.health.savedThisMonth', 'saved this month')}`
              : ''}
          </p>

          {/* Trend badges */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
            {savingsRate !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
                  savingsRate >= 0
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-red-500/15 text-red-300'
                )}
              >
                {savingsRate >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.round(Math.abs(savingsRate))}% {t('savings.health.savingsRate', 'savings rate')}
              </span>
            )}
            {totalGoals > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 text-blue-300 px-2.5 py-1 text-xs font-medium">
                <Target className="h-3 w-3" />
                {t('savings.health.goalsOnTrack', '{{on}} of {{total}} on track', {
                  on: onTrackGoals,
                  total: totalGoals,
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/5">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-blue-300/50 mb-1">
            {t('savings.snapshot.saved', 'Saved')}
          </p>
          <p
            className={cn(
              'text-sm sm:text-base font-semibold',
              currentSavings >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {formatAmount(Math.round(currentSavings))} {currency}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-blue-300/50 mb-1">
            {t('savings.snapshot.spent', 'Spent')}
          </p>
          <p className="text-sm sm:text-base font-semibold text-white/90">
            {formatAmount(Math.round(spent))} {currency}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-blue-300/50 mb-1">
            {t('savings.snapshot.income', 'Income')}
          </p>
          <p className="text-sm sm:text-base font-semibold text-white/90">
            {formatAmount(Math.round(income))} {currency}
          </p>
        </div>
      </div>
    </div>
  )
}
