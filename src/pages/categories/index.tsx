import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/app-layout'
import { CategoriesTable } from '@/components/categories/categories-table'
import { CategoryModal } from '@/components/categories/category-modal'
import { CategoryDeleteModal } from '@/components/categories/category-delete-modal'
import type { Category } from '@/hooks/categories/use-categories'
import { Plus } from "lucide-react"

export default function Categories() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

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

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  const handleDeleted = () => {
    setCategoryToDelete(null)
    setDeleteModalOpen(false)
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1 sm:text-3xl sm:mb-2">{t('categories.title')}</h2>
          <p className="text-sm text-muted-foreground sm:text-base">{t('categories.subtitle')}</p>
        </div>
        <Button onClick={handleAddCategory} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {t('categories.addCategory')}
        </Button>
      </div>

      <CategoriesTable onEdit={handleEditCategory} onDelete={handleDeleteCategory} />

      <CategoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={selectedCategory}
        mode={modalMode}
      />

      <CategoryDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        category={categoryToDelete}
        onDeleted={handleDeleted}
      />
    </AppLayout>
  )
}
