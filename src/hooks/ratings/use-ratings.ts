import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export interface Rating {
  id: string
  rating: number
  description?: string
  isPublic: boolean
  isApproved: boolean
  isFeatured: boolean
  adminComment?: string
  userId: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    profileImageUrl?: string
  }
}

export interface CreateRatingInput {
  rating: number
  description?: string
  isPublic?: boolean
}

export interface AdminUpdateRatingInput {
  isApproved?: boolean
  isFeatured?: boolean
  adminComment?: string
}

interface AdminRatingsResponse {
  data: Rating[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const fetchMyRating = async (): Promise<Rating | null> => {
  try {
    return await api.get<Rating>('/ratings/me')
  } catch {
    return null
  }
}

const submitRating = async (data: CreateRatingInput): Promise<Rating> => {
  return api.post<Rating>('/ratings', data)
}

const fetchAdminRatings = async (page = 1, limit = 20): Promise<AdminRatingsResponse> => {
  return api.get<AdminRatingsResponse>('/ratings/admin', { params: { page, limit } })
}

export function useMyRating() {
  return useQuery({
    queryKey: queryKeys.ratings.myRating(),
    queryFn: fetchMyRating,
  })
}

export function useSubmitRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: submitRating,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.myRating() })
    },
  })
}

export function useAdminRatings(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.ratings.adminList({ page, limit }),
    queryFn: () => fetchAdminRatings(page, limit),
  })
}

const adminUpdateRating = async (id: string, data: AdminUpdateRatingInput): Promise<Rating> => {
  return api.patch<Rating>(`/ratings/admin/${id}`, data)
}

export function useAdminUpdateRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdminUpdateRatingInput }) =>
      adminUpdateRating(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.adminLists() })
    },
  })
}
