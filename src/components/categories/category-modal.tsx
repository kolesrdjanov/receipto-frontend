import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
import { useSettingsStore } from '@/store/settings'
import { toast } from 'sonner'

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  mode: 'create' | 'edit'
}

type CategoryFormData = CreateCategoryInput

export function CategoryModal({ open, onOpenChange, category, mode }: CategoryModalProps) {
  const { t } = useTranslation()
  const { currency: preferredCurrency } = useSettingsStore()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
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
      monthlyBudget: undefined,
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
        monthlyBudget: category.monthlyBudget ?? undefined,
      })
    } else if (open && mode === 'create') {
      reset({
        name: '',
        color: '#3b82f6',
        icon: '',
        description: '',
        monthlyBudget: undefined,
      })
    }
  }, [open, category, mode, reset])

  const onSubmit = async (data: CategoryFormData) => {
    try {
      // If budget is set/changed, update the currency
      const submitData = { ...data }
      if (submitData.monthlyBudget && submitData.monthlyBudget > 0) {
        // For new budget or when budget value changes, use current preferred currency
        // For edit mode, keep existing currency unless budget is being newly set
        if (mode === 'create' || !category?.budgetCurrency) {
          submitData.budgetCurrency = preferredCurrency
        } else {
          // Keep existing budget currency when editing
          submitData.budgetCurrency = category.budgetCurrency
        }
      } else {
        // Clear budget currency if budget is removed
        submitData.budgetCurrency = undefined
      }

      if (mode === 'create') {
        await createCategory.mutateAsync(submitData)
        toast.success(t('categories.modal.createSuccess'))
      } else if (mode === 'edit' && category) {
        await updateCategory.mutateAsync({ id: category.id, data: submitData })
        toast.success(t('categories.modal.updateSuccess'))
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(mode === 'create' ? t('categories.modal.createError') : t('categories.modal.updateError'), {
        description: errorMessage,
      })
    }
  }

  const handleDelete = () => {
    if (!category) return
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!category) return

    try {
      await deleteCategory.mutateAsync(category.id)
      toast.success(t('categories.modal.deleteSuccess'))
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('categories.modal.deleteError'), {
        description: errorMessage,
      })
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
            {mode === 'create' ? t('categories.modal.createTitle') : t('categories.modal.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('categories.modal.createDescription')
              : t('categories.modal.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('categories.modal.name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: t('categories.modal.nameRequired') })}
              placeholder={t('categories.modal.namePlaceholder')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">{t('categories.modal.color')}</Label>
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
                placeholder={t('categories.modal.colorPlaceholder')}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">{t('categories.modal.icon')}</Label>
            <Input
              id="icon"
              {...register('icon')}
              placeholder={t('categories.modal.iconPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">
              {t('categories.modal.iconHelp')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('categories.modal.description')}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('categories.modal.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyBudget">
              {t('categories.modal.monthlyBudget')}
              {mode === 'edit' && category?.budgetCurrency && (
                <span className="ml-1 text-muted-foreground font-normal">
                  ({category.budgetCurrency})
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                id="monthlyBudget"
                type="number"
                min={0}
                step="0.01"
                {...register('monthlyBudget', { valueAsNumber: true })}
                placeholder={t('categories.modal.monthlyBudgetPlaceholder')}
                className="flex-1"
              />
              <div className="flex items-center px-3 bg-muted rounded-md text-sm text-muted-foreground">
                {mode === 'edit' && category?.budgetCurrency ? category.budgetCurrency : preferredCurrency}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('categories.modal.monthlyBudgetHelp')}
            </p>
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
                {deleteCategory.isPending ? t('common.deleting') : t('common.delete')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createCategory.isPending || updateCategory.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createCategory.isPending || updateCategory.isPending}
            >
              {isSubmitting || createCategory.isPending || updateCategory.isPending
                ? mode === 'create'
                  ? t('common.creating')
                  : t('common.updating')
                : mode === 'create'
                ? t('common.create')
                : t('common.update')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title={t('categories.modal.deleteTitle')}
        description={t('categories.modal.deleteConfirmWithReceipts', {
          name: category?.name || '',
        })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={deleteCategory.isPending}
      />
    </Dialog>
  )
}
