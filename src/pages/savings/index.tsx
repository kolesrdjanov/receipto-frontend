import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PiggyBank, Plus, Target, FileText, Lightbulb } from 'lucide-react'
import { useSavingsGoals, useSavingsOverview } from '@/hooks/savings/use-savings'
import { MonthlySnapshot } from '@/components/savings/monthly-snapshot'
import { GoalCard } from '@/components/savings/goal-card'
import { GoalModal } from '@/components/savings/goal-modal'

const SAVINGS_DESCRIPTION_PREF_KEY = 'receipto:savings:show-description'

export default function Savings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const now = new Date()
  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [showDescription, setShowDescription] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem(SAVINGS_DESCRIPTION_PREF_KEY)
    if (stored === null) return true
    return stored === 'true'
  })

  const { data: goals, isLoading: goalsLoading } = useSavingsGoals()
  const { data: overview, isLoading: overviewLoading } = useSavingsOverview(now.getFullYear(), now.getMonth() + 1)

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SAVINGS_DESCRIPTION_PREF_KEY, String(showDescription))
  }, [showDescription])

  // Prefer overview goals (have potentialSavings) over plain goals
  const allGoals = overview?.goals || goals || []
  const activeGoals = allGoals.filter((g) => !g.isCompleted)
  const completedGoals = allGoals.filter((g) => g.isCompleted)

  return (
    <AppLayout>
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2 flex items-center gap-2">
          <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8" />
          {t('savings.title')}
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t('savings.subtitle')}
        </p>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
          <span className="text-sm font-medium">{t('savings.howItWorks.toggleLabel')}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {showDescription ? t('savings.howItWorks.visible') : t('savings.howItWorks.hidden')}
            </span>
            <Switch checked={showDescription} onCheckedChange={setShowDescription} />
          </div>
        </div>

        {showDescription && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-primary" />
                {t('savings.howItWorks.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>{t('savings.howItWorks.line1')}</li>
                <li>{t('savings.howItWorks.line2')}</li>
                <li>{t('savings.howItWorks.line3')}</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Snapshot */}
      <div className="mb-6">
        <MonthlySnapshot overview={overview} isLoading={overviewLoading} />
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/savings/reports')}
          >
            <FileText className="h-4 w-4" />
            {t('savings.viewReports')}
          </Button>
        </div>
      </div>

      {/* Goals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t('savings.goals.title')}</h3>
          <Button size="sm" onClick={() => setGoalModalOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('savings.goals.addGoal')}
          </Button>
        </div>

        {goalsLoading ? (
          <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
        ) : goals?.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Target className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">{t('savings.goals.empty')}</p>
            <Button variant="outline" onClick={() => setGoalModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('savings.goals.addGoal')}
            </Button>
          </div>
        ) : (
          <>
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {t('savings.goals.completed')} ({completedGoals.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-75">
                  {completedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <GoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        mode="create"
      />
    </AppLayout>
  )
}
