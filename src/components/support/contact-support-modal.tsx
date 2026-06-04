import { useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSendSupportMessage } from '@/hooks/support/use-support'
import { toast } from 'sonner'

interface ContactSupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// NOTE: messages below reuse the existing hardcoded English strings that were
// previously rendered inline (no i18n keys exist for them).
const createSupportSchema = () =>
  z.object({
    subject: z
      .string()
      .min(1, 'Subject is required (max 200 characters)')
      .max(200, 'Subject is required (max 200 characters)'),
    message: z
      .string()
      .min(1, 'Message is required (max 5000 characters)')
      .max(5000, 'Message is required (max 5000 characters)'),
  })

type SupportFormData = z.infer<ReturnType<typeof createSupportSchema>>

export function ContactSupportModal({ open, onOpenChange }: ContactSupportModalProps) {
  const { t } = useTranslation()
  const schema = useMemo(() => createSupportSchema(), [])
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<SupportFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: '',
      message: '',
    },
  })

  const sendSupportMessage = useSendSupportMessage()

  const onSubmit = async (data: SupportFormData) => {
    try {
      await sendSupportMessage.mutateAsync(data)
      toast.success(t('support.success'))
      onOpenChange(false)
      reset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('support.error')
      toast.error(t('support.error'), {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('support.title')}</DialogTitle>
          <DialogDescription>{t('support.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{t('support.subject')}</Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder={t('support.subjectPlaceholder')}
              disabled={isSubmitting}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t('support.message')}</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder={t('support.messagePlaceholder')}
              rows={6}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || sendSupportMessage.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || sendSupportMessage.isPending}
            >
              {isSubmitting || sendSupportMessage.isPending
                ? t('support.sending')
                : t('support.send')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
