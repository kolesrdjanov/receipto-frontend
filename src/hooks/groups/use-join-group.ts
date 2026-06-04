import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { Group } from '@/hooks/groups/use-groups'

// API functions
const joinGroup = async (code: string): Promise<Group> => {
  return api.post<Group>(`/groups/join/${code}`, {})
}

// Hooks
export function useJoinGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}
