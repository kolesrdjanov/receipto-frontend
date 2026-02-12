import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

/**
 * Polls all group-detail queries every 30 seconds while the component is mounted.
 * Uses hierarchical query key invalidation — invalidating `groups.detail(id)`
 * automatically refetches all child queries (stats, activities, balances, receipts).
 */
export function useGroupPolling(groupId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!groupId) return

    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(groupId),
      })
    }, 30_000)

    return () => clearInterval(interval)
  }, [groupId, queryClient])
}
