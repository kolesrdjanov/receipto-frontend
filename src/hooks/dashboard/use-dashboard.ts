import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { Receipt } from '../receipts/use-receipts'

export interface CurrencyBreakdown {
  currency: string
  totalAmount: number
  receiptCount: number
}

export interface AggregatedStats {
  totalReceipts: number
  totalCategories: number
  byCurrency: CurrencyBreakdown[]
  recentReceipts: Receipt[]
}

export interface CategoryStatsByCurrency {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string | null
  byCurrency: CurrencyBreakdown[]
}

export interface DailyStatsByCurrency {
  date: string
  byCurrency: CurrencyBreakdown[]
}

export interface MonthlyStatsByCurrency {
  month: string
  byCurrency: CurrencyBreakdown[]
}

export interface TopStoreByCurrency {
  storeName: string
  byCurrency: CurrencyBreakdown[]
}

// Fetch functions
const fetchAggregatedStats = async (): Promise<AggregatedStats> => {
  return api.get<AggregatedStats>('/dashboard/aggregated/stats')
}

const fetchAggregatedCategoryStats = async (year: number, month: number): Promise<CategoryStatsByCurrency[]> => {
  return api.get<CategoryStatsByCurrency[]>(`/dashboard/aggregated/category-stats?year=${year}&month=${month}`)
}

const fetchAggregatedDailyStats = async (year: number, month: number): Promise<DailyStatsByCurrency[]> => {
  return api.get<DailyStatsByCurrency[]>(`/dashboard/aggregated/daily-stats?year=${year}&month=${month}`)
}

const fetchAggregatedMonthlyStats = async (year: number): Promise<MonthlyStatsByCurrency[]> => {
  return api.get<MonthlyStatsByCurrency[]>(`/dashboard/aggregated/monthly-stats?year=${year}`)
}

const fetchAggregatedTopStores = async (limit: number = 5): Promise<TopStoreByCurrency[]> => {
  return api.get<TopStoreByCurrency[]>(`/dashboard/aggregated/top-stores?limit=${limit}`)
}

// Hooks
export function useAggregatedStats() {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'aggregated', 'stats'],
    queryFn: fetchAggregatedStats,
  })
}

export function useAggregatedCategoryStats(year: number, month: number) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'aggregated', 'category-stats', year, month],
    queryFn: () => fetchAggregatedCategoryStats(year, month),
  })
}

export function useAggregatedDailyStats(year: number, month: number) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'aggregated', 'daily-stats', year, month],
    queryFn: () => fetchAggregatedDailyStats(year, month),
  })
}

export function useAggregatedMonthlyStats(year: number) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'aggregated', 'monthly-stats', year],
    queryFn: () => fetchAggregatedMonthlyStats(year),
  })
}

export function useAggregatedTopStores(limit: number = 5) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'aggregated', 'top-stores', limit],
    queryFn: () => fetchAggregatedTopStores(limit),
  })
}
