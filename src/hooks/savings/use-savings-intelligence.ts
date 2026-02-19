import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useSettingsStore } from '@/store/settings'

export interface SavingsGoalSignal {
  goalId: string
  goalName: string
  currency: string
  progressPercent: number
  remainingAmount: number
  requiredMonthly: number | null
  currentMonthlyContribution: number
  isOnTrack: boolean | null
  monthsToTarget: number | null
  monthsToDeadline: number | null
  deadline: string | null
}

export interface SavingsIntelligenceOverview {
  month: { year: number; month: number }
  currency: string
  income: { amount: number; currency: string } | null
  spent: { amount: number; currency: string }
  projectedEndOfMonthSpent: { amount: number; currency: string }
  currentSavings: { amount: number; currency: string } | null
  projectedSavings: { amount: number; currency: string } | null
  savingsRate: number | null
  healthScore: number
  opportunities: {
    budgetUnderspendPotential: number
    priceOptimizationPotential: number
    overspendLeakage: number
    totalPotential: number
    currency: string
  }
  topLeakingCategory: {
    id: string
    name: string
    icon: string | null
    overspend: number
    spent: number
    budget: number
    currency: string
  } | null
  goalSignals: SavingsGoalSignal[]
}

export interface SavingsIntelligenceAction {
  id: string
  type: 'budget' | 'price' | 'goal' | 'habit'
  title: string
  message: string
  expectedMonthlyImpact: number
  confidence: number
}

export interface SavingsIntelligenceActionsResponse {
  month: { year: number; month: number }
  currency: string
  source: 'ai' | 'rule_based'
  actions: SavingsIntelligenceAction[]
}

export interface SavingsScenarioRequest {
  reductionPercent: number
  horizonMonths?: number
  categoryIds?: string[]
}

export interface SavingsScenarioResponse {
  currency: string
  reductionPercent: number
  horizonMonths: number
  baselineMonthlySpent: number
  scenarioMonthlySpent: number
  monthlyDelta: number
  projectedHorizonSavings: number
  income: { amount: number; currency: string } | null
  baselineMonthlySaved: number | null
  scenarioMonthlySaved: number | null
  selectedCategories: Array<{
    id: string
    name: string
    monthlySpend: number
  }>
  goalForecasts: Array<{
    goalId: string
    goalName: string
    goalCurrency: string
    baselineMonthsToGoal: number | null
    scenarioMonthsToGoal: number | null
    timeSavedMonths: number | null
    additionalContributionPerMonth: number
  }>
}

const fetchIntelligenceOverview = (year: number, month: number): Promise<SavingsIntelligenceOverview> =>
  api.get(`/savings/intelligence/overview?year=${year}&month=${month}`)

const fetchIntelligenceActions = (year: number, month: number): Promise<SavingsIntelligenceActionsResponse> =>
  api.get(`/savings/intelligence/actions?year=${year}&month=${month}`)

export function useSavingsIntelligenceOverview(year: number, month: number) {
  const { language } = useSettingsStore()
  return useQuery({
    queryKey: queryKeys.savings.intelligenceOverview(year, month, language),
    queryFn: () => fetchIntelligenceOverview(year, month),
  })
}

export function useSavingsIntelligenceActions(year: number, month: number) {
  const { language } = useSettingsStore()
  return useQuery({
    queryKey: queryKeys.savings.intelligenceActions(year, month, language),
    queryFn: () => fetchIntelligenceActions(year, month),
  })
}

export function useSimulateSavingsScenario() {
  return useMutation({
    mutationFn: (data: SavingsScenarioRequest) =>
      api.post<SavingsScenarioResponse>('/savings/intelligence/scenario', data),
  })
}
