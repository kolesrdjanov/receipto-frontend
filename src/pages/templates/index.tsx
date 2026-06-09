import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { PageToolbar } from '@/components/layout/page-toolbar'
import { PageTransition } from '@/components/ui/animated'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { EmptyState, AddButton } from '@/components/glass/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { TemplateModal } from '@/components/templates/template-modal'
import { TemplateList, RowActionList } from '@/components/templates/primitives'
import { useTemplates, useDeleteTemplate, type Template } from '@/hooks/templates/use-templates'
import { useIsMobile } from '@/hooks/use-mobile'
import { useFabStore } from '@/store/fab'
import { getErrorMessage } from '@/lib/api'
import { toast } from 'sonner'

export default function Templates() {
  const { t } = useTranslation()
  const isMobile = useIsMobile(768)
  const { data: templates, isLoading, error } = useTemplates()
  const deleteTemplate = useDeleteTemplate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [actionsTemplate, setActionsTemplate] = useState<Template | null>(null)

  const handleAdd = useCallback(() => {
    setSelectedTemplate(null)
    setModalMode('create')
    setIsModalOpen(true)
  }, [])

  // Take over the global mobile FAB so it opens the Add form directly.
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  useEffect(() => {
    setFab(handleAdd)
    return () => clearFab()
  }, [setFab, clearFab, handleAdd])

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDelete = (template: Template) => {
    setTemplateToDelete(template)
    setDeleteConfirmOpen(true)
  }

  const openActions = (template: Template) => {
    setActionsTemplate(template)
    setActionsOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return
    try {
      await deleteTemplate.mutateAsync(templateToDelete.id)
      toast.success(t('templates.modal.deleteSuccess'))
      setTemplateToDelete(null)
    } catch (err) {
      toast.error(t('templates.modal.deleteError'), {
        description: getErrorMessage(err),
      })
    }
  }

  const list = templates ?? []

  const header = (
    <>
      <PageToolbar
        className="md:-mx-8 md:-mt-8 md:mb-6"
        title={t('templates.title')}
        subtitle={t('templates.subtitle')}
        actions={<AddButton onClick={handleAdd} label={t('templates.addTemplate')} data-testid="templates-add-button" />}
      />
      <div className="mb-5 flex items-start justify-between gap-3 md:hidden">
        <div className="min-w-0">
          <h1 className="t-h1 text-[28px]">{t('templates.title')}</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">{t('templates.subtitle')}</p>
        </div>
        <AddButton onClick={handleAdd} label={t('templates.addTemplate')} className="h-[38px] px-3.5" />
      </div>
    </>
  )

  return (
    <AppLayout>
      <PageTransition>
        {header}

        {isLoading ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card md:mt-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex min-h-[72px] items-center gap-3.5 border-b border-hairline-soft px-4 last:border-0">
                <div className="size-11 shrink-0 animate-pulse rounded-[14px] bg-bg-subtle" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/5 animate-pulse rounded bg-bg-subtle" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-bg-subtle" />
                </div>
                <div className="size-[18px] shrink-0 animate-pulse rounded bg-bg-subtle" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-4 grid place-items-center rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-glass-1 md:mt-0">
            <p className="text-sm text-destructive">
              {t('templates.loadError', { message: getErrorMessage(error, 'Unknown error') })}
            </p>
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            className="mt-4 md:mt-0"
            data-testid="templates-empty"
            icon={FileText}
            title={t('templates.noTemplates')}
            description={t('templates.noTemplatesText')}
            action={<AddButton onClick={handleAdd} label={t('templates.addTemplate')} />}
          />
        ) : (
          <div className="mt-4 md:mt-0">
            <TemplateList
              templates={list}
              wide={!isMobile}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOpenActions={openActions}
            />
          </div>
        )}
      </PageTransition>

      {/* Create / Edit form */}
      <TemplateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        template={selectedTemplate}
        mode={modalMode}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title={t('templates.modal.deleteTitle')}
        description={t('templates.modal.deleteConfirm', { name: templateToDelete?.name || '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={deleteTemplate.isPending}
      />

      {/* Mobile row action sheet */}
      {actionsTemplate && (
        <GlassDialog
          open={actionsOpen}
          onOpenChange={setActionsOpen}
          title={actionsTemplate.name}
          description={actionsTemplate.storeName}
          bodyClassName="py-3"
        >
          <RowActionList
            template={actionsTemplate}
            onEdit={(tpl) => {
              setActionsOpen(false)
              handleEdit(tpl)
            }}
            onDelete={(tpl) => {
              setActionsOpen(false)
              handleDelete(tpl)
            }}
          />
        </GlassDialog>
      )}
    </AppLayout>
  )
}
