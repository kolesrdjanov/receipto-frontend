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

const fetchDashboardStats = async (currency?: string): Promise<DashboardStats> => {
  const params = currency ? `?currency=${currency}` : ''
  return api.get<DashboardStats>(`/dashboard/stats${params}`)
}

const fetchCategoryStats = async (year: number, month: number, currency?: string): Promise<CategoryStats[]> => {
  let url = `/dashboard/category-stats?year=${year}&month=${month}`
  if (currency) url += `&currency=${currency}`
  return api.get<CategoryStats[]>(url)
}

const fetchDailyStats = async (year: number, month: number, currency?: string): Promise<DailyStats[]> => {
  let url = `/dashboard/daily-stats?year=${year}&month=${month}`
  if (currency) url += `&currency=${currency}`
  return api.get<DailyStats[]>(url)
}

const fetchMonthlyStats = async (year: number, currency?: string): Promise<MonthlyStats[]> => {
  let url = `/dashboard/monthly-stats?year=${year}`
  if (currency) url += `&currency=${currency}`
  return api.get<MonthlyStats[]>(url)
}

const fetchTopStores = async (limit: number = 5, currency?: string): Promise<TopStore[]> => {
  let url = `/dashboard/top-stores?limit=${limit}`
  if (currency) url += `&currency=${currency}`
  return api.get<TopStore[]>(url)
}

export function useDashboardStats(currency?: string) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'stats', currency],
    queryFn: () => fetchDashboardStats(currency),
  })
}

export function useCategoryStats(year: number, month: number, currency?: string) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'category-stats', year, month, currency],
    queryFn: () => fetchCategoryStats(year, month, currency),
  })
}

export function useDailyStats(year: number, month: number, currency?: string) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'daily-stats', year, month, currency],
    queryFn: () => fetchDailyStats(year, month, currency),
  })
}

export function useMonthlyStats(year: number, currency?: string) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'monthly-stats', year, currency],
    queryFn: () => fetchMonthlyStats(year, currency),
  })
}

export function useTopStores(limit: number = 5, currency?: string) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'top-stores', limit, currency],
    queryFn: () => fetchTopStores(limit, currency),
  })
}

