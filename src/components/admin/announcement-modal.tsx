import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  useCreateAnnouncement,
  useUpdateAnnouncement,
  type AdminAnnouncement,
} from '@/hooks/announcements/use-announcements'
import { toast } from 'sonner'

interface AnnouncementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement?: AdminAnnouncement | null
}

type FormData = {
  titleEn: string
  titleSr: string
  messageEn: string
  messageSr: string
  type: 'alert' | 'success' | 'info'
  displayMode: 'banner' | 'list' | 'both'
  linkUrl: string
  linkText: string
  isActive: boolean
}

export function AnnouncementModal({ open, onOpenChange, announcement }: AnnouncementModalProps) {
  const { t } = useTranslation()
  const isEditing = !!announcement
  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncement = useUpdateAnnouncement()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      titleEn: '',
      titleSr: '',
      messageEn: '',
      messageSr: '',
      type: 'info',
      displayMode: 'both',
      linkUrl: '',
      linkText: '',
      isActive: true,
    },
  })

  const isActive = watch('isActive')
  const type = watch('type')
  const displayMode = watch('displayMode')

  useEffect(() => {
    if (announcement) {
      reset({
        titleEn: announcement.title.en,
        titleSr: announcement.title.sr,
        messageEn: announcement.message.en,
        messageSr: announcement.message.sr,
        type: announcement.type,
        displayMode: announcement.displayMode,
        linkUrl: announcement.linkUrl || '',
        linkText: announcement.linkText || '',
        isActive: announcement.isActive,
      })
    } else {
      reset({
        titleEn: '',
        titleSr: '',
        messageEn: '',
        messageSr: '',
        type: 'info',
        displayMode: 'both',
        linkUrl: '',
        linkText: '',
        isActive: true,
      })
    }
  }, [announcement, reset])

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: { en: data.titleEn, sr: data.titleSr },
      message: { en: data.messageEn, sr: data.messageSr },
      type: data.type,
      displayMode: data.displayMode,
      isActive: data.isActive,
      linkUrl: data.linkUrl || undefined,
      linkText: data.linkText || undefined,
    }

    try {
      if (isEditing) {
        await updateAnnouncement.mutateAsync({ id: announcement.id, data: payload })
        toast.success(t('admin.announcements.updateSuccess'))
      } else {
        await createAnnouncement.mutateAsync(payload)
        toast.success(t('admin.announcements.createSuccess'))
      }
      onOpenChange(false)
    } catch {
      toast.error(isEditing ? t('admin.announcements.updateError') : t('admin.announcements.createError'))
    }
  }

  const isPending = createAnnouncement.isPending || updateAnnouncement.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('admin.announcements.editAnnouncement') : t('admin.announcements.createAnnouncement')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titleEn">{t('admin.announcements.form.titleEn')}</Label>
            <Input
              id="titleEn"
              {...register('titleEn', { required: true, maxLength: 200 })}
              placeholder={t('admin.announcements.form.titlePlaceholder')}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titleSr">{t('admin.announcements.form.titleSr')}</Label>
            <Input
              id="titleSr"
              {...register('titleSr', { required: true, maxLength: 200 })}
              placeholder={t('admin.announcements.form.titlePlaceholderSr')}
              disabled={isPending}
            />
            {(errors.titleEn || errors.titleSr) && (
              <p className="text-sm text-destructive">{t('admin.announcements.form.titleRequired')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="messageEn">{t('admin.announcements.form.messageEn')}</Label>
            <Textarea
              id="messageEn"
              {...register('messageEn', { required: true, maxLength: 2000 })}
              placeholder={t('admin.announcements.form.messagePlaceholder')}
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="messageSr">{t('admin.announcements.form.messageSr')}</Label>
            <Textarea
              id="messageSr"
              {...register('messageSr', { required: true, maxLength: 2000 })}
              placeholder={t('admin.announcements.form.messagePlaceholderSr')}
              rows={3}
              disabled={isPending}
            />
            {(errors.messageEn || errors.messageSr) && (
              <p className="text-sm text-destructive">{t('admin.announcements.form.messageRequired')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.announcements.form.type')}</Label>
              <Select value={type} onValueChange={(v) => setValue('type', v as FormData['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alert">{t('admin.announcements.form.typeAlert')}</SelectItem>
                  <SelectItem value="success">{t('admin.announcements.form.typeSuccess')}</SelectItem>
                  <SelectItem value="info">{t('admin.announcements.form.typeInfo')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.announcements.form.displayMode')}</Label>
              <Select value={displayMode} onValueChange={(v) => setValue('displayMode', v as FormData['displayMode'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">{t('admin.announcements.form.displayBanner')}</SelectItem>
                  <SelectItem value="list">{t('admin.announcements.form.displayList')}</SelectItem>
                  <SelectItem value="both">{t('admin.announcements.form.displayBoth')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkUrl">{t('admin.announcements.form.linkUrl')}</Label>
            <Input
              id="linkUrl"
              {...register('linkUrl')}
              placeholder={t('admin.announcements.form.linkUrlPlaceholder')}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkText">{t('admin.announcements.form.linkText')}</Label>
            <Input
              id="linkText"
              {...register('linkText', { maxLength: 100 })}
              placeholder={t('admin.announcements.form.linkTextPlaceholder')}
              disabled={isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">{t('admin.announcements.form.isActive')}</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t('common.saving')
                : isEditing
                  ? t('common.save')
                  : t('admin.announcements.createAnnouncement')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
