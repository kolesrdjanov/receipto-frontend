# Glass Design System Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the global, additive "glass" design-system layer (semantic + depth tokens, type scale, shadow scale, and relocated generic primitives) so every later screen migration composes the system instead of re-deriving it.

**Architecture:** Keep the shadcn token base untouched; add tokens/classes additively in `src/index.css`. Move the generic UI primitives out of `src/components/auth/glass.tsx` into a shared `src/components/glass/` home and drop the `Auth`/`Glass` name prefixes. Refactor auth's hardcoded palette colors onto the new semantic tokens. Auth stays a refactor with **visual parity** (no intended pixel change).

**Tech Stack:** React 19, Tailwind v4 (`@theme inline`), shadcn/ui tokens, lucide-react, Framer Motion. Verification = `npm run build` + Claude Preview screenshot parity (light/dark, mobile/desktop).

**Spec:** `docs/superpowers/specs/2026-06-04-glass-design-system-foundation-design.md`

---

## File Structure

- `src/index.css` — **modify**: add semantic + depth tokens (`:root`, `.dark`), register them + a shadow scale in `@theme inline`, add the `.t-*` type-scale classes.
- `src/components/glass/glass.tsx` — **create**: generic primitives (`Field`, `PasswordField`, `GradientButton`, `SecondaryButton`, `Alert`, `Badge`, `PasswordStrengthMeter`, `scorePassword`, `Checkbox`, `Divider`, `BrandWash`, `GoogleGIcon`).
- `src/components/auth/glass.tsx` — **modify**: keep only auth-specific `CardHead`, `EmailChip`, `BackLink`; import generic pieces from `@/components/glass/glass`.
- `src/components/auth/google-sign-in-button.tsx`, `src/components/layout/auth-layout.tsx`, `src/pages/auth/{sign-in,sign-up,forgot-password,reset-password,check-email,verify-email}.tsx` — **modify**: update imports + renamed usages.
- `docs/design-system.md` — **create**: token/type/primitive catalog + "compose, don't re-derive" + deferred-classes list.
- `CLAUDE.md` (repo root, `../CLAUDE.md`) — **modify**: link the design-system doc from the Design System Summary.

**Radii decision (refinement of spec):** do NOT add an `--r-*` radius scale — it would collide with Tailwind's `rounded-r-*` (right-side) utilities, and shadcn's existing scale already covers the values (`rounded-xl`=14=r-3, `rounded-2xl`=18=r-4, `rounded-3xl`=22=r-5; the glass card keeps its literal 28px in `.glass-card`). Reuse the shadcn radius scale and document the mapping. Shadow scale IS added (`--sh-1..4` → `shadow-glass-1..4`).

---

## Task 1: Semantic + depth tokens and shadow scale in `index.css`

**Files:** Modify `src/index.css` (`:root`, `.dark`, `@theme inline`).

- [ ] **Step 1: Add to `:root`** (after `--primary-soft` is not present in `:root` yet — add a neutral default too):

```css
/* glass semantic colors */
--success: oklch(0.65 0.16 155);
--success-soft: oklch(0.95 0.05 155);
--warning: oklch(0.75 0.16 75);
--warning-soft: oklch(0.96 0.05 80);
--info: oklch(0.65 0.13 230);
--info-soft: oklch(0.95 0.04 230);
/* glass depth tiers (additive to shadcn) */
--bg-subtle: oklch(0.965 0.003 250);
--hairline-soft: oklch(0.95 0.004 250);
--fg-faint: oklch(0.70 0.008 260);
--primary-soft: oklch(0.95 0.04 165);
/* glass shadow scale */
--sh-1: 0 1px 2px oklch(0 0 0 / 0.04), 0 1px 0 oklch(0 0 0 / 0.02);
--sh-2: 0 4px 12px oklch(0 0 0 / 0.06), 0 2px 4px oklch(0 0 0 / 0.04);
--sh-3: 0 10px 28px oklch(0 0 0 / 0.10), 0 4px 8px oklch(0 0 0 / 0.05);
--sh-4: 0 24px 56px oklch(0 0 0 / 0.16), 0 8px 16px oklch(0 0 0 / 0.06);
```

- [ ] **Step 2: Add the dark variants to `.dark`:**

```css
--success: oklch(0.78 0.15 155);
--success-soft: oklch(0.28 0.06 155);
--warning: oklch(0.80 0.16 75);
--warning-soft: oklch(0.30 0.06 75);
--info: oklch(0.75 0.14 230);
--info-soft: oklch(0.28 0.06 230);
--bg-subtle: oklch(0.235 0.012 260);
--hairline-soft: oklch(1 0 0 / 0.06);
--fg-faint: oklch(0.50 0.012 260);
--primary-soft: oklch(0.30 0.06 165);
--sh-1: 0 1px 2px oklch(0 0 0 / 0.30);
--sh-2: 0 4px 12px oklch(0 0 0 / 0.40), 0 2px 4px oklch(0 0 0 / 0.20);
--sh-3: 0 10px 28px oklch(0 0 0 / 0.50);
--sh-4: 0 24px 56px oklch(0 0 0 / 0.60);
```

- [ ] **Step 3: Register in `@theme inline`** (so utilities exist):

```css
--color-success: var(--success);
--color-success-soft: var(--success-soft);
--color-warning: var(--warning);
--color-warning-soft: var(--warning-soft);
--color-info: var(--info);
--color-info-soft: var(--info-soft);
--color-bg-subtle: var(--bg-subtle);
--color-hairline-soft: var(--hairline-soft);
--color-fg-faint: var(--fg-faint);
--color-primary-soft: var(--primary-soft);
--shadow-glass-1: var(--sh-1);
--shadow-glass-2: var(--sh-2);
--shadow-glass-3: var(--sh-3);
--shadow-glass-4: var(--sh-4);
```

- [ ] **Step 4: Verify** — `npm run build`. Expected: PASS (no token usage yet, just definitions).

---

## Task 2: Global type-scale classes in `index.css`

**Files:** Modify `src/index.css` (append a new section before the AUTH REDESIGN block).

- [ ] **Step 1: Add the type scale:**

```css
/* ============================================
   GLASS TYPE SCALE
   ============================================ */
.t-display { font-size: 44px; line-height: 1.05; font-weight: 800; letter-spacing: -0.025em; }
.t-h1 { font-size: 32px; line-height: 1.10; font-weight: 700; letter-spacing: -0.022em; }
.t-h2 { font-size: 24px; line-height: 1.20; font-weight: 700; letter-spacing: -0.018em; }
.t-h3 { font-size: 20px; line-height: 1.25; font-weight: 600; letter-spacing: -0.015em; }
.t-title { font-size: 17px; line-height: 1.30; font-weight: 600; letter-spacing: -0.01em; }
.t-body { font-size: 15px; line-height: 1.45; font-weight: 400; }
.t-body-strong { font-size: 15px; line-height: 1.45; font-weight: 600; }
.t-sm { font-size: 13px; line-height: 1.40; font-weight: 500; }
.t-xs { font-size: 11px; line-height: 1.30; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.t-num { font-variant-numeric: tabular-nums; }
```

- [ ] **Step 2: Verify** — `npm run build`. Expected: PASS.

---

## Task 3: Create `components/glass/glass.tsx` with the generic primitives

**Files:** Create `src/components/glass/glass.tsx`.

- [ ] **Step 1:** Move every generic primitive currently in `src/components/auth/glass.tsx` into the new file, dropping prefixes: `GlassField → Field`, `AuthAlert → Alert`, `AuthBadge → Badge`, `AuthCheckbox → Checkbox`, `AuthDivider → Divider`. Keep `PasswordField`, `PasswordStrengthMeter`, `scorePassword`, `GradientButton`, `SecondaryButton`, `BrandWash`, `GoogleGIcon` as-is. Imports: `React`, `useTranslation`, lucide icons, `cn`. (Do **not** import `Logo` or `Link` here — those belong to the auth-specific pieces.)

- [ ] **Step 2:** Apply the semantic-token refactor inside this file (see Task 4 — done in the same write to avoid a throwaway intermediate).

- [ ] **Step 3: Verify** — `npm run build` will still fail until Task 5 re-points imports; defer the build check to Task 5.

---

## Task 4: Refactor `Alert`/`Badge`/`PasswordStrengthMeter` onto semantic tokens

**Files:** within `src/components/glass/glass.tsx` (same file as Task 3).

- [ ] **Step 1:** Replace hardcoded palette classes with semantic-token utilities:
  - `Alert` `ALERT_STYLES`: `err → bg-destructive/10 text-destructive`; `warn → bg-warning-soft text-warning`; `ok → bg-success-soft text-success`; `info → bg-info-soft text-info`.
  - `Badge` `BADGE_STYLES`: `primary → bg-primary-soft text-primary`; `ok → bg-success-soft text-success`; `danger → bg-destructive/10 text-destructive`.
  - `PasswordStrengthMeter` `STRENGTH`: `weak → bg-destructive text-destructive`; `fair → bg-warning text-warning`; `good → bg-info text-info`; `strong → bg-success text-success`.

- [ ] **Step 2:** Field error helper + leading-icon faint color may use `text-fg-faint`/`text-muted-foreground` (no change required for parity).

---

## Task 5: Slim `components/auth/glass.tsx` to auth-specific pieces + re-point imports

**Files:** Modify `src/components/auth/glass.tsx`, all six auth pages, `auth-layout.tsx`, `google-sign-in-button.tsx`.

- [ ] **Step 1:** Rewrite `src/components/auth/glass.tsx` to contain only `CardHead`, `EmailChip`, `BackLink`. `CardHead` imports `Badge` from `@/components/glass/glass` and `Logo` from `@/components/ui/logo`; `BackLink` imports `Link` + `ArrowLeft`.

- [ ] **Step 2:** Update imports across consumers:
  - Generic primitives now come from `@/components/glass/glass` (`Field`, `PasswordField`, `Alert`, `Badge`, `Divider`, `Checkbox`, `GradientButton`, `SecondaryButton`, `PasswordStrengthMeter`, `BrandWash`, `GoogleGIcon`).
  - Auth-specific (`CardHead`, `EmailChip`, `BackLink`) stay from `@/components/auth/glass`.
  - Rename usages: `GlassField → Field`, `AuthAlert → Alert`, `AuthBadge → Badge`, `AuthCheckbox → Checkbox`, `AuthDivider → Divider` in: `sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `check-email.tsx`, `verify-email.tsx`, `auth-layout.tsx` (`BrandWash`), `google-sign-in-button.tsx` (`GoogleGIcon`).

- [ ] **Step 2b:** Grep guard — `grep -rn "GlassField\|AuthAlert\|AuthBadge\|AuthCheckbox\|AuthDivider" src` must return nothing.

- [ ] **Step 3: Verify** — `npm run build`. Expected: PASS (all imports resolved).

---

## Task 6: Documentation

**Files:** Create `src/../docs/design-system.md` (i.e. `receipto-frontend/docs/design-system.md`); modify root `CLAUDE.md`.

- [ ] **Step 1:** Write `docs/design-system.md`: token reference (shadcn base + glass additions), the `.t-*` type scale, the `components/glass/` primitive catalog with prop summaries, the "compose, don't re-derive" rule, the deferred/lazy component list (list-row, segmented, switch, pill, sheet, tab-bar, side-nav, avatar, skeleton, empty), and the radii mapping note.
- [ ] **Step 2:** In root `CLAUDE.md` "Design Context → Design System Summary", add a line pointing to `receipto-frontend/docs/design-system.md` as the glass-system source of truth.

---

## Task 7: Verify parity + commit + push

- [ ] **Step 1:** `npm run build` — PASS.
- [ ] **Step 2:** Start preview on a free port (`5180 --strictPort`), screenshot `/sign-in` and `/sign-up` in light and dark; confirm visual parity with Phase 1.
- [ ] **Step 3:** `grep -rn "amber-\|emerald-6\|emerald-5\|blue-6\|blue-5" src/components/glass src/components/auth` returns nothing (palette fully replaced).
- [ ] **Step 4:** Commit (foundation + auth refactor, then docs) and push to `feature/redesign-main-branch`.

---

## Self-Review

- **Spec coverage:** A=Task 1 (tokens) ✓; B=Task 2 (type scale) ✓; C=Tasks 3+5 (primitives relocated/renamed, lazy list deferred + documented) ✓; D=Task 4 (semantic refactor) ✓; E=Task 6 (docs) ✓. Acceptance criteria → Task 7. Radii deviation explicitly documented.
- **Placeholder scan:** none — every token value, class, rename, and command is concrete.
- **Type consistency:** renamed exports (`Field`/`Alert`/`Badge`/`Checkbox`/`Divider`) are used consistently from Task 3 onward; auth-specific (`CardHead`/`EmailChip`/`BackLink`) consistently sourced from `@/components/auth/glass`.
