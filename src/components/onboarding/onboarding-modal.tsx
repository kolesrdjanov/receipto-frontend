import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Smartphone,
  QrCode,
  FolderOpen,
  Shield,
  Users,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettingsStore, type Language } from '@/store/settings'

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { t } = useTranslation()
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const [step, setStep] = useState(0)

  const steps = [
    {
      key: 'installApp',
      icon: Smartphone,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      key: 'step1',
      icon: QrCode,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      key: 'step2',
      icon: FolderOpen,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      key: 'step3',
      icon: Shield,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      key: 'step4',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ] as const

  const totalSteps = steps.length + 1 // +1 for language step

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('receipto-onboarding-completed', 'true')
    onOpenChange(false)
    setStep(0)
  }

  const handleSkip = () => {
    localStorage.setItem('receipto-onboarding-completed', 'true')
    onOpenChange(false)
    setStep(0)
  }

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
  }

  // Step indicator dots (shared between all steps)
  const stepDots = (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            index === step
              ? 'w-6 bg-primary'
              : index < step
                ? 'w-1.5 bg-primary/60'
                : 'w-1.5 bg-muted'
          )}
        />
      ))}
    </div>
  )

  // Language selection step (step 0)
  if (step === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center px-2 py-4">
            {stepDots}

            {/* Globe icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary/10">
              <Globe className="w-8 h-8 text-primary" />
            </div>

            {/* Bilingual title — always shows both languages */}
            <h2 className="text-xl font-semibold mb-1">Choose Your Language</h2>
            <p className="text-sm text-muted-foreground mb-6">Izaberite jezik</p>

            {/* Language cards */}
            <div className="grid grid-cols-2 gap-3 w-full mb-6">
              <button
                onClick={() => handleLanguageSelect('en')}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all',
                  language === 'en'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="text-lg font-semibold">English</span>
                <span className="text-xs text-muted-foreground">Engleski</span>
                {language === 'en' && (
                  <Check className="w-4 h-4 text-primary mt-1" />
                )}
              </button>

              <button
                onClick={() => handleLanguageSelect('sr')}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all',
                  language === 'sr'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="text-lg font-semibold">Srpski</span>
                <span className="text-xs text-muted-foreground">Serbian</span>
                {language === 'sr' && (
                  <Check className="w-4 h-4 text-primary mt-1" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between w-full gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                {t('onboarding.skip')}
              </Button>
              <Button onClick={handleNext} className="gap-1">
                {t('common.next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Regular steps (step 1-5, index into steps array with step-1)
  const currentStep = steps[step - 1]
  const Icon = currentStep.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center px-2 py-4">
          {stepDots}

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
            {t(`onboarding.${currentStep.key}.title`)}
          </h2>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
            {t(`onboarding.${currentStep.key}.description`)}
          </p>

          {/* Tip (if exists) */}
          {t(`onboarding.${currentStep.key}.tip`, { defaultValue: '' }) && (
            <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3 mb-6 text-left w-full">
              <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t(`onboarding.${currentStep.key}.tip`)}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between w-full gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>

            {step < totalSteps - 1 ? (
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
