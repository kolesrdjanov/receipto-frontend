import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  TrendingDown,
} from 'lucide-react'
import {
  useSavingsGoal,
  useDeleteSavingsGoal,
  useRemoveContribution,
  useGoalInsights,
} from '@/hooks/savings/use-savings'
import { GoalModal } from '@/components/savings/goal-modal'
import { ContributionModal } from '@/components/savings/contribution-modal'
import { GoalActions } from '@/components/savings/goal-actions'
import { CategoryPerformance } from '@/components/savings/category-performance'
import { toast } from 'sonner'
import { cn, formatAmount } from '@/lib/utils'

const INITIAL_CONTRIBUTIONS_COUNT = 5

function ProgressRing({
  progress,
  color,
  size = 64,
}: {
  progress: number
  color: string
  size?: number
}) {
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(Math.max(progress, 0), 100)
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-primary/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{clamped}%</span>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </AppLayout>
  )
}

export default function SavingsGoalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: goal, isLoading } = useSavingsGoal(id!)
  const { data: insights, isLoading: insightsLoading } = useGoalInsights(id!)
  const deleteGoal = useDeleteSavingsGoal()
  const removeContribution = useRemoveContribution(id!)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [contributionModalOpen, setContributionModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingContributionId, setDeletingContributionId] = useState<
    string | null
  >(null)
  const [showAllContributions, setShowAllContributions] = useState(false)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (!goal) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">
          {t('savings.goal.notFound')}
        </div>
      </AppLayout>
    )
  }

  const progress =
    goal.targetAmount > 0
      ? Math.min(
          100,
          Math.round(
            (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100,
          ),
        )
      : 0

  const remaining = Math.max(
    0,
    Number(goal.targetAmount) - Number(goal.currentAmount),
  )
  const goalColor = goal.color || '#3b82f6'

  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null
  const daysLeft = deadlineDate
    ? Math.ceil(
        (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null

  // Status determination
  const getStatus = () => {
    if (goal.isCompleted) {
      return {
        label: t('savings.goals.completed'),
        colorClass:
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        icon: <Check className="h-3 w-3" />,
      }
    }
    if (!goal.deadline) {
      return null // No badge for goals without deadlines
    }
    if (insights?.pace?.isOnTrack === true) {
      return {
        label: t('savings.insights.onTrack'),
        colorClass:
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        icon: null,
      }
    }
    if (insights?.pace?.isOnTrack === false) {
      return {
        label: t('savings.insights.behind'),
        colorClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        icon: <TrendingDown className="h-3 w-3" />,
      }
    }
    return null
  }

  const status = getStatus()

  // Priority color
  const priorityColor =
    goal.priority === 'high'
      ? 'text-red-600 dark:text-red-400'
      : goal.priority === 'medium'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-muted-foreground'

  // Contributions
  const contributions = goal.contributions ?? []
  const visibleContributions = showAllContributions
    ? contributions
    : contributions.slice(0, INITIAL_CONTRIBUTIONS_COUNT)
  const hasMore = contributions.length > INITIAL_CONTRIBUTIONS_COUNT

  const handleDeleteGoal = async () => {
    try {
      await deleteGoal.mutateAsync(goal.id)
      toast.success(t('savings.goal.deleted'))
      navigate('/savings')
    } catch {
      toast.error(t('common.error'))
    }
  }

  const handleDeleteContribution = async (contributionId: string) => {
    try {
      await removeContribution.mutateAsync(contributionId)
      toast.success(t('savings.contributions.removed'))
      setDeletingContributionId(null)
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <AppLayout>
      {/* Navigation header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={() => navigate('/savings')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('savings.title')}
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditModalOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('common.update')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Completed celebration */}
      {goal.isCompleted && (
        <Card className="mb-4 border-green-500/30 bg-green-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="rounded-full bg-green-500/10 p-2">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-600 dark:text-green-400">
                {t('savings.goal.completedTitle')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('savings.goal.completedMessage')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact progress header */}
      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          {/* Top row: icon + name + status + ring */}
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{
                backgroundColor: `${goalColor}20`,
                color: goalColor,
              }}
            >
              {goal.icon || '🎯'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold truncate">{goal.name}</h2>
                {status && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0',
                      status.colorClass,
                    )}
                  >
                    {status.icon}
                    {status.label}
                  </span>
                )}
              </div>
              {deadlineDate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {deadlineDate.toLocaleDateString()}
                  {daysLeft !== null && (
                    <span
                      className={cn(
                        'ml-1',
                        daysLeft < 0 && 'text-red-500',
                        daysLeft >= 0 && daysLeft <= 30 && 'text-amber-500',
                      )}
                    >
                      {daysLeft < 0
                        ? `(${t('savings.goal.overdue')})`
                        : `(${t('savings.goal.daysLeft', { count: daysLeft })})`}
                    </span>
                  )}
                </p>
              )}
            </div>
            <ProgressRing progress={progress} color={goalColor} />
          </div>

          {/* Amount bar */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">
                {formatAmount(Math.round(Number(goal.currentAmount)))}{' '}
                {goal.currency}{' '}
                <span className="text-muted-foreground font-normal">
                  {t('savings.goalDetail.saved')}
                </span>
              </span>
              <span className="text-muted-foreground text-xs">
                {formatAmount(Math.round(remaining))} {goal.currency}{' '}
                {t('savings.goalDetail.remaining')}
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: goalColor,
                }}
              />
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {t('savings.goalDetail.monthlyRate')}
              </p>
              <p className="text-sm font-medium mt-0.5">
                {insights?.pace?.currentMonthly != null
                  ? `${formatAmount(Math.round(insights.pace.currentMonthly))} ${goal.currency}`
                  : '\u2014'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {t('savings.goalDetail.requiredRate')}
              </p>
              <p className="text-sm font-medium mt-0.5">
                {insights?.pace?.requiredMonthly != null
                  ? `${formatAmount(Math.round(insights.pace.requiredMonthly))} ${goal.currency}`
                  : '\u2014'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {t('savings.goalDetail.projected')}
              </p>
              <p className="text-sm font-medium mt-0.5">
                {insights?.pace?.monthsToTarget != null
                  ? t('savings.goalDetail.monthsCount', {
                      count: insights.pace.monthsToTarget,
                    })
                  : '\u2014'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {t('savings.goalModal.priority')}
              </p>
              <p className={cn('text-sm font-medium mt-0.5', priorityColor)}>
                {t(`savings.priority.${goal.priority}`)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column actionable section */}
      <div
        className={cn(
          'grid gap-4 mb-4',
          goal.categoryId ? 'lg:grid-cols-2' : 'lg:grid-cols-1',
        )}
      >
        <GoalActions goalId={goal.id} year={year} month={month} />
        {goal.categoryId && (
          <CategoryPerformance
            insights={insights}
            goalCurrency={goal.currency}
            isLoading={insightsLoading}
          />
        )}
      </div>

      {/* No budget hint for linked categories without budget */}
      {goal.category && !insights?.categoryInsights && insights && (
        <Card className="border-dashed mb-4">
          <CardContent className="py-4 text-center text-sm text-muted-foreground">
            {t('savings.insights.noBudget', {
              category: goal.category.name,
            })}
          </CardContent>
        </Card>
      )}

      {/* Contributions section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {t('savings.contributions.title')}
              {contributions.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {contributions.length}
                </span>
              )}
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setContributionModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t('savings.contributions.add')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('savings.contributions.empty')}
            </p>
          ) : (
            <div className="space-y-1">
              {visibleContributions.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Dot indicator */}
                    <div
                      className={cn(
                        'mt-1.5 h-2 w-2 rounded-full shrink-0',
                        c.source === 'auto'
                          ? 'bg-green-500'
                          : 'bg-blue-500',
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          +{formatAmount(Number(c.amount))} {c.currency}
                        </p>
                        {c.source === 'auto' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                            <Sparkles className="h-2.5 w-2.5" />
                            {t('savings.goalDetail.auto')}
                          </span>
                        )}
                      </div>
                      {c.source === 'auto' && goal.category ? (
                        <p className="text-xs text-muted-foreground">
                          {t('savings.goal.autoContribution', {
                            category: goal.category.name,
                          })}
                        </p>
                      ) : c.note ? (
                        <p className="text-xs text-muted-foreground truncate">
                          {c.note}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {c.source === 'manual' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setDeletingContributionId(c.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}

              {/* Show all toggle */}
              {hasMore && (
                <button
                  onClick={() => setShowAllContributions((prev) => !prev)}
                  className="flex items-center gap-1 w-full justify-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {showAllContributions ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      {t('savings.goalDetail.showLess')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      {t('savings.goalDetail.showAll', {
                        count: contributions.length,
                      })}
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <GoalModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        goal={goal}
        mode="edit"
      />

      <ContributionModal
        open={contributionModalOpen}
        onOpenChange={setContributionModalOpen}
        goalId={goal.id}
        goalCurrency={goal.currency}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('savings.goal.deleteConfirmTitle')}
        description={t('savings.goal.deleteConfirmDescription')}
        onConfirm={handleDeleteGoal}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!deletingContributionId}
        onOpenChange={(open) => !open && setDeletingContributionId(null)}
        title={t('savings.contributions.deleteConfirmTitle')}
        description={t('savings.contributions.deleteConfirmDescription')}
        onConfirm={() =>
          deletingContributionId &&
          handleDeleteContribution(deletingContributionId)
        }
        variant="destructive"
      />
    </AppLayout>
  )
}
