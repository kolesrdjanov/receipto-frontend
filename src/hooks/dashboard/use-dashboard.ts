import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { Receipt } from '../receipts/use-receipts'

export interface DashboardStats {
  totalReceipts: number
  totalCategories: number
  totalAmount: number
  currency: string
  recentReceipts: Receipt[]
}

export interface CategoryStats {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string | null
  totalAmount: number
  receiptCount: number
}

export interface DailyStats {
  date: string
  totalAmount: number
  receiptCount: number
}

export interface MonthlyStats {
  month: string
  totalAmount: number
  receiptCount: number
}

export interface TopStore {
  storeName: string
  totalAmount: number
  receiptCount: number
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  return api.get<DashboardStats>('/dashboard/stats')
}

const fetchCategoryStats = async (year: number, month: number): Promise<CategoryStats[]> => {
  return api.get<CategoryStats[]>(`/dashboard/category-stats?year=${year}&month=${month}`)
}

const fetchDailyStats = async (year: number, month: number): Promise<DailyStats[]> => {
  return api.get<DailyStats[]>(`/dashboard/daily-stats?year=${year}&month=${month}`)
}

const fetchMonthlyStats = async (year: number): Promise<MonthlyStats[]> => {
  return api.get<MonthlyStats[]>(`/dashboard/monthly-stats?year=${year}`)
}

const fetchTopStores = async (limit: number = 5): Promise<TopStore[]> => {
  return api.get<TopStore[]>(`/dashboard/top-stores?limit=${limit}`)
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
  })
}

export function useCategoryStats(year: number, month: number) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'category-stats', year, month],
    queryFn: () => fetchCategoryStats(year, month),
  })
}

export function useDailyStats(year: number, month: number) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'daily-stats', year, month],
    queryFn: () => fetchDailyStats(year, month),
  })
}

export function useMonthlyStats(year: number) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'monthly-stats', year],
    queryFn: () => fetchMonthlyStats(year),
  })
}

export function useTopStores(limit: number = 5) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'top-stores', limit],
    queryFn: () => fetchTopStores(limit),
  })
}

