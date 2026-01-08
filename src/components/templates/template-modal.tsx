import { useEffect } from 'react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateTemplate,
  useUpdateTemplate,
  type Template,
  type CreateTemplateInput,
} from '@/hooks/templates/use-templates'
import { useCategories } from '@/hooks/categories/use-categories'
import { useCurrencies } from '@/hooks/currencies/use-currencies'
import { useSettingsStore } from '@/store/settings'
import { toast } from 'sonner'

interface TemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: Template | null
  mode: 'create' | 'edit'
}

type TemplateFormData = CreateTemplateInput

export function TemplateModal({ open, onOpenChange, template, mode }: TemplateModalProps) {
  const { t } = useTranslation()
  const { currency: preferredCurrency } = useSettingsStore()
  const { data: categories } = useCategories()
  const { data: currencies } = useCurrencies()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormData>({
    defaultValues: {
      name: '',
      storeName: '',
      currency: preferredCurrency,
      categoryId: undefined,
    },
  })

  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()

  const categoryId = watch('categoryId')
  const currency = watch('currency')

  useEffect(() => {
    if (open && template && mode === 'edit') {
      reset({
        name: template.name,
        storeName: template.storeName,
        currency: template.currency || preferredCurrency,
        categoryId: template.categoryId || undefined,
      })
    } else if (open && mode === 'create') {
      reset({
        name: '',
        storeName: '',
        currency: preferredCurrency,
        categoryId: undefined,
      })
    }
  }, [open, template, mode, reset, preferredCurrency])

  const onSubmit = async (data: TemplateFormData) => {
    try {
      // Convert empty strings to null for optional fields
      const submitData = {
        ...data,
        categoryId: data.categoryId || null,
      }

      if (mode === 'create') {
        await createTemplate.mutateAsync(submitData)
        toast.success(t('templates.modal.createSuccess'))
      } else if (mode === 'edit' && template) {
        await updateTemplate.mutateAsync({ id: template.id, data: submitData })
        toast.success(t('templates.modal.updateSuccess'))
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(mode === 'create' ? t('templates.modal.createError') : t('templates.modal.updateError'), {
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
            {mode === 'create' ? t('templates.modal.createTitle') : t('templates.modal.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('templates.modal.createDescription')
              : t('templates.modal.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('templates.modal.name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name', { required: t('templates.modal.nameRequired') })}
              placeholder={t('templates.modal.namePlaceholder')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeName">
              {t('templates.modal.storeName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="storeName"
              {...register('storeName', { required: t('templates.modal.storeNameRequired') })}
              placeholder={t('templates.modal.storeNamePlaceholder')}
            />
            {errors.storeName && (
              <p className="text-sm text-destructive">{errors.storeName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t('templates.modal.currency')}</Label>
            <Select
              value={currency || preferredCurrency}
              onValueChange={(value) => setValue('currency', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('templates.modal.selectCurrency')} />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code} - {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">{t('templates.modal.category')}</Label>
            <Select
              value={categoryId || 'none'}
              onValueChange={(value) => setValue('categoryId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('templates.modal.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('templates.modal.noCategory')}</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon && <span className="mr-2">{cat.icon}</span>}
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createTemplate.isPending || updateTemplate.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createTemplate.isPending || updateTemplate.isPending}
            >
              {isSubmitting || createTemplate.isPending || updateTemplate.isPending
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
    </Dialog>
  )
}
