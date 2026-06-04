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
| `--destructive` (shadcn) + `--destructive-soft` / `--destructive-foreground-on-soft` | `bg-destructive` / `bg-destructive-soft` / `text-[color:var(--destructive-foreground-on-soft)]` | danger/error; `*-soft` = tinted danger surfaces (failed status badge, delete confirm icon, mobile bulk Remove) |
| `--brand-violet-soft` / `--brand-violet-foreground` | `bg-brand-violet-soft` / `text-brand-violet-foreground` | the recurring status badge (the one non-gradient use of the violet hue) |

`*-soft` = tinted background; `*-foreground` = readable text **on** that soft
background (darker in light mode, lighter in dark).

### Depth tiers (additive to shadcn)
`--bg-subtle` (`bg-bg-subtle`), `--hairline-soft` (`border-hairline-soft`),
`--fg-faint` (`text-fg-faint`, for placeholders/faint icons), `--fg-2`
(`text-fg-2`, mid-tone text between `--foreground` and `--muted-foreground`),
`--primary-soft` (`bg-primary-soft`, tinted primary; **accent-aware** — derived from `--primary`).

### Shadow scale
`--sh-1..4` → `shadow-glass-1 … shadow-glass-4` (heavier in dark).

### Radii (reuse shadcn — no new scale)
The handoff's `--r-1..6` map onto the existing shadcn radius utilities to avoid
colliding with Tailwind's `rounded-r-*` (right-side) utilities:
`r-2`=`rounded-lg` (10) · `r-3`=`rounded-xl` (14, glass fields) ·
`r-4`=`rounded-2xl` (18, badges) · `r-5`=`rounded-3xl` (22) · `r-pill`=`rounded-full`.
The glass card uses a literal `28px` inside `.glass-card`.

### Accent lock — now app-wide (accent picker retired)
The 6-swatch accent picker was **retired** in the settings redesign: base `:root`/`.dark`
`--primary` (+ `--ring`) point directly at brand emerald, `--primary-soft` auto-derives via
`oklch(from var(--primary) …)`, the six `.accent-*` blocks were removed from `index.css`, and
`applyAccentColor()` in `store/settings.ts` (+ the `ThemeInitializer` in `App.tsx`) only strip
stale `accent-*` classes — they add none. So the whole app renders emerald; the accent-aware
sidebar active state (`bg-primary-soft text-primary`) simply reads emerald now. `.auth-emerald`
/ `.onboarding-emerald` remain (redundant but harmless). The `accentColor` store field + setter +
type are kept (dead for theming) for safe migration — sweep later with product sign-off.

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

`src/components/glass/glass-dialog.tsx` holds **`GlassDialog`** — the shared responsive
overlay shell: a centered frosted modal on desktop (≥ md) and a Framer-Motion slide-up
bottom sheet on mobile, composing Radix Dialog primitives (scrim/focus-trap/Esc) +
`useReducedMotion`. Layout is header / scrollable body / pinned footer. The shared
`ConfirmDialog`, all Recurring overlays, the **announcements panel**, and the **mobile FAB
Add/Scan sheet** compose from it. Use it for any new mobile-sheet/desktop-modal surface
instead of re-deriving the pattern.

## App navigation shell (`src/components/layout/`)

The chrome that wraps every page, restyled to Glass and composed from the shadcn
`Sidebar` primitive — **don't re-derive nav chrome per screen**:

- `app-sidebar.tsx` — desktop sidebar (280px expanded / 76px icon-rail) + mobile drawer
  (same component, rendered in the shadcn mobile `Sheet`). Data-driven `MONEY` / `WALLET`
  nav arrays; active state = `bg-primary-soft text-primary` (accent-aware; sidebar is
  gradient-free). Footer is a profile **popover** on desktop and an inline block in the
  mobile drawer (`isMobile` branch). Holds the `ThemeSegmented` Light/Dark/System control
  (now a shared component at `components/layout/theme-segmented.tsx` — icon-only here, `labeled`
  on the App settings row).
- `mobile-tab-bar.tsx` — Home · Expenses · gradient FAB · Warranties · More; the Warranties
  slot falls back through the Wallet group when flag-gated off; the FAB defers to a
  page-registered `useFabStore` action, else opens `FabActionSheet`.
- `fab-action-sheet.tsx` — global "Add expense" `GlassDialog` (Scan / Add manually →
  `/receipts?action=scan|add`, consumed by the Receipts page).
- `app-layout.tsx` — edge-to-edge frosted mobile header (language · centered logo · avatar;
  no hamburger) + content frame + tab bar + shared modals.
- The sidebar/mobile-header language toggle is `LanguageSwitcher` with the `pill`
  variant (`fullWidth` in the sidebar, `abbreviated` in the mobile header).

> Sidebar widths live on the shadcn primitive (`ui/sidebar.tsx`):
> `SIDEBAR_WIDTH=17.5rem`, `SIDEBAR_WIDTH_ICON=4.75rem`, `SIDEBAR_WIDTH_MOBILE=min(88vw,21rem)`.

## Deferred (port on first use)

The handoff's `foundations.css` also defines: switch, pill. These are **not** ported yet —
add each (here + in `index.css`/`components/glass`) when the first screen that needs it is
migrated. Keep this list current.

**Ported:** sheet/modal (`GlassDialog`), list rows + status badges
(`receipts/primitives.tsx`, `recurring-expenses/primitives.tsx`), card grid + coverage
bar + derived emoji tile (`warranties/primitives.tsx`), segmented control (Recurring add/edit
form + the shell `ThemeSegmented`), tab-bar + side-nav + avatar (the navigation shell),
skeleton + empty state (inline per screen).

## Migration order (indicative)

dashboard → then module by module. Each is its own cycle. Spec/plan templates live under
`docs/superpowers/`.

**Migrated so far:** auth (Phase 1), onboarding modal (centered glass Dialog on desktop /
Framer-Motion slide-up bottom sheet on mobile; reuses `glass-card` + `IconTile` + the
`.onboarding-emerald` lock), **expenses/receipts** (the full page — glass filter
rail + mobile filter sheet, day-grouped feed with per-day subtotals [desktop numbered
pages / mobile infinite Load-more], list primitives `StatusBadge`/`CatTile`/`CatName`/
`Amount`/`SelectCheck` in `receipts/primitives.tsx`, `+`-menu / FAB Add sheet / glass
template picker + CSV import guide, selection mode + glass bulk bars + desktop row kebab
with archived/recurring gating + `GlassDialog` assign-category, and the glass scan flow
`qr-scanner.tsx` → `GlassDialog` across all camera/processing/retry/error states; plus
the glass shared comps confirm-dialog / pagination / date-picker / receipt-viewer),
recurring expenses (flat urgency-sorted list, status
scale, `GlassDialog` overlays, global mobile-FAB takeover via `store/fab.ts`), warranties
(coverage-bar-hero cards, urgency status language, derived emoji tiles, zod-validated
`GlassDialog` form, restyled gallery lightbox), loyalty cards (wallet-card grid),
**navigation shell** (`app-layout`: sidebar + mobile drawer + frosted mobile header + tab
bar/FAB + profile popover w/ theme toggle + announcements modal) — the shared chrome every
page adopts, **settings & account** (App settings / Profile / Account / Rate modal — shared
`components/settings/primitives.tsx`: `SettingsCard`/`SettingRow`/`AccentRetired`/`NotifList`/
`RankCard` tier crest/`SaveBar`/`StarPicker`; labeled `ThemeSegmented`; auth-style password
card + strength meter; responsive danger zone [desktop inline / mobile `GlassDialog` sheet];
rate modal on `GlassDialog`; **accent picker retired → emerald locked app-wide**).
