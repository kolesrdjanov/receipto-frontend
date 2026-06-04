import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

// API functions
const resendVerification = async (email: string): Promise<void> => {
  return api.post<void>('/auth/resend-verification', { email }, { requiresAuth: false })
}

// Hooks
export function useResendVerification() {
  return useMutation({
    mutationFn: resendVerification,
  })
}
