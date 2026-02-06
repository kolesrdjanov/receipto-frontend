import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export interface StoreCategorySuggestion {
  categoryId: string
  categoryName: string
  categoryIcon?: string
  categoryColor?: string
  confidence: number
  reason: string
}

export function useSuggestCategory(storeName: string, enabled: boolean) {
  return useQuery<StoreCategorySuggestion | null>({
    queryKey: queryKeys.categorization.suggestByStore(storeName),
    queryFn: async () => {
      const result = await api.get<StoreCategorySuggestion | null>('/receipts/suggest-category', {
        params: { storeName },
      })
      return result ?? null
    },
    enabled: enabled && storeName.length >= 2,
    staleTime: 0,
  })
}
