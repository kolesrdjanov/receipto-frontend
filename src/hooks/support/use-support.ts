import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface SendSupportMessageDto {
  subject: string
  message: string
}

interface SendSupportMessageResponse {
  success: boolean
  message: string
}

async function sendSupportMessage(data: SendSupportMessageDto): Promise<SendSupportMessageResponse> {
  return api.post<SendSupportMessageResponse>('/support/contact', data)
}

export function useSendSupportMessage() {
  return useMutation({
    mutationFn: sendSupportMessage,
  })
}
