import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

const signUpSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    terms: z.boolean().refine((val) => val === true, 'You must agree to the terms and conditions'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignUpFormData = z.infer<typeof signUpSchema>

interface RegisterResponse {
  accessToken: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export function useSignUp() {
  const navigate = useNavigate()
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

      login(response.user, response.accessToken)
      navigate('/dashboard')
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    errors,
    apiError,
    isLoading,
    handleChange,
    handleSubmit,
  }
}
