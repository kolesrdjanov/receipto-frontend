import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  isActive: boolean
  sortOrder: number
}

const fetchCurrencies = async (): Promise<Currency[]> => {
  return api.get<Currency[]>('/currencies')
}

export function useCurrencies() {
  return useQuery({
    queryKey: queryKeys.currencies.list(),
    queryFn: fetchCurrencies,
    staleTime: 1000 * 60 * 60
  })
}

