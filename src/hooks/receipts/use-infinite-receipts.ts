import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { PaginatedReceipts, ReceiptsFilters } from '@/hooks/receipts/use-receipts'

function buildQuery(filters: ReceiptsFilters & { page: number }): string {
  const p = new URLSearchParams()
  if (filters.groupId) p.append('groupId', filters.groupId)
  if (filters.categoryId) p.append('categoryId', filters.categoryId)
  if (filters.minAmount !== undefined) p.append('minAmount', String(filters.minAmount))
  if (filters.maxAmount !== undefined) p.append('maxAmount', String(filters.maxAmount))
  if (filters.startDate) p.append('startDate', filters.startDate)
  if (filters.endDate) p.append('endDate', filters.endDate)
  p.append('page', String(filters.page))
  if (filters.limit !== undefined) p.append('limit', String(filters.limit))
  if (filters.sortBy) p.append('sortBy', filters.sortBy)
  if (filters.sortOrder) p.append('sortOrder', filters.sortOrder)
  return p.toString()
}

/**
 * Mobile feed: appends pages via useInfiniteQuery. `enabled` lets the page run only
 * one data path per viewport (desktop uses the page-based useReceipts).
 */
export function useInfiniteReceipts(filters: ReceiptsFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.receipts.lists(), 'infinite', filters] as const,
    queryFn: ({ pageParam }) =>
      api.get<PaginatedReceipts>(`/receipts?${buildQuery({ ...filters, page: pageParam })}`),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    enabled,
  })
}
