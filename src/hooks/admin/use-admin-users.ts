import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'admin'
  createdAt: string
  lastLoginAt: string | null
  receiptCount: number
  warrantyCount: number
  recurringExpenseCount: number
  recurringPaymentCount: number
  recurringReceiptCount: number
}

export type SortField =
  | 'createdAt'
  | 'lastLoginAt'
  | 'receiptCount'
  | 'warrantyCount'
  | 'recurringExpenseCount'
  | 'email'
  | 'firstName'
  | 'lastName'
export type SortOrder = 'ASC' | 'DESC'

export interface AdminUsersFilters {
  page?: number
  limit?: number
  search?: string
  sortBy?: SortField
  sortOrder?: SortOrder
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedAdminUsers {
  data: AdminUser[]
  meta: PaginationMeta
}

const fetchAdminUsers = async (
  filters?: AdminUsersFilters
): Promise<PaginatedAdminUsers> => {
  const params = new URLSearchParams()
  if (filters?.page !== undefined) params.append('page', filters.page.toString())
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString())
  if (filters?.search?.length) params.append('search', filters.search)
  if (filters?.sortBy) params.append('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

  const queryString = params.toString()
  const endpoint = `/users${queryString ? `?${queryString}` : ''}`

  return api.get<PaginatedAdminUsers>(endpoint)
}

export function useAdminUsers(filters?: AdminUsersFilters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchAdminUsers(filters),
  })
}

// Create user types and mutation
export interface CreateUserInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: 'user' | 'admin'
}

export interface CreateUserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'admin'
}

const createUser = async (data: CreateUserInput): Promise<CreateUserResponse> => {
  return api.post<CreateUserResponse>('/users', data)
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

// Delete user mutation
const deleteUser = async (userId: string): Promise<void> => {
  return api.delete(`/users/${userId}`)
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
    },
  })
}

// Get user details
export interface UserDetails {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'admin'
  profileImageUrl: string | null
  createdAt: string
  lastLoginAt: string | null
  receiptCount: number
  warrantyCount: number
  recurringExpenseCount: number
  recurringPaymentCount: number
  recurringReceiptCount: number
  street: string | null
  zipCode: string | null
  city: string | null
}

const fetchUserDetails = async (userId: string): Promise<UserDetails> => {
  return api.get<UserDetails>(`/users/${userId}/details`)
}

export function useUserDetails(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId!),
    queryFn: () => fetchUserDetails(userId!),
    enabled: !!userId,
  })
}

// Get user categories
export interface UserCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  monthlyBudget?: number | null
  budgetCurrency?: string | null
  createdAt: string
}

export interface PaginatedUserCategories {
  data: UserCategory[]
  meta: PaginationMeta
}

const fetchUserCategories = async (
  userId: string,
  page: number,
  limit: number
): Promise<PaginatedUserCategories> => {
  return api.get<PaginatedUserCategories>(
    `/users/${userId}/categories?page=${page}&limit=${limit}`
  )
}

export function useUserCategories(userId: string | null, page: number, limit: number = 5) {
  return useQuery({
    queryKey: [...queryKeys.users.detail(userId!), 'categories', page, limit],
    queryFn: () => fetchUserCategories(userId!, page, limit),
    enabled: !!userId,
  })
}

// Get user receipts
export interface UserReceipt {
  id: string
  storeName: string
  totalAmount: string | number
  currency: string
  receiptDate: string
  receiptNumber: string
  status: string
  category: {
    id: string
    name: string
    icon: string
    color: string
  } | null
  createdAt: string
}

export interface PaginatedUserReceipts {
  data: UserReceipt[]
  meta: PaginationMeta
}

const fetchUserReceipts = async (
  userId: string,
  page: number,
  limit: number
): Promise<PaginatedUserReceipts> => {
  return api.get<PaginatedUserReceipts>(
    `/users/${userId}/receipts?page=${page}&limit=${limit}`
  )
}

export function useUserReceipts(userId: string | null, page: number, limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.users.detail(userId!), 'receipts', page, limit],
    queryFn: () => fetchUserReceipts(userId!, page, limit),
    enabled: !!userId,
  })
}

export interface CategorySpendingByCurrency {
  currency: string
  totalAmount: number
  receiptCount: number
}

export interface UserCategorySpending {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string | null
  byCurrency: CategorySpendingByCurrency[]
}

const fetchUserSpendingByCategory = async (userId: string): Promise<UserCategorySpending[]> => {
  return api.get<UserCategorySpending[]>(`/users/${userId}/analytics/spending-by-category`)
}

export function useUserSpendingByCategory(userId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.users.detail(userId!), 'analytics', 'spending-by-category'],
    queryFn: () => fetchUserSpendingByCategory(userId!),
    enabled: !!userId,
  })
}

