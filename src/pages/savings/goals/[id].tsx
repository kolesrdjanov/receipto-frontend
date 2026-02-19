import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  ArrowLeft,
  Calendar,
  Check,
  FolderOpen,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useSavingsGoal, useDeleteSavingsGoal, useRemoveContribution, useGoalInsights } from '@/hooks/savings/use-savings'
import { GoalModal } from '@/components/savings/goal-modal'
import { ContributionModal } from '@/components/savings/contribution-modal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function SavingsGoalDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: goal, isLoading } = useSavingsGoal(id!)
  const { data: insights } = useGoalInsights(id!)
  const deleteGoal = useDeleteSavingsGoal()
  const removeContribution = useRemoveContribution(id!)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [contributionModalOpen, setContributionModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingContributionId, setDeletingContributionId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
      </AppLayout>
    )
  }

  if (!goal) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">{t('savings.goal.notFound')}</div>
      </AppLayout>
    )
  }

  const progress = goal.targetAmount > 0
    ? Math.min(100, Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100))
    : 0

  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // Projected completion
  const daysSinceCreated = Math.max(1, Math.ceil((Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
  const dailyRate = Number(goal.currentAmount) / daysSinceCreated
  const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
  const projectedDays = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : null

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
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/savings')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            {goal.icon && <span className="text-2xl">{goal.icon}</span>}
            <h2 className="text-xl font-bold truncate">{goal.name}</h2>
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1">
            <button
              onClick={() => setEditModalOpen(true)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            >
              <Pencil className="h-4 w-4" />
              {t('common.update')}
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
            >
              <Trash2 className="h-4 w-4" />
              {t('common.delete')}
            </button>
          </PopoverContent>
        </Popover>
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

      <div className="grid gap-4">
        {/* Progress Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-3xl font-bold" style={{ color: goal.color || undefined }}>
                {progress}%
              </p>
              <p className="text-sm text-muted-foreground">
                {Number(goal.currentAmount).toLocaleString()} / {Number(goal.targetAmount).toLocaleString()} {goal.currency}
              </p>
            </div>
            <Progress value={progress} className="h-3" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-sm">
              {deadlineDate && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {t('savings.goal.deadline')}
                  </p>
                  <p className={cn(
                    'font-medium',
                    daysLeft !== null && daysLeft < 0 && 'text-red-500',
                    daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 && 'text-amber-500',
                  )}>
                    {daysLeft !== null && daysLeft < 0
                      ? t('savings.goal.overdue')
                      : daysLeft !== null
                        ? t('savings.goal.daysLeft', { count: daysLeft })
                        : deadlineDate.toLocaleDateString()
                    }
                  </p>
                </div>
              )}

              {projectedDays !== null && !goal.isCompleted && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {t('savings.goal.projectedCompletion')}
                  </p>
                  <p className="font-medium">
                    {t('savings.goal.projectedDays', { count: projectedDays })}
                  </p>
                </div>
              )}

              {goal.category && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    {t('savings.goal.linkedCategory')}
                  </p>
                  <p className="font-medium">
                    {goal.category.icon && <span className="mr-1">{goal.category.icon}</span>}
                    {goal.category.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Insights */}
        {insights?.categoryInsights && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {t('savings.insights.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('savings.insights.spentThisMonth')}</p>
                  <p className="text-lg font-semibold">
                    {Math.round(insights.categoryInsights.spentThisMonth).toLocaleString()} {insights.categoryInsights.budgetCurrency}
                  </p>
                  <Progress
                    value={Math.min(100, (insights.categoryInsights.spentThisMonth / insights.categoryInsights.budget) * 100)}
                    className="h-1.5"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    / {Math.round(insights.categoryInsights.budget).toLocaleString()} {insights.categoryInsights.budgetCurrency}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('savings.insights.potentialSavings')}</p>
                  <p className={cn(
                    'text-lg font-semibold',
                    insights.categoryInsights.potentialSavings > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground'
                  )}>
                    {insights.categoryInsights.potentialSavings > 0 ? '+' : ''}
                    {Math.round(insights.categoryInsights.potentialSavings).toLocaleString()} {insights.categoryInsights.budgetCurrency}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('savings.insights.monthlyPaceNeeded')}</p>
                  <p className="text-lg font-semibold">
                    {insights.pace.requiredMonthly !== null
                      ? `${Math.round(insights.pace.requiredMonthly).toLocaleString()} ${goal.currency}`
                      : t('savings.insights.noDeadline')}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('savings.insights.status')}</p>
                  {insights.pace.isOnTrack === null ? (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      {t('savings.insights.noDeadline')}
                    </span>
                  ) : insights.pace.isOnTrack ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                      <Check className="h-3.5 w-3.5" />
                      {t('savings.insights.onTrack')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                      <TrendingDown className="h-3.5 w-3.5" />
                      {t('savings.insights.behind')}
                    </span>
                  )}
                </div>
              </div>

              {/* Auto vs manual breakdown */}
              {(insights.autoSavingsTotal > 0 || insights.manualTotal > 0) && (
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    {t('savings.insights.autoSavingsTotal')}: {Math.round(insights.autoSavingsTotal).toLocaleString()} {goal.currency}
                  </span>
                  <span className="flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    {t('savings.insights.manualTotal')}: {Math.round(insights.manualTotal).toLocaleString()} {goal.currency}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No budget hint */}
        {goal.category && !insights?.categoryInsights && insights && (
          <Card className="border-dashed">
            <CardContent className="py-4 text-center text-sm text-muted-foreground">
              {t('savings.insights.noBudget', { category: goal.category.name })}
            </CardContent>
          </Card>
        )}

        {/* Contributions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('savings.contributions.title')}</CardTitle>
              <Button size="sm" onClick={() => setContributionModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {t('savings.contributions.add')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!goal.contributions?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('savings.contributions.empty')}
              </p>
            ) : (
              <div className="space-y-2">
                {goal.contributions.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-center justify-between py-2 border-b last:border-0',
                      c.source === 'auto' && 'bg-amber-500/5 -mx-2 px-2 rounded',
                    )}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      {c.source === 'auto' ? (
                        <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          +{Number(c.amount).toLocaleString()} {c.currency}
                        </p>
                        {c.source === 'auto' && goal.category ? (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            {t('savings.goal.autoContribution', { category: goal.category.name })}
                          </p>
                        ) : c.note ? (
                          <p className="text-xs text-muted-foreground truncate">{c.note}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setDeletingContributionId(c.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
        onConfirm={() => deletingContributionId && handleDeleteContribution(deletingContributionId)}
        variant="destructive"
      />
    </AppLayout>
  )
}
