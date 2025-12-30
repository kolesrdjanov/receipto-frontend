import { useQuery } from '@tanstack/react-query'
import { useSettingsStore } from '@/store/settings'

interface ExchangeRates {
  [currency: string]: number
}

interface ExchangeRateApiResponse {
  result: string
  base_code: string
  rates: ExchangeRates
}

// Supported currencies are now fetched from the backend via useCurrencies() hook.
// See use-currencies.ts for the source of truth.

const fetchExchangeRates = async (baseCurrency: string): Promise<ExchangeRates> => {
  try {
    const response = await fetch(
      `https://open.er-api.com/v6/latest/${baseCurrency}`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }

    const data: ExchangeRateApiResponse = await response.json()

    if (data.result !== 'success') {
      throw new Error('API returned error')
    }

    return data.rates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return getFallbackRates(baseCurrency)
  }
}

const getFallbackRates = (baseCurrency: string): ExchangeRates => {
  const fallbackRates: Record<string, ExchangeRates> = {
    EUR: { EUR: 1, USD: 1.09, RSD: 117.35, BAM: 1.9558 },
    USD: { EUR: 0.92, USD: 1, RSD: 107.76, BAM: 1.80 },
    RSD: { EUR: 0.00852, USD: 0.00928, RSD: 1, BAM: 0.0167 },
    BAM: { EUR: 0.5113, USD: 0.556, RSD: 60, BAM: 1 },
  }
  return fallbackRates[baseCurrency] || fallbackRates.EUR
}

export function useExchangeRates(baseCurrency?: string) {
  const { currency: preferredCurrency } = useSettingsStore()
  const base = baseCurrency || preferredCurrency || 'RSD'

  return useQuery({
    queryKey: ['exchange-rates', base],
    queryFn: () => fetchExchangeRates(base),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
  })
}

export function useCurrencyConverter() {
  const { currency: preferredCurrency } = useSettingsStore()
  const { data: rates, isLoading, error } = useExchangeRates(preferredCurrency)

  const convert = (amount: number, fromCurrency: string, toCurrency?: string): number => {
    const target = toCurrency || preferredCurrency || 'RSD'

    if (!rates || fromCurrency === target) {
      return amount
    }

    if (rates[fromCurrency] !== undefined && fromCurrency === preferredCurrency) {
      return amount
    }


    const fromRate = rates[fromCurrency]
    if (fromRate === undefined || fromRate === 0) {
      console.warn(`No rate found for ${fromCurrency}`)
      return amount
    }

    return amount / fromRate
  }

  const formatConverted = (amount: number, fromCurrency: string): string => {
    const converted = convert(amount, fromCurrency)
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: preferredCurrency || 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted)
  }

  return {
    convert,
    formatConverted,
    rates,
    isLoading,
    error,
    preferredCurrency: preferredCurrency || 'RSD',
  }
}

export function useConvertedAmounts<T extends { totalAmount: number; currency?: string }>(
  items: T[] | undefined,
  targetCurrency: string
) {
  const { data: rates } = useExchangeRates(targetCurrency)

  if (!items || !rates) {
    return { items, totalConverted: 0 }
  }

  const convertedItems = items.map((item) => {
    const fromCurrency = item.currency || 'RSD'
    if (fromCurrency === targetCurrency) {
      return { ...item, convertedAmount: item.totalAmount }
    }

    const fromRate = rates[fromCurrency]
    if (!fromRate || fromRate === 0) {
      return { ...item, convertedAmount: item.totalAmount }
    }

    return {
      ...item,
      convertedAmount: item.totalAmount / fromRate,
    }
  })

  const totalConverted = convertedItems.reduce(
    (sum, item) => sum + (item.convertedAmount || 0),
    0
  )

  return { items: convertedItems, totalConverted }
}

