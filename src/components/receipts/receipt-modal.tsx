import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
  useCreateReceipt,
  useUpdateReceipt,
  useDeleteReceipt,
  type Receipt,
} from '@/hooks/receipts/use-receipts'
import { useCategories } from '@/hooks/categories/use-categories'
import { useCurrencies } from '@/hooks/currencies/use-currencies'
import { useGroups } from '@/hooks/groups/use-groups'
import { toast } from 'sonner'

interface ReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt?: Receipt | null
  mode: 'create' | 'edit'
  prefillData?: Partial<Receipt> | null
}

type ReceiptFormData = {
  storeName: string
  totalAmount: string
  currency: string
  receiptDate: string
  receiptNumber: string
  categoryId: string
  groupId: string
}


export function ReceiptModal({ open, onOpenChange, receipt, mode, prefillData }: ReceiptModalProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<ReceiptFormData>({
    defaultValues: {
      storeName: '',
      totalAmount: '',
      currency: 'RSD',
      receiptDate: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      categoryId: '',
      groupId: '',
    },
  })

  const { data: categories = [] } = useCategories()
  const { data: currencies = [] } = useCurrencies()
  const { data: groups = [] } = useGroups()
  const createReceipt = useCreateReceipt()
  const updateReceipt = useUpdateReceipt()
  const deleteReceipt = useDeleteReceipt()

  // Watch groupId to auto-set currency
  const selectedGroupId = watch('groupId')
  const selectedGroup = groups.find((g) => g.id === selectedGroupId)

  // Kada se promeni grupa, postavi currency iz grupe
  useEffect(() => {
    if (selectedGroup) {
      setValue('currency', selectedGroup.currency)
    }
  }, [selectedGroupId, selectedGroup, setValue])

  useEffect(() => {
    if (open && receipt && mode === 'edit') {
      reset({
        storeName: receipt.storeName || '',
        totalAmount: receipt.totalAmount?.toString() || '',
        currency: receipt.currency || 'RSD',
        receiptDate: receipt.receiptDate
          ? new Date(receipt.receiptDate).toISOString().split('T')[0]
          : '',
        receiptNumber: receipt.receiptNumber || '',
        categoryId: receipt.categoryId || '',
        groupId: receipt.groupId || '',
      })
    } else if (open && mode === 'create') {
      reset({
        storeName: prefillData?.storeName || '',
        totalAmount: '',
        currency: prefillData?.currency || 'RSD',
        receiptDate: new Date().toISOString().split('T')[0],
        receiptNumber: '',
        categoryId: prefillData?.categoryId || '',
        groupId: '',
      })
    }
  }, [open, receipt, mode, reset, prefillData])

  const onSubmit = async (data: ReceiptFormData) => {
    try {
      const payload = {
        storeName: data.storeName || undefined,
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
        currency: data.currency || undefined,
        receiptDate: data.receiptDate || undefined,
        receiptNumber: data.receiptNumber || undefined,
        categoryId: data.categoryId || null,
        groupId: data.groupId || null,
      }

      if (mode === 'create') {
        await createReceipt.mutateAsync(payload)
        toast.success(t('receipts.modal.createSuccess'))
      } else if (mode === 'edit' && receipt) {
        await updateReceipt.mutateAsync({ id: receipt.id, data: payload })
        toast.success(t('receipts.modal.updateSuccess'))
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(mode === 'create' ? t('receipts.modal.createError') : t('receipts.modal.updateError'), {
        description: errorMessage,
      })
    }
  }

  const handleDelete = async () => {
    if (!receipt) return

    if (window.confirm(t('receipts.modal.deleteConfirm'))) {
      try {
        await deleteReceipt.mutateAsync(receipt.id)
        toast.success(t('receipts.modal.deleteSuccess'))
        onOpenChange(false)
        reset()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred'
        toast.error(t('receipts.modal.deleteError'), {
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('receipts.modal.addTitle') : t('receipts.modal.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('receipts.modal.addDescription')
              : t('receipts.modal.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">{t('receipts.modal.storeName')}</Label>
            <Input
              id="storeName"
              {...register('storeName')}
              placeholder={t('receipts.modal.storeNamePlaceholder')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">{t('receipts.modal.totalAmount')}</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                {...register('totalAmount')}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('receipts.modal.currency')}</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!selectedGroup}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder={t('receipts.modal.currency')} />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.code}>
                          {currency.code} - {currency.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {selectedGroup && (
                <p className="text-xs text-muted-foreground">
                  {t('receipts.modal.currencySetByGroup')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptDate">{t('receipts.modal.date')}</Label>
              <Input
                id="receiptDate"
                type="date"
                {...register('receiptDate')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptNumber">{t('receipts.modal.receiptNumber')}</Label>
            <Input
              id="receiptNumber"
              {...register('receiptNumber')}
              placeholder={t('receipts.modal.receiptNumberPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">{t('receipts.modal.category')}</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('receipts.modal.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon && <span className="mr-2">{category.icon}</span>}
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {groups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="groupId">{t('receipts.modal.group')}</Label>
              <Controller
                name="groupId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                    value={field.value || '__none__'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('receipts.modal.group')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t('receipts.modal.noGroup')}</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.icon && <span className="mr-2">{group.icon}</span>}
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {mode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteReceipt.isPending || isSubmitting}
                className="sm:mr-auto"
              >
                {deleteReceipt.isPending ? t('common.deleting') : t('common.delete')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createReceipt.isPending || updateReceipt.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createReceipt.isPending || updateReceipt.isPending}
            >
              {isSubmitting || createReceipt.isPending || updateReceipt.isPending
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
