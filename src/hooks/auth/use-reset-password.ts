import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordFormData, string>>>({})
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name as keyof ResetPasswordFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setApiError(t('auth.validation.invalidResetLink'))
      return
    }

    const resetPasswordSchema = createResetPasswordSchema(t)
    const result = resetPasswordSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ResetPasswordFormData, string>> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ResetPasswordFormData
        fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setApiError('')
    setIsLoading(true)

    try {
      await api.post(
        '/auth/reset-password',
        {
          token,
          password: result.data.password,
          confirmPassword: result.data.confirmPassword,
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
  }

  return {
    formData,
    errors,
    apiError,
    success,
    isLoading,
    token,
    handleChange,
    handleSubmit,
  }
}
