import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Public endpoint returns resolved strings (based on Accept-Language)
export interface Announcement {
  id: string
  title: string
  message: string
  type: 'alert' | 'success' | 'info'
  displayMode: 'banner' | 'list' | 'both'
  linkUrl?: string
  linkText?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Admin endpoint returns full localized objects
export interface LocalizedText {
  en: string
  sr: string
}

export interface AdminAnnouncement {
  id: string
  title: LocalizedText
  message: LocalizedText
  type: 'alert' | 'success' | 'info'
  displayMode: 'banner' | 'list' | 'both'
  linkUrl?: string
  linkText?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAnnouncementInput {
  title: LocalizedText
  message: LocalizedText
  type?: 'alert' | 'success' | 'info'
  displayMode?: 'banner' | 'list' | 'both'
  linkUrl?: string
  linkText?: string
  isActive?: boolean
}

export interface UpdateAnnouncementInput {
  title?: LocalizedText
  message?: LocalizedText
  type?: 'alert' | 'success' | 'info'
  displayMode?: 'banner' | 'list' | 'both'
  linkUrl?: string
  linkText?: string
  isActive?: boolean
}

interface AdminAnnouncementsResponse {
  data: AdminAnnouncement[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const fetchActiveAnnouncements = async (): Promise<Announcement[]> => {
  return api.get<Announcement[]>('/announcements/active')
}

const fetchAdminAnnouncements = async (page = 1, limit = 20): Promise<AdminAnnouncementsResponse> => {
  return api.get<AdminAnnouncementsResponse>('/announcements/admin', { params: { page, limit } })
}

export function useActiveAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements.active(),
    queryFn: fetchActiveAnnouncements,
    staleTime: 60_000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useAdminAnnouncements(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.announcements.adminList({ page, limit }),
    queryFn: () => fetchAdminAnnouncements(page, limit),
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAnnouncementInput) =>
      api.post<AdminAnnouncement>('/announcements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all })
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementInput }) =>
      api.patch<AdminAnnouncement>(`/announcements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all })
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all })
    },
  })
}
