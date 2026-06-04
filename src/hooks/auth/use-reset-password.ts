import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'

function createResetPasswordSchema(t: (key: string) => string) {
  return z
    .object({
      password: z
        .string()
        .min(8, t('auth.validation.passwordMinLength'))
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: t('auth.validation.passwordRequirements') }),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.validation.passwordsMismatch'),
      path: ['confirmPassword'],
    })
}

type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordSchema>>

export function useResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(createResetPasswordSchema(t)),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    if (!token) {
      setApiError(t('auth.validation.invalidResetLink'))
      return
    }

    setApiError('')
    setIsLoading(true)

    try {
      await api.post(
        '/auth/reset-password',
        {
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        },
        { requiresAuth: false }
      )
      setSuccess(true)
      setTimeout(() => {
        navigate('/sign-in')
      }, 2000)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t('auth.validation.resetPasswordFailed'))
    } finally {
      setIsLoading(false)
    }
  })

  return {
    register: form.register,
    watch: form.watch,
    errors: form.formState.errors,
    apiError,
    success,
    isLoading,
    token,
    handleSubmit: onSubmit,
  }
}
