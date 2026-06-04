import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Types
export interface CategorizationAccuracy {
  totalSuggestions: number
  acceptedSuggestions: number
  acceptanceRate: number
  averageConfidence: number
  topPerformingCategories: Array<{
    categoryId: string
    categoryName: string
    acceptanceRate: number
    totalSuggestions: number
  }>
}

// API functions
const fetchCategorizationAccuracy = async (): Promise<CategorizationAccuracy> => {
  try {
    // api.get already returns response.data, not the full AxiosResponse
    return await api.get<CategorizationAccuracy>('/dashboard/categorization-accuracy')
  } catch {
    // Return default empty data instead of throwing
    return {
      totalSuggestions: 0,
      acceptedSuggestions: 0,
      acceptanceRate: 0,
      averageConfidence: 0,
      topPerformingCategories: [],
    }
  }
}

// Hooks
export function useCategorizationAccuracy() {
  return useQuery({
    queryKey: queryKeys.dashboard.categorizationAccuracy(),
    queryFn: fetchCategorizationAccuracy,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on error
  })
}
