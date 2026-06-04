import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'

function createSignUpSchema(t: (key: string) => string) {
  return z
    .object({
      firstName: z.string().min(1, t('auth.validation.firstNameRequired')),
      lastName: z.string().min(1, t('auth.validation.lastNameRequired')),
      email: z.string().min(1, t('auth.validation.emailRequired')).email(t('auth.validation.emailInvalid')),
      password: z
        .string()
        .min(8, t('auth.validation.passwordMinLength'))
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: t('auth.validation.passwordRequirements') }),
      confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
      terms: z.boolean().refine((val) => val === true, t('auth.validation.termsRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.validation.passwordsMismatch'),
      path: ['confirmPassword'],
    })
}

type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>

export function useSignUp() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(createSignUpSchema(t)),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    setApiError('')
    setIsLoading(true)

    try {
      await api.post(
        '/auth/register',
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        },
        { requiresAuth: false }
      )

      // Redirect to check-email page with the email in state
      navigate('/check-email', { replace: true, state: { email: data.email } })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t('auth.validation.signUpFailed'))
    } finally {
      setIsLoading(false)
    }
  })

  return {
    register: form.register,
    watch: form.watch,
    errors: form.formState.errors,
    apiError,
    setApiError,
    isLoading,
    handleSubmit: onSubmit,
  }
}
