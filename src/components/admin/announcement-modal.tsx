import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
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

const FORM_ID = 'announcement-form'
const fieldLabel = 'mb-1.5 ml-0.5 block text-[12px] font-semibold text-fg-2'

// NOTE: the original `required: true` rules had no message; the grouped error UI
// renders `titleRequired` / `messageRequired` keys — reused here as the messages.
// `linkText`'s `maxLength: 100` had no message and no error UI; kept as a bare
// `.max(100)` (no i18n key exists, none added).
const createAnnouncementSchema = (t: (key: string, opts?: Record<string, unknown>) => string) =>
  z.object({
    titleEn: z.string().min(1, t('admin.announcements.form.titleRequired')).max(200),
    titleSr: z.string().min(1, t('admin.announcements.form.titleRequired')).max(200),
    messageEn: z.string().min(1, t('admin.announcements.form.messageRequired')).max(2000),
    messageSr: z.string().min(1, t('admin.announcements.form.messageRequired')).max(2000),
    type: z.enum(['alert', 'success', 'info']),
    displayMode: z.enum(['banner', 'list', 'both']),
    linkUrl: z.string().optional(),
    linkText: z.string().max(100).optional(),
    isActive: z.boolean(),
  })

type FormData = z.infer<ReturnType<typeof createAnnouncementSchema>>

export function AnnouncementModal({ open, onOpenChange, announcement }: AnnouncementModalProps) {
  const { t } = useTranslation()
  const isEditing = !!announcement
  const createAnnouncement = useCreateAnnouncement()
  const updateAnnouncement = useUpdateAnnouncement()

  const schema = useMemo(() => createAnnouncementSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
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
  const title = isEditing ? t('admin.announcements.editAnnouncement') : t('admin.announcements.createAnnouncement')

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      desktopWidth={560}
      actions={{
        primary: (
          <Button type="submit" form={FORM_ID} className="rounded-xl" disabled={isPending}>
            {isPending ? t('common.saving') : isEditing ? t('common.save') : t('admin.announcements.createAnnouncement')}
          </Button>
        ),
        secondary: (
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('common.cancel')}
          </Button>
        ),
      }}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="titleEn" className={fieldLabel}>{t('admin.announcements.form.titleEn')}</Label>
            <Input id="titleEn" {...register('titleEn')} placeholder={t('admin.announcements.form.titlePlaceholder')} disabled={isPending} />
          </div>
          <div>
            <Label htmlFor="titleSr" className={fieldLabel}>{t('admin.announcements.form.titleSr')}</Label>
            <Input id="titleSr" {...register('titleSr')} placeholder={t('admin.announcements.form.titlePlaceholderSr')} disabled={isPending} />
          </div>
        </div>
        {(errors.titleEn || errors.titleSr) && (
          <p className="ml-0.5 -mt-2 text-[13px] text-destructive">{t('admin.announcements.form.titleRequired')}</p>
        )}

        <div>
          <Label htmlFor="messageEn" className={fieldLabel}>{t('admin.announcements.form.messageEn')}</Label>
          <Textarea id="messageEn" {...register('messageEn')} placeholder={t('admin.announcements.form.messagePlaceholder')} rows={3} disabled={isPending} />
        </div>
        <div>
          <Label htmlFor="messageSr" className={fieldLabel}>{t('admin.announcements.form.messageSr')}</Label>
          <Textarea id="messageSr" {...register('messageSr')} placeholder={t('admin.announcements.form.messagePlaceholderSr')} rows={3} disabled={isPending} />
        </div>
        {(errors.messageEn || errors.messageSr) && (
          <p className="ml-0.5 -mt-2 text-[13px] text-destructive">{t('admin.announcements.form.messageRequired')}</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className={fieldLabel}>{t('admin.announcements.form.type')}</Label>
            <Select value={type} onValueChange={(v) => setValue('type', v as FormData['type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alert">{t('admin.announcements.form.typeAlert')}</SelectItem>
                <SelectItem value="success">{t('admin.announcements.form.typeSuccess')}</SelectItem>
                <SelectItem value="info">{t('admin.announcements.form.typeInfo')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={fieldLabel}>{t('admin.announcements.form.displayMode')}</Label>
            <Select value={displayMode} onValueChange={(v) => setValue('displayMode', v as FormData['displayMode'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="banner">{t('admin.announcements.form.displayBanner')}</SelectItem>
                <SelectItem value="list">{t('admin.announcements.form.displayList')}</SelectItem>
                <SelectItem value="both">{t('admin.announcements.form.displayBoth')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="linkUrl" className={fieldLabel}>{t('admin.announcements.form.linkUrl')}</Label>
            <Input id="linkUrl" {...register('linkUrl')} placeholder={t('admin.announcements.form.linkUrlPlaceholder')} disabled={isPending} />
          </div>
          <div>
            <Label htmlFor="linkText" className={fieldLabel}>{t('admin.announcements.form.linkText')}</Label>
            <Input id="linkText" {...register('linkText')} placeholder={t('admin.announcements.form.linkTextPlaceholder')} disabled={isPending} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-bg-subtle/50 px-4 py-3">
          <Label htmlFor="isActive" className="text-sm font-semibold">{t('admin.announcements.form.isActive')}</Label>
          <Switch id="isActive" checked={isActive} onCheckedChange={(checked) => setValue('isActive', checked)} disabled={isPending} />
        </div>
      </form>
    </GlassDialog>
  )
}
