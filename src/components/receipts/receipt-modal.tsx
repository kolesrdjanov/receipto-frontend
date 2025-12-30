import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
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
  type CreateReceiptInput,
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


export function ReceiptModal({ open, onOpenChange, receipt, mode }: ReceiptModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
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
        storeName: '',
        totalAmount: '',
        currency: 'RSD',
        receiptDate: new Date().toISOString().split('T')[0],
        receiptNumber: '',
        categoryId: '',
        groupId: '',
      })
    }
  }, [open, receipt, mode, reset])

  const onSubmit = async (data: ReceiptFormData) => {
    try {
      const payload: CreateReceiptInput = {
        storeName: data.storeName || undefined,
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
        currency: data.currency || undefined,
        receiptDate: data.receiptDate || undefined,
        receiptNumber: data.receiptNumber || undefined,
        categoryId: data.categoryId || undefined,
        groupId: data.groupId || undefined,
      }

      if (mode === 'create') {
        await createReceipt.mutateAsync(payload)
        toast.success('Receipt created successfully')
      } else if (mode === 'edit' && receipt) {
        await updateReceipt.mutateAsync({ id: receipt.id, data: payload })
        toast.success('Receipt updated successfully')
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(mode === 'create' ? 'Failed to create receipt' : 'Failed to update receipt', {
        description: errorMessage,
      })
    }
  }

  const handleDelete = async () => {
    if (!receipt) return

    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await deleteReceipt.mutateAsync(receipt.id)
        toast.success('Receipt deleted successfully')
        onOpenChange(false)
        reset()
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred'
        toast.error('Failed to delete receipt', {
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
            {mode === 'create' ? 'Add Receipt' : 'Edit Receipt'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Manually add a new receipt.'
              : 'Update the receipt details or delete it.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              {...register('storeName')}
              placeholder="e.g., Grocery Store, Restaurant"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                {...register('totalAmount')}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptDate">Date</Label>
              <Input
                id="receiptDate"
                type="date"
                {...register('receiptDate')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Receipt Number</Label>
            <Input
              id="receiptNumber"
              {...register('receiptNumber')}
              placeholder="Optional receipt/invoice number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Category</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
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
              <Label htmlFor="groupId">Group (optional)</Label>
              <Controller
                name="groupId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No group</SelectItem>
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
                {deleteReceipt.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createReceipt.isPending || updateReceipt.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createReceipt.isPending || updateReceipt.isPending}
            >
              {isSubmitting || createReceipt.isPending || updateReceipt.isPending
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