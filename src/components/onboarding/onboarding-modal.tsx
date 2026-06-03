import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { IconTile, type IconTileAccent } from '@/components/glass/glass'
import { useSettingsStore, type Language } from '@/store/settings'

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface StepDef {
  key: string
  icon: LucideIcon
  accent: IconTileAccent
}

const STEPS: StepDef[] = [
  { key: 'installApp', icon: Smartphone, accent: 'violet' },
  { key: 'step1', icon: QrCode, accent: 'emerald' },
  { key: 'step2', icon: FolderOpen, accent: 'cyan' },
  { key: 'step3', icon: Shield, accent: 'info' },
  { key: 'step4', icon: Users, accent: 'pink' },
]

const TOTAL_STEPS = STEPS.length + 1 // + language step
const SHEET_EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// Shared nav-button geometry/type (handoff `.btn`): ghost Back/Skip and the
// gradient Next/Get-Started match in size/weight/shape — only the fill differs.
const NAV_BTN = 'h-11 gap-2 rounded-full px-[18px] text-[15px] font-semibold'

/** Desktop = centered glass dialog; mobile = bottom sheet. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

function StepDots({ active }: { active: number }) {
  return (
    <div className="mb-[22px] flex items-center justify-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i === active ? 'w-6 bg-primary' : i < active ? 'w-1.5 bg-primary/55' : 'w-1.5 bg-border',
          )}
        />
      ))}
    </div>
  )
}

function FeatureStep({ def }: { def: StepDef }) {
  const { t } = useTranslation()
  const tip = t(`onboarding.${def.key}.tip`, { defaultValue: '' })
  return (
    <>
      <IconTile icon={def.icon} accent={def.accent} className="mb-5" />
      <h2 className="t-h2">{t(`onboarding.${def.key}.title`)}</h2>
      <p className="t-body mt-2.5 max-w-[304px] text-muted-foreground">
        {t(`onboarding.${def.key}.description`)}
      </p>
      {tip && (
        <div className="mt-[18px] flex w-full items-start gap-2.5 rounded-xl bg-bg-subtle px-3.5 py-3 text-left">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-warning" />
          <span className="text-[12.5px] leading-[1.45] text-muted-foreground">{tip}</span>
        </div>
      )}
    </>
  )
}

function LangCard({
  primary,
  secondary,
  selected,
  onClick,
}: {
  primary: string
  secondary: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-[18px] transition-[border-color,background-color,box-shadow]',
        selected
          ? 'border-primary bg-primary-soft ring-4 ring-primary/15'
          : 'border-border bg-card hover:border-primary/50',
      )}
    >
      <span className="text-[17px] font-bold leading-none">{primary}</span>
      <span className="text-xs text-muted-foreground">{secondary}</span>
      <span className="mt-1 flex h-4 items-center justify-center">
        {selected && <Check className="size-4 text-primary" strokeWidth={3} />}
      </span>
    </button>
  )
}

function LanguageStep({ language, onSelect }: { language: Language; onSelect: (l: Language) => void }) {
  return (
    <>
      <IconTile icon={Globe} accent="primary" size={32} className="mb-[18px]" />
      <h2 className="t-h2">Choose Your Language</h2>
      <p className="t-sm mt-1 text-muted-foreground">Izaberite jezik</p>
      <div className="mt-[22px] grid w-full grid-cols-2 gap-3">
        <LangCard primary="English" secondary="Engleski" selected={language === 'en'} onClick={() => onSelect('en')} />
        <LangCard primary="Srpski" secondary="Serbian" selected={language === 'sr'} onClick={() => onSelect('sr')} />
      </div>
    </>
  )
}

/** Brand-gradient nav CTA — auto-width pill (not the full-width GradientButton). */
function GradientPill({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('btn-brand inline-flex items-center justify-center', NAV_BTN)}
    >
      {children}
    </button>
  )
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { t } = useTranslation()
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const [step, setStep] = useState(0)
  const isDesktop = useIsDesktop()
  const reduceMotion = useReducedMotion()

  const isLast = step === TOTAL_STEPS - 1
  const a11yTitle = step === 0 ? 'Choose Your Language' : t(`onboarding.${STEPS[step - 1].key}.title`)

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1)
  }
  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }
  const complete = () => {
    localStorage.setItem('receipto-onboarding-completed', 'true')
    onOpenChange(false)
  }

  const body = (
    <div className="flex flex-col items-center text-center">
      <StepDots active={step} />
      {step === 0 ? (
        <LanguageStep language={language} onSelect={setLanguage} />
      ) : (
        <FeatureStep def={STEPS[step - 1]} />
      )}
      <div className="mt-6 flex w-full items-center justify-between gap-3">
        {step === 0 ? (
          <Button
            variant="ghost"
            onClick={complete}
            className={cn(NAV_BTN, 'text-muted-foreground hover:bg-bg-subtle hover:text-foreground')}
          >
            {t('onboarding.skip')}
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={handlePrev}
            className={cn(NAV_BTN, 'text-foreground hover:bg-bg-subtle')}
          >
            <ChevronLeft className="size-4" />
            {t('common.back')}
          </Button>
        )}
        {isLast ? (
          <GradientPill onClick={complete}>{t('onboarding.getStarted')}</GradientPill>
        ) : (
          <GradientPill onClick={handleNext}>
            {t('common.next')}
            <ChevronRight className="size-4" />
          </GradientPill>
        )}
      </div>
    </div>
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence onExitComplete={() => setStep(0)}>
        {open && (
          <DialogPrimitive.Portal forceMount key="onboarding">
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.45)] backdrop-blur-[5px] dark:bg-[oklch(0_0_0/0.55)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div
                className={cn(
                  'onboarding-emerald pointer-events-none fixed inset-0 z-50 flex',
                  isDesktop ? 'items-center justify-center p-4' : 'items-end justify-center',
                )}
              >
                {isDesktop ? (
                  <motion.div
                    key="desktop"
                    className="glass-card pointer-events-auto w-[432px] max-w-[calc(100%-2rem)] px-[26px] py-[30px]"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                  >
                    <DialogPrimitive.Title className="sr-only">{a11yTitle}</DialogPrimitive.Title>
                    {body}
                  </motion.div>
                ) : (
                  <motion.div
                    key="mobile"
                    className="glass-card pointer-events-auto w-full px-[26px] pt-3 pb-[calc(30px+env(safe-area-inset-bottom))]"
                    style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ duration: reduceMotion ? 0 : 0.3, ease: SHEET_EASE }}
                  >
                    <DialogPrimitive.Title className="sr-only">{a11yTitle}</DialogPrimitive.Title>
                    <div className="mx-auto mb-4 h-[5px] w-9 rounded-full bg-border" />
                    {body}
                  </motion.div>
                )}
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
