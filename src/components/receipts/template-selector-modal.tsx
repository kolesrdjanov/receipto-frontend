import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { useTemplates, type Template } from '@/hooks/templates/use-templates'
import { getErrorMessage } from '@/lib/api'

interface TemplateSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: Template) => void
}

export function TemplateSelectorModal({ open, onOpenChange, onSelect }: TemplateSelectorModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: templates, isLoading, error } = useTemplates()

  const handleSelect = (template: Template) => {
    onSelect(template)
    onOpenChange(false)
  }

  const handleCreateTemplate = () => {
    onOpenChange(false)
    navigate('/templates')
  }

  const hasTemplates = !isLoading && !error && !!templates && templates.length > 0

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('receipts.templateSelector.title')}
      description={t('receipts.templateSelector.description')}
      desktopWidth={520}
      actions={
        hasTemplates
          ? {
              primary: (
                <Button variant="outline" onClick={handleCreateTemplate}>
                  <Plus className="size-4" />
                  {t('receipts.templateSelector.createTemplate')}
                </Button>
              ),
            }
          : undefined
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-destructive">
          {t('receipts.templateSelector.loadError', { message: getErrorMessage(error, 'Unknown error') })}
        </div>
      ) : !hasTemplates ? (
        <div className="py-8 text-center">
          <p className="mb-2 text-muted-foreground">{t('receipts.templateSelector.noTemplates')}</p>
          <p className="mb-6 text-sm text-muted-foreground">{t('receipts.templateSelector.noTemplatesText')}</p>
          <Button onClick={handleCreateTemplate}>
            <Plus className="size-4" />
            {t('receipts.templateSelector.createTemplate')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {templates!.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-bg-subtle"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[15px] font-semibold text-foreground">{template.name}</span>
                {template.storeName && (
                  <span className="truncate text-[12.5px] text-muted-foreground">{template.storeName}</span>
                )}
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  {template.currency && (
                    <span className="inline-flex items-center rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {template.currency}
                    </span>
                  )}
                  {template.category && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-foreground"
                      style={{ backgroundColor: (template.category.color || '#888') + '20' }}
                    >
                      {template.category.icon && <span>{template.category.icon}</span>}
                      {template.category.name}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-[18px] shrink-0 text-fg-faint" />
            </button>
          ))}
        </div>
      )}
    </GlassDialog>
  )
}
