import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/store/auth'

export interface Me {
  id: string
  email: string
  firstName: string
  lastName: string
  profileImageUrl?: string | null
}

export interface UpdateMeData {
  firstName?: string
  lastName?: string
  removeProfileImage?: boolean
}

const fetchMe = async (): Promise<Me> => {
  return api.get<Me>('/users/me')
}

const patchMe = async (data: UpdateMeData): Promise<Me> => {
  return api.patch<Me>('/users/me', data)
}

export function useMe(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: fetchMe,
    enabled,
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  const updateUser = useAuthStore((s) => s.updateUser)

  return useMutation({
    mutationFn: patchMe,
    onSuccess: (me) => {
      queryClient.setQueryData(queryKeys.users.me(), me)
      updateUser({
        firstName: me.firstName,
        lastName: me.lastName,
        profileImageUrl: me.profileImageUrl ?? null,
      })
    },
  })
}

