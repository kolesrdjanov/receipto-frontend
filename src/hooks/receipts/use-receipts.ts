import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Types
export interface ScrapedData {
  tin?: string
  companyName?: string
  storeName?: string
  address?: string
  city?: string
  municipality?: string
  totalAmount?: number
  currency?: string
  receiptNumber?: string
  receiptDate?: string
  invoiceType?: string
  transactionType?: string
  paymentMethod?: string
  invoiceCounter?: string
  totalCounter?: string
  items?: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    taxLabel: string
  }>
  taxes?: Array<{
    label: string
    name: string
    rate: number
    amount: number
  }>
  journal?: string // Full receipt text from fiscal portal
  error?: string
}

export interface Receipt {
  id: string
  userId: string
  categoryId?: string
  groupId?: string
  paidById?: string
  qrCodeUrl?: string
  storeName?: string
  totalAmount?: string | number
  currency?: string
  receiptDate?: string
  receiptNumber?: string
  scrapedData?: ScrapedData
  status: 'pending' | 'scraped' | 'failed' | 'completed'
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
  paidBy?: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
  // Auto-categorization fields
  merchantId?: string
  merchant?: {
    id: string
    companyName: string
    storeName?: string
  }
  autoSuggestedCategoryId?: string
  autoSuggestedCategory?: {
    id: string
    name: string
    color?: string
    icon?: string
  }
  suggestionConfidence?: number
  suggestionAccepted?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateReceiptInput {
  qrCodeUrl?: string
  pfrData?: {
    InvoiceNumberSe?: string
    InvoiceCounter?: string
    InvoiceCounterExtension?: string
    TotalAmount?: string
    SdcDateTime?: string
  }
  storeName?: string
  totalAmount?: number
  currency?: string
  receiptDate?: string
  receiptNumber?: string
  categoryId?: string | null
  groupId?: string | null
  paidById?: string | null
}

export interface UpdateReceiptInput {
  storeName?: string
  totalAmount?: number
  currency?: string
  receiptDate?: string
  receiptNumber?: string
  categoryId?: string | null
  groupId?: string | null
  paidById?: string | null
}

export interface ReceiptsFilters {
  categoryId?: string
  minAmount?: number
  maxAmount?: number
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedReceipts {
  data: Receipt[]
  meta: PaginationMeta
}

// API functions
const fetchReceipts = async (filters?: ReceiptsFilters): Promise<PaginatedReceipts> => {
  const params = new URLSearchParams()
  if (filters?.categoryId) params.append('categoryId', filters.categoryId)
  if (filters?.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString())
  if (filters?.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString())
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.page !== undefined) params.append('page', filters.page.toString())
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString())

  const queryString = params.toString()
  const endpoint = `/receipts${queryString ? `?${queryString}` : ''}`

  return api.get<PaginatedReceipts>(endpoint)
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
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReceiptInput }) => updateReceipt(id, data),
    onSuccess: (updatedReceipt) => {
      queryClient.setQueryData(queryKeys.receipts.detail(updatedReceipt.id), updatedReceipt)
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteReceipt,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.receipts.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}
