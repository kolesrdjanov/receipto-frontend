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

// Aggregated types (za "All converted" mod)
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

// Regular fetch functions
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

// Aggregated fetch functions
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

// Regular hooks
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

// Aggregated hooks
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

