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
import { Edit } from 'lucide-react'

interface CategoriesTableProps {
  onEdit?: (category: Category) => void
}

export function CategoriesTable({ onEdit }: CategoriesTableProps) {
  const { data: categories, isLoading, error } = useCategories()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Loading categories...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-destructive">
            Error loading categories: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-muted-foreground">No categories yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Create your first category to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories ({categories.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
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
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {category.icon ? (
                    <span className="text-lg">{category.icon}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {category.description ? (
                    <span className="text-sm">{category.description}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
