import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

// API functions
const verifyEmail = async (token: string): Promise<void> => {
  return api.post<void>('/auth/verify-email', { token }, { requiresAuth: false })
}

// Hooks
export function useVerifyEmail() {
  return useMutation({
    mutationFn: verifyEmail,
  })
}
