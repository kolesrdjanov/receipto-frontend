import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTemplates, type Template } from '@/hooks/templates/use-templates'
import { EmptyState } from '@/components/glass/empty-state'
import { Trash2, Pencil, FileText } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface TemplatesTableProps {
  onEdit?: (template: Template) => void
  onDelete?: (template: Template) => void
}

export function TemplatesTable({ onEdit, onDelete }: TemplatesTableProps) {
  const { t } = useTranslation()
  const { data: templates, isLoading, error } = useTemplates()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">{t('templates.loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-destructive">
            {t('templates.loadError', { message: error instanceof Error ? error.message : 'Unknown error' })}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title={t('templates.noTemplates')}
        description={t('templates.noTemplatesText')}
      />
    )
  }

  return (
    <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('templates.table.name')}</TableHead>
              <TableHead>{t('templates.table.storeName')}</TableHead>
              <TableHead>{t('templates.table.currency')}</TableHead>
              <TableHead>{t('templates.table.category')}</TableHead>
              <TableHead>{t('templates.table.createdAt')}</TableHead>
              <TableHead className="text-right">{t('templates.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.storeName}</TableCell>
                  <TableCell>
                    {template.currency || '-'}
                  </TableCell>
                  <TableCell>
                    {template.category ? (
                        <div className="flex items-center gap-2">
                          {template.category.icon && (
                              <span className="text-lg">{template.category.icon}</span>
                          )}
                          <span>{template.category.name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(template.createdAt)}
                  </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                          <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(template)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                      )}
                      {onDelete && (
                          <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(template)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
  )
}
