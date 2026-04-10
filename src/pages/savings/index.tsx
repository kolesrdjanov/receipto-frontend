import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Plus, Target } from 'lucide-react'
import { useSavingsGoals, useSavingsOverview } from '@/hooks/savings/use-savings'
import {
  useSavingsIntelligenceOverview,
  useSavingsIntelligenceActions,
} from '@/hooks/savings/use-savings-intelligence'
import { HealthCard } from '@/components/savings/health-card'
import { GoalCard } from '@/components/savings/goal-card'
import { GoalModal } from '@/components/savings/goal-modal'
import { ReportsTab } from '@/components/savings/reports-tab'
import { cn } from '@/lib/utils'

type Tab = 'goals' | 'reports'

export default function Savings() {
  const { t } = useTranslation()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('goals')
  const [showCompleted, setShowCompleted] = useState(false)

  const { data: goals, isLoading: goalsLoading } = useSavingsGoals()
  const { data: overview } = useSavingsOverview(year, month)
  const { data: intelligence } = useSavingsIntelligenceOverview(year, month)
  const { data: actionsData } = useSavingsIntelligenceActions(year, month)

  // Merge overview goals (have progressPercent, potentialSavings) with base goals
  const allGoals = overview?.goals || goals || []
  const activeGoals = allGoals.filter((g) => !g.isCompleted)
  const completedGoals = allGoals.filter((g) => g.isCompleted)

  // Build intelligence tip map: goalId -> tip
  const tipMap = useMemo(() => {
    const map = new Map<string, { icon: string; text: string; isOnTrack: boolean | null }>()

    // From goal signals
    const goalSignals = intelligence?.goalSignals ?? []
    for (const signal of goalSignals) {
      if (signal.isOnTrack === false && signal.requiredMonthly !== null) {
        map.set(signal.goalId, {
          icon: 'target',
          text: t('savings.health.behindPaceTip', 'Needs {{amount}} {{currency}}/month to stay on track', {
            amount: Math.round(signal.requiredMonthly).toLocaleString(),
            currency: signal.currency,
          }),
          isOnTrack: false,
        })
      } else if (signal.isOnTrack === true) {
        map.set(signal.goalId, {
          icon: 'check',
          text: t('savings.health.onTrackTip', 'On pace to reach the target on time'),
          isOnTrack: true,
        })
      }
    }

    // Enrich behind goals with action tips if available
    const actions = actionsData?.actions ?? []
    for (const action of actions) {
      if (action.type === 'goal') {
        // Try to match by title containing goal name
        for (const signal of goalSignals) {
          if (
            action.title.includes(signal.goalName) ||
            action.message.includes(signal.goalName)
          ) {
            map.set(signal.goalId, {
              icon: 'lightbulb',
              text: action.message,
              isOnTrack: signal.isOnTrack,
            })
          }
        }
      }
    }

    return map
  }, [intelligence, actionsData, t])

  return (
    <AppLayout>
      {/* Page header */}
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('savings.title', 'Savings')}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base mt-1">
            {t('savings.subtitle', 'Set goals and track your savings progress')}
          </p>
        </div>
        <Button onClick={() => setGoalModalOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          {t('savings.goals.addGoal', 'Add Goal')}
        </Button>
      </div>

      {/* Hero health card */}
      <div className="mb-6">
        <HealthCard />
      </div>

      {/* Tab buttons */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors relative',
            activeTab === 'goals'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground/80'
          )}
          onClick={() => setActiveTab('goals')}
        >
          {t('savings.goals.title', 'Your Goals')}
          {activeTab === 'goals' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
          )}
        </button>
        <button
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors relative',
            activeTab === 'reports'
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground/80'
          )}
          onClick={() => setActiveTab('reports')}
        >
          {t('savings.reports.title', 'Monthly Reports')}
          {activeTab === 'reports' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
          )}
        </button>
      </div>

      {/* Goals tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {goalsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.loading', 'Loading...')}
            </div>
          ) : goals?.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Target className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                {t('savings.goals.empty', 'No savings goals yet. Create one to start tracking!')}
              </p>
              <Button variant="outline" onClick={() => setGoalModalOpen(true)}>
                <Plus className="h-4 w-4" />
                {t('savings.goals.addGoal', 'Add Goal')}
              </Button>
            </div>
          ) : (
            <>
              {/* Active goals grid */}
              {activeGoals.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeGoals.map((goal) => {
                    const tip = tipMap.get(goal.id)
                    return (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        intelligenceTip={tip ? { icon: tip.icon, text: tip.text } : null}
                        isOnTrack={tip?.isOnTrack ?? null}
                      />
                    )
                  })}
                  {/* New goal placeholder card */}
                  <button
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-sm text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer min-h-[120px]"
                    onClick={() => setGoalModalOpen(true)}
                  >
                    <Plus className="h-5 w-5" />
                    {t('savings.goals.addGoal', 'Add Goal')}
                  </button>
                </div>
              )}

              {/* Completed goals collapsible */}
              {completedGoals.length > 0 && (
                <div className="space-y-3">
                  <button
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowCompleted(!showCompleted)}
                  >
                    {showCompleted ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    {t('savings.goals.completed', 'Completed')} ({completedGoals.length})
                  </button>
                  {showCompleted && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-75">
                      {completedGoals.map((goal) => (
                        <GoalCard key={goal.id} goal={goal} isOnTrack={true} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Reports tab */}
      {activeTab === 'reports' && <ReportsTab />}

      {/* Goal create modal */}
      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        mode="create"
      />
    </AppLayout>
  )
}
