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

function CategoryCard({ category, onEdit, onDelete }: { category: Category; onEdit?: (category: Category) => void; onDelete?: (category: Category) => void }) {
  const { t } = useTranslation()

  return (
    <Card data-testid={`category-card-${category.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {category.color && (
              <div
                className="w-10 h-10 rounded-full border flex-shrink-0 flex items-center justify-center text-lg"
                style={{ backgroundColor: category.color }}
              >
                {category.icon || ''}
              </div>
            )}
            {!category.color && category.icon && (
              <div className="w-10 h-10 rounded-full border bg-muted flex-shrink-0 flex items-center justify-center text-lg">
                {category.icon}
              </div>
            )}
            {!category.color && !category.icon && (
              <div className="w-10 h-10 rounded-full border bg-muted flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-muted-foreground truncate">{category.description}</p>
              )}
              {category.monthlyBudget && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('categories.table.monthlyBudget')}: {category.monthlyBudget} {category.budgetCurrency || ''}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
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
        </div>
      </CardContent>
    </Card>
  )
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
    <>
      {/* Mobile view - Card list */}
      <div className="flex flex-col gap-3 md:hidden" data-testid="categories-mobile-list">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop view - Table */}
      <Table className="hidden md:table" data-testid="categories-table">
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
    </>
  )
}
