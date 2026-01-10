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

  // Currencies
  currencies: {
    all: ['currencies'] as const,
    lists: () => [...queryKeys.currencies.all, 'list'] as const,
    list: () => [...queryKeys.currencies.lists()] as const,
  },

  // Groups
  groups: {
    all: ['groups'] as const,
    lists: () => [...queryKeys.groups.all, 'list'] as const,
    list: () => [...queryKeys.groups.lists()] as const,
    details: () => [...queryKeys.groups.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.groups.details(), id] as const,
    stats: (id: string) => [...queryKeys.groups.detail(id), 'stats'] as const,
    invites: () => [...queryKeys.groups.all, 'invites'] as const,
  },

  // Dashboard stats (if needed)
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters?: { page?: number; limit?: number }) =>
      [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },

  // Warranties
  warranties: {
    all: ['warranties'] as const,
    lists: () => [...queryKeys.warranties.all, 'list'] as const,
    list: (status?: string) => [...queryKeys.warranties.lists(), status] as const,
    details: () => [...queryKeys.warranties.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.warranties.details(), id] as const,
    stats: () => [...queryKeys.warranties.all, 'stats'] as const,
    expiringSoon: (days?: number) => [...queryKeys.warranties.all, 'expiring', days] as const,
  },

  // Templates
  templates: {
    all: ['templates'] as const,
    lists: () => [...queryKeys.templates.all, 'list'] as const,
    list: () => [...queryKeys.templates.lists()] as const,
    details: () => [...queryKeys.templates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.templates.details(), id] as const,
  },
} as const
