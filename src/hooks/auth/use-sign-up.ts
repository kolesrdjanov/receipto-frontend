import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

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

interface RegisterResponse {
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

export function useSignUp() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpFormData, string>>>({})
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof SignUpFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const signUpSchema = createSignUpSchema(t)
    const result = signUpSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignUpFormData, string>> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof SignUpFormData
        fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setApiError('')
    setIsLoading(true)

    try {
      const response = await api.post<RegisterResponse>(
        '/auth/register',
        {
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          password: result.data.password,
        },
        { requiresAuth: false }
      )

      login(response.user, response.accessToken, response.refreshToken)

      // Redirect to the page they were trying to access, or dashboard
      const from = (location.state as { from?: string })?.from || '/dashboard'
      navigate(from, { replace: true })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t('auth.validation.signUpFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    errors,
    apiError,
    setApiError,
    isLoading,
    handleChange,
    handleSubmit,
  }
}
