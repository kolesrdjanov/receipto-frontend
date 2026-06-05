import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Step 1 of passwordless sign-in: email a one-time login code.
 * Always resolves with a generic message (no email enumeration).
 */
const requestCode = async (email: string): Promise<{ message: string }> => {
  return api.post<{ message: string }>('/auth/request-code', { email }, { requiresAuth: false })
}

export function useRequestCode() {
  return useMutation({ mutationFn: requestCode })
}
