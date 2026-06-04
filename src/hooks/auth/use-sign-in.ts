import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, isApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface LoginResponse {
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

function createSignInSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
    password: z.string().min(1, t('common.validation.passwordRequired')),
  })
}

type SignInFormData = z.infer<ReturnType<typeof createSignInSchema>>

export function useSignIn() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)

  const form = useForm<SignInFormData>({
    resolver: zodResolver(createSignInSchema(t)),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    setError('')
    setEmailNotVerified(false)
    setIsLoading(true)

    try {
      const response = await api.post<LoginResponse>(
        '/auth/login',
        {
          email: data.email,
          password: data.password,
        },
        { requiresAuth: false }
      )

      login(response.user, response.accessToken, response.refreshToken)

      const from = (location.state as { from?: string })?.from || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      if (isApiError(err) && err.code === 'auth.emailNotVerified') {
        setEmailNotVerified(true)
      }
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  })

  return {
    register: form.register,
    getValues: form.getValues,
    errors: form.formState.errors,
    error,
    setError,
    isLoading,
    emailNotVerified,
    handleSubmit: onSubmit,
  }
}
