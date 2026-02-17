import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTemplates, type Template } from '@/hooks/templates/use-templates'
import { Loader2, Plus } from 'lucide-react'

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('receipts.templateSelector.title')}</DialogTitle>
          <DialogDescription>
            {t('receipts.templateSelector.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">
              {t('receipts.templateSelector.loadError', {
                message: error instanceof Error ? error.message : 'Unknown error'
              })}
            </div>
          ) : !templates || templates.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {t('receipts.templateSelector.noTemplates')}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {t('receipts.templateSelector.noTemplatesText')}
              </p>
              <Button onClick={handleCreateTemplate}>
                <Plus className="h-4 w-4" />
                {t('receipts.templateSelector.createTemplate')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelect(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {template.storeName}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          {template.currency && (
                            <span className="text-muted-foreground">
                              {t('receipts.templateSelector.currency')}: {template.currency}
                            </span>
                          )}
                          {template.category && (
                            <span className="flex items-center gap-1">
                              {template.category.icon && (
                                <span>{template.category.icon}</span>
                              )}
                              <span
                                className="rounded-full px-1.5 py-0.5 text-xs"
                                style={{
                                  backgroundColor: template.category.color ? template.category.color + '20' : 'var(--muted)',
                                  color: 'var(--foreground)',
                                }}
                              >
                                {template.category.name}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
