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

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  return api.get<DashboardStats>('/dashboard/stats')
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: fetchDashboardStats,
  })
}

