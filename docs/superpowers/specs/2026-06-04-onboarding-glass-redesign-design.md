# Onboarding "Glass" Redesign — Design

**Date:** 2026-06-04
**Branch:** `feature/redesign-main-branch`
**Status:** Approved design — ready for implementation plan
**Cycle:** Screen migration #2 (after Phase 0 foundation; first screen cycle after auth)

## Context

The Glass design system foundation (Phase 0) and auth (Phase 1) are shipped. This
cycle migrates the **first-run onboarding modal** (`src/components/onboarding/onboarding-modal.tsx`)
onto the Glass foundation. **Behavior and data are unchanged — only presentation is
replaced.** Handoff: `~/Downloads/design_handoff_onboarding/` (README, `Onboarding.jsx`,
`glass.css`). We compose from the existing foundation (`src/index.css`,
`src/components/glass/glass.tsx`, `docs/design-system.md`); we do **not** re-derive tokens.

## Settled decisions (resolved with the user)

1. **Mobile sheet = Framer Motion slide-up (no `vaul`).** The app's `Drawer` is a custom
   *side* drawer, not a bottom sheet, and `vaul` is not installed. We slide a glass panel
   up from the bottom using the already-installed `framer-motion`, over a Radix Dialog
   scrim. Backdrop-tap + Esc close it; a decorative drag handle is shown but the sheet is
   **not** drag-dismissable (the original onboarding had no drag either, and the app's
   other sheets don't drag — consistency + smallest footprint). A future shared "sheet"
   primitive can standardize drag app-wide.
2. **Brand-tinted icon tiles + emerald lock.** Icon tiles use the brand palette
   (Install=violet, Track=emerald, Organize=cyan, Warranty=info, Split=pink),
   Language=emerald. The onboarding surface pins `--primary` to brand emerald via an
   `.onboarding-emerald` wrapper (same pattern `docs/design-system.md` blesses for
   brand-locked surfaces) so the step dots, language-card selection, and the
   Next/Get-Started CTA stay cohesively on-brand. Adds one token: `--brand-pink`
   (light + dark).
3. **Keep 5 feature steps.** Mirror the current component + handoff: language + Install,
   Track, Organize, Warranty, Split (6 total). `step5` "Track Prices" exists in i18n but
   stays unrendered (Pro/feature-flagged surface the component deliberately omits).

## Contract (unchanged — must hold)

- Props: `{ open: boolean, onOpenChange: (open: boolean) => void }`.
- `useState(step)` (0–5); `useSettingsStore` `language` / `setLanguage`.
- `totalSteps = steps.length + 1`; index 0 = language, 1–5 = the `steps` array.
- `steps`: `installApp`·Smartphone·violet · `step1`·QrCode·emerald · `step2`·FolderOpen·cyan
  · `step3`·Shield·info · `step4`·Users·pink.
- Nav: step 0 = **Skip + Next**; steps 1–4 = **Back + Next**; last (index 5) = **Back + Get Started**.
- `handleComplete` / `handleSkip` both set `localStorage['receipto-onboarding-completed']='true'`,
  call `onOpenChange(false)`, and reset `step` to 0.
- Step dots: active = wide pill, past = filled, future = muted.
- Tip (Sparkles) renders only when `onboarding.<key>.tip` is non-empty (`installApp`, `step1`).
- All copy via `t()` from existing `onboarding.*` keys (present in en.json + sr.json). The
  language-step title stays hardcoded bilingual: "Choose Your Language" / "Izaberite jezik".
- Mounted at `app-layout.tsx:83` (which also writes the localStorage flag on close — kept).

## Architecture

### Component composition (`onboarding-modal.tsx`, full presentation rewrite)

Import Radix Dialog primitives directly (`@radix-ui/react-dialog`) rather than the app's
shared `DialogContent` wrapper — the wrapper hardcodes a centered position, a fixed
overlay, and a close "X"; onboarding needs a custom overlay, two shells, and no default X.
Using the primitives keeps shared chrome untouched.

```
OnboardingModal
└── DialogPrimitive.Root (open, onOpenChange)
    └── AnimatePresence (onExitComplete → setStep(0))   // reset after exit, no step-0 flash
        └── open && DialogPrimitive.Portal forceMount
            ├── DialogPrimitive.Overlay asChild forceMount
            │   └── motion.div  (scrim: oklch(0 0 0/0.45) dark /0.55, backdrop-blur-[5px], fade)
            └── DialogPrimitive.Content asChild forceMount  (onboarding-emerald wrapper, aria via sr-only Title)
                └── motion.div  → <Shell>           // desktop: centered card / mobile: bottom sheet
                    └── <StepBody index={step} />    // shared inner content
```

- **Responsive split:** `useMediaQuery('(min-width: 640px)')` (small inline hook, or reuse an
  existing one if present). `true` → centered desktop card; `false` → bottom sheet.
- **Desktop shell:** centered `motion.div.glass-card`, `w-[432px] max-w-[calc(100%-2rem)]`,
  padding `30px 26px`, `text-center`. Enter `{opacity:0, scale:0.96, y:8} → {1,1,0}`, exit
  reverse. (`.glass-card` already supplies bg/blur/border/28px radius/`shadow-glass-4`.)
- **Mobile shell:** bottom-anchored container `fixed inset-x-0 bottom-0`, sheet =
  `motion.div.glass-card rounded-t-[28px]` full-bleed, padding `12px 26px 30px` +
  `env(safe-area-inset-bottom)` on the bottom. Decorative drag handle `36×5 rounded-full
  bg-border` centered at top, ~16px gap below. Enter `{y:'100%'} → {y:0}`, exit `{y:'100%'}`,
  tween ~0.3s `cubic-bezier(0.2,0.8,0.2,1)`.
- **Reduced motion:** `useReducedMotion()` from framer-motion — when true, drop transforms
  and use `duration: 0` (Framer's JS-driven transforms are not caught by the global
  `prefers-reduced-motion` CSS clamp, so this must be explicit).
- **A11y:** a visually-hidden `DialogPrimitive.Title` per step (language title / step title);
  `aria-describedby={undefined}` on Content to silence the description warning. Focus trap,
  Esc, scrim-tap close come from Radix.

### Shared inner content (`StepBody`)

Top→bottom, centered: **StepDots** → **IconTile** → **Title** → **Description** →
optional **Tip** → **Nav row**. Language step (index 0) swaps the icon/title block for the
**LanguageStep** (Globe tile + bilingual title + 2-col language cards). Nav row is identical
across all steps (only the left/right button labels change).

- **StepDots:** Tailwind — `h-1.5 rounded-full transition-all duration-300`; active
  `w-6 bg-primary`, past `w-1.5 bg-primary/55`, future `w-1.5 bg-border`; `gap-1.5`, centered.
- **IconTile** (new primitive, see below): `accent` per step, 72×72, icon ~34 (language 32).
- **Title:** `.t-h2`, centered.
- **Description:** `.t-body text-muted-foreground max-w-[304px] mx-auto`, centered.
- **Tip:** `flex items-start gap-2.5 bg-bg-subtle rounded-xl px-3.5 py-3 text-left`;
  `Sparkles` 16px `text-warning shrink-0`; text `text-[12.5px] text-muted-foreground leading-[1.45]`.
- **LanguageStep:** Globe `IconTile accent="primary"` (size 32); title "Choose Your Language"
  (`.t-h2`), subtitle "Izaberite jezik" (`.t-sm text-muted-foreground`); 2-col grid of cards.
  Card = `flex flex-col items-center gap-1 border-2 rounded-xl px-3 py-[18px] bg-card`; primary
  label `text-[17px] font-bold`, secondary `text-xs text-muted-foreground`. Selected:
  `border-primary bg-primary-soft ring-4 ring-primary/15` + `Check` (16px, `text-primary`,
  `strokeWidth={3}`). Unselected hover: `hover:border-primary/50`. Selecting calls
  `setLanguage(lang)` (updates store + live-switches i18n) and highlights, but does **not**
  advance.
- **Nav row:** `flex items-center justify-between gap-3 mt-6`. Left = `Skip` (step 0) or
  `Back` (`ChevronLeft`) — shadcn `Button variant="ghost" size="sm"` (Skip `text-muted-foreground`).
  Right = `Next` (`ChevronRight`) or `Get Started` on the last step — a gradient pill.

### Gradient nav pill

The shared `GradientButton` is `w-full h-[52px]` (full-width CTA). The nav CTA is auto-width
in a space-between row, so we apply the existing **`.btn-brand`** class to a plain button
(sanctioned by the handoff): `btn-brand inline-flex h-11 items-center gap-1.5 rounded-full
px-5 text-[15px] font-semibold`. Kept local to onboarding for now (a width-flexible
`GradientButton` variant can be extracted later if a second consumer appears).

## New foundation additions

### `src/components/glass/glass.tsx` — `IconTile`

Generic accent-tinted square tile (dashboard will reuse it). API:

```ts
type IconTileAccent = 'emerald' | 'cyan' | 'violet' | 'pink' | 'info' | 'primary'
function IconTile({ icon, accent, size = 34, className }:
  { icon: LucideIcon; accent: IconTileAccent; size?: number; className?: string })
```

Renders `div.grid.size-[72px].place-items-center.rounded-3xl + icon-tile-${accent}`, icon at
`size` px (color inherited via `currentColor`).

### `src/index.css`

- **`--brand-pink`**: light `oklch(0.70 0.20 350)`, dark `oklch(0.78 0.16 350)` (added to the
  brand block alongside emerald/cyan/violet).
- **`.icon-tile-*` tint classes** (light + dark), formulas ported verbatim from
  handoff `glass.css`:
  - emerald/cyan/violet/pink: bg `oklch(from var(--brand-X) 0.94 0.05 h)`, icon
    `oklch(from var(--brand-X) 0.4x c h)`; dark bg `…0.30 0.06 h`, icon `…0.82–0.84 0.10 h`.
  - info: bg `var(--info-soft)`, icon `oklch(from var(--info) 0.45 c h)`; dark bg
    `oklch(from var(--info) 0.30 0.06 h)`, icon `…0.84 0.08 h`.
  - primary: bg `var(--primary-soft)`, icon `var(--primary)`; dark icon brightened.
- **`.onboarding-emerald`**: folded into the existing `.auth-emerald` rule as a second
  selector (`.auth-emerald, .onboarding-emerald { … }` and the `.dark` pair). Auth output
  unchanged; no duplicated values.

### Docs

- `docs/design-system.md`: document `IconTile` + `.icon-tile-*` + `.onboarding-emerald`;
  remove "sheet" reference scope-creep; note onboarding migrated.
- Root `CLAUDE.md` design summary already says "migrate screens one area at a time" — no change
  needed beyond the design-system doc.

## Out of scope / non-goals

- No `vaul`, no drag-to-dismiss, no `step5`/Track Prices.
- No change to the contract, the localStorage flag, the i18n keys, or `app-layout.tsx`.
- No restyle of the app behind the modal (it's the real route, dimmed by the scrim).
- No change to auth or the shared `Dialog`/`Drawer`/`Button` components.

## Verification

- `npm run build` passes (tsc + vite).
- Preview on a free port (`--port 5180 --strictPort`; 5173 is a different project on this
  machine). Screenshot all 6 steps × {mobile, desktop} × {light, dark}.
- Confirm: step nav (Skip/Back/Next/Get Started) works; language selection writes
  `language` to the store + live-switches copy; complete/skip set the localStorage flag and
  close; reduced-motion path renders.
- Commit + push to `feature/redesign-main-branch` (pre-push build hook runs).

## Risks & mitigations

- **Framer + Radix exit animation** → use `forceMount` + `AnimatePresence`; reset `step` in
  `onExitComplete` to avoid a step-0 flash during the exit.
- **Reduced motion** → explicit `useReducedMotion()` (CSS clamp doesn't cover JS transforms).
- **Backdrop-filter perf/fallback** → `.glass-card` already ships an opaque fallback.
- **Emerald lock leaking** → scoped to the `.onboarding-emerald` wrapper on Content only.
- **Safe-area on mobile** → sheet bottom padding includes `env(safe-area-inset-bottom)`.
