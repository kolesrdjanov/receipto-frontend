import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/app-layout'
import { CategoriesTable } from '@/components/categories/categories-table'

export default function Categories() {
  const handleAddCategory = () => {
    // TODO: Implement add category modal/form
    console.log('Add category clicked')
  }

  const handleEditCategory = (category: any) => {
    // TODO: Implement edit category modal/form
    console.log('Edit category:', category)
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Categories</h2>
          <p className="text-muted-foreground">Organize your receipts by category</p>
        </div>
        <Button onClick={handleAddCategory}>Add Category</Button>
      </div>

      <CategoriesTable onEdit={handleEditCategory} />
    </AppLayout>
  )
}
