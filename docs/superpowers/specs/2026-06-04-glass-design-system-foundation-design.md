# Glass Design System — Foundation (Phase 0)

**Date:** 2026-06-04
**Branch:** `feature/redesign-main-branch`
**Status:** Approved design — ready for implementation plan

## Context

The app is migrating fully to the "Glass" design system. Phase 1 (auth) is already
built and committed: auth consumes a few global tokens (`--brand-*`, `.glass-card`,
`.btn-brand`) plus reusable primitives that currently live under
`src/components/auth/glass.tsx`. The broader design system from the handoff
(`design_handoff_auth/foundations.css` + the glass classes in `Auth.html`) is **not**
established app-wide yet.

This spec defines the **global foundation** so that every subsequent screen migration
*composes* the system instead of re-deriving it. It does **not** restyle any non-auth
screen — those are separate cycles.

## Settled decisions

- **Rollout:** foundation-first, then migrate area-by-area (each its own spec → plan →
  implement cycle).
- **Token base:** keep the shadcn token base (`--background`/`--foreground`/`--border`/
  `--radius`/…) **untouched**; add the glass layer **additively**. No mass rename.
- **Idiom:** Tailwind-utility-first (matches the app). Component CSS classes only where
  utilities can't cleanly express it (`glass-card`, brand gradient, type scale). React
  primitives for repeated widgets. No parallel styling system.
- **Accent:** auth stays pinned to brand emerald via `.auth-emerald`; the rest of the
  app continues to honor the user's `.accent-*` choice. (No change here.)

## Scope — the foundation deliverable

### A. Token layer (`src/index.css`, additive)

1. **Brand** — `--brand-emerald/cyan/violet` (already present). No change.
2. **Semantic colors** — promote the alert/badge colors auth currently fakes with
   Tailwind palette utilities (`amber`/`emerald`/`blue`) into real themeable tokens with
   dark variants. Reuse `--destructive` for danger.
   - Light: `--success: oklch(0.65 0.16 155)`, `--success-soft: oklch(0.95 0.05 155)`;
     `--warning: oklch(0.75 0.16 75)`, `--warning-soft: oklch(0.96 0.05 80)`;
     `--info: oklch(0.65 0.13 230)`, `--info-soft: oklch(0.95 0.04 230)`.
   - Dark: `--success: oklch(0.78 0.15 155)`, `--success-soft: oklch(0.28 0.06 155)`;
     `--warning: oklch(0.80 0.16 75)`, `--warning-soft: oklch(0.30 0.06 75)`;
     `--info: oklch(0.75 0.14 230)`, `--info-soft: oklch(0.28 0.06 230)`.
   - Add `*-foreground` (text-on-soft) where needed, or derive with `oklch(from …)` as
     auth already does. Register the colors in `@theme inline` so `bg-success-soft`,
     `text-success` etc. become utilities.
3. **Depth tiers shadcn lacks** (additive):
   - `--bg-subtle` — light `oklch(0.965 0.003 250)`, dark `oklch(0.235 0.012 260)`.
   - `--hairline-soft` — light `oklch(0.95 0.004 250)`, dark `oklch(1 0 0 / 0.06)`.
   - `--fg-faint` — light `oklch(0.70 0.008 260)`, dark `oklch(0.50 0.012 260)`
     (replaces today's `muted-foreground/70` hack).
   - `--primary-soft` already defined inside `.auth-emerald`; add a neutral default in
     `:root`/`.dark` so it's usable outside auth.
4. **Scales as Tailwind theme extensions** (so they're utilities, not magic numbers):
   - Radii: `--r-1: 6px … --r-6: 28px`, `--r-pill: 999px` → registered so `rounded-r-3`,
     `rounded-r-6`, `rounded-r-pill` work.
   - Shadows: `--sh-1 … --sh-4` (values from `foundations.css`, light + heavier dark) →
     `shadow-sh-2`, `shadow-sh-4`.
   - Spacing already covered by Tailwind v4's dynamic scale — no new spacing tokens.
5. `.auth-emerald` — unchanged (auth-only accent lock).

### B. Type scale (global)

Add the semantic type set as global classes, values from `foundations.css`:

| Class | size / line-height / weight / tracking |
|---|---|
| `.t-display` | 44 / 1.05 / 800 / -0.025em |
| `.t-h1` | 32 / 1.10 / 700 / -0.022em |
| `.t-h2` | 24 / 1.20 / 700 / -0.018em |
| `.t-h3` | 20 / 1.25 / 600 / -0.015em |
| `.t-title` | 17 / 1.30 / 600 / -0.01em |
| `.t-body` | 15 / 1.45 / 400 |
| `.t-body-strong` | 15 / 1.45 / 600 |
| `.t-sm` | 13 / 1.40 / 500 |
| `.t-xs` | 11 / 1.30 / 600 / 0.04em / uppercase |
| `.t-num` | tabular-nums |

Becomes the standard for headings/labels across the redesign (replaces ad-hoc
`text-2xl font-bold` per screen). Auth's inline `text-[27px]`/`text-[15px]` etc. can be
migrated to these opportunistically (not required for parity).

### C. Primitive layer

Create a shared home `src/components/glass/` and move the **generic** primitives out of
`src/components/auth/glass.tsx`:

- **Generic → `components/glass/`:** `GlassCard`, `Field` (renamed from `GlassField`),
  `PasswordField`, `GradientButton`, `SecondaryButton`, `Alert` (from `AuthAlert`),
  `Badge` (from `AuthBadge`), `PasswordStrengthMeter` + `scorePassword`, `Checkbox`
  (from `AuthCheckbox`), `Divider` (from `AuthDivider`), `BrandWash`, `GoogleGIcon`.
- **Auth-specific → stays in `components/auth/`:** `CardHead`, `EmailChip`, `BackLink`
  (router-coupled), and the `.auth-emerald` usage.
- Update all auth imports. Auth screens must render **identically** (this is a refactor,
  not a redesign).
- **Lazy port** (NOT now — when the first consumer screen is migrated): list rows,
  segmented control, switch, pill, sheet, tab-bar, side-nav, avatar, skeleton, empty
  state. Log these as known-deferred in the doc.

### D. Semantic refactor of auth

Replace auth's hardcoded Tailwind palette colors (`amber-500/10`, `emerald-600`,
`blue-500`, etc. in `Alert`, `Badge`, `PasswordStrengthMeter`) with the new semantic
tokens. This both validates the tokens and removes palette drift.

### E. Documentation

- New `docs/design-system.md`: tokens, type scale, primitive catalog, and the
  "compose, don't re-derive" rule, plus the list of deferred (lazy) component classes.
- Update the **Design System Summary** in the root `CLAUDE.md` to point at it.

## Non-goals

- Restyling any non-auth screen (each is its own later cycle).
- Porting the heavy component vocabulary (list/segmented/sheet/tab-bar/side-nav/…) up front.
- Renaming shadcn tokens or changing the accent system (beyond the auth lock already shipped).
- Any visual change to auth — Phase 0 is a refactor + system extraction with visual parity.

## Migration order (post-foundation, indicative — each its own cycle)

Shared app chrome (`app-layout`: sidebar + mobile nav + header) → dashboard → then
module by module (receipts, categories, warranties, groups, items, savings, …).

## Acceptance criteria

- `index.css` has the new semantic + depth tokens (light **and** dark), the type-scale
  classes, and registered radii/shadow scales; `npm run build` passes.
- Generic primitives live in `components/glass/`; auth imports updated; **auth screens
  render identically** in light/dark, mobile/desktop (verified via preview screenshots
  against the Phase 1 result).
- Auth alerts/badges/strength-meter use the semantic tokens — no hardcoded `amber/
  emerald/blue` palette remaining in auth.
- `docs/design-system.md` exists and `CLAUDE.md` DS summary links it.

## Risks & mitigations

- **Import churn from moving files** → update every importer and rely on the build to
  catch misses; keep the move mechanical.
- **Contrast regressions** → every new token must define a dark variant; spot-check
  alerts/badges in dark.
- **Visual parity** → auth is a refactor here; screenshot-compare before/after in both
  themes and both form factors.
