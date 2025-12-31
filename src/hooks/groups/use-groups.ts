import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Types
export interface GroupMember {
  id: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'accepted' | 'declined'
  invitedEmail?: string
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    profileImageUrl?: string
  }
  invitedBy?: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

export interface Group {
  id: string
  name: string
  description?: string
  currency: string
  color?: string
  icon?: string
  createdById: string
  createdBy?: {
    id: string
    firstName: string
    lastName: string
  }
  members: GroupMember[]
  createdAt: string
  updatedAt: string
}

export interface GroupInvite extends GroupMember {
  group: Group
}

export interface CreateGroupInput {
  name: string
  description?: string
  currency: string
  color?: string
  icon?: string
}

export interface UpdateGroupInput {
  name?: string
  description?: string
  color?: string
  icon?: string
}

export interface GroupStats {
  totalReceipts: number
  totalAmount: number
  perUser: {
    userId: string
    firstName: string
    lastName: string
    receiptsCount: number
    totalSpent: number
  }[]
}

// API functions
const fetchGroups = async (): Promise<Group[]> => {
  return api.get<Group[]>('/groups')
}

const fetchGroup = async (id: string): Promise<Group> => {
  return api.get<Group>(`/groups/${id}`)
}

const fetchGroupStats = async (id: string): Promise<GroupStats> => {
  return api.get<GroupStats>(`/groups/${id}/stats`)
}

const fetchPendingInvites = async (): Promise<GroupInvite[]> => {
  return api.get<GroupInvite[]>('/groups/invites')
}

const createGroup = async (data: CreateGroupInput): Promise<Group> => {
  return api.post<Group>('/groups', data)
}

const updateGroup = async (id: string, data: UpdateGroupInput): Promise<Group> => {
  return api.patch<Group>(`/groups/${id}`, data)
}

const deleteGroup = async (id: string): Promise<void> => {
  return api.delete<void>(`/groups/${id}`)
}

const inviteMember = async (groupId: string, email: string): Promise<GroupMember> => {
  return api.post<GroupMember>(`/groups/${groupId}/invite`, { email })
}

const acceptInvite = async (groupId: string): Promise<GroupMember> => {
  return api.post<GroupMember>(`/groups/${groupId}/accept`, {})
}

const declineInvite = async (groupId: string): Promise<void> => {
  return api.post<void>(`/groups/${groupId}/decline`, {})
}

const removeMember = async (groupId: string, memberId: string): Promise<void> => {
  return api.delete<void>(`/groups/${groupId}/members/${memberId}`)
}

const leaveGroup = async (groupId: string): Promise<void> => {
  return api.post<void>(`/groups/${groupId}/leave`, {})
}

// Hooks
export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: fetchGroups,
  })
}

export function useGroup(id: string) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => fetchGroup(id),
    enabled: !!id,
  })
}

export function useGroupStats(id: string) {
  return useQuery({
    queryKey: queryKeys.groups.stats(id),
    queryFn: () => fetchGroupStats(id),
    enabled: !!id,
  })
}

export function usePendingInvites() {
  return useQuery({
    queryKey: queryKeys.groups.invites(),
    queryFn: fetchPendingInvites,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupInput }) =>
      updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useDeleteGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, email }: { groupId: string; email: string }) =>
      inviteMember(groupId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useAcceptInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.invites() })
    },
  })
}

export function useDeclineInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: declineInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.invites() })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      removeMember(groupId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

export function useLeaveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    },
  })
}

