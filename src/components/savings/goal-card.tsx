import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Calendar, Check, Sparkles, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SavingsGoal } from '@/hooks/savings/use-savings'

interface GoalCardProps {
  goal: SavingsGoal & { potentialSavings?: number | null; categoryBudget?: number | null }
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
}

export function GoalCard({ goal }: GoalCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const progress = goal.targetAmount > 0
    ? Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100))
    : 0

  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={() => navigate(`/savings/goals/${goal.id}`)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {goal.icon && (
              <span className="text-xl shrink-0">{goal.icon}</span>
            )}
            <div className="min-w-0">
              <h3 className="font-medium text-sm truncate">{goal.name}</h3>
              {goal.category && (
                <p className="text-xs text-muted-foreground truncate">
                  {goal.category.icon && <span className="mr-1">{goal.category.icon}</span>}
                  {goal.category.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {goal.isCompleted && (
              <div className="rounded-full bg-green-500/10 p-1">
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
              </div>
            )}
            <span className={cn(
              'text-[10px] font-medium px-1.5 py-0.5 rounded border',
              priorityColors[goal.priority] || priorityColors.medium
            )}>
              {t(`savings.priority.${goal.priority}`)}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{progress}%</span>
            <span className="font-medium">
              {Number(goal.currentAmount).toLocaleString()} / {Number(goal.targetAmount).toLocaleString()} {goal.currency}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          {goal.potentialSavings != null && goal.potentialSavings > 0 && (
            <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              ~{Math.round(goal.potentialSavings).toLocaleString()} {goal.currency} {t('savings.insights.potentialSavings').toLowerCase()}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {deadlineDate && (
            <span className={cn(
              'flex items-center gap-1',
              daysLeft !== null && daysLeft < 0 && 'text-red-500',
              daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 && 'text-amber-500',
            )}>
              <Calendar className="h-3 w-3" />
              {daysLeft !== null && daysLeft < 0
                ? t('savings.goal.overdue')
                : deadlineDate.toLocaleDateString()
              }
            </span>
          )}
          {!deadlineDate && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {t('savings.goal.noDeadline')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
