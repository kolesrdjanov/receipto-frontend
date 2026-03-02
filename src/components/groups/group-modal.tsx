import { useEffect, useState, useSyncExternalStore } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter } from '@/components/ui/emoji-picker'
import { CurrencySelect } from '@/components/ui/currency-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const mediaQuery = typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)') : null
function useIsMobile() {
  return useSyncExternalStore(
    (cb) => { mediaQuery?.addEventListener('change', cb); return () => mediaQuery?.removeEventListener('change', cb) },
    () => mediaQuery?.matches ?? false,
    () => false,
  )
}
import {
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  type Group,
  type CreateGroupInput,
} from '@/hooks/groups/use-groups'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'

interface GroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Group | null
  mode: 'create' | 'edit'
}

type GroupFormData = {
  name: string
  description: string
  currency: string
  icon: string
}

export function GroupModal({ open, onOpenChange, group, mode }: GroupModalProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<GroupFormData>({
    defaultValues: {
      name: '',
      description: '',
      currency: 'RSD',
      icon: '',
    },
  })

  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()
  const deleteGroup = useDeleteGroup()

  useEffect(() => {
    if (open && group && mode === 'edit') {
      reset({
        name: group.name || '',
        description: group.description || '',
        currency: group.currency || 'RSD',
        icon: group.icon || '',
      })
    } else if (open && mode === 'create') {
      reset({
        name: '',
        description: '',
        currency: 'RSD',
        icon: '',
      })
    }
  }, [open, group, mode, reset])

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
      } else if (mode === 'edit' && group) {
        await updateGroup.mutateAsync({ id: group.id, data: payload })
        toast.success(t('groups.modal.updateSuccess'))
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(mode === 'create' ? t('groups.modal.createError') : t('groups.modal.updateError'), {
        description: errorMessage,
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
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      toast.error(t('groups.modal.deleteError'), {
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('groups.modal.createTitle') : t('groups.modal.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('groups.modal.createDescription')
              : t('groups.modal.editDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('groups.modal.name')} *</Label>
            <Input
              id="name"
              {...register('name', { required: true })}
              placeholder={t('groups.modal.namePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('groups.modal.description')}</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder={t('groups.modal.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t('groups.modal.defaultCurrency')}</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <CurrencySelect
                  id="currency"
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('groups.modal.defaultCurrency')}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              {t('groups.modal.defaultCurrencyHelp')}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t('groups.modal.icon')}</Label>
            <div className="flex items-center gap-2">
              {isMobile ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 text-lg p-0"
                    onClick={() => setEmojiPickerOpen(true)}
                  >
                    {watch('icon') || '😀'}
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
                        <EmojiPickerSearch placeholder={t('groups.modal.iconSearchPlaceholder')} />
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
                      {watch('icon') || '😀'}
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
                      <EmojiPickerSearch placeholder={t('groups.modal.iconSearchPlaceholder')} />
                      <EmojiPickerContent />
                      <EmojiPickerFooter />
                    </EmojiPicker>
                  </PopoverContent>
                </Popover>
              )}
              {watch('icon') && (
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
              {!watch('icon') && (
                <span className="text-sm text-muted-foreground">
                  {t('groups.modal.iconPlaceholder')}
                </span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {mode === 'edit' && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleteGroup.isPending || isSubmitting}
                className="sm:mr-auto"
              >
                <Trash2 className="h-4 w-4" />
                {t('common.delete')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || createGroup.isPending || updateGroup.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || createGroup.isPending || updateGroup.isPending}
            >
              {isSubmitting || createGroup.isPending || updateGroup.isPending
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
            <AlertDialogTitle>{t('groups.modal.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('groups.modal.deleteConfirmDescription', { name: group?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? (
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
