import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Check, Lightbulb } from 'lucide-react'
import { cn, formatAmount } from '@/lib/utils'
import type { SavingsGoal } from '@/hooks/savings/use-savings'

interface IntelligenceTip {
  icon: string
  text: string
}

interface GoalCardProps {
  goal: SavingsGoal & {
    progressPercent?: number
    potentialSavings?: number | null
    categoryBudget?: number | null
  }
  intelligenceTip?: IntelligenceTip | null
  isOnTrack?: boolean | null
}

export function GoalCard({ goal, intelligenceTip, isOnTrack }: GoalCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const progress =
    goal.progressPercent ??
    (goal.targetAmount > 0
      ? Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100))
      : 0)

  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null
  const goalColor = goal.color || '#3b82f6'

  // Determine status: completed, on track, or behind
  const statusOnTrack = isOnTrack ?? true
  const statusLabel = goal.isCompleted
    ? t('savings.goals.completed', 'Completed')
    : statusOnTrack
      ? t('savings.insights.onTrack', 'On track')
      : t('savings.insights.behind', 'Behind')
  const statusColorClass = goal.isCompleted
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    : statusOnTrack
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'

  // Progress bar color
  const barColor = goal.isCompleted
    ? 'bg-emerald-500'
    : statusOnTrack
      ? 'bg-emerald-500'
      : 'bg-amber-500'

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 overflow-hidden"
      onClick={() => navigate(`/savings/goals/${goal.id}`)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: icon + name + status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon with color-tinted background */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
              style={{
                backgroundColor: `${goalColor}20`,
                color: goalColor,
              }}
            >
              {goal.icon || '🎯'}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-sm truncate">{goal.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {goal.category && (
                  <span className="truncate">
                    {goal.category.icon && <span className="mr-0.5">{goal.category.icon}</span>}
                    {goal.category.name}
                  </span>
                )}
                {goal.category && deadlineDate && (
                  <span className="text-muted-foreground/50">·</span>
                )}
                {deadlineDate && (
                  <span className="flex items-center gap-0.5 shrink-0">
                    <Calendar className="h-3 w-3" />
                    {deadlineDate.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {goal.isCompleted && (
              <div className="rounded-full bg-emerald-500/15 p-1">
                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <span
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                statusColorClass
              )}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Amount + progress */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium">
              {formatAmount(Math.round(Number(goal.currentAmount)))} / {formatAmount(Math.round(Number(goal.targetAmount)))} {goal.currency}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className={cn('h-full rounded-full transition-all duration-500', barColor)}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Inline intelligence tip */}
        {intelligenceTip && (
          <div
            className={cn(
              'flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
              statusOnTrack
                ? 'bg-emerald-500/5 border border-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-500/5 border border-amber-500/15 text-amber-700 dark:text-amber-400'
            )}
          >
            <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{intelligenceTip.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
