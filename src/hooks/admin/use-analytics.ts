import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// --- Types ---

export interface AnalyticsFilters {
  dateFrom?: string
  dateTo?: string
  chain?: string
  city?: string
  currency?: string
  limit?: number
}

export interface OverviewStats {
  totalRecords: number
  uniqueProducts: number
  uniqueChains: number
  uniqueCities: number
  uniqueUsers: number
}

export interface ChainOverview {
  chainName: string
  transactions: number
  uniqueUsers: number
  totalRevenue: string
  uniqueProducts: number
  cities: number
  firstSeen: string
  lastSeen: string
}

export interface ChainDetail extends ChainOverview {
  avgTransaction: string
  cityList: string[] | null
}

export interface TopProduct {
  id: string
  displayName: string
  purchaseCount: number
  uniqueBuyers: number
  avgPrice: string
  minPrice: string
  maxPrice: string
  storeCount: number
  currency: string
}

export interface ProductPriceComparison {
  chainName: string
  avgPrice: string
  minPrice: string
  maxPrice: string
  records: number
  uniqueBuyers: number
  lastSeen: string
  currency: string
}

export interface WalletShare {
  chainName: string
  avgSharePercent: string
  minSharePercent: string
  maxSharePercent: string
  userCount: number
  totalSpend: string
}

export interface PriceTrend {
  month: string
  chainName: string
  avgPrice: string
  minPrice: string
  maxPrice: string
  records: number
  currency: string
}

export interface CityStats {
  city: string
  transactions: number
  uniqueUsers: number
  totalRevenue: string
  uniqueStores: number
  uniqueChains: number
}

export interface PromoCampaign {
  id: string
  name: string
  chainName: string
  startDate: string
  endDate: string
  baselineStartDate: string
  baselineEndDate: string
  notes: string | null
  createdAt: string
}

export interface PromoMetrics {
  transactions: number
  uniqueUsers: number
  totalRevenue: string
  avgTransaction: string
}

export interface PromoAnalysis {
  campaign: PromoCampaign
  baseline: PromoMetrics | null
  promo: PromoMetrics | null
  newCustomers: number
}

export interface CreatePromoDto {
  name: string
  chainName: string
  startDate: string
  endDate: string
  baselineStartDate: string
  baselineEndDate: string
  notes?: string
}

// --- Helpers ---

function filtersToParams(filters?: AnalyticsFilters): Record<string, string> | undefined {
  if (!filters) return undefined
  const params: Record<string, string> = {}
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.chain) params.chain = filters.chain
  if (filters.city) params.city = filters.city
  if (filters.currency) params.currency = filters.currency
  if (filters.limit) params.limit = String(filters.limit)
  return Object.keys(params).length > 0 ? params : undefined
}

function toQueryString(params?: Record<string, string>): string {
  if (!params) return ''
  const qs = new URLSearchParams(params).toString()
  return qs ? `?${qs}` : ''
}

// --- Hooks ---

const ANALYTICS_STALE_TIME = 5 * 60 * 1000 // 5 minutes

export function useAnalyticsOverview(filters?: AnalyticsFilters) {
  const params = filtersToParams(filters)
  return useQuery({
    queryKey: queryKeys.analytics.overview(params),
    queryFn: () => api.get<OverviewStats>(`/admin/analytics/overview${toQueryString(params)}`),
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useAnalyticsChains(filters?: AnalyticsFilters) {
  const params = filtersToParams(filters)
  return useQuery({
    queryKey: queryKeys.analytics.chains(params),
    queryFn: () => api.get<ChainOverview[]>(`/admin/analytics/chains${toQueryString(params)}`),
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useAnalyticsChainDetail(name: string, filters?: AnalyticsFilters) {
  const params = filtersToParams(filters)
  return useQuery({
    queryKey: queryKeys.analytics.chainDetail(name, params),
    queryFn: () => api.get<ChainDetail>(`/admin/analytics/chains/${encodeURIComponent(name)}${toQueryString(params)}`),
    enabled: !!name,
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useAnalyticsTopProducts(filters?: AnalyticsFilters) {
  const params = filtersToParams(filters)
  return useQuery({
    queryKey: queryKeys.analytics.topProducts(params),
    queryFn: () => api.get<TopProduct[]>(`/admin/analytics/products/top${toQueryString(params)}`),
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useAnalyticsProductPrices(productId: string, filters?: { dateFrom?: string; dateTo?: string; chain?: string }) {
  const params: Record<string, string> = {}
  if (filters?.dateFrom) params.dateFrom = filters.dateFrom
  if (filters?.dateTo) params.dateTo = filters.dateTo
  if (filters?.chain) params.chain = filters.chain
  const qsParams = Object.keys(params).length > 0 ? params : undefined

  return useQuery({
    queryKey: queryKeys.analytics.productPrices(productId, qsParams),
    queryFn: () => api.get<ProductPriceComparison[]>(`/admin/analytics/products/${productId}/prices${toQueryString(qsParams)}`),
    enabled: !!productId,
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useAnalyticsWalletShare(filters?: AnalyticsFilters) {
  const params = filtersToParams(filters)
  return useQuery({
    queryKey: queryKeys.analytics.walletShare(params),
    queryFn: () => api.get<WalletShare[]>(`/admin/analytics/wallet/share${toQueryString(params)}`),
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useAnalyticsPriceTrends(productId: string, filters?: { dateFrom?: string; dateTo?: string; chain?: string }) {
  const params: Record<string, string> = { productId }
  if (filters?.dateFrom) params.dateFrom = filters.dateFrom
  if (filters?.dateTo) params.dateTo = filters.dateTo
  if (filters?.chain) params.chain = filters.chain

  return useQuery({
    queryKey: queryKeys.analytics.priceTrends(productId, params),
    queryFn: () => api.get<PriceTrend[]>(`/admin/analytics/prices/trends?${new URLSearchParams(params).toString()}`),
    enabled: !!productId,
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useAnalyticsCities(filters?: AnalyticsFilters) {
  const params = filtersToParams(filters)
  return useQuery({
    queryKey: queryKeys.analytics.cities(params),
    queryFn: () => api.get<CityStats[]>(`/admin/analytics/geo/cities${toQueryString(params)}`),
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useAnalyticsPromos() {
  return useQuery({
    queryKey: queryKeys.analytics.promos(),
    queryFn: () => api.get<PromoCampaign[]>('/admin/analytics/promos'),
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useAnalyticsPromoAnalysis(id: string) {
  return useQuery({
    queryKey: queryKeys.analytics.promoAnalysis(id),
    queryFn: () => api.get<PromoAnalysis>(`/admin/analytics/promos/${id}/analysis`),
    enabled: !!id,
    staleTime: ANALYTICS_STALE_TIME,
  })
}

export function useCreatePromo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreatePromoDto) => api.post<PromoCampaign>('/admin/analytics/promos', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.promos() })
    },
  })
}

export function useDeletePromo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/analytics/promos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.promos() })
    },
  })
}
