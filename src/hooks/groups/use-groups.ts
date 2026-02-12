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
  expiresAt?: string
  createdAt: string
}

export interface Group {
  id: string
  name: string
  description?: string
  currency: string
  color?: string
  icon?: string
  isArchived?: boolean
  archivedAt?: string
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
  currency?: string // Default currency for receipts in this group
  color?: string
  icon?: string
}

export interface UpdateGroupInput {
  name?: string
  description?: string
  currency?: string // Default currency for receipts in this group
  color?: string
  icon?: string
}

export interface CurrencyAmount {
  currency: string
  totalAmount: number
  receiptCount: number
}

export interface UserCurrencyAmount {
  currency: string
  totalSpent: number
  receiptsCount: number
}

export interface GroupStats {
  totalReceipts: number
  byCurrency: CurrencyAmount[]
  perUser: {
    userId: string
    firstName: string
    lastName: string
    receiptsCount: number
    byCurrency: UserCurrencyAmount[]
  }[]
}

export interface MemberBalanceCurrency {
  currency: string
  totalPaid: number
  totalOwed: number
  balance: number
}

export interface SettlementByCurrency {
  currency: string
  received: number
  paid: number
}

export interface MemberBalance {
  userId: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    profileImageUrl?: string
  }
  byCurrency?: MemberBalanceCurrency[]
  settlementsByCurrency?: SettlementByCurrency[]
  // Legacy fields for backwards compatibility (old API format)
  totalPaid?: number
  totalOwed?: number
  balance?: number
  settlementsReceived?: number
  settlementsPaid?: number
}

export interface SuggestedSettlement {
  from: {
    id: string
    firstName: string
    lastName: string
  }
  to: {
    id: string
    firstName: string
    lastName: string
  }
  amount: number
}

export interface SettlementRecord {
  id: string
  groupId: string
  fromUserId: string
  fromUser: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
  toUserId: string
  toUser: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
  amount: number
  currency: string
  note?: string
  settledAt: string
  createdById: string
  createdBy?: {
    id: string
    firstName?: string
    lastName?: string
  }
  createdAt: string
}

export interface CreateSettlementInput {
  fromUserId: string
  toUserId: string
  amount: number
  currency: string
  note?: string
  settledAt?: string
}

export interface GroupActivity {
  id: string
  groupId: string
  userId?: string
  user?: {
    id: string
    firstName?: string
    lastName?: string
    email: string
  }
  type: string
  metadata?: Record<string, any>
  createdAt: string
}

// Legacy alias for backwards compatibility
export type Settlement = SuggestedSettlement

// API functions
const fetchGroups = async (includeArchived = false): Promise<Group[]> => {
  const params = includeArchived ? '?includeArchived=true' : ''
  return api.get<Group[]>(`/groups${params}`)
}

const fetchGroup = async (id: string): Promise<Group> => {
  return api.get<Group>(`/groups/${id}`)
}

const fetchGroupStats = async (id: string): Promise<GroupStats> => {
  return api.get<GroupStats>(`/groups/${id}/stats`)
}

const fetchGroupBalances = async (id: string): Promise<MemberBalance[]> => {
  return api.get<MemberBalance[]>(`/groups/${id}/balances`)
}

const fetchSuggestedSettlements = async (id: string): Promise<SuggestedSettlement[]> => {
  return api.get<SuggestedSettlement[]>(`/groups/${id}/suggested-settlements`)
}

const fetchSettlementHistory = async (id: string): Promise<SettlementRecord[]> => {
  return api.get<SettlementRecord[]>(`/groups/${id}/settlement-history`)
}

const fetchActivities = async (id: string, limit = 50, offset = 0): Promise<{ data: GroupActivity[]; total: number }> => {
  return api.get<{ data: GroupActivity[]; total: number }>(`/groups/${id}/activities?limit=${limit}&offset=${offset}`)
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

const archiveGroup = async (id: string): Promise<Group> => {
  return api.post<Group>(`/groups/${id}/archive`, {})
}

const unarchiveGroup = async (id: string): Promise<Group> => {
  return api.post<Group>(`/groups/${id}/unarchive`, {})
}

const createSettlement = async (groupId: string, data: CreateSettlementInput): Promise<SettlementRecord> => {
  return api.post<SettlementRecord>(`/groups/${groupId}/settlements`, data)
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
export function useGroups(includeArchived = false) {
  return useQuery({
    queryKey: [...queryKeys.groups.list(), { includeArchived }],
    queryFn: () => fetchGroups(includeArchived),
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

export function useGroupBalances(id: string) {
  return useQuery({
    queryKey: [...queryKeys.groups.detail(id), 'balances'],
    queryFn: () => fetchGroupBalances(id),
    enabled: !!id,
  })
}

export function useSuggestedSettlements(id: string) {
  return useQuery({
    queryKey: [...queryKeys.groups.detail(id), 'suggested-settlements'],
    queryFn: () => fetchSuggestedSettlements(id),
    enabled: !!id,
  })
}

export function useSettlementHistory(id: string) {
  return useQuery({
    queryKey: [...queryKeys.groups.detail(id), 'settlement-history'],
    queryFn: () => fetchSettlementHistory(id),
    enabled: !!id,
  })
}

export function useGroupActivities(id: string, limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...queryKeys.groups.detail(id), 'activities', { limit, offset }],
    queryFn: () => fetchActivities(id, limit, offset),
    enabled: !!id,
  })
}

export function usePendingInvites() {
  return useQuery({
    queryKey: queryKeys.groups.invites(),
    queryFn: fetchPendingInvites,
  })
}

// Legacy alias for backwards compatibility
export const useGroupSettlements = useSuggestedSettlements

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
    onSuccess: (_data, variables) => {
      // Invalidate both the list and the specific group detail
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables.id) })
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
    onSuccess: (_data, variables) => {
      // Invalidate both the list and the specific group detail
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables.groupId) })
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
    onSuccess: (_data, variables) => {
      // Invalidate both the list and the specific group detail
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(variables.groupId) })
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

export function useArchiveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: archiveGroup,
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) })
    },
  })
}

export function useUnarchiveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: unarchiveGroup,
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) })
    },
  })
}

export function useCreateSettlement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: CreateSettlementInput }) =>
      createSettlement(groupId, data),
    onSuccess: (_data, variables) => {
      // Invalidate all group-related queries (balances, settlements, activities)
      // Using exact: false to match all nested query keys
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId),
        exact: false
      })
    },
  })
}

