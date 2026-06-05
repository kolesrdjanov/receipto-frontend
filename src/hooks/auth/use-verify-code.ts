import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface VerifyCodeResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    profileImageUrl?: string | null
    role: 'user' | 'admin'
  }
  isNewUser: boolean
}

/**
 * Step 2 of passwordless sign-in: verify the code and sign in. On success the
 * tokens land in the auth store; the response's `isNewUser` drives whether the
 * caller routes to the one-time profile step.
 */
export function useVerifyCode() {
  const login = useAuthStore((s) => s.login)

  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      api.post<VerifyCodeResponse>('/auth/verify-code', { email, code }, { requiresAuth: false }),
    onSuccess: (res) => {
      login(res.user, res.accessToken, res.refreshToken)
    },
  })
}
