import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { SmilePlus, Lock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Field } from '@/components/glass/glass'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  EmojiPicker,
  EmojiPickerSearch,
  EmojiPickerContent,
  EmojiPickerFooter,
} from '@/components/ui/emoji-picker'
import { CategoryCircle, ColorSwatches, DEFAULT_CATEGORY_COLOR } from '@/components/categories/primitives'
import {
  useCreateCategory,
  useUpdateCategory,
  type Category,
  type CreateCategoryInput,
} from '@/hooks/categories/use-categories'
import { useSettingsStore } from '@/store/settings'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

const FORM_ID = 'category-form'

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  mode: 'create' | 'edit'
  /** Routes Delete (edit mode) to the page's unified delete flow (reassign / confirm). */
  onRequestDelete?: (category: Category) => void
}

type CategoryFormData = CreateCategoryInput

const fieldShell =
  'flex h-[50px] items-center gap-2.5 rounded-[14px] border border-border bg-muted/60 px-3.5 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15'
const inputCls =
  'min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:font-normal placeholder:text-fg-faint'

function fmtBudget(amount: number, currency: string) {
  return `${Math.round(amount).toLocaleString('sr-RS')} ${currency}`
}

export function CategoryModal({ open, onOpenChange, category, mode, onRequestDelete }: CategoryModalProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile(768)
  const { currency: preferredCurrency } = useSettingsStore()
  const [emojiOpen, setEmojiOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    defaultValues: { name: '', color: DEFAULT_CATEGORY_COLOR, icon: '', description: '', monthlyBudget: undefined },
  })

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const colorValue = watch('color')
  const iconValue = watch('icon')
  const nameValue = watch('name')
  const budgetValue = watch('monthlyBudget')

  const lockedCurrency = mode === 'edit' ? category?.budgetCurrency : undefined
  const displayCurrency = lockedCurrency || preferredCurrency || 'RSD'

  useEffect(() => {
    if (!open) return
    if (category && mode === 'edit') {
      reset({
        name: category.name,
        color: category.color || DEFAULT_CATEGORY_COLOR,
        icon: category.icon || '',
        description: category.description || '',
        monthlyBudget: category.monthlyBudget ?? undefined,
      })
    } else {
      reset({ name: '', color: DEFAULT_CATEGORY_COLOR, icon: '', description: '', monthlyBudget: undefined })
    }
  }, [open, category, mode, reset])

  const close = () => {
    onOpenChange(false)
    reset()
  }

  const onSubmit = async (data: CategoryFormData) => {
    const submitData: CreateCategoryInput = { ...data }
    if (submitData.monthlyBudget && submitData.monthlyBudget > 0) {
      submitData.budgetCurrency =
        mode === 'create' || !category?.budgetCurrency ? preferredCurrency : category.budgetCurrency
    } else {
      submitData.monthlyBudget = undefined
      submitData.budgetCurrency = undefined
    }

    try {
      if (mode === 'create') {
        await createCategory.mutateAsync(submitData)
        toast.success(t('categories.modal.createSuccess'))
      } else if (category) {
        await updateCategory.mutateAsync({ id: category.id, data: submitData })
        toast.success(t('categories.modal.updateSuccess'))
      }
      close()
    } catch (error) {
      const description = error instanceof Error ? error.message : 'An error occurred'
      toast.error(
        mode === 'create' ? t('categories.modal.createError') : t('categories.modal.updateError'),
        { description },
      )
    }
  }

  const requestDelete = () => {
    if (!category) return
    onOpenChange(false)
    onRequestDelete?.(category)
  }

  const pending = isSubmitting || createCategory.isPending || updateCategory.isPending
  const primaryLabel = pending
    ? mode === 'create'
      ? t('common.creating')
      : t('common.updating')
    : mode === 'create'
      ? t('categories.modal.createButton')
      : t('categories.modal.saveButton')

  const emojiPicker = (
    <EmojiPicker
      className={isMobile ? 'h-[min(58vh,440px)] w-full' : 'h-[340px] w-[340px]'}
      onEmojiSelect={(emoji) => {
        setValue('icon', emoji.emoji, { shouldDirty: true })
        setEmojiOpen(false)
      }}
    >
      <EmojiPickerSearch placeholder={t('categories.modal.iconSearchPlaceholder')} />
      <EmojiPickerContent />
      <EmojiPickerFooter />
    </EmojiPicker>
  )

  const iconRowButton = (
    <button
      type="button"
      onClick={isMobile ? () => setEmojiOpen(true) : undefined}
      className="flex h-14 w-full items-center gap-3 rounded-[14px] border border-border bg-bg-subtle/70 pl-2.5 pr-3 text-left transition-colors hover:border-primary/50 dark:bg-muted/40"
      data-testid="category-icon-input"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-card text-[22px] leading-none shadow-glass-1">
        {iconValue || '😀'}
      </span>
      <span className={cn('flex-1 text-[13.5px] font-medium', iconValue ? 'text-fg-2' : 'text-fg-faint')}>
        {iconValue ? t('categories.modal.iconChange') : t('categories.modal.iconChoose')}
      </span>
      <SmilePlus className="size-[18px] shrink-0 text-fg-faint" />
    </button>
  )

  const footer = (
    <>
      {/* Desktop */}
      <div className="hidden items-center gap-2 md:flex">
        {mode === 'edit' ? (
          <Button type="button" variant="destructive" size="sm" className="mr-auto" onClick={requestDelete} data-testid="category-delete-button">
            <Trash2 className="size-4" />
            {t('common.delete')}
          </Button>
        ) : (
          <div className="flex-1" />
        )}
        <Button type="button" variant="outline" onClick={close} disabled={pending} data-testid="category-cancel-button">
          {t('common.cancel')}
        </Button>
        <Button type="submit" form={FORM_ID} disabled={pending} data-testid="category-submit-button">
          {primaryLabel}
        </Button>
      </div>
      {/* Mobile */}
      <div className="flex flex-col gap-2 md:hidden">
        <Button type="submit" form={FORM_ID} className="w-full" disabled={pending}>
          {primaryLabel}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={close} disabled={pending}>
          {t('common.cancel')}
        </Button>
        {mode === 'edit' && (
          <Button type="button" variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={requestDelete}>
            <Trash2 className="size-4" />
            {t('categories.modal.deleteCategory')}
          </Button>
        )}
      </div>
    </>
  )

  return (
    <>
      <GlassDialog
        open={open}
        onOpenChange={(v) => (v ? onOpenChange(true) : close())}
        title={mode === 'create' ? t('categories.modal.createTitle') : t('categories.modal.editTitle')}
        description={mode === 'create' ? t('categories.modal.createDescription') : t('categories.modal.editDescription')}
        desktopWidth={520}
        footer={footer}
      >
        <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" data-testid="category-form">
          {/* Live preview pill */}
          <div>
            <label className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">
              {t('categories.modal.preview')}
            </label>
            <div className="flex items-center gap-3 rounded-[14px] border border-hairline-soft bg-bg-subtle/70 px-3.5 py-3 dark:bg-muted/40">
              <CategoryCircle color={colorValue} icon={iconValue || '🏷️'} size={44} />
              <div className="min-w-0 flex-1">
                <div className={cn('truncate text-[16px] font-bold tracking-[-0.01em]', nameValue ? 'text-foreground' : 'text-fg-faint')}>
                  {nameValue || t('categories.modal.previewNamePlaceholder')}
                </div>
                {budgetValue && budgetValue > 0 ? (
                  <div className="mt-0.5 text-[12px] tabular-nums text-muted-foreground">
                    {fmtBudget(budgetValue, displayCurrency)} {t('categories.perMonth')}
                  </div>
                ) : (
                  <div className="mt-0.5 text-[12px] text-fg-faint">{t('categories.modal.noBudget')}</div>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <Field
            label={<>{t('categories.modal.name')} <span className="text-destructive">*</span></>}
            placeholder={t('categories.modal.namePlaceholder')}
            error={errors.name?.message}
            data-testid="category-name-input"
            {...register('name', { required: t('categories.modal.nameRequired') })}
          />

          {/* Color */}
          <div>
            <label className="mb-2 ml-0.5 block text-xs font-semibold text-muted-foreground">
              {t('categories.modal.color')}
            </label>
            <ColorSwatches value={colorValue} onChange={(hex) => setValue('color', hex, { shouldDirty: true })} />
          </div>

          {/* Icon (emoji) */}
          <div>
            <label className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">
              {t('categories.modal.icon')}
            </label>
            {isMobile ? (
              iconRowButton
            ) : (
              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>{iconRowButton}</PopoverTrigger>
                <PopoverContent className="w-fit p-0" align="start" collisionPadding={16}>
                  {emojiPicker}
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="cat-description" className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">
              {t('categories.modal.description')}
            </label>
            <textarea
              id="cat-description"
              rows={3}
              placeholder={t('categories.modal.descriptionPlaceholder')}
              className="min-h-[84px] w-full resize-none rounded-[14px] border border-border bg-muted/60 px-3.5 py-3 text-[15px] font-medium leading-relaxed text-foreground outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-fg-faint focus:border-primary focus:ring-4 focus:ring-primary/15"
              data-testid="category-description-input"
              {...register('description')}
            />
          </div>

          {/* Monthly budget + currency lock */}
          <div>
            <label className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">
              {t('categories.modal.monthlyBudget')}
              {lockedCurrency && <span className="ml-1.5 font-medium text-fg-faint">({lockedCurrency})</span>}
            </label>
            <div className="flex items-stretch gap-3">
              <div className={cn(fieldShell, 'flex-1')}>
                <input
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  placeholder={t('categories.modal.monthlyBudgetPlaceholder')}
                  className={cn(inputCls, 'tabular-nums')}
                  data-testid="category-budget-input"
                  {...register('monthlyBudget', { valueAsNumber: true })}
                />
              </div>
              <div
                className="flex h-[50px] shrink-0 items-center gap-1.5 rounded-[14px] bg-bg-subtle px-3.5 text-muted-foreground"
                data-testid="category-budget-currency"
              >
                <span className="text-[14px] font-semibold">{displayCurrency}</span>
                {lockedCurrency && <Lock className="size-[13px] text-fg-faint" />}
              </div>
            </div>
            <p className="ml-0.5 mt-1.5 text-[12px] font-medium text-muted-foreground">
              {lockedCurrency ? t('categories.modal.budgetHelpEdit') : t('categories.modal.monthlyBudgetHelp')}
            </p>
          </div>
        </form>
      </GlassDialog>

      {/* Mobile emoji sheet (desktop uses the popover above) */}
      {isMobile && (
        <GlassDialog
          open={emojiOpen}
          onOpenChange={setEmojiOpen}
          title={t('categories.modal.chooseIcon')}
          bodyClassName="p-3"
        >
          {emojiPicker}
        </GlassDialog>
      )}
    </>
  )
}
