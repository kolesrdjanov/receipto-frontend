import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCategories, type Category } from '@/hooks/categories/use-categories'
import { Trash2, Pencil } from 'lucide-react'

interface CategoriesTableProps {
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
}

export function CategoriesTable({ onEdit, onDelete }: CategoriesTableProps) {
  const { t } = useTranslation()
  const { data: categories, isLoading, error } = useCategories()

  if (isLoading) {
    return (
      <Card data-testid="categories-loading">
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">{t('categories.loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card data-testid="categories-error">
        <CardContent className="p-8">
          <p className="text-center text-destructive">
            {t('categories.loadError', { message: error instanceof Error ? error.message : 'Unknown error' })}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!categories || categories.length === 0) {
    return (
      <Card data-testid="categories-empty">
        <CardHeader>
          <CardTitle className="text-center text-muted-foreground">{t('categories.noCategories')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            {t('categories.noCategoriesText')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Table data-testid="categories-table">
        <TableHeader>
          <TableRow>
            <TableHead>{t('categories.table.name')}</TableHead>
            <TableHead>{t('categories.table.color')}</TableHead>
            <TableHead>{t('categories.table.icon')}</TableHead>
            <TableHead>{t('categories.table.description')}</TableHead>
            <TableHead>{t('categories.table.monthlyBudget')}</TableHead>
            <TableHead className="text-right">{t('categories.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id} data-testid={`category-row-${category.id}`}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                {category.color ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-muted-foreground">{category.color}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {category.icon ? (
                  <span className="text-lg">{category.icon}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {category.description ? (
                  <span className="text-sm">{category.description}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
                <TableCell>
                    {category.monthlyBudget ? (
                        <span className="text-sm">{category.monthlyBudget}</span>
                    ) : (
                        <span className="text-muted-foreground">-</span>
                    )}
                </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(category)}
                      data-testid={`category-edit-${category.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(category)}
                      data-testid={`category-delete-${category.id}`}
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
