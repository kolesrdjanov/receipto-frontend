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
  receiptCount: number
}

export interface AdminUsersFilters {
  page?: number
  limit?: number
  search?: string
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
