import axios, { AxiosError } from 'axios'
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'

const API_BASE_URL = import.meta.env.VITE_APP_API_URL || ''

interface ApiRequestOptions extends AxiosRequestConfig {
  requiresAuth?: boolean
}

export class ApiError extends Error {
  status?: number
  rawMessage?: string

  constructor(message: string, options?: { status?: number; rawMessage?: string }) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.rawMessage = options?.rawMessage
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

// Track ongoing refresh requests to prevent concurrent calls
let refreshPromise: Promise<boolean> | null = null

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token and language
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const requiresAuth = (config as any).requiresAuth !== false

    if (requiresAuth) {
      const accessToken = useAuthStore.getState().accessToken
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
      }
    }

    // Add Accept-Language header from settings store
    config.headers['Accept-Language'] = useSettingsStore.getState().language || 'en'

    // Let axios auto-set Content-Type with boundary for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
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
        return Promise.reject(
          new ApiError('Session expired. Please sign in again.', { status: 401 }),
        )
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
      const payload = error.response?.data as
        | { message?: string | string[] }
        | undefined
      const rawMessage = payload?.message
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : rawMessage || error.message || 'An error occurred'
      throw new ApiError(message, {
        status: error.response?.status,
        rawMessage: Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage,
      })
    }
    throw error
  }
}

async function refreshAccessToken(): Promise<boolean> {
  // If a refresh is already in progress, wait for it instead of starting a new one
  if (refreshPromise) {
    return refreshPromise
  }

  // Create a new refresh promise
  refreshPromise = (async () => {
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

      const { accessToken, refreshToken: newRefreshToken } = response.data
      const authStore = useAuthStore.getState()

      authStore.setAccessToken(accessToken)

      // Also update refresh token if rotated
      if (newRefreshToken) {
        authStore.setRefreshToken(newRefreshToken)
      }

      return true
    } catch {
      return false
    } finally {
      // Clear the promise after completion (success or failure)
      refreshPromise = null
    }
  })()

  return refreshPromise
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
