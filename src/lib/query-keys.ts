/**
 * Centralized query key factory for type-safe and consistent cache keys
 *
 * Following TanStack Query best practices for query key organization:
 * - Keys are arrays for better invalidation and filtering
 * - Hierarchical structure from general to specific
 * - Each entity has its own namespace
 */

export const queryKeys = {
  // Receipts
  receipts: {
    all: ['receipts'] as const,
    lists: () => [...queryKeys.receipts.all, 'list'] as const,
    list: (filters?: { categoryId?: string; startDate?: string; endDate?: string }) =>
      [...queryKeys.receipts.lists(), filters] as const,
    details: () => [...queryKeys.receipts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.receipts.details(), id] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
  },

  // Dashboard stats (if needed)
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
} as const
