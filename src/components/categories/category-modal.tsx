import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
  type CreateCategoryInput,
} from '@/hooks/categories/use-categories'
import { toast } from 'sonner'

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  mode: 'create' | 'edit'
}

type CategoryFormData = CreateCategoryInput

export function CategoryModal({ open, onOpenChange, category, mode }: CategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: '',
      color: '#3b82f6',
      icon: '',
      description: '',
    },
  })

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  useEffect(() => {
    if (open && category && mode === 'edit') {
      reset({
        name: category.name,
        color: category.color || '#3b82f6',
        icon: category.icon || '',
        description: category.description || '',
      })
    } else if (open && mode === 'create') {
      reset({
        name: '',
        color: '#3b82f6',
        icon: '',
        description: '',
      })
    }
  }, [open, category, mode, reset])

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (mode === 'create') {
        await createCategory.mutateAsync(data)
        toast.success('Category created successfully')
      } else if (mode === 'edit' && category) {
        await updateCategory.mutateAsync({ id: category.id, data })
        toast.success('Category updated successfully')
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(mode === 'create' ? 'Failed to create category' : 'Failed to update category', {
        description: errorMessage,
      })
    }
  }

  const handleDelete = async () => {
    if (!category) return

    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory.mutateAsync(category.id)
        toast.success('Category deleted successfully')
        onOpenChange(false)
        reset()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred'
        toast.error('Failed to delete category', {
          description: errorMessage,
        })
      }
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Category' : 'Edit Category'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new category to organize your receipts.'
              : 'Update the category details or delete it.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Name is required' })}
              placeholder="e.g., Groceries, Travel, Entertainment"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                {...register('color')}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                {...register('color')}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Input
              id="icon"
              {...register('icon')}
              placeholder="e.g., 🛒, ✈️, 🎬"
            />
            <p className="text-xs text-muted-foreground">
              Enter an emoji or icon name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional description for this category"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {mode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCategory.isPending || isSubmitting}
                className="sm:mr-auto"
              >
                {deleteCategory.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createCategory.isPending || updateCategory.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createCategory.isPending || updateCategory.isPending}
            >
              {isSubmitting || createCategory.isPending || updateCategory.isPending
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Updating...'
                : mode === 'create'
                ? 'Create'
                : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
