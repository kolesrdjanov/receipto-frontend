import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter } from '@/components/ui/emoji-picker'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  type Group,
  type CreateGroupInput,
} from '@/hooks/groups/use-groups'
import { getErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Trash2, Link as LinkIcon } from 'lucide-react'

interface GroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Group | null
  mode: 'create' | 'edit'
}

const FORM_ID = 'group-form'
const fieldLabel = 'mb-1.5 ml-0.5 block text-[12px] font-semibold text-fg-2'

// A handful of group-appropriate quick emojis (one-tap), with the full picker behind the tile.
const QUICK_EMOJI = ['🏠', '✈️', '🍝', '🎉', '🛒', '🏖️', '⚽', '🎬', '🍺', '🚗', '💼', '🎓']

const createGroupSchema = (t: (key: string, opts?: Record<string, unknown>) => string) =>
  z.object({
    name: z.string().min(1, t('groups.modal.nameRequired')),
    description: z.string(),
    currency: z.string(),
    icon: z.string(),
  })

type GroupFormData = z.infer<ReturnType<typeof createGroupSchema>>

/** Create / edit group — Glass form-modal (bottom sheet on mobile, centered modal on desktop). */
export function GroupModal({ open, onOpenChange, group, mode }: GroupModalProps) {
  const { t } = useTranslation()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  const schema = useMemo(() => createGroupSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', currency: 'RSD', icon: '' },
  })

  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()
  const deleteGroup = useDeleteGroup()
  const pending = isSubmitting || createGroup.isPending || updateGroup.isPending

  useEffect(() => {
    if (!open) return
    if (group && mode === 'edit') {
      reset({
        name: group.name || '',
        description: group.description || '',
        currency: group.currency || 'RSD',
        icon: group.icon || '',
      })
    } else {
      reset({ name: '', description: '', currency: 'RSD', icon: '' })
    }
  }, [open, group, mode, reset])

  const icon = watch('icon')

  const onSubmit = async (data: GroupFormData) => {
    try {
      const payload: CreateGroupInput = {
        name: data.name,
        description: data.description || undefined,
        currency: data.currency || undefined,
        icon: data.icon || undefined,
      }
      if (mode === 'create') {
        await createGroup.mutateAsync(payload)
        toast.success(t('groups.modal.createSuccess'))
      } else if (group) {
        await updateGroup.mutateAsync({ id: group.id, data: payload })
        toast.success(t('groups.modal.updateSuccess'))
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      toast.error(mode === 'create' ? t('groups.modal.createError') : t('groups.modal.updateError'), {
        description: getErrorMessage(error),
      })
    }
  }

  const handleDelete = async () => {
    if (!group) return
    try {
      await deleteGroup.mutateAsync(group.id)
      toast.success(t('groups.modal.deleteSuccess'))
      setShowDeleteDialog(false)
      onOpenChange(false)
      reset()
    } catch (error) {
      toast.error(t('groups.modal.deleteError'), { description: getErrorMessage(error) })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    reset()
  }

  return (
    <>
      <GlassDialog
        open={open}
        onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}
        title={mode === 'create' ? t('groups.modal.createTitle') : t('groups.modal.editTitle')}
        description={mode === 'create' ? t('groups.modal.createDescription') : t('groups.modal.editDescription')}
        desktopWidth={460}
        actions={{
          primary: (
            <Button type="submit" form={FORM_ID} disabled={pending} loading={pending}>
              {mode === 'create' ? t('common.create') : t('common.update')}
            </Button>
          ),
          secondary: (
            <Button type="button" variant="outline" onClick={handleClose} disabled={pending}>
              {t('common.cancel')}
            </Button>
          ),
          destructive:
            mode === 'edit' && group ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={pending || deleteGroup.isPending}
              >
                <Trash2 className="size-4" />
                {t('common.delete')}
              </Button>
            ) : undefined,
        }}
      >
        <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Identity: emoji tile + name */}
          <div className="flex items-end gap-3">
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="size-10 shrink-0 rounded-xl p-0 text-[20px]">
                  {icon || '😀'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-fit p-0" align="start" collisionPadding={16}>
                <EmojiPicker
                  className="h-[340px]"
                  onEmojiSelect={(emoji) => {
                    setValue('icon', emoji.emoji, { shouldDirty: true })
                    setEmojiPickerOpen(false)
                  }}
                >
                  <EmojiPickerSearch placeholder={t('groups.modal.iconSearchPlaceholder')} />
                  <EmojiPickerContent />
                  <EmojiPickerFooter />
                </EmojiPicker>
              </PopoverContent>
            </Popover>
            <div className="min-w-0 flex-1">
              <Label htmlFor="name" className={fieldLabel}>
                {t('groups.modal.name')}
              </Label>
              <Input id="name" {...register('name')} placeholder={t('groups.modal.namePlaceholder')} />
            </div>
          </div>
          {errors.name && <p className="-mt-2 ml-0.5 text-[13px] text-destructive">{errors.name.message}</p>}

          {/* Quick emoji row */}
          <div className="flex flex-wrap gap-2">
            {QUICK_EMOJI.map((em) => (
              <Button
                key={em}
                type="button"
                variant="outline"
                onClick={() => setValue('icon', em, { shouldDirty: true })}
                className={cn(
                  'size-10 rounded-xl p-0 text-[20px]',
                  icon === em && 'border-primary bg-primary-soft',
                )}
              >
                {em}
              </Button>
            ))}
          </div>

          <div>
            <Label htmlFor="currency" className={fieldLabel}>
              {t('groups.modal.defaultCurrency')}
            </Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <CurrencySelect
                  id="currency"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('groups.modal.defaultCurrency')}
                  triggerClassName="w-full"
                />
              )}
            />
            <p className="mt-1.5 ml-0.5 text-xs text-muted-foreground">{t('groups.modal.defaultCurrencyHelp')}</p>
          </div>

          <div>
            <Label htmlFor="description" className={fieldLabel}>
              {t('groups.modal.description')}
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('groups.modal.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          {/* Invite-after-creating hint (handoff §3) — members come next, via the Manage sheet. */}
          {mode === 'create' && (
            <div className="flex items-start gap-2.5 rounded-xl bg-bg-subtle px-3.5 py-3">
              <LinkIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="text-[12.5px] leading-[1.45] text-muted-foreground">
                {t('groups.modal.inviteAfterCreate')}
              </span>
            </div>
          )}
        </form>
      </GlassDialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title={t('groups.modal.deleteTitle')}
        description={t('groups.modal.deleteConfirmDescription', { name: group?.name })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="destructive"
        isLoading={deleteGroup.isPending}
      />
    </>
  )
}
