import { useState, useEffect } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMyRating, useSubmitRating } from '@/hooks/ratings/use-ratings'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RateAppModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RateAppModal({ open, onOpenChange }: RateAppModalProps) {
  const { t } = useTranslation()
  const { data: existingRating } = useMyRating()
  const submitRating = useSubmitRating()

  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    if (open && existingRating) {
      setRating(existingRating.rating)
      setDescription(existingRating.description || '')
      setIsPublic(existingRating.isPublic)
    } else if (open) {
      setRating(0)
      setDescription('')
      setIsPublic(false)
    }
  }, [open, existingRating])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  const displayRating = hoveredRating || rating

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('rating.title')}</DialogTitle>
          <DialogDescription>{t('rating.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('rating.ratingLabel')}</Label>
            <div className="flex gap-1 justify-center py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      star <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating-description">{t('rating.descriptionLabel')}</Label>
            <Textarea
              id="rating-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('rating.descriptionPlaceholder')}
              rows={4}
              maxLength={1000}
              disabled={submitRating.isPending}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
              disabled={submitRating.isPending}
            />
            <span className="text-sm text-muted-foreground">{t('rating.allowPublic')}</span>
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitRating.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={rating === 0 || submitRating.isPending}
            >
              {submitRating.isPending
                ? t('rating.submitting')
                : existingRating
                  ? t('rating.update')
                  : t('rating.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
