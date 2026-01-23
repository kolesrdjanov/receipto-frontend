import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  QrCode,
  FolderOpen,
  Shield,
  Users,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TOTAL_STEPS = 4

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('receipto-onboarding-completed', 'true')
    onOpenChange(false)
    setStep(1)
  }

  const handleSkip = () => {
    localStorage.setItem('receipto-onboarding-completed', 'true')
    onOpenChange(false)
    setStep(1)
  }

  const steps = [
    {
      icon: QrCode,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: FolderOpen,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Shield,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    // {
    //   icon: TrendingUp,
    //   color: 'text-rose-500',
    //   bgColor: 'bg-rose-500/10',
    // },
  ]

  const currentStep = steps[step - 1]
  const Icon = currentStep.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center px-2 py-4">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  index + 1 === step
                    ? 'w-6 bg-primary'
                    : index + 1 < step
                      ? 'w-1.5 bg-primary/60'
                      : 'w-1.5 bg-muted'
                )}
              />
            ))}
          </div>

          {/* Icon */}
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
              currentStep.bgColor
            )}
          >
            <Icon className={cn('w-8 h-8', currentStep.color)} />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold mb-2">
            {t(`onboarding.step${step}.title`)}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
            {t(`onboarding.step${step}.description`)}
          </p>

          {/* Tip (if exists) */}
          {t(`onboarding.step${step}.tip`, { defaultValue: '' }) && (
            <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3 mb-6 text-left w-full">
              <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t(`onboarding.step${step}.tip`)}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between w-full gap-3">
            {step > 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('common.back')}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                {t('onboarding.skip')}
              </Button>
            )}

            {step < TOTAL_STEPS ? (
              <Button onClick={handleNext} className="gap-1">
                {t('common.next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                {t('onboarding.getStarted')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
