import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export interface FeatureFlags {
  warranties: boolean
  itemPricing: boolean
  savings: boolean
  recurringExpenses: boolean
}

const fetchFeatureFlags = async (): Promise<FeatureFlags> => {
  return api.get<FeatureFlags>('/settings/features')
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: queryKeys.settings.features(),
    queryFn: fetchFeatureFlags,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
