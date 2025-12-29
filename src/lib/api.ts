import axios, { AxiosError } from 'axios'
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

interface ApiRequestOptions extends AxiosRequestConfig {
  requiresAuth?: boolean
}

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const requiresAuth = (config as any).requiresAuth !== false

    if (requiresAuth) {
      const accessToken = useAuthStore.getState().accessToken
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const requiresAuth = (originalRequest as any).requiresAuth !== false

    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && requiresAuth && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshed = await refreshAccessToken()
      if (refreshed) {
        const newAccessToken = useAuthStore.getState().accessToken
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return axiosInstance(originalRequest)
      } else {
        // Refresh failed, logout user
        useAuthStore.getState().logout()
        window.location.href = '/sign-in'
        return Promise.reject(new Error('Session expired. Please sign in again.'))
      }
    }

    return Promise.reject(error)
  }
)

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...axiosOptions } = options

  try {
    const response = await axiosInstance.request<T>({
      url: endpoint,
      ...axiosOptions,
      requiresAuth,
    } as any)

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'An error occurred'
      throw new Error(message)
    }
    throw error
  }
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) {
      return false
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    const { accessToken } = response.data
    useAuthStore.getState().setAccessToken(accessToken)
    return true
  } catch {
    return false
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      data,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      data,
    }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      data,
    }),
}
