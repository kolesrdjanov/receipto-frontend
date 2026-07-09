import { useEffect, useRef, useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Alert } from '@/components/glass/glass'
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
  type Receipt,
  type CreateReceiptInput,
  type UpdateReceiptInput,
} from '@/hooks/receipts/use-receipts'
import { useSuggestCategory } from '@/hooks/receipts/use-suggest-category'
import { useCategories } from '@/hooks/categories/use-categories'
import { CurrencySelect } from '@/components/ui/currency-select'
import { useGroups, useGroup } from '@/hooks/groups/use-groups'
import { useAuthStore } from '@/store/auth'
import { CategorySuggestionCard } from './category-suggestion-card'
import { toast } from 'sonner'
import { CheckCircle2, Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Chip } from '@/components/glass/chip'
import { getErrorMessage } from '@/lib/api'

interface ReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt?: Receipt | null
  mode: 'create' | 'edit'
  prefillData?: Partial<Receipt> | null
  /** Edit mode: request deletion (the page owns the confirm dialog). */
  onRequestDelete?: (receipt: Receipt) => void
}

// "required" messages reuse the existing shared `common.required` key (no new keys
// added). Amount-specific messages have no i18n key, so they are hardcoded English
// strings — NOTED in the deliverable. en.json/sr.json are NOT touched.
const createReceiptSchema = (t: TFunction) =>
  z.object({
    storeName: z.string().min(1, t('common.required')),
    totalAmount: z.coerce
      .number({ message: t('common.validation.amountInvalid') })
      .positive(t('common.validation.amountPositive')),
    currency: z.string().min(1, t('common.required')),
    receiptDate: z.string().min(1, t('common.required')),
    receiptNumber: z.string().optional(),
    // Optional in the form (default ''); mapped to `null` at the API boundary in
    // onSubmit. Kept as a plain string here so the Select/suggestion-card props
    // (which expect string | undefined) stay strictly typed.
    categoryId: z.string().optional(),
    groupId: z.string().optional(),
    paidById: z.string().optional(),
  })

// 3-generic signature: z.coerce.number() makes input (string) differ from output (number),
// so single-generic useForm fails to typecheck. Input = raw form values, Output = coerced.
type ReceiptFormInput = z.input<ReturnType<typeof createReceiptSchema>>
type ReceiptForm = z.output<ReturnType<typeof createReceiptSchema>>

const FORM_ID = 'receipt-form'
const fieldLabel = 'field-label'

export function ReceiptModal({ open, onOpenChange, receipt, mode, prefillData, onRequestDelete }: ReceiptModalProps) {
  const { t } = useTranslation()
  const [splitAmong, setSplitAmong] = useState<string[]>([])
  const [blurredStoreName, setBlurredStoreName] = useState('')

  const schema = useMemo(() => createReceiptSchema(t), [t])

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReceiptFormInput, unknown, ReceiptForm>({
    resolver: zodResolver(schema),
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

  const onSubmit = async (data: ReceiptForm) => {
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

      // Shared, non-split fields. totalAmount is a validated positive number
      // (Zod coerce), so no parseFloat / undefined-guard is needed.
      const base = {
        storeName: data.storeName,
        totalAmount: data.totalAmount,
        currency: data.currency,
        receiptDate: receiptDateToSend,
        receiptNumber: data.receiptNumber || undefined,
        categoryId: data.categoryId || null,
        groupId: data.groupId || null,
        paidById: data.paidById || null,
      }

      // splitAmong only matters when a group is selected: send the explicit list
      // when not all members are included, otherwise leave undefined (edit mode
      // additionally sends null to clear any existing participants).
      const splitAmong =
        data.groupId && !allSelected ? effectiveSplitAmong : undefined

      if (mode === 'create') {
        const payload: CreateReceiptInput = { ...base, splitAmong }
        await createReceipt.mutateAsync(payload)
        toast.success(t('receipts.modal.createSuccess'))
      } else if (mode === 'edit' && receipt) {
        const payload: UpdateReceiptInput = {
          ...base,
          splitAmong: data.groupId && allSelected ? null : splitAmong,
        }
        await updateReceipt.mutateAsync({ id: receipt.id, data: payload })
        toast.success(t('receipts.modal.updateSuccess'))
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      toast.error(mode === 'create' ? t('receipts.modal.createError') : t('receipts.modal.updateError'), {
        description: errorMessage,
      })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    reset()
  }

  // "Review receipt" is the post-scan verification state: an edit-mode receipt that
  // was auto-categorized after a fiscal QR scan (autoSuggestedCategoryId set).
  const isReview = mode === 'edit' && !!receipt?.autoSuggestedCategoryId
  const pending = isSubmitting || createReceipt.isPending || updateReceipt.isPending

  const title =
    mode === 'create'
      ? t('receipts.modal.addTitle')
      : isReview
        ? t('receipts.modal.reviewTitle')
        : t('receipts.modal.editTitle')
  const description =
    mode === 'create'
      ? t('receipts.modal.addDescription')
      : isReview
        ? t('receipts.modal.reviewDescription')
        : t('receipts.modal.editDescription')
  const primaryLabel = pending
    ? mode === 'create'
      ? t('common.creating')
      : t('common.updating')
    : mode === 'create'
      ? t('common.create')
      : isReview
        ? t('receipts.modal.confirmSave')
        : t('common.update')

  return (
    <GlassDialog
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}
      title={title}
      description={description}
      desktopWidth={520}
      actions={{
        primary: (
          <Button
            type="submit"
            form={FORM_ID}
            disabled={pending}
            data-testid="receipt-submit-button"
          >
            {primaryLabel}
          </Button>
        ),
        secondary: (
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={pending}
            data-testid="receipt-cancel-button"
          >
            {t('common.cancel')}
          </Button>
        ),
        destructive:
          mode === 'edit' && receipt ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onOpenChange(false)
                onRequestDelete?.(receipt)
              }}
              disabled={pending}
              data-testid="receipt-delete-button"
            >
              <Trash2 className="size-4" />
              {t('common.delete')}
            </Button>
          ) : undefined,
      }}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" data-testid="receipt-form">
        {isReview && (
          <Alert kind="ok" icon={CheckCircle2}>
            {t('receipts.modal.scannedNotice')}
          </Alert>
        )}

        <div>
          <Label htmlFor="storeName" className={fieldLabel}>
            {t('receipts.modal.storeName')}
          </Label>
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
          {errors.storeName && (
            <p className="mt-1 ml-0.5 text-[13px] text-destructive" data-testid="receipt-store-error">
              {errors.storeName.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.5fr_1fr_1.3fr]">
          <div>
            <Label htmlFor="totalAmount" className={fieldLabel}>
              {t('receipts.modal.totalAmount')}
            </Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
             
              {...register('totalAmount')}
              placeholder="0.00"
              data-testid="receipt-amount-input"
            />
            {errors.totalAmount && (
              <p className="mt-1 ml-0.5 text-[13px] text-destructive" data-testid="receipt-amount-error">
                {errors.totalAmount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="currency" className={fieldLabel}>
              {t('receipts.modal.currency')}
            </Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <CurrencySelect
                  id="currency"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('receipts.modal.currency')}
                  triggerClassName="w-full"
                  data-testid="receipt-currency-select"
                />
              )}
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <Label htmlFor="receiptDate" className={fieldLabel}>
              {t('receipts.modal.date')}
            </Label>
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
            {errors.receiptDate && (
              <p className="mt-1 ml-0.5 text-[13px] text-destructive" data-testid="receipt-date-error">
                {errors.receiptDate.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="receiptNumber" className={fieldLabel}>
            {t('receipts.modal.receiptNumber')}
          </Label>
          <Input
            id="receiptNumber"
           
            {...register('receiptNumber')}
            placeholder={t('receipts.modal.receiptNumberPlaceholder')}
            data-testid="receipt-number-input"
          />
        </div>

        <div>
          <Label htmlFor="categoryId" className={fieldLabel}>
            {t('receipts.modal.category')}
          </Label>
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

          {/* AI category suggestion — auto-categorized (edit) or store-name based (create) */}
          {receipt?.autoSuggestedCategoryId && mode === 'edit' && (
            <div className="mt-2.5">
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
            </div>
          )}

          {storeSuggestion && mode === 'create' && (
            <div className="mt-2.5">
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
            </div>
          )}
        </div>

        {groups.length > 0 && (
          <div>
            <Label htmlFor="groupId" className={fieldLabel}>
              {t('receipts.modal.group')}
            </Label>
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
              <p className="mt-1.5 ml-0.5 text-xs text-muted-foreground">
                {t('receipts.modal.groupLocked')}
              </p>
            )}
          </div>
        )}

        {selectedGroupId && groupMembers.length > 0 && (
          <div>
            <Label htmlFor="paidById" className={fieldLabel}>
              {t('receipts.modal.paidBy')}
            </Label>
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
                          {name} {isCurrentUser && t('common.me')}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="mt-1.5 ml-0.5 text-xs text-muted-foreground">
              {t('receipts.modal.paidByHelp')}
            </p>
          </div>
        )}

        {selectedGroupId && groupMembers.length > 1 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label className={cn(fieldLabel, 'mb-0')}>
                {t('receipts.modal.splitAmong')}{' '}
                <span className="font-medium text-fg-faint">
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
                  className="text-xs font-medium text-primary hover:underline"
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
                  <Chip
                    key={member.userId}
                    tone="soft"
                    active={isSelected}
                    onClick={() => toggleMember(member.userId)}
                    icon={isSelected ? <Check className="size-3.5" /> : undefined}
                    label={name}
                  />
                )
              })}
            </div>
            <p className="mt-2 ml-0.5 text-xs text-muted-foreground">
              {t('receipts.modal.splitAmongHelp')}
            </p>
          </div>
        )}
      </form>
    </GlassDialog>
  )
}
