import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export interface LoyaltyCard {
  id: string
  cardName: string
  codeType: 'qr' | 'barcode'
  codeFormat: string
  codeValue: string
  color: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreateLoyaltyCardData {
  cardName: string
  codeType: 'qr' | 'barcode'
  codeFormat: string
  codeValue: string
  color?: string
}

export interface UpdateLoyaltyCardData {
  cardName?: string
  codeType?: 'qr' | 'barcode'
  codeFormat?: string
  codeValue?: string
  color?: string
}

const fetchLoyaltyCards = async (): Promise<LoyaltyCard[]> => {
  return api.get<LoyaltyCard[]>('/loyalty-cards')
}

const fetchLoyaltyCard = async (id: string): Promise<LoyaltyCard> => {
  return api.get<LoyaltyCard>(`/loyalty-cards/${id}`)
}

const createLoyaltyCard = async (data: CreateLoyaltyCardData): Promise<LoyaltyCard> => {
  return api.post<LoyaltyCard>('/loyalty-cards', data)
}

const updateLoyaltyCard = async (id: string, data: UpdateLoyaltyCardData): Promise<LoyaltyCard> => {
  return api.patch<LoyaltyCard>(`/loyalty-cards/${id}`, data)
}

const deleteLoyaltyCard = async (id: string): Promise<void> => {
  return api.delete(`/loyalty-cards/${id}`)
}

export function useLoyaltyCards() {
  return useQuery({
    queryKey: queryKeys.loyaltyCards.list(),
    queryFn: fetchLoyaltyCards,
  })
}

export function useLoyaltyCard(id: string) {
  return useQuery({
    queryKey: queryKeys.loyaltyCards.detail(id),
    queryFn: () => fetchLoyaltyCard(id),
    enabled: !!id,
  })
}

export function useCreateLoyaltyCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createLoyaltyCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyCards.all })
    },
  })
}

export function useUpdateLoyaltyCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLoyaltyCardData }) =>
      updateLoyaltyCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyCards.all })
    },
  })
}

export function useDeleteLoyaltyCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLoyaltyCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyCards.all })
    },
  })
}
