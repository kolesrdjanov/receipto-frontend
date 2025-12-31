import { useState } from 'react'
import { api } from '@/lib/api'

export function useForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      await api.post(
        '/auth/forgot-password',
        { email },
        { requiresAuth: false }
      )
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    email,
    setEmail,
    error,
    success,
    isLoading,
    handleSubmit,
  }
}
