# Receipto Glass Design System

The app is migrating to the **"Glass"** design system (frosted surfaces over a soft
brand wash; brand gradient reserved for logo + primary CTA; calm neutral everywhere
else). This is the reference for that system. **Compose from here — don't re-derive
per screen.**

Rollout is **foundation-first, then screen by screen**. This doc + `src/index.css` +
`src/components/glass/` are the foundation. Each screen migration is its own
spec → plan → implement cycle.

## Principle

Keep the **shadcn token base** (`--background`/`--foreground`/`--border`/`--radius`/…)
untouched. The glass system is an **additive layer** on top of it, expressed through
Tailwind utilities + a small number of component classes. No parallel token system, no
mass renames.

## Tokens (`src/index.css`)

All tokens have light (`:root`) and dark (`.dark`) values and are registered in
`@theme inline`, so they're available as Tailwind utilities.

### Brand (logo + primary CTA only)
`--brand-emerald`, `--brand-cyan`, `--brand-violet`. Used by `.btn-brand` /
`.bg-brand-gradient` and `BrandWash`. **Do not** use the gradient for anything else —
that restraint is what makes the system feel calm/Apple-like.

`--brand-pink` is an extra brand hue (no dark variant, like the others — tints
recompute L/C). It is **not** part of the gradient; it only feeds the `.icon-tile-pink`
accent tile.

### Semantic colors (alerts, badges, strength meter)
| Token | Utility | Use |
|---|---|---|
| `--success` / `--success-soft` / `--success-foreground` | `bg-success` / `bg-success-soft` / `text-success-foreground` | ok states |
| `--warning` / `--warning-soft` / `--warning-foreground` | `bg-warning` / `bg-warning-soft` / `text-warning-foreground` | warn states |
| `--info` / `--info-soft` / `--info-foreground` | `bg-info` / `bg-info-soft` / `text-info-foreground` | info states |
| `--destructive` (shadcn) | `bg-destructive/10` / `text-destructive` | danger/error |

`*-soft` = tinted background; `*-foreground` = readable text **on** that soft
background (darker in light mode, lighter in dark).

### Depth tiers (additive to shadcn)
`--bg-subtle` (`bg-bg-subtle`), `--hairline-soft` (`border-hairline-soft`),
`--fg-faint` (`text-fg-faint`, for placeholders/faint icons), `--primary-soft`
(`bg-primary-soft`, tinted primary; **accent-aware** — derived from `--primary`).

### Shadow scale
`--sh-1..4` → `shadow-glass-1 … shadow-glass-4` (heavier in dark).

### Radii (reuse shadcn — no new scale)
The handoff's `--r-1..6` map onto the existing shadcn radius utilities to avoid
colliding with Tailwind's `rounded-r-*` (right-side) utilities:
`r-2`=`rounded-lg` (10) · `r-3`=`rounded-xl` (14, glass fields) ·
`r-4`=`rounded-2xl` (18, badges) · `r-5`=`rounded-3xl` (22) · `r-pill`=`rounded-full`.
The glass card uses a literal `28px` inside `.glass-card`.

### Accent lock
`.auth-emerald` (and `.onboarding-emerald`, which shares the same rule) pin
`--primary`/`--ring`/`--primary-soft` to brand emerald for that subtree only.
Everywhere else the user's `.accent-*` choice applies. Use the same pattern (add a
selector to that shared rule) for any other brand-locked surface — onboarding is the
second one.

## Type scale (`.t-*`)

`.t-display` (44/800) · `.t-h1` (32/700) · `.t-h2` (24/700) · `.t-h3` (20/600) ·
`.t-title` (17/600) · `.t-body` (15/400) · `.t-body-strong` (15/600) · `.t-sm` (13/500) ·
`.t-xs` (11/600, uppercase, tracked) · `.t-num` (tabular-nums). Use these for
headings/labels instead of ad-hoc `text-2xl font-bold`.

## Component classes (`src/index.css`)

- `.glass-card` — frosted floating surface (real `backdrop-filter` + opaque fallback;
  dark gets a top highlight).
- `.btn-brand` — brand-gradient primary CTA (used by `GradientButton`; also applied to a
  plain auto-width pill for the onboarding nav CTA).
- `.bg-brand-gradient` — soft gradient fill (progress bars, blobs).
- `.icon-tile-{emerald,cyan,violet,pink,info,primary}` — soft accent-tinted square
  backgrounds (light + dark), consumed by the `IconTile` primitive. Tints recompute
  L/C from the brand/semantic token via `oklch(from …)`.

## Primitives (`src/components/glass/glass.tsx`)

Generic, reusable across the app:

| Component | Notes |
|---|---|
| `Field` | floating-label glass input; props `label`, `icon`, `error`, `invalid` (border-only), `trailing` |
| `PasswordField` | `Field` + built-in eye toggle |
| `PasswordStrengthMeter` + `scorePassword` | 4-segment meter; scoring mirrors the sign-up zod rule |
| `Alert` | `kind`: `err`/`warn`/`ok`/`info` + leading icon |
| `Badge` | round icon badge; `kind`: `primary`/`ok`/`danger` |
| `GradientButton` | primary CTA with `loading`/`loadingText` |
| `SecondaryButton` | neutral pill (resend actions) |
| `Checkbox` | custom 20px control (no shadcn Checkbox in this app) |
| `Divider` | "or" divider with hairline rules |
| `BrandWash` | decorative blurred brand blobs |
| `GoogleGIcon` | official 4-color Google "G" |
| `IconTile` | 72×72 accent-tinted square; props `icon`, `accent` (`emerald`/`cyan`/`violet`/`pink`/`info`/`primary`), `size` (default 34); pairs with the `.icon-tile-*` classes |

Auth-specific helpers live in `src/components/auth/glass.tsx`: `CardHead`, `EmailChip`,
`BackLink`.

## Deferred (port on first use)

The handoff's `foundations.css` also defines: list rows, segmented control, switch,
pill, sheet, tab-bar, side-nav, avatar, skeleton, empty state. These are **not** ported
yet — add each (here + in `index.css`/`components/glass`) when the first screen that
needs it is migrated. Keep this list current.

## Migration order (indicative)

Shared app chrome (`app-layout`: sidebar + mobile nav + header) → dashboard → then
module by module. Each is its own cycle. Spec/plan templates live under
`docs/superpowers/`.

**Migrated so far:** auth (Phase 1), onboarding modal (centered glass Dialog on desktop /
Framer-Motion slide-up bottom sheet on mobile; reuses `glass-card` + `IconTile` + the
`.onboarding-emerald` lock).
