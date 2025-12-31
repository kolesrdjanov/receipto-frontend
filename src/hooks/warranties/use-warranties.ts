import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/store/auth'
import axios from 'axios'

export interface Warranty {
  id: string
  productName: string
  storeName?: string
  purchaseDate: string
  warrantyExpires: string
  warrantyDuration?: number
  imageUrl?: string
  imagePublicId?: string
  imageUrl2?: string
  imagePublicId2?: string
  notes?: string
  userId: string
  receiptId?: string
  createdAt: string
  updatedAt: string
}

export interface WarrantyStats {
  total: number
  active: number
  expired: number
  expiringSoon: number
}

export interface CreateWarrantyData {
  productName: string
  storeName?: string
  purchaseDate: string
  warrantyDuration?: number
  notes?: string
  receiptId?: string
}

// Fetch all warranties
const fetchWarranties = async (status?: string): Promise<Warranty[]> => {
  const endpoint = status ? `/warranties?status=${status}` : '/warranties'
  return api.get<Warranty[]>(endpoint)
}

// Fetch warranty stats
const fetchWarrantyStats = async (): Promise<WarrantyStats> => {
  return api.get<WarrantyStats>('/warranties/stats')
}

// Fetch expiring soon
const fetchExpiringSoon = async (days: number = 30): Promise<Warranty[]> => {
  return api.get<Warranty[]>(`/warranties/expiring-soon?days=${days}`)
}

const API_BASE_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000/api'

async function apiRequestWithFormData<T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PATCH'
): Promise<T> {
  // Use a plain axios call so we can control headers for FormData.
  // Reuse the same refresh-token behavior as the main api client.
  const accessToken = useAuthStore.getState().accessToken

  try {
    const response = await axios.request<T>({
      url: `${API_BASE_URL}${endpoint}`,
      method,
      data: formData,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      // Let axios set the multipart boundary automatically.
    })
    return response.data
  } catch (err) {
    // If unauthorized, rely on the same refresh endpoint used in lib/api.ts.
    // Keep it local to avoid circular imports.
    const refreshToken = useAuthStore.getState().refreshToken
    if (
      axios.isAxiosError(err) &&
      err.response?.status === 401 &&
      refreshToken
    ) {
      try {
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        )
        const { accessToken: newAccessToken } = refreshResponse.data
        if (newAccessToken) {
          useAuthStore.getState().setAccessToken(newAccessToken)
        }

        const retryResponse = await axios.request<T>({
          url: `${API_BASE_URL}${endpoint}`,
          method,
          data: formData,
          headers: {
            ...(newAccessToken ? { Authorization: `Bearer ${newAccessToken}` } : {}),
          },
        })

        return retryResponse.data
      } catch {
        // If refresh fails, surface a clear error.
        throw new Error('Session expired. Please sign in again.')
      }
    }

    if (axios.isAxiosError(err)) {
      const data = err.response?.data
      const maybeMessage =
        typeof data === 'object' && data !== null && 'message' in data
          ? (data as { message?: unknown }).message
          : undefined

      const message = typeof maybeMessage === 'string' ? maybeMessage : err.message
      throw new Error(message || 'Request failed')
    }

    throw err
  }
}

// Create warranty with optional images (max 2)
const createWarranty = async (data: CreateWarrantyData, images?: File[]): Promise<Warranty> => {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  })

  ;(images ?? []).slice(0, 2).forEach((img) => {
    formData.append('images', img)
  })

  return apiRequestWithFormData<Warranty>('/warranties', formData, 'POST')
}

// Update warranty
const updateWarranty = async (
  id: string,
  data: Partial<CreateWarrantyData>,
  images?: File[],
  removeImage1?: boolean,
  removeImage2?: boolean
): Promise<Warranty> => {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value))
    }
  })

  if (removeImage1) {
    formData.append('removeImage1', 'true')
  }
  if (removeImage2) {
    formData.append('removeImage2', 'true')
  }

  ;(images ?? []).slice(0, 2).forEach((img) => {
    formData.append('images', img)
  })

  return apiRequestWithFormData<Warranty>(`/warranties/${id}`, formData, 'PATCH')
}

// Delete warranty
const deleteWarranty = async (id: string): Promise<void> => {
  await api.delete(`/warranties/${id}`)
}

// Upload images to existing warranty
const uploadWarrantyImages = async (id: string, images: File[]): Promise<Warranty> => {
  const formData = new FormData()
  images.slice(0, 2).forEach((img) => formData.append('images', img))
  return apiRequestWithFormData<Warranty>(`/warranties/${id}/image`, formData, 'POST')
}

// Remove image from warranty
const removeWarrantyImage = async (id: string): Promise<Warranty> => {
  return api.delete<Warranty>(`/warranties/${id}/image`)
}

// Hooks
export function useWarranties(status?: 'active' | 'expired' | 'expiring') {
  return useQuery({
    queryKey: queryKeys.warranties.list(status),
    queryFn: () => fetchWarranties(status),
  })
}

export function useWarrantyStats() {
  return useQuery({
    queryKey: queryKeys.warranties.stats(),
    queryFn: fetchWarrantyStats,
  })
}

export function useExpiringSoonWarranties(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.warranties.expiringSoon(days),
    queryFn: () => fetchExpiringSoon(days),
  })
}

export function useCreateWarranty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ data, images }: { data: CreateWarrantyData; images?: File[] }) =>
      createWarranty(data, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warranties.all })
    },
  })
}

export function useUpdateWarranty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
      images,
      removeImage1,
      removeImage2,
    }: {
      id: string
      data: Partial<CreateWarrantyData>
      images?: File[]
      removeImage1?: boolean
      removeImage2?: boolean
    }) => updateWarranty(id, data, images, removeImage1, removeImage2),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warranties.all })
    },
  })
}

export function useDeleteWarranty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWarranty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warranties.all })
    },
  })
}

export function useUploadWarrantyImages() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, images }: { id: string; images: File[] }) =>
      uploadWarrantyImages(id, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warranties.all })
    },
  })
}

export function useRemoveWarrantyImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeWarrantyImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.warranties.all })
    },
  })
}

// Helper function to check warranty status
export function getWarrantyStatus(warranty: Warranty): 'active' | 'expiring' | 'expired' {
  const today = new Date()
  const expiryDate = new Date(warranty.warrantyExpires)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  if (expiryDate < today) {
    return 'expired'
  }
  if (expiryDate <= thirtyDaysFromNow) {
    return 'expiring'
  }
  return 'active'
}

// Helper to format remaining days
export function getRemainingDays(warranty: Warranty): number {
  const today = new Date()
  const expiryDate = new Date(warranty.warrantyExpires)
  const diffTime = expiryDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
