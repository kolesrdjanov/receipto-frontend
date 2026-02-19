import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Types
export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currency: string
  currentAmount: number
  deadline: string | null
  icon: string | null
  color: string | null
  priority: string
  categoryId: string | null
  category: {
    id: string
    name: string
    icon: string | null
    color: string | null
  } | null
  isCompleted: boolean
  completedAt: string | null
  userId: string
  contributions?: SavingsContribution[]
  createdAt: string
  updatedAt: string
}

export interface SavingsContribution {
  id: string
  amount: number
  currency: string
  note: string | null
  source: 'manual' | 'auto'
  periodMonth: string | null
  goalId: string
  userId: string
  createdAt: string
}

export interface GoalInsights {
  categoryInsights: {
    categoryName: string
    categoryIcon: string | null
    budget: number
    budgetCurrency: string
    spentThisMonth: number
    spentLastMonth: number
    potentialSavings: number
  } | null
  pace: {
    requiredMonthly: number | null
    currentMonthly: number
    isOnTrack: boolean | null
    monthsToTarget: number | null
  }
  autoSavingsTotal: number
  manualTotal: number
}

export interface SavingsOverview {
  monthlyIncome: number | null
  incomeCurrency: string | null
  spending: {
    currency: string
    totalAmount: number
    receiptCount: number
  }[]
  goals: (SavingsGoal & { progressPercent: number; potentialSavings: number | null; categoryBudget: number | null })[]
}

export interface CreateSavingsGoalData {
  name: string
  targetAmount: number
  currency?: string
  deadline?: string
  icon?: string
  color?: string
  priority?: string
  categoryId?: string
}

export interface UpdateSavingsGoalData {
  name?: string
  targetAmount?: number
  currency?: string
  deadline?: string | null
  icon?: string
  color?: string
  priority?: string
  categoryId?: string | null
  isCompleted?: boolean
}

export interface CreateContributionData {
  amount: number
  currency?: string
  note?: string
}

// Fetchers
const fetchGoals = (): Promise<SavingsGoal[]> => api.get('/savings/goals')
const fetchGoal = (id: string): Promise<SavingsGoal> => api.get(`/savings/goals/${id}`)
const fetchOverview = (year: number, month: number): Promise<SavingsOverview> =>
  api.get(`/savings/overview?year=${year}&month=${month}`)
const fetchGoalInsights = (id: string): Promise<GoalInsights> =>
  api.get(`/savings/goals/${id}/insights`)

// Query hooks
export function useSavingsGoals() {
  return useQuery({
    queryKey: queryKeys.savings.goals(),
    queryFn: fetchGoals,
  })
}

export function useSavingsGoal(id: string) {
  return useQuery({
    queryKey: queryKeys.savings.goalDetail(id),
    queryFn: () => fetchGoal(id),
    enabled: !!id,
  })
}

export function useSavingsOverview(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.savings.overview(year, month),
    queryFn: () => fetchOverview(year, month),
  })
}

export function useGoalInsights(goalId: string) {
  return useQuery({
    queryKey: queryKeys.savings.goalInsights(goalId),
    queryFn: () => fetchGoalInsights(goalId),
    enabled: !!goalId,
  })
}

// Mutation hooks
export function useCreateSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSavingsGoalData) =>
      api.post<SavingsGoal>('/savings/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSavingsGoalData & { id: string }) =>
      api.patch<SavingsGoal>(`/savings/goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/savings/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })
}

export function useAddContribution(goalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateContributionData) =>
      api.post<SavingsContribution>(`/savings/goals/${goalId}/contributions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.goalDetail(goalId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.goals() })
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })
}

export function useRemoveContribution(goalId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (contributionId: string) =>
      api.delete(`/savings/goals/${goalId}/contributions/${contributionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.goalDetail(goalId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.goals() })
      queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })
}
