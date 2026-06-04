import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { Checkbox } from '@/components/glass/glass'
import { StarPicker } from '@/components/settings/primitives'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useMyRating, useSubmitRating } from '@/hooks/ratings/use-ratings'
import { toast } from 'sonner'

interface RateAppModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RateAppModal({ open, onOpenChange }: RateAppModalProps) {
  const { t } = useTranslation()
  const { data: existingRating } = useMyRating()
  const submitRating = useSubmitRating()

  const [rating, setRating] = useState(0)
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    // Prefill the form from the user's existing rating (or reset) each time the modal opens.
    if (open && existingRating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRating(existingRating.rating)
      setDescription(existingRating.description || '')
      setIsPublic(existingRating.isPublic)
    } else if (open) {
      setRating(0)
      setDescription('')
      setIsPublic(false)
    }
  }, [open, existingRating])

  const handleSubmit = async () => {
    if (rating === 0) return

    try {
      await submitRating.mutateAsync({ rating, description: description || undefined, isPublic })
      toast.success(existingRating ? t('rating.updated') : t('rating.success'))
      onOpenChange(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('rating.error')
      toast.error(t('rating.error'), { description: errorMessage })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <GlassDialog
      open={open}
      onOpenChange={handleClose}
      title={t('rating.title')}
      description={t('rating.description')}
      desktopWidth={480}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={submitRating.isPending}
            className="order-2 w-full sm:order-1 sm:w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={rating === 0 || submitRating.isPending}
            className="order-1 w-full sm:order-2 sm:w-auto"
          >
            {submitRating.isPending
              ? t('rating.submitting')
              : existingRating
                ? t('rating.update')
                : t('rating.submit')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-2.5 text-center text-sm font-semibold">{t('rating.ratingLabel')}</p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        <div>
          <label
            htmlFor="rating-description"
            className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground"
          >
            {t('rating.descriptionLabel')}
          </label>
          <div className="relative">
            <Textarea
              id="rating-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('rating.descriptionPlaceholder')}
              rows={4}
              maxLength={1000}
              disabled={submitRating.isPending}
              className="resize-none rounded-[14px] pb-6"
            />
            <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-fg-faint">
              {description.length}/1000
            </span>
          </div>
        </div>

        <label className="flex cursor-pointer select-none items-center gap-2.5">
          <Checkbox
            checked={isPublic}
            onChange={(e) => setIsPublic((e.target as HTMLInputElement).checked)}
            disabled={submitRating.isPending}
          />
          <span className="text-sm text-muted-foreground">{t('rating.allowPublic')}</span>
        </label>
      </div>
    </GlassDialog>
  )
}
