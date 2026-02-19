import { useEffect } from 'react'
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
import { useAddContribution } from '@/hooks/savings/use-savings'
import { toast } from 'sonner'

interface ContributionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalId: string
  goalCurrency: string
}

interface ContributionFormData {
  amount: number
  note: string
}

export function ContributionModal({ open, onOpenChange, goalId, goalCurrency }: ContributionModalProps) {
  const { t } = useTranslation()
  const addContribution = useAddContribution(goalId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContributionFormData>({
    defaultValues: { amount: 0, note: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ amount: 0, note: '' })
    }
  }, [open, reset])

  const onSubmit = async (data: ContributionFormData) => {
    try {
      await addContribution.mutateAsync({
        amount: Number(data.amount),
        currency: goalCurrency,
        note: data.note.trim() || undefined,
      })
      toast.success(t('savings.contributions.added'))
      onOpenChange(false)
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('savings.contributionModal.title')}</DialogTitle>
          <DialogDescription>{t('savings.contributionModal.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              {t('savings.contributionModal.amount')} ({goalCurrency})
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              {...register('amount', { required: true, min: 0.01, valueAsNumber: true })}
            />
            {errors.amount && <p className="text-xs text-destructive">{t('common.required')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">{t('savings.contributionModal.note')}</Label>
            <Textarea
              id="note"
              {...register('note', { maxLength: 500 })}
              placeholder={t('savings.contributionModal.notePlaceholder')}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={addContribution.isPending}>
              {t('savings.contributionModal.add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
