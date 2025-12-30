import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Types
export interface Receipt {
  id: string
  userId: string
  categoryId?: string
  groupId?: string
  qrCodeUrl?: string
  storeName?: string
  totalAmount?: number
  currency?: string
  receiptDate?: string
  receiptNumber?: string
  scrapedData?: Record<string, unknown>
  status: 'pending' | 'scraped' | 'failed'
  category?: {
    id: string
    name: string
    color?: string
    icon?: string
  }
  group?: {
    id: string
    name: string
    color?: string
    icon?: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateReceiptInput {
  qrCodeUrl?: string
  storeName?: string
  totalAmount?: number
  currency?: string
  receiptDate?: string
  receiptNumber?: string
  categoryId?: string
  groupId?: string
}

export interface UpdateReceiptInput {
  storeName?: string
  totalAmount?: number
  currency?: string
  receiptDate?: string
  receiptNumber?: string
  categoryId?: string
  groupId?: string
}

export interface ReceiptsFilters {
  categoryId?: string
  startDate?: string
  endDate?: string
}

// API functions
const fetchReceipts = async (filters?: ReceiptsFilters): Promise<Receipt[]> => {
  const params = new URLSearchParams()
  if (filters?.categoryId) params.append('categoryId', filters.categoryId)
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)

  const queryString = params.toString()
  const endpoint = `/receipts${queryString ? `?${queryString}` : ''}`

  return api.get<Receipt[]>(endpoint)
}

const fetchReceipt = async (id: string): Promise<Receipt> => {
  return api.get<Receipt>(`/receipts/${id}`)
}

const createReceipt = async (data: CreateReceiptInput): Promise<Receipt> => {
  return api.post<Receipt>('/receipts', data)
}

const updateReceipt = async (id: string, data: UpdateReceiptInput): Promise<Receipt> => {
  return api.patch<Receipt>(`/receipts/${id}`, data)
}

const deleteReceipt = async (id: string): Promise<void> => {
  return api.delete<void>(`/receipts/${id}`)
}

// Hooks
export function useReceipts(filters?: ReceiptsFilters) {
  return useQuery({
    queryKey: queryKeys.receipts.list(filters),
    queryFn: () => fetchReceipts(filters),
  })
}

export function useReceipt(id: string) {
  return useQuery({
    queryKey: queryKeys.receipts.detail(id),
    queryFn: () => fetchReceipt(id),
    enabled: !!id,
  })
}

export function useCreateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReceipt,
    onSuccess: () => {
      // Invalidate all receipt lists to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.lists() })
      // Also invalidate dashboard stats if they exist
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    },
  })
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReceiptInput }) => updateReceipt(id, data),
    onSuccess: (updatedReceipt) => {
      // Update the specific receipt in cache
      queryClient.setQueryData(queryKeys.receipts.detail(updatedReceipt.id), updatedReceipt)
      // Invalidate all receipt lists
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.lists() })
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    },
  })
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReceipt,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.receipts.detail(deletedId) })
      // Invalidate all receipt lists
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.lists() })
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    },
  })
}
