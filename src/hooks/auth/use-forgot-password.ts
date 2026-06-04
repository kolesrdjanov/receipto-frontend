import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'

function createForgotPasswordSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
  })
}

type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>

export function useForgotPassword() {
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(createForgotPasswordSchema(t)),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      await api.post(
        '/auth/forgot-password',
        { email: data.email },
        { requiresAuth: false }
      )
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  })

  return {
    register: form.register,
    errors: form.formState.errors,
    error,
    success,
    isLoading,
    handleSubmit: onSubmit,
  }
}
