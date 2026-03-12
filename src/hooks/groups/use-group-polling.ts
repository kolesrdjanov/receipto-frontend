import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

/**
 * Polls all group-detail queries every 30 seconds while the component is mounted
 * AND the tab is visible. Pauses polling when the user switches to another tab
 * to avoid wasting bandwidth.
 */
export function useGroupPolling(groupId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!groupId) return

    let interval: ReturnType<typeof setInterval> | null = null

    const startPolling = () => {
      if (interval) return
      interval = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groups.detail(groupId),
        })
      }, 30_000)
    }

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        // Refetch immediately when tab becomes visible, then resume polling
        queryClient.invalidateQueries({
          queryKey: queryKeys.groups.detail(groupId),
        })
        startPolling()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [groupId, queryClient])
}
