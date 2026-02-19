import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiRequest } from '@/lib/api'
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
  hasJournal?: boolean
  status: 'pending' | 'scraped' | 'failed' | 'manual' | 'completed' | 'recurring'
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
    isArchived?: boolean
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
  participants?: { userId: string }[]
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
  splitAmong?: string[]
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
  splitAmong?: string[] | null
}

export interface ReceiptsFilters {
  groupId?: string
  categoryId?: string
  minAmount?: number
  maxAmount?: number
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: 'receiptDate' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CurrencyTotal {
  currency: string
  total: number
}

export interface PaginatedReceipts {
  data: Receipt[]
  meta: PaginationMeta
  totalAmounts: CurrencyTotal[]
}

// API functions
const fetchReceipts = async (filters?: ReceiptsFilters): Promise<PaginatedReceipts> => {
  const params = new URLSearchParams()
  if (filters?.groupId) params.append('groupId', filters.groupId)
  if (filters?.categoryId) params.append('categoryId', filters.categoryId)
  if (filters?.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString())
  if (filters?.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString())
  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.page !== undefined) params.append('page', filters.page.toString())
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString())
  if (filters?.sortBy) params.append('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

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

const bulkDeleteReceipts = async (ids: string[]): Promise<{ deleted: number; skipped: number }> => {
  return api.delete<{ deleted: number; skipped: number }>('/receipts/bulk', { data: { ids } })
}

export interface ExportReceipt {
  id: string
  storeName?: string
  totalAmount?: number
  currency?: string
  receiptDate?: string
  receiptNumber?: string
  status: string
  category?: { id: string; name: string }
}

export interface ImportResult {
  total: number
  imported: number
  errors: { row: number; message: string }[]
}

const fetchExportReceipts = async (): Promise<ExportReceipt[]> => {
  return api.get<ExportReceipt[]>('/receipts/export')
}

const importReceipts = async (file: File): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest<ImportResult>('/receipts/import', { method: 'POST', data: formData })
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

export function useBulkDeleteReceipts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkDeleteReceipts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function generateCsv(receipts: ExportReceipt[]): string {
  const headers = ['storeName', 'totalAmount', 'currency', 'receiptDate', 'receiptNumber', 'categoryName', 'status']
  const lines = [headers.join(',')]

  for (const r of receipts) {
    const date = r.receiptDate ? r.receiptDate.split('T')[0] : ''
    const row = [
      escapeCsvField(r.storeName || ''),
      r.totalAmount != null ? String(r.totalAmount) : '',
      r.currency || '',
      date,
      escapeCsvField(r.receiptNumber || ''),
      escapeCsvField(r.category?.name || ''),
      r.status || '',
    ]
    lines.push(row.join(','))
  }

  return lines.join('\n')
}

export function useExportReceipts() {
  return useMutation({
    mutationFn: async () => {
      const receipts = await fetchExportReceipts()
      const csv = generateCsv(receipts)
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().split('T')[0]
      a.download = `receipts-${date}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    },
  })
}

export function useImportReceipts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: importReceipts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
