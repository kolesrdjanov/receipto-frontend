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

type SupportFormData = {
  subject: string
  message: string
}

export function ContactSupportModal({ open, onOpenChange }: ContactSupportModalProps) {
  const { t } = useTranslation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<SupportFormData>({
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
              {...register('subject', {
                required: true,
                maxLength: 200,
              })}
              placeholder={t('support.subjectPlaceholder')}
              disabled={isSubmitting}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">Subject is required (max 200 characters)</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t('support.message')}</Label>
            <Textarea
              id="message"
              {...register('message', {
                required: true,
                maxLength: 5000,
              })}
              placeholder={t('support.messagePlaceholder')}
              rows={6}
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-sm text-destructive">Message is required (max 5000 characters)</p>
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
