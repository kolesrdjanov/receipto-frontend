import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatMoney } from '@/lib/utils'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GMemberAvatar } from '@/components/groups/primitives'
import { useCategories } from '@/hooks/categories/use-categories'
import { useCreateReceipt } from '@/hooks/receipts/use-receipts'
import { memberName } from '@/lib/groups'
import { getErrorMessage } from '@/lib/api'
import type { GroupMember } from '@/hooks/groups/use-groups'

const fieldLabel = 'mb-1.5 ml-0.5 block text-[12px] font-semibold text-fg-2'

const schema = z.object({
  storeName: z.string().trim().min(1),
  totalAmount: z.coerce.number().positive(),
  currency: z.string().min(1),
  receiptDate: z.string().min(1),
  categoryId: z.string().optional(),
  paidById: z.string().min(1),
  splitAmong: z.array(z.string()).min(1),
})

type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

interface GroupExpenseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupCurrency: string
  members: GroupMember[]
  currentUserId?: string
}

/**
 * Group-native "Add expense" sheet (handoff §3): what-for, big amount + currency,
 * paid-by avatar chips (single-select, defaults to you), an Equally split over a member
 * checklist with per-person shares, category + date. Splitting by custom amounts needs
 * per-user amounts in the API — the segmented control keeps that option visible but
 * disabled until the backend grows support.
 */
export function GroupExpenseSheet({
  open,
  onOpenChange,
  groupId,
  groupCurrency,
  members,
  currentUserId,
}: GroupExpenseSheetProps) {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()
  const createReceipt = useCreateReceipt()

  const defaults = useMemo<FormValues>(
    () => ({
      storeName: '',
      totalAmount: '' as unknown as number,
      currency: groupCurrency || 'RSD',
      receiptDate: new Date().toISOString().slice(0, 10),
      categoryId: '',
      paidById: currentUserId || members[0]?.userId || '',
      splitAmong: members.map((m) => m.userId),
    }),
    [groupCurrency, currentUserId, members],
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schema), defaultValues: defaults })

  useEffect(() => {
    if (open) reset(defaults)
  }, [open, reset, defaults])

  const amount = Number(watch('totalAmount')) || 0
  const split = watch('splitAmong')
  const currency = watch('currency')
  const share = split.length > 0 ? amount / split.length : 0

  const onSubmit = async (values: FormOutput) => {
    try {
      await createReceipt.mutateAsync({
        storeName: values.storeName,
        totalAmount: values.totalAmount,
        currency: values.currency,
        receiptDate: values.receiptDate,
        categoryId: values.categoryId || null,
        groupId,
        paidById: values.paidById,
        splitAmong: values.splitAmong,
      })
      toast.success(t('groups.expense.added'))
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, t('groups.expense.addError')))
    }
  }

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('groups.expense.addExpense')}
      desktopWidth={460}
      actions={{
        primary: (
          <Button
            type="submit"
            form="group-expense-form"
            variant="default"
            loading={createReceipt.isPending}
            loadingText={t('common.saving')}
          >
            {t('groups.expense.addExpense')}
          </Button>
        ),
        secondary: (
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        ),
      }}
    >
      <form id="group-expense-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* What for */}
        <div>
          <Label htmlFor="ge-what" className={fieldLabel}>
            {t('groups.expense.whatFor')}
          </Label>
          <Input
            id="ge-what"
            placeholder={t('groups.expense.whatForPlaceholder')}
            autoComplete="off"
            {...register('storeName')}
          />
          {errors.storeName && (
            <p className="ml-0.5 mt-1 text-[13px] text-destructive">{t('groups.expense.whatForRequired')}</p>
          )}
        </div>

        {/* Big amount + currency */}
        <div className="grid grid-cols-[1fr_128px] gap-2.5">
          <div>
            <Label htmlFor="ge-amount" className={fieldLabel}>
              {t('receipts.modal.totalAmount')}
            </Label>
            <Input
              id="ge-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              className="h-12 text-[22px] font-bold tracking-[-0.01em]"
              {...register('totalAmount')}
            />
            {errors.totalAmount && (
              <p className="ml-0.5 mt-1 text-[13px] text-destructive">{t('groups.expense.amountRequired')}</p>
            )}
          </div>
          <div>
            <Label htmlFor="ge-currency" className={fieldLabel}>
              {t('receipts.modal.currency')}
            </Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <CurrencySelect
                  id="ge-currency"
                  value={field.value}
                  onValueChange={field.onChange}
                  triggerClassName="h-12 w-full"
                />
              )}
            />
          </div>
        </div>

        {/* Paid by — avatar chips, single select */}
        <div>
          <span className={fieldLabel}>{t('groups.expense.paidBy')}</span>
          <Controller
            name="paidById"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const selected = field.value === m.userId
                  return (
                    // eslint-disable-next-line no-restricted-syntax -- raw-button-ok: single-select avatar chip (aria-pressed), not a Button variant
                    <button
                      key={m.userId}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => field.onChange(m.userId)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-[13px] font-semibold transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-bg-subtle',
                      )}
                    >
                      <GMemberAvatar user={m.user} self={m.userId === currentUserId} size={24} />
                      {m.userId === currentUserId ? t('groups.you') : memberName(m.user)}
                    </button>
                  )
                })}
              </div>
            )}
          />
        </div>

        {/* Split — Equally segmented + member checklist with per-person shares */}
        <div>
          <span className={fieldLabel}>{t('groups.expense.split')}</span>
          <div className="mb-2.5 inline-flex rounded-[10px] bg-bg-subtle p-[3px]">
            <span className="rounded-[7px] bg-card px-3.5 py-1.5 text-[13px] font-semibold text-foreground shadow-glass-1">
              {t('groups.expense.splitEqually')}
            </span>
            <span
              aria-disabled
              title={t('groups.expense.splitByAmountSoon')}
              className="cursor-not-allowed px-3.5 py-1.5 text-[13px] font-semibold text-fg-faint"
            >
              {t('groups.expense.splitByAmount')}
            </span>
          </div>
          <Controller
            name="splitAmong"
            control={control}
            render={({ field }) => (
              <div className="overflow-hidden rounded-xl border border-border">
                {members.map((m) => {
                  const checked = field.value.includes(m.userId)
                  return (
                    // eslint-disable-next-line no-restricted-syntax -- raw-button-ok: checkbox row (role=checkbox) in the split checklist, not a Button variant
                    <button
                      key={m.userId}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() =>
                        field.onChange(
                          checked ? field.value.filter((id) => id !== m.userId) : [...field.value, m.userId],
                        )
                      }
                      className="flex w-full items-center gap-2.5 border-t border-hairline-soft px-3 py-2.5 text-left transition-colors first:border-t-0 hover:bg-bg-subtle"
                    >
                      <span
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded-[6px] border-2 transition-colors',
                          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong bg-card',
                        )}
                      >
                        {checked && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <GMemberAvatar user={m.user} self={m.userId === currentUserId} size={26} />
                      <span className="flex-1 truncate text-[13.5px] font-semibold text-foreground">
                        {m.userId === currentUserId ? t('groups.you') : memberName(m.user)}
                      </span>
                      {checked && amount > 0 && (
                        <span className="shrink-0 text-[12.5px] font-semibold text-muted-foreground">
                          {formatMoney(share, currency)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          />
          {errors.splitAmong && (
            <p className="ml-0.5 mt-1 text-[13px] text-destructive">{t('groups.expense.splitRequired')}</p>
          )}
        </div>

        {/* Category + Date */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <Label htmlFor="ge-category" className={fieldLabel}>
              {t('receipts.modal.category')}
            </Label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger id="ge-category">
                    <SelectValue placeholder={t('receipts.modal.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="ge-date" className={fieldLabel}>
              {t('receipts.modal.date')}
            </Label>
            <Controller
              name="receiptDate"
              control={control}
              render={({ field }) => <DatePicker id="ge-date" value={field.value} onChange={field.onChange} />}
            />
          </div>
        </div>
      </form>
    </GlassDialog>
  )
}
