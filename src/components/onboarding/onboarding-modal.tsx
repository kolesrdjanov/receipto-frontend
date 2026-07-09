import { type ReactNode, useState } from 'react'
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
  Share,
  SquarePlus,
  ShieldCheck,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo, LogoMark } from '@/components/ui/logo'
import { useSettingsStore, type Language } from '@/store/settings'

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tour layout — `spotlight` centers the preview with the copy beneath it;
   *  `side` places preview and copy side-by-side on desktop. */
  variant?: 'spotlight' | 'side'
}

/* ------------------------------------------------------------------ */
/* Step previews — large monochrome illustrations composed from Luma   */
/* primitives. Decorative sample data only (numbers + proper nouns),   */
/* so nothing here needs translation.                                  */
/* ------------------------------------------------------------------ */

function PreviewShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none mx-auto w-full select-none rounded-2xl border border-border bg-card p-5 text-left shadow-glass-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Install — a phone frame with the app icon on the home screen. */
function InstallPreview() {
  return (
    <div
      aria-hidden
      className="pointer-events-none mx-auto w-[228px] select-none rounded-[36px] border border-border bg-card p-3 shadow-glass-2"
    >
      <div className="flex flex-col items-center rounded-[26px] bg-bg-subtle px-4 pb-7 pt-4">
        <div className="h-1.5 w-14 rounded-full bg-border-strong" />
        <LogoMark className="mt-9 size-16" />
        <span className="mt-3 text-[13px] font-semibold text-foreground">Receipto</span>
        <div className="mt-9 flex w-full items-center justify-center gap-5 rounded-xl border border-border bg-card py-2.5 text-muted-foreground">
          <Share className="size-4" />
          <SquarePlus className="size-4" />
          <Smartphone className="size-4" />
        </div>
      </div>
    </div>
  )
}

/** Track expenses — a QR-scanned expense with line items and the total. */
function ExpensePreview({ totalLabel }: { totalLabel: string }) {
  const items = [
    { emoji: '🥛', name: 'Mleko 2.8%', amount: '179' },
    { emoji: '🍞', name: 'Hleb beli', amount: '89' },
    { emoji: '☕', name: 'Kafa mlevena', amount: '549' },
  ]
  return (
    <PreviewShell className="max-w-[340px]">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg-subtle text-[20px]">🛒</span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-foreground">Maxi</div>
          <div className="text-[12.5px] text-muted-foreground">QR · 09:41</div>
        </div>
        <QrCode className="size-4 shrink-0 text-fg-faint" />
      </div>
      <div className="my-4 border-t border-dashed border-border" />
      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2.5">
            <span className="text-[15px] leading-none">{item.emoji}</span>
            <span className="flex-1 truncate text-[13px] text-muted-foreground">{item.name}</span>
            <span className="text-[13px] font-semibold text-foreground">{item.amount}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {totalLabel}
        </span>
        <span className="text-[20px] font-bold tracking-[-0.01em] text-foreground">RSD 1.240</span>
      </div>
    </PreviewShell>
  )
}

/** Categories — monthly budget bars. */
function CategoriesPreview() {
  const rows = [
    { emoji: '🛒', name: 'Namirnice', amount: 'RSD 14.280', pct: 74 },
    { emoji: '🚌', name: 'Prevoz', amount: 'RSD 8.890', pct: 48 },
    { emoji: '🍽️', name: 'Restorani', amount: 'RSD 6.250', pct: 31 },
  ]
  return (
    <PreviewShell className="flex max-w-[340px] flex-col gap-4">
      {rows.map((row) => (
        <div key={row.name} className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg-subtle text-[17px]">
            {row.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="truncate text-[13.5px] font-semibold text-foreground">{row.name}</span>
              <span className="shrink-0 text-[12px] font-semibold text-muted-foreground">{row.amount}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
              <div className="h-full rounded-full bg-foreground" style={{ width: `${row.pct}%` }} />
            </div>
          </div>
        </div>
      ))}
    </PreviewShell>
  )
}

/** Warranties — a warranty card with its coverage bar. */
function WarrantyPreview() {
  return (
    <PreviewShell className="max-w-[340px]">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg-subtle text-[20px]">📺</span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-foreground">Samsung TV 55&quot;</div>
          <div className="text-[12.5px] text-muted-foreground">Tehnomanija</div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-primary-foreground">
          <ShieldCheck className="size-3" />
          2027
        </span>
      </div>
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-fg-faint">
          <span>03/2025</span>
          <span className="font-bold text-foreground">68%</span>
          <span>03/2027</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
          <div className="h-full rounded-full bg-foreground" style={{ width: '68%' }} />
        </div>
      </div>
    </PreviewShell>
  )
}

/** Groups — the balance card with settle rows. */
function GroupsPreview({ settleLabel }: { settleLabel: string }) {
  const rows = [
    { initials: 'JP', name: 'Jelena', amount: 'RSD 700' },
    { initials: 'SM', name: 'Stefan', amount: 'RSD 700' },
  ]
  return (
    <PreviewShell className="max-w-[340px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Weekend Trip
        </span>
        <span className="text-[22px] font-bold tracking-[-0.02em] text-foreground">+ RSD 1.400</span>
      </div>
      <div className="mt-4 flex flex-col">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-2.5 border-t border-border py-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-bg-subtle text-[11px] font-bold text-foreground">
              {row.initials}
            </span>
            <span className="flex-1 truncate text-[13.5px] font-semibold text-foreground">{row.name}</span>
            <span className="text-[13px] font-bold text-foreground">{row.amount}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground">
        <ArrowLeftRight className="size-3.5" />
        {settleLabel}
      </div>
    </PreviewShell>
  )
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

interface StepDef {
  key: string
  icon: LucideIcon
  preview: (t: (k: string) => string) => ReactNode
}

const STEPS: StepDef[] = [
  { key: 'installApp', icon: Smartphone, preview: () => <InstallPreview /> },
  { key: 'step1', icon: QrCode, preview: (t) => <ExpensePreview totalLabel={t('receipts.total')} /> },
  { key: 'step2', icon: FolderOpen, preview: () => <CategoriesPreview /> },
  { key: 'step3', icon: Shield, preview: () => <WarrantyPreview /> },
  { key: 'step4', icon: Users, preview: (t) => <GroupsPreview settleLabel={t('groups.settlements.title')} /> },
]

const TOTAL_STEPS = STEPS.length + 1 // + language step

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

function LanguagePicker({ language, onSelect }: { language: Language; onSelect: (l: Language) => void }) {
  return (
    <div className="mx-auto grid w-full max-w-[420px] grid-cols-2 gap-3">
      <LangCard primary="English" secondary="Engleski" selected={language === 'en'} onClick={() => onSelect('en')} />
      <LangCard primary="Srpski" secondary="Serbian" selected={language === 'sr'} onClick={() => onSelect('sr')} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Full-screen guided tour                                             */
/* ------------------------------------------------------------------ */

export function OnboardingModal({ open, onOpenChange, variant = 'spotlight' }: OnboardingModalProps) {
  const { t } = useTranslation()
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const [step, setStep] = useState(0)
  const reduceMotion = useReducedMotion()

  const isLast = step === TOTAL_STEPS - 1
  const isLanguage = step === 0
  const def = isLanguage ? null : STEPS[step - 1]
  const a11yTitle = isLanguage ? 'Choose Your Language' : t(`onboarding.${def!.key}.title`)
  const tip = def ? t(`onboarding.${def.key}.tip`, { defaultValue: '' }) : ''

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

  const copy = (
    <div className={cn('flex flex-col', variant === 'side' ? 'items-start text-left' : 'items-center text-center')}>
      {isLanguage ? (
        <>
          <h2 className="t-h1">Choose Your Language</h2>
          <p className="t-sm mt-1.5 text-muted-foreground">Izaberite jezik</p>
        </>
      ) : (
        <>
          <h2 className="t-h1 text-balance">{t(`onboarding.${def!.key}.title`)}</h2>
          <p className="t-body mt-3 max-w-[42ch] text-muted-foreground">
            {t(`onboarding.${def!.key}.description`)}
          </p>
          {tip && (
            <div className="mt-5 flex w-full max-w-[420px] items-start gap-2.5 rounded-xl bg-bg-subtle px-3.5 py-3 text-left">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-foreground" />
              <span className="text-[12.5px] leading-[1.45] text-muted-foreground">{tip}</span>
            </div>
          )}
        </>
      )}
    </div>
  )

  const preview = isLanguage ? (
    <LanguagePicker language={language} onSelect={setLanguage} />
  ) : (
    def!.preview(t)
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence onExitComplete={() => setStep(0)}>
        {open && (
          <DialogPrimitive.Portal forceMount key="onboarding">
            <DialogPrimitive.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                className="fixed inset-0 z-50 flex flex-col bg-background"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              >
                <DialogPrimitive.Title className="sr-only">{a11yTitle}</DialogPrimitive.Title>

                {/* Top bar — logo · step counter · persistent Skip */}
                <header className="mx-auto flex w-full max-w-[1080px] items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
                  <Logo size="sm" />
                  <div className="flex items-center gap-2.5">
                    <span className="text-[13px] font-semibold tabular-nums text-muted-foreground">
                      {step + 1} / {TOTAL_STEPS}
                    </span>
                    {!isLast && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={complete}
                        className="rounded-full text-muted-foreground hover:text-foreground"
                      >
                        {t('onboarding.skip')}
                      </Button>
                    )}
                  </div>
                </header>

                {/* Progress bar */}
                <div className="mx-auto mt-4 w-full max-w-[1080px] px-5 sm:px-8">
                  <div
                    role="progressbar"
                    aria-valuemin={1}
                    aria-valuemax={TOTAL_STEPS}
                    aria-valuenow={step + 1}
                    className="h-1 overflow-hidden rounded-full bg-subtle"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Step content */}
                <main className="grid flex-1 place-items-center overflow-y-auto px-5 py-8 sm:px-8">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={step}
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -28 }}
                      transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeOut' }}
                      className={cn(
                        'w-full',
                        variant === 'side' && !isLanguage
                          ? 'grid max-w-[880px] items-center gap-10 md:grid-cols-2 md:gap-14'
                          : 'flex max-w-[560px] flex-col items-center gap-8',
                      )}
                    >
                      <div className="w-full">{preview}</div>
                      {copy}
                    </motion.div>
                  </AnimatePresence>
                </main>

                {/* Footer — Back · Next / Get started */}
                <footer className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
                  <div>
                    {step > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handlePrev}
                        className="h-11 gap-2 rounded-full px-[18px] text-[15px] font-semibold text-foreground hover:bg-bg-subtle"
                      >
                        <ChevronLeft className="size-4" />
                        {t('common.back')}
                      </Button>
                    )}
                  </div>
                  {isLast ? (
                    <Button
                      type="button"
                      variant="default"
                      onClick={complete}
                      className="h-11 gap-2 rounded-full px-[22px] text-[15px] font-semibold"
                    >
                      {t('onboarding.getStarted')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleNext}
                      className="h-11 gap-2 rounded-full px-[22px] text-[15px] font-semibold"
                    >
                      {t('common.next')}
                      <ChevronRight className="size-4" />
                    </Button>
                  )}
                </footer>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
