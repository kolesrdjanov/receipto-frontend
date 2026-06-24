# UI Audit Remediation — Design

**Date:** 2026-06-24 · **Branch:** `feature/v2`
**Source audit:** `docs/ui-audit-2026-06-24.md` (29 findings, Critical→Low)
**Scope:** Full — all 29 findings across accessibility, responsive/layout, visual consistency, interaction/animation.

## Guiding principle

Fix in the **shared/primitive layer** wherever a pattern repeats; touch individual screens
only for genuinely local issues. Respect the existing codebase conventions:

- **One-Button rule** (ESLint `no-restricted-syntax` + `.claude/hooks/no-raw-button.sh`):
  app code uses `<Button>`; raw `<button>` is *intentionally exempt* in the primitive layer
  (`components/ui/**`, `components/glass/**`, `*primitives.tsx`).
- Therefore: **no separate `<IconButton>`**. Instead fix `Button size="icon"` to a real
  44px hit target, and add a shared `.hit-area` utility for the bespoke raw-button
  primitives (kebabs, swatches, scanner/lightbox controls) that legitimately stay raw.
- Glass button radius default is `rounded-xl` — never re-add `className="rounded-xl"`.
- Verification gate: `npm run build` (= `tsc -b && vite build`, strict TS). Must be green
  before push. The pre-push hook also builds.

## Work breakdown

### Phase 1 — Shared primitives (clears the 4 systemic themes)

1. **Theme A — touch targets (`ui/button.tsx`, `index.css`)**
   - `size="icon"` currently `h-9 w-9` (36px) → make a true 44px tap target. Keep the
     visual glyph at its current scale; expand the *hit* area to ≥44px (prefer real
     `min-h-11 min-w-11`; where a dense visual is required, keep the small box but add a
     `before:absolute before:-inset-…` 44px hit area).
   - Add `size="icon-sm"` for dense desktop tables: small visual, still ≥44px hit area.
   - Add a `.hit-area` utility class in `index.css` (min 44×44 via padding or a centered
     pseudo-element) for raw-`<button>` primitives that can't become `<Button>`.

2. **Theme C — `ui/progress.tsx`**
   - Add `role="progressbar"`, `aria-valuenow` (clamped int), `aria-valuemin=0`,
     `aria-valuemax=100`, and an optional `aria-label` prop.

3. **Alert — `glass/glass.tsx`**
   - Add `role="alert"` and `aria-live` (`assertive` for `err`, `polite` otherwise) so
     form/OTP errors are announced.

4. **Theme D — swatch/toggle focus rings**
   - `categories/primitives.tsx` & `loyalty-cards/primitives.tsx` color pickers: add
     `focus-visible:ring-2 focus-visible:ring-ring` (keep scale as secondary feedback).

### Phase 2 — Tokens (`index.css`)

5. `--fg-faint` light `oklch(0.7…)` → `~oklch(0.58…)` (≥4.5:1 on white);
   dark `oklch(0.5…)` → `~oklch(0.6…)`.
6. Rating stars `text-dark` (undefined class) → `text-muted-foreground`
   (`settings/primitives.tsx:226`).

### Phase 3 — Per-screen passes (grouped, mostly mechanical)

7. **Color-not-only (B / #4):** ensure icon **and/or** text accompanies functional color —
   TrendPill (arrow always + `aria-label` w/ direction & %), price up/down (distinct
   glyphs), "Best price" (✓ + text), recurring status/urgency badges, glass status badges.
8. **Charts (C / #5):** `role="img"` + summarizing `aria-label` + a visually-hidden data
   table for `items/price-history-chart.tsx` and `dashboard/focus/modules.tsx` sparkline.
9. **Framer reduced-motion (#9):** `useReducedMotion()` guard on
   `onboarding/onboarding-modal.tsx` sheet and `loyalty-cards/loyalty-card-scanner.tsx` laser.
10. **Async loading (#11, #12):** drive `loading=`/`aria-busy` from mutation `isPending` —
    OTP verify (`auth/sign-in.tsx`), recurring mark-paid, warranty import/export,
    receipts scan FAB. Add red-border/error state on OTP cells.
11. **Safe-area / dvh (#13, #14):** `env(safe-area-inset-top)` on sticky bars
    (`layout/page-toolbar.tsx`, `receipts/expenses-mobile-header.tsx`); `vh→dvh` in
    `glass/glass-dialog.tsx`.
12. **ARIA labels (#15, #24, #17):** FeatureSwitchRow/Pill (`admin/primitives.tsx`),
    lightbox nav buttons (`warranties/warranty-gallery-modal.tsx`), swatch color names.

### Phase 4 — Medium/Low polish

13. Recurring paused/ended rows `opacity-60` → `text-muted-foreground` (#16).
14. `mobile-tab-bar.tsx` NavLink `focus-visible` ring (#18); FAB overlap min-height (#19).
15. Filter chip height ≥44px mobile (#20); store-comparison `role=table`/columnheaders (#21).
16. PageToolbar `title=` tooltip on truncated title (#22); category reassign circle size (#23).
17. Camera/avatar `active:scale-95` tap feedback (#25); dashboard empty-state drop
    `rounded-full` (#27); shopping-insights focus ring (#28); hub-menu flatten nested
    switch (#29).

## Out of scope / dropped

The four disproven findings in the audit's "Corrected / dropped" section stay dropped
(muted-foreground & fg-2 contrast were fine; CSS `animate-*` reduced-motion already
handled globally — only Framer is exempt).

## Verification & delivery

- `npm run build` green after each phase; final full build before push.
- Commit per logical group (primitives / tokens / per-screen / polish).
- Push to `feature/v2` only after a confirmed-green build.
