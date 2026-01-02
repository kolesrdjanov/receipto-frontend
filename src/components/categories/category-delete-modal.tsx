import { useState, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategoryReceipts, useCategories, useDeleteCategory, type Category } from '@/hooks/categories/use-categories'
import { useUpdateReceipt } from '@/hooks/receipts/use-receipts'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CategoryDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onDeleted: () => void
}

export function CategoryDeleteModal({
  open,
  onOpenChange,
  category,
  onDeleted,
}: CategoryDeleteModalProps) {
  const { t } = useTranslation()
  const { data: receipts, isLoading: receiptsLoading } = useCategoryReceipts(category?.id || '')
  const { data: categories } = useCategories()
  const updateReceipt = useUpdateReceipt()
  const deleteCategory = useDeleteCategory()
  const [reassignments, setReassignments] = useState<Record<string, string | null>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  // Initialize reassignments when receipts load
  useEffect(() => {
    if (receipts && receipts.length > 0) {
      const initial: Record<string, string | null> = {}
      receipts.forEach((receipt) => {
        initial[receipt.id] = null // null means uncategorized
      })
      setReassignments(initial)
    }
  }, [receipts])

  const handleSetAllUncategorized = () => {
    if (!receipts) return
    const updates: Record<string, string | null> = {}
    receipts.forEach((receipt) => {
      updates[receipt.id] = null
    })
    setReassignments(updates)
  }

  const handleReassignmentChange = (receiptId: string, newCategoryId: string | null) => {
    setReassignments((prev) => ({
      ...prev,
      [receiptId]: newCategoryId,
    }))
  }

  const handleConfirm = async () => {
    if (!category) return
    
    setIsProcessing(true)
    
    try {
      // If there are receipts, reassign them first
      if (receipts && receipts.length > 0) {
        const updates = Object.entries(reassignments).map(([receiptId, categoryId]) =>
          updateReceipt.mutateAsync({
            id: receiptId,
            data: { categoryId },
          })
        )
        
        await Promise.all(updates)
        toast.success(t('categories.modal.reassignSuccess'))
      }
      
      // Now delete the category
      await deleteCategory.mutateAsync(category.id)
      toast.success(t('categories.modal.deleteSuccess'))
      
      // Close modal and notify parent
      onOpenChange(false)
      onDeleted()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      if (receipts && receipts.length > 0) {
        toast.error(t('categories.modal.reassignError'), {
          description: errorMessage,
        })
      } else {
        toast.error(t('categories.modal.deleteError'), {
          description: errorMessage,
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const formatAmount = (receipt: any) => {
    const currency: string = receipt.currency || 'RSD'
    const amount = receipt.totalAmount
    if (amount === undefined || amount === null) return '-'
    return `${currency} ${amount}`
  }

  // Filter out the category being deleted from the options
  const availableCategories = categories?.filter((cat) => cat.id !== category?.id) || []

  if (receiptsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // No receipts - show simple confirmation
  if (!receipts || receipts.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('categories.modal.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('categories.modal.deleteConfirmSimple', { name: category?.name || '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Has receipts - show reassignment interface
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('categories.modal.deleteWithReceiptsTitle')}</DialogTitle>
          <DialogDescription>
            {t('categories.modal.deleteWithReceiptsDescription', {
              name: category?.name || '',
              count: receipts.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div className="flex justify-end mb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSetAllUncategorized}
            >
              {t('categories.modal.setAllUncategorized')}
            </Button>
          </div>

          {receipts.map((receipt) => (
            <div key={receipt.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">
                    {receipt.storeName || t('receipts.unknownStore')}
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>{formatAmount(receipt)}</span>
                    <span>{formatDate(receipt.receiptDate)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`category-${receipt.id}`} className="text-xs">
                  {t('categories.modal.reassignTo')}
                </Label>
                <Select
                  value={reassignments[receipt.id] || 'uncategorized'}
                  onValueChange={(value) =>
                    handleReassignmentChange(
                      receipt.id,
                      value === 'uncategorized' ? null : value
                    )
                  }
                >
                  <SelectTrigger id={`category-${receipt.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">
                      {t('categories.modal.uncategorized')}
                    </SelectItem>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="inline-flex items-center gap-2">
                          {cat.icon && <span>{cat.icon}</span>}
                          <span>{cat.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {receipts && receipts.length > 0 ? t('categories.modal.reassigning') : t('common.deleting')}
              </>
            ) : (
              receipts && receipts.length > 0 ? t('categories.modal.deleteAndReassign') : t('common.delete')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
