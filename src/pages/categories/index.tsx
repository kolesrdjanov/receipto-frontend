import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/app-layout'
import { CategoriesTable } from '@/components/categories/categories-table'
import { CategoryModal } from '@/components/categories/category-modal'
import type { Category } from '@/hooks/categories/use-categories'

export default function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  const handleAddCategory = () => {
    setSelectedCategory(null)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setModalMode('edit')
    setIsModalOpen(true)
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

      <CategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={selectedCategory}
        mode={modalMode}
      />
    </AppLayout>
  )
}
