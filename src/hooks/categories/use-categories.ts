import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Types
export interface Category {
  id: string
  userId: string
  name: string
  color?: string
  icon?: string
  description?: string
  monthlyBudget?: number
  budgetCurrency?: string
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryInput {
  name: string
  color?: string
  icon?: string
  description?: string
  monthlyBudget?: number
  budgetCurrency?: string
}

export interface UpdateCategoryInput {
  name?: string
  color?: string
  icon?: string
  description?: string
  monthlyBudget?: number
  budgetCurrency?: string
}

// API functions
const fetchCategories = async (): Promise<Category[]> => {
  return api.get<Category[]>('/categories')
}

const fetchCategory = async (id: string): Promise<Category> => {
  return api.get<Category>(`/categories/${id}`)
}

const createCategory = async (data: CreateCategoryInput): Promise<Category> => {
  return api.post<Category>('/categories', data)
}

const updateCategory = async (id: string, data: UpdateCategoryInput): Promise<Category> => {
  return api.patch<Category>(`/categories/${id}`, data)
}

const deleteCategory = async (id: string): Promise<void> => {
  return api.delete<void>(`/categories/${id}`)
}

// Hooks
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: fetchCategories,
  })
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => fetchCategory(id),
    enabled: !!id,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      // Invalidate categories list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) => updateCategory(id, data),
    onSuccess: (updatedCategory) => {
      // Update the specific category in cache
      queryClient.setQueryData(queryKeys.categories.detail(updatedCategory.id), updatedCategory)
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.categories.detail(deletedId) })
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() })
      // Invalidate receipts that might be using this category
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.lists() })
      // Invalidate dashboard stats
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    },
  })
}
