import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface GoogleAuthResponse {
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
}

export function useGoogleAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSuccess = async (credential: string) => {
    setError('')
    setIsLoading(true)

    try {
      const response = await api.post<GoogleAuthResponse>(
        '/auth/google',
        { idToken: credential },
        { requiresAuth: false },
      )

      login(response.user, response.accessToken, response.refreshToken)

      const from = (location.state as { from?: string })?.from || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.')
  }

  return {
    error,
    isLoading,
    handleGoogleSuccess,
    handleGoogleError,
  }
}
