import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { useCallback } from 'react'

export function useLogout() {
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = useCallback(() => {
    // Clear all React Query cache
    queryClient.clear()
    // Clear auth state
    logout()
  }, [queryClient, logout])

  return handleLogout
}

