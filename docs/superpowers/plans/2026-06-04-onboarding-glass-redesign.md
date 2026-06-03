# Onboarding "Glass" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the first-run onboarding modal onto the Glass design system — desktop centered glass dialog, mobile slide-up bottom sheet — keeping the exact props/state/i18n/localStorage contract.

**Architecture:** Compose Radix Dialog primitives directly (scrim + focus-trap + Esc) with a custom dim/blur overlay and two Framer-Motion-animated shells (centered card / bottom sheet) chosen by a media query. Shared inner content (dots → icon tile → title → description → tip → nav). Adds a reusable `IconTile` primitive + `.icon-tile-*` tints + `--brand-pink` + an `.onboarding-emerald` accent lock.

**Tech Stack:** React 19, TypeScript (strict), `@radix-ui/react-dialog`, `framer-motion` (already installed — no `vaul`), Tailwind v4, lucide-react, i18next.

**Verification note:** No component-unit-test harness exists in this repo (Playwright E2E only, not wired to this modal). Per-task verification is `npm run build`; final verification is the preview-screenshot matrix (6 steps × mobile/desktop × light/dark) + behavior checks.

---

### Task 1: Tokens + CSS foundation (`src/index.css`)

**Files:**
- Modify: `receipto-frontend/src/index.css` (brand block ~525–530; `.auth-emerald` rule ~535–546; append icon-tile block at EOF)

- [ ] **Step 1: Add `--brand-pink` to the brand block**

In the `:root` brand block, after `--brand-violet`:

```css
  --brand-pink: oklch(0.7 0.2 350);
```

(No dark variant needed — like emerald/cyan/violet, the `.icon-tile-*` tints recompute L/C via `oklch(from …)` and only carry the hue.)

- [ ] **Step 2: Fold `.onboarding-emerald` into the existing `.auth-emerald` rule**

Change the two rule headers (light + dark) to selector lists — values unchanged:

```css
.auth-emerald,
.onboarding-emerald {
  --primary: oklch(0.55 0.16 165);
  --primary-foreground: oklch(0.99 0 0);
  --primary-soft: oklch(0.95 0.04 165);
  --ring: oklch(0.55 0.16 165);
}
.dark .auth-emerald,
.dark .onboarding-emerald {
  --primary: oklch(0.78 0.15 165);
  --primary-foreground: oklch(0.16 0.02 260);
  --primary-soft: oklch(0.3 0.06 165);
  --ring: oklch(0.78 0.15 165);
}
```

- [ ] **Step 3: Append the icon-tile tint classes at EOF**

```css
/* ============================================
   ACCENT-TINTED ICON TILE
   Soft brand-tinted square. Consumed by the IconTile
   primitive (onboarding now; dashboard later).
   ============================================ */
.icon-tile-emerald { background: oklch(from var(--brand-emerald) 0.94 0.05 h); color: oklch(from var(--brand-emerald) 0.45 c h); }
.icon-tile-cyan    { background: oklch(from var(--brand-cyan) 0.94 0.05 h);    color: oklch(from var(--brand-cyan) 0.42 c h); }
.icon-tile-violet  { background: oklch(from var(--brand-violet) 0.94 0.05 h);  color: oklch(from var(--brand-violet) 0.48 c h); }
.icon-tile-pink    { background: oklch(from var(--brand-pink) 0.94 0.05 h);    color: oklch(from var(--brand-pink) 0.48 c h); }
.icon-tile-info    { background: var(--info-soft);                             color: oklch(from var(--info) 0.45 c h); }
.icon-tile-primary { background: var(--primary-soft);                          color: var(--primary); }
.dark .icon-tile-emerald { background: oklch(from var(--brand-emerald) 0.3 0.06 h); color: oklch(from var(--brand-emerald) 0.82 0.1 h); }
.dark .icon-tile-cyan    { background: oklch(from var(--brand-cyan) 0.3 0.06 h);    color: oklch(from var(--brand-cyan) 0.82 0.1 h); }
.dark .icon-tile-violet  { background: oklch(from var(--brand-violet) 0.3 0.06 h);  color: oklch(from var(--brand-violet) 0.84 0.1 h); }
.dark .icon-tile-pink    { background: oklch(from var(--brand-pink) 0.3 0.06 h);    color: oklch(from var(--brand-pink) 0.84 0.1 h); }
.dark .icon-tile-info    { background: oklch(from var(--info) 0.3 0.06 h);          color: oklch(from var(--info) 0.84 0.08 h); }
.dark .icon-tile-primary { color: oklch(from var(--primary) calc(l + 0.06) c h); }
```

- [ ] **Step 4: Build** — `cd receipto-frontend && npm run build` → Expected: PASS (CSS compiles; no TS yet).

---

### Task 2: `IconTile` primitive (`src/components/glass/glass.tsx`)

**Files:**
- Modify: `receipto-frontend/src/components/glass/glass.tsx` (append; `LucideIcon` already imported line 3)

- [ ] **Step 1: Append the primitive + accent type**

```tsx
/* ------------------------------------------------------------------ */
/* Accent-tinted icon tile (soft brand tint; reusable across screens)  */
/* ------------------------------------------------------------------ */
export type IconTileAccent = 'emerald' | 'cyan' | 'violet' | 'pink' | 'info' | 'primary'

export function IconTile({
  icon: Icon,
  accent,
  size = 34,
  className,
}: {
  icon: LucideIcon
  accent: IconTileAccent
  size?: number
  className?: string
}) {
  return (
    <div className={cn('grid size-[72px] place-items-center rounded-3xl', `icon-tile-${accent}`, className)}>
      <Icon style={{ width: size, height: size }} strokeWidth={2} />
    </div>
  )
}
```

- [ ] **Step 2: Build** — `npm run build` → Expected: PASS.

---

### Task 3: Rewrite the onboarding modal (`src/components/onboarding/onboarding-modal.tsx`)

**Files:**
- Overwrite: `receipto-frontend/src/components/onboarding/onboarding-modal.tsx`

- [ ] **Step 1: Replace the file with the Glass implementation**

```tsx
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

function GradientPill({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-brand inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[15px] font-semibold"
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
      {step === 0 ? <LanguageStep language={language} onSelect={setLanguage} /> : <FeatureStep def={STEPS[step - 1]} />}
      <div className="mt-6 flex w-full items-center justify-between gap-3">
        {step === 0 ? (
          <Button variant="ghost" size="sm" onClick={complete} className="text-muted-foreground">
            {t('onboarding.skip')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={handlePrev} className="gap-1">
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
```

- [ ] **Step 2: Build** — `npm run build` → Expected: PASS (tsc strict + vite).

- [ ] **Step 3: Commit**

```bash
cd receipto-frontend
git add src/index.css src/components/glass/glass.tsx src/components/onboarding/onboarding-modal.tsx docs/superpowers
git commit -m "feat(onboarding): migrate first-run modal to Glass design system"
```

---

### Task 4: Preview verification (free port 5180)

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server** on `--port 5180 --strictPort` (5173 is a different project on this machine).
- [ ] **Step 2:** Force the modal open (clear `localStorage['receipto-onboarding-completed']`, or temporarily toggle `isOnboardingOpen`) and screenshot **all 6 steps** at mobile (390w) and desktop (≥640w), in **light and dark**.
- [ ] **Step 3: Behavior checks** —
  - Skip (step 0) and Get Started (last) set `localStorage['receipto-onboarding-completed']='true'` and close.
  - Next/Back move through steps; dots animate the active pill width.
  - Selecting a language highlights the card, writes `language` to the settings store, live-switches copy, and does **not** advance.
  - Scrim-tap and Esc close the modal.
- [ ] **Step 4:** Fix any visual/behavioral gaps in the source, rebuild, re-screenshot.

---

### Task 5: Docs + push

**Files:**
- Modify: `receipto-frontend/docs/design-system.md`

- [ ] **Step 1:** Document `IconTile` (primitive table), the `.icon-tile-*` classes (component-classes section), `--brand-pink`, and the `.onboarding-emerald` lock (accent-lock note). Mark onboarding as migrated.
- [ ] **Step 2: Commit & push**

```bash
cd receipto-frontend
git add docs/design-system.md
git commit -m "docs(design-system): document IconTile, icon-tile tints, onboarding-emerald"
git push origin feature/redesign-main-branch   # pre-push build hook runs
```

---

## Self-Review

- **Spec coverage:** shell (desktop dialog + mobile sheet) ✓ T3; scrim ✓ T3; dots ✓ T3; IconTile ✓ T2; tints + brand-pink + emerald lock ✓ T1; language step ✓ T3; nav + gradient pill ✓ T3; reduced-motion ✓ T3; safe-area ✓ T3; contract/localStorage/i18n preserved ✓ T3; docs ✓ T5; verification ✓ T4.
- **Placeholder scan:** none — all steps contain real code/commands.
- **Type consistency:** `IconTileAccent` (T2) is the single source for `accent` used in `STEPS` and `IconTile` (T3); `StepDef`, `SHEET_EASE`, `TOTAL_STEPS` defined once and used consistently.
