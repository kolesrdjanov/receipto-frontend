import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export interface AppSettingValue {
  value: any
  description: string | null
  updatedAt: string
}

export type AppSettings = Record<string, AppSettingValue>

const fetchAppSettings = async (): Promise<AppSettings> => {
  return api.get<AppSettings>('/admin/settings')
}

const updateAppSettings = async (settings: Record<string, any>): Promise<void> => {
  return api.patch('/admin/settings', { settings })
}

export function useAppSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings(),
    queryFn: fetchAppSettings,
  })
}

export function useUpdateAppSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings() })
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.features() })
    },
  })
}
