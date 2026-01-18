import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Types
export interface FrequentItem {
  id: string
  displayName: string
  purchaseCount: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  lastPrice: number
  lastPurchaseDate: string
  stores: string[]
}

export interface PriceHistoryPoint {
  date: string
  price: number
  storeName: string
  quantity: number
}

export interface StorePriceComparison {
  storeName: string
  avgPrice: number
  minPrice: number
  maxPrice: number
  lastPrice: number
  lastDate: string
  purchaseCount: number
}

export interface SavingsOpportunity {
  productId: string
  displayName: string
  currentStore: string
  currentPrice: number
  cheaperStore: string
  cheaperPrice: number
  potentialSavings: number
  savingsPercent: number
}

export interface ItemStats {
  totalProducts: number
  totalPriceRecords: number
  uniqueStores: number
}

export interface ProductItem {
  id: string
  normalizedName: string
  displayName: string
  category?: string
  unit?: string
  unitSize?: number
  userId?: string
  aliases?: ItemAlias[]
  createdAt: string
  updatedAt: string
}

export interface ItemAlias {
  id: string
  aliasName: string
  storeName?: string
  productItemId: string
  createdAt: string
}

export interface MigrateResult {
  processed: number
  itemsCreated: number
  pricesRecorded: number
}

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: Pagination
}

// API functions
const fetchFrequentItems = async (
  options: { page?: number; limit?: number } = {}
): Promise<PaginatedResponse<FrequentItem>> => {
  const params = new URLSearchParams()
  if (options.page) params.append('page', options.page.toString())
  if (options.limit) params.append('limit', options.limit.toString())
  const queryString = params.toString()
  return api.get<PaginatedResponse<FrequentItem>>(`/items/frequent${queryString ? `?${queryString}` : ''}`)
}

const fetchItemStats = async (): Promise<ItemStats> => {
  return api.get<ItemStats>('/items/stats')
}

const fetchUserProducts = async (): Promise<ProductItem[]> => {
  return api.get<ProductItem[]>('/items/products')
}

const fetchSavingsOpportunities = async (limit: number = 10): Promise<SavingsOpportunity[]> => {
  return api.get<SavingsOpportunity[]>(`/items/savings?limit=${limit}`)
}

const fetchProduct = async (id: string): Promise<ProductItem> => {
  return api.get<ProductItem>(`/items/${id}`)
}

const fetchPriceHistory = async (
  id: string,
  options?: { store?: string; limit?: number }
): Promise<PriceHistoryPoint[]> => {
  const params = new URLSearchParams()
  if (options?.store) params.append('store', options.store)
  if (options?.limit) params.append('limit', options.limit.toString())
  const queryString = params.toString()
  return api.get<PriceHistoryPoint[]>(`/items/${id}/history${queryString ? `?${queryString}` : ''}`)
}

const fetchStorePriceComparison = async (id: string): Promise<StorePriceComparison[]> => {
  return api.get<StorePriceComparison[]>(`/items/${id}/stores`)
}

const searchSimilarProducts = async (query: string, limit: number = 5): Promise<ProductItem[]> => {
  if (!query) return []
  return api.get<ProductItem[]>(`/items/search/similar?q=${encodeURIComponent(query)}&limit=${limit}`)
}

const migrateExistingReceipts = async (): Promise<MigrateResult> => {
  return api.post<MigrateResult>('/items/migrate')
}

// Hooks
export function useFrequentItems(options: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 10 } = options
  return useQuery({
    queryKey: queryKeys.items.frequent(page, limit),
    queryFn: () => fetchFrequentItems({ page, limit }),
  })
}

export function useItemStats() {
  return useQuery({
    queryKey: queryKeys.items.stats(),
    queryFn: fetchItemStats,
  })
}

export function useUserProducts() {
  return useQuery({
    queryKey: queryKeys.items.products(),
    queryFn: fetchUserProducts,
  })
}

export function useSavingsOpportunities(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.items.savings(limit),
    queryFn: () => fetchSavingsOpportunities(limit),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.items.detail(id),
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  })
}

export function usePriceHistory(id: string, options?: { store?: string; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.items.history(id, options?.store),
    queryFn: () => fetchPriceHistory(id, options),
    enabled: !!id,
  })
}

export function useStorePriceComparison(id: string) {
  return useQuery({
    queryKey: queryKeys.items.stores(id),
    queryFn: () => fetchStorePriceComparison(id),
    enabled: !!id,
  })
}

export function useSearchSimilarProducts(query: string, limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.items.search(query),
    queryFn: () => searchSimilarProducts(query, limit),
    enabled: query.length >= 2,
  })
}

export function useMigrateReceipts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: migrateExistingReceipts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
    },
  })
}

// Delete product API function
const deleteProduct = async (id: string): Promise<{ deleted: boolean; pricesDeleted: number; aliasesDeleted: number }> => {
  return api.delete(`/items/${id}`)
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all })
    },
  })
}
