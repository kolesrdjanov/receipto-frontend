import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useSettingsStore } from '@/store/settings'

export interface MonthlyReportListItem {
  year: number
  month: number
  generatedAt: string
  receiptCount: number
}

export interface MonthlyReportData {
  income: { amount: number; currency: string } | null
  totalSpent: { amount: number; currency: string }[]
  totalSpentConverted: number | null
  receiptCount: number
  topCategories: {
    name: string
    icon: string
    amount: number
    currency: string
    percentage: number
  }[]
  savingsRate: number | null
  savedAmount: number | null
  goals: {
    name: string
    icon: string
    targetAmount: number
    currentAmount: number
    currency: string
    progressPercent: number
    isCompleted: boolean
    contributionsThisMonth: number
  }[]
  comparison: {
    previousMonth: {
      totalSpent: { amount: number; currency: string }[]
      receiptCount: number
    }
    spendingChange: number | null
  } | null
  dailyAverage: { amount: number; currency: string }
}

export interface MonthlyReport {
  id: string
  year: number
  month: number
  data: MonthlyReportData
  aiNarrative: string | null
  aiTips: string[] | null
  language: string
  generatedAt: string
}

const fetchReportList = async (): Promise<MonthlyReportListItem[]> => {
  return api.get<MonthlyReportListItem[]>('/savings/reports')
}

const fetchReport = async (year: number, month: number): Promise<MonthlyReport> => {
  return api.get<MonthlyReport>(`/savings/reports/${year}/${month}`)
}

export function useReportList() {
  return useQuery({
    queryKey: queryKeys.reports.list(),
    queryFn: fetchReportList,
  })
}

export function useReport(year: number | null, month: number | null) {
  const { language } = useSettingsStore()

  return useQuery({
    queryKey: [...queryKeys.reports.detail(year!, month!), language],
    queryFn: () => fetchReport(year!, month!),
    enabled: year !== null && month !== null,
  })
}

export function useGenerateReportNow() {
  const queryClient = useQueryClient()
  const { language } = useSettingsStore()

  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) => fetchReport(year, month),
    onSuccess: (report, variables) => {
      queryClient.setQueryData([...queryKeys.reports.detail(variables.year, variables.month), language], report)
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.list() })
    },
  })
}
