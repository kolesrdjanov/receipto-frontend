import { useEffect, useRef, useState, useMemo } from 'react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
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
import { useSuggestCategory } from '@/hooks/receipts/use-suggest-category'
import { useCategories } from '@/hooks/categories/use-categories'
import { CurrencySelect } from '@/components/ui/currency-select'
import { useGroups, useGroup } from '@/hooks/groups/use-groups'
import { useAuthStore } from '@/store/auth'
import { CategorySuggestionCard } from './category-suggestion-card'
import { toast } from 'sonner'
import { Loader2, Trash2, Check } from 'lucide-react'

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
  paidById: string
}


export function ReceiptModal({ open, onOpenChange, receipt, mode, prefillData }: ReceiptModalProps) {
  const { t } = useTranslation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [splitAmong, setSplitAmong] = useState<string[]>([])
  const [blurredStoreName, setBlurredStoreName] = useState('')

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
      paidById: '',
    },
  })

  // Track original date to preserve time component when user doesn't change the date
  const originalDateRef = useRef<{ full: string | null; dateOnly: string }>({
    full: null,
    dateOnly: '',
  })

  const { data: categories = [] } = useCategories()

  const includeArchivedGroups = mode === 'edit'
  const { data: groups = [] } = useGroups(includeArchivedGroups)
  const user = useAuthStore((state) => state.user)
  const createReceipt = useCreateReceipt()
  const updateReceipt = useUpdateReceipt()
  const deleteReceipt = useDeleteReceipt()

  // Store name category suggestion (create mode only, no category selected yet)
  const watchedCategoryId = watch('categoryId')
  const { data: storeSuggestion } = useSuggestCategory(
    blurredStoreName,
    mode === 'create' && !watchedCategoryId,
  )

  // Watch groupId to fetch group details for member selection
  const selectedGroupId = watch('groupId')
  const { data: selectedGroupDetails } = useGroup(selectedGroupId || '')

  // Get accepted group members
  const groupMembers = selectedGroupDetails?.members?.filter((m) => m.status === 'accepted') || []

  useEffect(() => {
    if (open && receipt && mode === 'edit') {
      const dateOnly = receipt.receiptDate
        ? new Date(receipt.receiptDate).toISOString().split('T')[0]
        : ''

      // Store the original full date and date-only portion for comparison
      originalDateRef.current = {
        full: receipt.receiptDate || null,
        dateOnly,
      }

      reset({
        storeName: receipt.storeName || '',
        totalAmount: receipt.totalAmount?.toString() || '',
        currency: receipt.currency || 'RSD',
        receiptDate: dateOnly,
        receiptNumber: receipt.receiptNumber || '',
        categoryId: receipt.categoryId || '',
        groupId: receipt.groupId || '',
        paidById: receipt.paidById || '',
      })

      // Initialize splitAmong from existing participants
      if (receipt.participants && receipt.participants.length > 0) {
        setSplitAmong(receipt.participants.map((p) => p.userId))
      } else {
        setSplitAmong([]) // empty = all members
      }
    } else if (open && mode === 'create') {
      // Reset original date tracking for new receipts
      originalDateRef.current = { full: null, dateOnly: '' }

      reset({
        storeName: prefillData?.storeName || '',
        totalAmount: '',
        currency: prefillData?.currency || 'RSD',
        receiptDate: new Date().toISOString().split('T')[0],
        receiptNumber: '',
        categoryId: prefillData?.categoryId || '',
        groupId: prefillData?.groupId || '',
        paidById: prefillData?.groupId && user ? user.id : '',
      })

      setSplitAmong([]) // default: all members
      setBlurredStoreName('') // reset suggestion state
    }
  }, [open, receipt, mode, reset, prefillData])

  // When group members load and splitAmong is empty (= all), keep it as empty
  // When group changes, reset splitAmong to empty (= all members)
  const prevGroupIdRef = useRef(selectedGroupId)
  useEffect(() => {
    if (prevGroupIdRef.current !== selectedGroupId) {
      setSplitAmong([]) // reset to "all" when group changes
      prevGroupIdRef.current = selectedGroupId
    }
  }, [selectedGroupId])

  // Determine if all members are selected (splitAmong empty or matches all)
  const allMemberIds = useMemo(() => groupMembers.map((m) => m.userId), [groupMembers])
  const effectiveSplitAmong = splitAmong.length === 0 ? allMemberIds : splitAmong
  const allSelected = splitAmong.length === 0 || (groupMembers.length > 0 && splitAmong.length === groupMembers.length)

  const toggleMember = (userId: string) => {
    if (splitAmong.length === 0) {
      // Currently "all" → switching to explicit: remove this member
      setSplitAmong(allMemberIds.filter((id) => id !== userId))
    } else if (splitAmong.includes(userId)) {
      // Don't allow deselecting the last member
      if (splitAmong.length <= 1) return
      const next = splitAmong.filter((id) => id !== userId)
      // If we'd end up with all members, collapse back to empty
      setSplitAmong(next.length === allMemberIds.length ? [] : next)
    } else {
      const next = [...splitAmong, userId]
      setSplitAmong(next.length === allMemberIds.length ? [] : next)
    }
  }

  const selectAllMembers = () => {
    setSplitAmong([])
  }

  const onSubmit = async (data: ReceiptFormData) => {
    try {
      // Determine the receiptDate to send:
      // - If editing and the date hasn't changed, preserve the original (with time)
      // - If the date changed or creating new, use the form value (date only)
      let receiptDateToSend: string | undefined = data.receiptDate || undefined

      if (mode === 'edit' && originalDateRef.current.full) {
        // Check if user changed the date portion
        const dateUnchanged = data.receiptDate === originalDateRef.current.dateOnly
        if (dateUnchanged) {
          // Preserve the original full datetime (with time component)
          receiptDateToSend = originalDateRef.current.full
        }
      }

      const payload: Record<string, unknown> = {
        storeName: data.storeName || undefined,
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : undefined,
        currency: data.currency || undefined,
        receiptDate: receiptDateToSend,
        receiptNumber: data.receiptNumber || undefined,
        categoryId: data.categoryId || null,
        groupId: data.groupId || null,
        paidById: data.paidById || null,
      }

      // Only send splitAmong when a group is selected and not all members
      if (data.groupId && !allSelected) {
        payload.splitAmong = effectiveSplitAmong
      } else if (data.groupId && allSelected) {
        // Explicitly clear participants on update if switched back to all
        if (mode === 'edit') {
          payload.splitAmong = null
        }
      }

      if (mode === 'create') {
        await createReceipt.mutateAsync(payload as any)
        toast.success(t('receipts.modal.createSuccess'))
      } else if (mode === 'edit' && receipt) {
        await updateReceipt.mutateAsync({ id: receipt.id, data: payload as any })
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

    try {
      await deleteReceipt.mutateAsync(receipt.id)
      toast.success(t('receipts.modal.deleteSuccess'))
      setShowDeleteDialog(false)
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

  const handleClose = () => {
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" data-testid="receipt-modal">
        <DialogHeader>
          <DialogTitle data-testid="receipt-modal-title">
            {mode === 'create' ? t('receipts.modal.addTitle') : t('receipts.modal.editTitle')}
          </DialogTitle>
          <DialogDescription data-testid="receipt-modal-description">
            {mode === 'create'
              ? t('receipts.modal.addDescription')
              : t('receipts.modal.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="receipt-form">
          <div className="space-y-2">
            <Label htmlFor="storeName">{t('receipts.modal.storeName')}</Label>
            <Input
              id="storeName"
              {...register('storeName', {
                onBlur: (e) => {
                  const value = e.target.value?.trim()
                  if (value && value.length >= 2 && mode === 'create') {
                    setBlurredStoreName(value)
                  }
                },
              })}
              placeholder={t('receipts.modal.storeNamePlaceholder')}
              data-testid="receipt-store-input"
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
                data-testid="receipt-amount-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t('receipts.modal.currency')}</Label>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <CurrencySelect
                    id="currency"
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={t('receipts.modal.currency')}
                    data-testid="receipt-currency-select"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptDate">{t('receipts.modal.date')}</Label>
              <Controller
                name="receiptDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="receiptDate"
                    value={field.value}
                    onChange={field.onChange}
                    data-testid="receipt-date-picker"
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptNumber">{t('receipts.modal.receiptNumber')}</Label>
            <Input
              id="receiptNumber"
              {...register('receiptNumber')}
              placeholder={t('receipts.modal.receiptNumberPlaceholder')}
              data-testid="receipt-number-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">{t('receipts.modal.category')}</Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger data-testid="receipt-category-select">
                    <SelectValue placeholder={t('receipts.modal.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} data-testid={`receipt-category-option-${category.id}`}>
                        {category.icon && <span className="mr-2">{category.icon}</span>}
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Show AI category suggestions if available */}
          {receipt?.autoSuggestedCategoryId && mode === 'edit' && (
            <CategorySuggestionCard
              suggestions={[
                {
                  categoryId: receipt.autoSuggestedCategoryId,
                  categoryName: receipt.autoSuggestedCategory?.name || 'Suggested',
                  categoryIcon: receipt.autoSuggestedCategory?.icon,
                  categoryColor: receipt.autoSuggestedCategory?.color,
                  confidence: receipt.suggestionConfidence || 0,
                  reason: t('categorization.basedOnPurchases'),
                },
              ]}
              currentCategoryId={watchedCategoryId}
              onAccept={(categoryId) => setValue('categoryId', categoryId, { shouldDirty: true, shouldTouch: true })}
              disabled={isSubmitting}
            />
          )}

          {/* Show store-name-based category suggestion (create mode) */}
          {storeSuggestion && mode === 'create' && (
            <CategorySuggestionCard
              suggestions={[
                {
                  categoryId: storeSuggestion.categoryId,
                  categoryName: storeSuggestion.categoryName,
                  categoryIcon: storeSuggestion.categoryIcon,
                  categoryColor: storeSuggestion.categoryColor,
                  confidence: storeSuggestion.confidence,
                  reason: storeSuggestion.reason,
                },
              ]}
              currentCategoryId={watchedCategoryId}
              onAccept={(categoryId) => setValue('categoryId', categoryId, { shouldDirty: true, shouldTouch: true })}
              disabled={isSubmitting}
            />
          )}

          {groups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="groupId">{t('receipts.modal.group')}</Label>
              <Controller
                name="groupId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val === '__none__' ? '' : val)
                      // Reset paidById when group changes
                      if (val === '__none__') {
                        setValue('paidById', '')
                      } else if (user) {
                        // Default to current user when selecting a group
                        setValue('paidById', user.id)
                      }
                    }}
                    value={field.value || '__none__'}
                    disabled={mode === 'create' && !!prefillData?.groupId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('receipts.modal.group')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t('receipts.modal.noGroup')}</SelectItem>
                      {groups.map((group) => (
                        <SelectItem
                          key={group.id}
                          value={group.id}
                          disabled={!!group.isArchived}
                        >
                          {group.icon && <span className="mr-2">{group.icon}</span>}
                          {group.name}
                          {group.isArchived && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({t('groups.archive.archivedBadge')})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {mode === 'create' && prefillData?.groupId && (
                <p className="text-xs text-muted-foreground">
                  {t('receipts.modal.groupLocked')}
                </p>
              )}
            </div>
          )}

          {selectedGroupId && groupMembers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="paidById">{t('receipts.modal.paidBy')}</Label>
              <Controller
                name="paidById"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || user?.id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('receipts.modal.selectPaidBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      {groupMembers.map((member) => {
                        const name = member.user?.firstName && member.user?.lastName
                          ? `${member.user.firstName} ${member.user.lastName}`
                          : member.user?.firstName || member.user?.lastName || member.user?.email || 'Unknown'
                        const isCurrentUser = member.userId === user?.id
                        return (
                          <SelectItem key={member.userId} value={member.userId}>
                            {name} {isCurrentUser && '(Me)'}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                {t('receipts.modal.paidByHelp')}
              </p>
            </div>
          )}

          {selectedGroupId && groupMembers.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {t('receipts.modal.splitAmong')}{' '}
                  <span className="text-muted-foreground font-normal">
                    ({t('receipts.modal.splitAmongCount', {
                      count: effectiveSplitAmong.length,
                      total: groupMembers.length,
                    })})
                  </span>
                </Label>
                {!allSelected && (
                  <button
                    type="button"
                    onClick={selectAllMembers}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('receipts.modal.splitAmongAll')}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {groupMembers.map((member) => {
                  const name = member.user?.firstName && member.user?.lastName
                    ? `${member.user.firstName} ${member.user.lastName}`
                    : member.user?.firstName || member.user?.lastName || member.user?.email || 'Unknown'
                  const isSelected = effectiveSplitAmong.includes(member.userId)
                  return (
                    <button
                      key={member.userId}
                      type="button"
                      onClick={() => toggleMember(member.userId)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/30 border-border text-muted-foreground'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      {name}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('receipts.modal.splitAmongHelp')}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {mode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleteReceipt.isPending || isSubmitting}
                className="sm:mr-auto"
                data-testid="receipt-delete-button"
              >
                <Trash2 className="h-4 w-4" />
                {t('common.delete')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createReceipt.isPending || updateReceipt.isPending}
              data-testid="receipt-cancel-button"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createReceipt.isPending || updateReceipt.isPending}
              data-testid="receipt-submit-button"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('receipts.modal.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('receipts.modal.deleteConfirm', { store: receipt?.storeName || t('common.unknown') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteReceipt.isPending}
            >
              {deleteReceipt.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
