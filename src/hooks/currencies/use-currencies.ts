import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export interface Currency {
  id: string
  code: string
  name: string
  symbol: string
  icon?: string
  isActive: boolean
  sortOrder: number
}

export const FLAG_EMOJI_MAP: Record<string, string> = {
  'flag-rs': '🇷🇸',
  'flag-mk': '🇲🇰',
  'flag-us': '🇺🇸',
  'flag-eu': '🇪🇺',
  'flag-ba': '🇧🇦',
  'flag-ro': '🇷🇴',
  'flag-hu': '🇭🇺',
  'flag-bg': '🇧🇬',
}

export function getCurrencyFlag(icon?: string): string {
  if (!icon) return ''
  return FLAG_EMOJI_MAP[icon] ?? ''
}

// Fallback currencies used when API is unavailable
const FALLBACK_CURRENCIES: Currency[] = [
  { id: 'fallback-rsd', code: 'RSD', name: 'Serbian Dinar', symbol: 'дин.', isActive: true, sortOrder: 1 },
  { id: 'fallback-eur', code: 'EUR', name: 'Euro', symbol: '€', isActive: true, sortOrder: 2 },
  { id: 'fallback-usd', code: 'USD', name: 'US Dollar', symbol: '$', isActive: true, sortOrder: 3 },
  { id: 'fallback-bam', code: 'BAM', name: 'Convertible Mark', symbol: 'KM', isActive: true, sortOrder: 4 },
]

const fetchCurrencies = async (): Promise<Currency[]> => {
  return api.get<Currency[]>('/currencies')
}

export function useCurrencies() {
  const query = useQuery({
    queryKey: queryKeys.currencies.list(),
    queryFn: fetchCurrencies,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
  })

  // Return fallback currencies when data is unavailable
  const currencies = query.data ?? FALLBACK_CURRENCIES

  return {
    ...query,
    data: currencies,
    currencies,
  }
}

/**
 * Returns an array of supported currency codes (e.g., ['RSD', 'EUR', 'USD', 'BAM'])
 * with fallback support when API is unavailable
 */
export function useSupportedCurrencyCodes() {
  const { currencies, isLoading, error } = useCurrencies()

  const codes = useMemo(() =>
    currencies.map(c => c.code),
    [currencies]
  )

  return {
    codes,
    isLoading,
    error,
  }
}

