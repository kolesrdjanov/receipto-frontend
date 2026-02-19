import { useEffect, useState, useSyncExternalStore } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter } from '@/components/ui/emoji-picker'
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
import { useCurrencies, getCurrencyFlag } from '@/hooks/currencies/use-currencies'
import { useCategories } from '@/hooks/categories/use-categories'
import { useCreateSavingsGoal, useUpdateSavingsGoal, type SavingsGoal } from '@/hooks/savings/use-savings'
import { useSettingsStore } from '@/store/settings'
import { toast } from 'sonner'

const mediaQuery = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)') : null
function useIsMobile() {
  return useSyncExternalStore(
    (cb) => { mediaQuery?.addEventListener('change', cb); return () => mediaQuery?.removeEventListener('change', cb) },
    () => mediaQuery?.matches ?? false,
    () => false,
  )
}

interface GoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: SavingsGoal | null
  mode: 'create' | 'edit'
}

interface GoalFormData {
  name: string
  targetAmount: number
  currency: string
  deadline: string
  icon: string
  color: string
  priority: string
  categoryId: string
}

export function GoalModal({ open, onOpenChange, goal, mode }: GoalModalProps) {
  const { t } = useTranslation()
  const { currency: preferredCurrency } = useSettingsStore()
  const { currencies } = useCurrencies()
  const { data: categories } = useCategories()
  const createGoal = useCreateSavingsGoal()
  const updateGoal = useUpdateSavingsGoal()
  const isMobile = useIsMobile()
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormData>({
    defaultValues: {
      name: '',
      targetAmount: 0,
      currency: preferredCurrency || 'RSD',
      deadline: '',
      icon: '🎯',
      color: '#3b82f6',
      priority: 'medium',
      categoryId: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && goal) {
        reset({
          name: goal.name,
          targetAmount: Number(goal.targetAmount),
          currency: goal.currency,
          deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
          icon: goal.icon || '🎯',
          color: goal.color || '#3b82f6',
          priority: goal.priority,
          categoryId: goal.categoryId || '',
        })
      } else {
        reset({
          name: '',
          targetAmount: 0,
          currency: preferredCurrency || 'RSD',
          deadline: '',
          icon: '🎯',
          color: '#3b82f6',
          priority: 'medium',
          categoryId: '',
        })
      }
    }
  }, [open, mode, goal, reset, preferredCurrency])

  const iconValue = watch('icon')
  const colorValue = watch('color')

  const onSubmit = async (data: GoalFormData) => {
    try {
      const payload = {
        name: data.name.trim(),
        targetAmount: Number(data.targetAmount),
        currency: data.currency,
        deadline: data.deadline || undefined,
        icon: data.icon || undefined,
        color: data.color || undefined,
        priority: data.priority,
        categoryId: data.categoryId || undefined,
      }

      if (mode === 'edit' && goal) {
        await updateGoal.mutateAsync({ id: goal.id, ...payload })
        toast.success(t('savings.goal.updated'))
      } else {
        await createGoal.mutateAsync(payload)
        toast.success(t('savings.goal.created'))
      }
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('savings.goalModal.createTitle') : t('savings.goalModal.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t('savings.goalModal.createDescription') : t('savings.goalModal.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('savings.goalModal.name')}</Label>
            <Input
              id="name"
              {...register('name', { required: true })}
              placeholder={t('savings.goalModal.namePlaceholder')}
            />
            {errors.name && <p className="text-xs text-destructive">{t('common.required')}</p>}
          </div>

          {/* Target Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">{t('savings.goalModal.targetAmount')}</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0.01"
                {...register('targetAmount', { required: true, min: 0.01, valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('savings.goalModal.currency')}</Label>
              <Select value={watch('currency')} onValueChange={(v) => setValue('currency', v)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-1.5">
                        <span>{getCurrencyFlag(c.icon)}</span>
                        <span>{c.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>{t('savings.goalModal.deadline')}</Label>
            <DatePicker
              value={watch('deadline')}
              onChange={(v) => setValue('deadline', v)}
              placeholder={t('common.pickDate')}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>{t('savings.goalModal.priority')}</Label>
            <Select value={watch('priority')} onValueChange={(v) => setValue('priority', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">{t('savings.priority.high')}</SelectItem>
                <SelectItem value="medium">{t('savings.priority.medium')}</SelectItem>
                <SelectItem value="low">{t('savings.priority.low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t('savings.goalModal.category')}</Label>
            <Select value={watch('categoryId')} onValueChange={(v) => setValue('categoryId', v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('savings.goalModal.noCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('savings.goalModal.noCategory')}</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-1.5">
                      {cat.icon && <span>{cat.icon}</span>}
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>{t('savings.goalModal.color')}</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={colorValue || '#3b82f6'}
                onChange={(e) => setValue('color', e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={colorValue || '#3b82f6'}
                onChange={(e) => setValue('color', e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          {/* Icon (Emoji Picker) */}
          <div className="space-y-2">
            <Label>{t('savings.goalModal.icon')}</Label>
            <div className="flex items-center gap-2">
              {isMobile ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 text-lg p-0"
                    onClick={() => setEmojiPickerOpen(true)}
                  >
                    {iconValue || '🎯'}
                  </Button>
                  <Dialog open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                    <DialogContent className="p-0 gap-0 max-w-[min(24rem,calc(100vw-2rem))]">
                      <EmojiPicker
                        className="h-[min(24rem,60vh)] w-full"
                        onEmojiSelect={(emoji) => {
                          setValue('icon', emoji.emoji)
                          setEmojiPickerOpen(false)
                        }}
                      >
                        <EmojiPickerSearch />
                        <EmojiPickerContent />
                        <EmojiPickerFooter />
                      </EmojiPicker>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-10 text-lg p-0"
                    >
                      {iconValue || '🎯'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-0" align="start" collisionPadding={16}>
                    <EmojiPicker
                      className="h-[340px]"
                      onEmojiSelect={(emoji) => {
                        setValue('icon', emoji.emoji)
                        setEmojiPickerOpen(false)
                      }}
                    >
                      <EmojiPickerSearch />
                      <EmojiPickerContent />
                      <EmojiPickerFooter />
                    </EmojiPicker>
                  </PopoverContent>
                </Popover>
              )}
              {iconValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground text-xs"
                  onClick={() => setValue('icon', '')}
                >
                  {t('common.clear')}
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || createGoal.isPending || updateGoal.isPending}>
              {mode === 'create' ? t('savings.goalModal.create') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
