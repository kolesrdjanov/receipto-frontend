import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export interface InsightDetails {
  amount?: number
  currency?: string
  percentage?: number
  categoryName?: string
  categoryIcon?: string
  storeName?: string
  productName?: string
  comparisonPeriod?: string
  previousAmount?: number
  currentAmount?: number
  budgetAmount?: number
  budgetUsed?: number
  savings?: number
  streak?: number
}

export interface Insight {
  id: string
  type: string
  priority: 'low' | 'medium' | 'high'
  tone: 'positive' | 'neutral' | 'warning' | 'celebration'
  title: string
  message: string
  details?: InsightDetails
  actionLabel?: string
  actionRoute?: string
  createdAt: string
}

export interface CoachResponse {
  greeting: string
  insights: Insight[]
  summary?: {
    totalSpentThisWeek: number
    totalSpentLastWeek: number
    weeklyChange: number
    weeklyChangePercent: number
    receiptsThisWeek: number
    topCategory?: {
      name: string
      icon: string
      amount: number
    }
  }
  tip?: {
    title: string
    message: string
  }
}

export function useCoach() {
  return useQuery({
    queryKey: queryKeys.coach(),
    queryFn: () => api.get<CoachResponse>('/coach'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}
