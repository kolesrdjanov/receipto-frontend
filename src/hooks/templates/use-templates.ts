import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

// Types
export interface Template {
  id: string
  userId: string
  name: string
  storeName: string
  currency?: string
  categoryId?: string
  category?: {
    id: string
    name: string
    color?: string
    icon?: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateInput {
  name: string
  storeName: string
  currency?: string
  categoryId?: string | null
}

export interface UpdateTemplateInput {
  name?: string
  storeName?: string
  currency?: string
  categoryId?: string | null
}

// API functions
const fetchTemplates = async (): Promise<Template[]> => {
  return api.get<Template[]>('/templates')
}

const fetchTemplate = async (id: string): Promise<Template> => {
  return api.get<Template>(`/templates/${id}`)
}

const createTemplate = async (data: CreateTemplateInput): Promise<Template> => {
  return api.post<Template>('/templates', data)
}

const updateTemplate = async (id: string, data: UpdateTemplateInput): Promise<Template> => {
  return api.patch<Template>(`/templates/${id}`, data)
}

const deleteTemplate = async (id: string): Promise<void> => {
  return api.delete<void>(`/templates/${id}`)
}

// Hooks
export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates.list(),
    queryFn: () => fetchTemplates(),
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: queryKeys.templates.detail(id),
    queryFn: () => fetchTemplate(id),
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.lists() })
    },
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateInput }) => updateTemplate(id, data),
    onSuccess: (updatedTemplate) => {
      queryClient.setQueryData(queryKeys.templates.detail(updatedTemplate.id), updatedTemplate)
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.lists() })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.templates.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.lists() })
    },
  })
}
