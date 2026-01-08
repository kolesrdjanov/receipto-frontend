import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AppLayout } from '@/components/layout/app-layout'
import { TemplatesTable } from '@/components/templates/templates-table'
import { TemplateModal } from '@/components/templates/template-modal'
import { useDeleteTemplate, type Template } from '@/hooks/templates/use-templates'
import { Plus } from "lucide-react"
import { toast } from 'sonner'

export default function Templates() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)
  const deleteTemplate = useDeleteTemplate()

  const handleAddTemplate = () => {
    setSelectedTemplate(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDeleteTemplate = (template: Template) => {
    setTemplateToDelete(template)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    try {
      await deleteTemplate.mutateAsync(templateToDelete.id)
      toast.success(t('templates.modal.deleteSuccess'))
      setTemplateToDelete(null)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('templates.modal.deleteError'), {
        description: errorMessage,
      })
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2">{t('templates.title')}</h2>
          <p className="text-sm text-muted-foreground sm:text-base">{t('templates.subtitle')}</p>
        </div>
        <Button onClick={handleAddTemplate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {t('templates.addTemplate')}
        </Button>
      </div>

      <TemplatesTable onEdit={handleEditTemplate} onDelete={handleDeleteTemplate} />

      <TemplateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        template={selectedTemplate}
        mode={modalMode}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title={t('templates.modal.deleteTitle')}
        description={t('templates.modal.deleteConfirm', {
          name: templateToDelete?.name || '',
        })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={deleteTemplate.isPending}
      />
    </AppLayout>
  )
}
