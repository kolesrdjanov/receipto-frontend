import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Types
export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface RecurringExpense {
  id: string
  name: string
  amount: number
  currency: string
  isFixed: boolean
  frequency: RecurringFrequency
  dayOfMonth?: number
  startDate: string
  endDate?: string
  icon?: string
  color?: string
  notes?: string
  isPaused: boolean
  categoryId?: string
  category?: {
    id: string
    name: string
    color?: string
    icon?: string
  }
  nextDueDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface RecurringExpensePayment {
  id: string
  recurringExpenseId: string
  amount: number
  paidDate: string
  dueDate: string
  notes?: string
  createdAt: string
}

export interface UpcomingExpense {
  id: string
  name: string
  amount: number
  currency: string
  isFixed: boolean
  icon?: string
  color?: string
  category?: {
    id: string
    name: string
    color?: string
    icon?: string
  }
  dueDate: string
}

export interface UpcomingResponse {
  overdue: UpcomingExpense[]
  dueSoon: UpcomingExpense[]
  upcoming: UpcomingExpense[]
}

export interface RecurringSummary {
  monthlyCommitment: { amount: number; currency: string }[]
  paidThisMonth: number
  pendingThisMonth: number
  totalActive: number
}

export interface CreateRecurringExpenseInput {
  name: string
  amount: number
  currency?: string
  isFixed?: boolean
  frequency?: RecurringFrequency
  dayOfMonth?: number
  startDate: string
  endDate?: string
  categoryId?: string | null
  icon?: string
  color?: string
  notes?: string
}

export interface UpdateRecurringExpenseInput extends Partial<CreateRecurringExpenseInput> {
  isPaused?: boolean
}

export interface MarkPaidInput {
  amount?: number
  paidDate?: string
  dueDate: string
  notes?: string
}

// API functions
const fetchRecurringExpenses = (): Promise<RecurringExpense[]> =>
  api.get('/recurring-expenses')

const fetchRecurringExpense = (id: string): Promise<RecurringExpense> =>
  api.get(`/recurring-expenses/${id}`)

const fetchUpcoming = (days?: number): Promise<UpcomingResponse> =>
  api.get(`/recurring-expenses/upcoming${days ? `?days=${days}` : ''}`)

const fetchSummary = (): Promise<RecurringSummary> =>
  api.get('/recurring-expenses/summary')

const createRecurringExpense = (data: CreateRecurringExpenseInput): Promise<RecurringExpense> =>
  api.post('/recurring-expenses', data)

const updateRecurringExpense = (id: string, data: UpdateRecurringExpenseInput): Promise<RecurringExpense> =>
  api.patch(`/recurring-expenses/${id}`, data)

const deleteRecurringExpense = (id: string): Promise<void> =>
  api.delete(`/recurring-expenses/${id}`)

const markAsPaid = (id: string, data: MarkPaidInput): Promise<RecurringExpensePayment> =>
  api.post(`/recurring-expenses/${id}/pay`, data)

const fetchPayments = (id: string, limit?: number): Promise<RecurringExpensePayment[]> =>
  api.get(`/recurring-expenses/${id}/payments${limit ? `?limit=${limit}` : ''}`)

// Hooks
export function useRecurringExpenses() {
  return useQuery({
    queryKey: queryKeys.recurringExpenses.list(),
    queryFn: fetchRecurringExpenses,
  })
}

export function useRecurringExpense(id: string) {
  return useQuery({
    queryKey: queryKeys.recurringExpenses.detail(id),
    queryFn: () => fetchRecurringExpense(id),
    enabled: !!id,
  })
}

export function useUpcomingExpenses(days?: number) {
  return useQuery({
    queryKey: queryKeys.recurringExpenses.upcoming(days),
    queryFn: () => fetchUpcoming(days),
  })
}

export function useRecurringSummary() {
  return useQuery({
    queryKey: queryKeys.recurringExpenses.summary(),
    queryFn: fetchSummary,
  })
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
    },
  })
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringExpenseInput }) =>
      updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
    },
  })
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.recurringExpenses.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
    },
  })
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarkPaidInput }) =>
      markAsPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringExpenses.all })
    },
  })
}

export function usePaymentHistory(id: string) {
  return useQuery({
    queryKey: queryKeys.recurringExpenses.payments(id),
    queryFn: () => fetchPayments(id),
    enabled: !!id,
  })
}
