import { useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSendSupportMessage } from '@/hooks/support/use-support'
import { toast } from 'sonner'

interface ContactSupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FORM_ID = 'contact-support-form'
const labelCls = 'mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground'

const createSupportSchema = (t: (key: string, opts?: Record<string, unknown>) => string) =>
  z.object({
    subject: z
      .string()
      .min(1, t('common.validation.fieldRequired', { field: t('support.subject') }))
      .max(200, t('common.validation.maxLength', { field: t('support.subject'), max: 200 })),
    message: z
      .string()
      .min(1, t('common.validation.fieldRequired', { field: t('support.message') }))
      .max(5000, t('common.validation.maxLength', { field: t('support.message'), max: 5000 })),
  })

type SupportFormData = z.infer<ReturnType<typeof createSupportSchema>>

export function ContactSupportModal({ open, onOpenChange }: ContactSupportModalProps) {
  const { t } = useTranslation()
  const schema = useMemo(() => createSupportSchema(t), [t])
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<SupportFormData>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', message: '' },
  })

  const sendSupportMessage = useSendSupportMessage()
  const pending = isSubmitting || sendSupportMessage.isPending

  const close = () => {
    onOpenChange(false)
    reset()
  }

  const onSubmit = async (data: SupportFormData) => {
    try {
      await sendSupportMessage.mutateAsync(data)
      toast.success(t('support.success'))
      close()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('support.error')
      toast.error(t('support.error'), { description: errorMessage })
    }
  }

  return (
    <GlassDialog
      open={open}
      onOpenChange={(v) => (v ? onOpenChange(true) : close())}
      title={t('support.title')}
      description={t('support.description')}
      desktopWidth={520}
      actions={{
        primary: (
          <Button type="submit" form={FORM_ID} loading={pending} loadingText={t('support.sending')}>
            {t('support.send')}
          </Button>
        ),
        secondary: (
          <Button type="button" variant="outline" onClick={close} disabled={pending}>
            {t('common.cancel')}
          </Button>
        ),
      }}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label htmlFor="subject" className={labelCls}>
            {t('support.subject')}
          </label>
          <Input
            id="subject"
            {...register('subject')}
            placeholder={t('support.subjectPlaceholder')}
            disabled={pending}
          />
          {errors.subject && (
            <p className="ml-0.5 mt-1.5 text-xs text-destructive">{errors.subject.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className={labelCls}>
            {t('support.message')}
          </label>
          <Textarea
            id="message"
            {...register('message')}
            placeholder={t('support.messagePlaceholder')}
            rows={6}
            disabled={pending}
          />
          {errors.message && (
            <p className="ml-0.5 mt-1.5 text-xs text-destructive">{errors.message.message}</p>
          )}
        </div>
      </form>
    </GlassDialog>
  )
}
