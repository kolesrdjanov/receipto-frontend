# Receipto "Luma" Design System

> **Superseded — "Glass" → "Luma" (2026).** The app migrated from the old emerald **"Glass"**
> system (frosted `backdrop-filter` surfaces, brand gradients, Plus Jakarta Sans) to flat,
> monochrome **"Luma"**: neutral base, **near-black primary**, 1px hairline borders, minimal
> shadow, **Geist / Geist Mono** typography, and **red reserved strictly for
> destructive/expired/you-owe** states. Token *names* were kept (values remapped in
> `src/index.css`), so the primitives below still apply — but read every "emerald / brand
> gradient / frosted" mention as its Luma equivalent (monochrome / `bg-primary` / flat `.card`).
> The authoritative migration record is `docs/luma-redesign-progress.md`. Category and
> loyalty-card per-item colors are the one retained color exception.

This is the reference for the design system. **Compose from here — don't re-derive per screen.**
The foundation is `src/index.css` (tokens, `.t-*` type scale, utilities) + `src/components/glass/`
+ `src/components/ui/`.

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
`.t-xs` (11/600, uppercase, tracked). Use these for
headings/labels instead of ad-hoc `text-2xl font-bold`. (Numbers/amounts render in the normal
body font — **no** `tabular-nums`/`.t-num`; that utility was retired.)

## Accessibility baseline (WCAG AA — enforced)

The target is **WCAG AA**. These rules came out of the 2026-06-24 whole-app audit
(`docs/ui-audit-2026-06-24.md`) and are the default for all new/changed UI — the audit
found each of them violated repeatedly, so treat them as non-negotiable, not aspirational.

**Touch targets.** Every interactive element ≥ 44×44px. Use `<Button size="icon">`
(44px) or `size="icon-sm"` (dense). For bespoke raw buttons add `hit-area`. Never ship a
`size-8`/`size-9` icon button without one of these.

**Icon-only controls** carry an `aria-label` (i18n'd — both EN+SR). When a control already
has visible text, mark its decorative icon `aria-hidden="true"` so it isn't double-read.

**Color is never the only signal.** Status / trend / urgency / "best price" etc. must pair
color with an icon **and/or** text. (Most Glass badges already do — `StatusBadge` always
renders its label; keep it that way.)

**Contrast.** Body/label text ≥ 4.5:1 on its background. `--fg-faint` is tuned to AA
(~4.65:1 light / ~5.44:1 dark) — verify any new low-emphasis token the same way; don't
eyeball OKLCH. Use `--fg-2` for mid-tone text that must stay readable, `--fg-faint` only
for genuinely de-emphasized text.

**Focus.** Visible `focus-visible:ring-2 focus-visible:ring-ring` on every custom
interactive element (swatches, chips, nav tabs, link cards). Don't leave `outline-none`
without a replacement ring.

**Motion.** The global `@media (prefers-reduced-motion)` rule in `index.css` neutralizes
CSS `animation`/`transition`. **Framer Motion is NOT covered** — guard Framer animations
with `useReducedMotion()` (collapse to opacity/instant). `GlassDialog` already does this.

**Charts** (recharts / hand-rolled SVG) aren't screen-reader accessible alone: wrap in
`role="img"` with a summarizing `aria-label`, and provide an `sr-only` data table for the
series (see `items/price-history-chart.tsx`).

**Feedback & state.** Async actions use `<Button loading=>` (spinner + auto-disable +
`aria-busy`). Form error/success alerts use `role="alert"`/`status` + `aria-live` (the
glass `Alert` does this). Custom progress bars use `role="progressbar"` +
`aria-valuenow/min/max` (the shared `Progress` does this).

**Viewport.** Mobile sheets/overlays use `dvh` (not `vh`); sticky/fixed bars reserve
`env(safe-area-inset-*)`.

### What's machine-enforced vs. human-reviewed
Some of the above is checkable by tooling; the rest needs review. Both layers run:

- **ESLint** (`eslint.config.js`): `eslint-plugin-jsx-a11y` recommended set as **warnings**
  (alt-text, valid ARIA props/roles, label association, redundant roles, …); plus a custom
  `no-restricted-syntax` rule that flags a `<Button>`/`<button>` with `size-8`/`size-9` and
  no `hit-area`/`icon-sm` (the touch-target regression). Lint baseline is intentionally
  dirty — the gate is **0 new errors in files you touch**.
- **PostToolUse hook** (`.claude/hooks/no-small-touch-target.sh`): blocks AI edits that add a
  small-touch-target icon button, mirroring `no-raw-button.sh` / `no-glass-field.sh`. Opt out
  of either with a `touch-target-ok: <reason>` comment in the same edit (decorative-only).
- **Human review only** (no reliable lint signal — enforce in PR review): icon-only
  *needs aria-label*, color-not-only, contrast ratios, chart data-table, Framer
  `useReducedMotion`. A className/AST rule can't judge these without heavy false positives.

## Component classes (`src/index.css`)

- `.glass-card` — frosted floating surface (real `backdrop-filter` + opaque fallback;
  dark gets a top highlight).
- `.btn-brand` — brand-gradient primary CTA. **Not applied by hand** — it's the internal
  stylesheet of `<Button variant="brand">`. Use that variant, never the class directly.
- `.bg-brand-gradient` — soft gradient fill (progress bars, blobs).
- `.icon-tile-{emerald,cyan,violet,pink,info,primary}` — soft accent-tinted square
  backgrounds (light + dark), consumed by the `IconTile` primitive. Tints recompute
  L/C from the brand/semantic token via `oklch(from …)`.
- `.hit-area` — guarantees a ≥44px tappable area via a centered pseudo-element while
  keeping a small visual glyph. Apply to bespoke raw-`<button>` primitives (kebabs,
  swatches, scanner/lightbox/settle controls). App-level icon buttons use
  `<Button size="icon">` (already 44px) instead.

## Buttons (`src/components/ui/button.tsx`)

**One component for every button.** Never hand-roll a `<button>` with button styling — add a
variant instead. Enforced by a PostToolUse hook + an ESLint `no-restricted-syntax` rule; raw
`<button>` is allowed only in the primitive layer (`components/ui`, `components/glass`,
`*primitives.tsx`) for bespoke surfaces (swatches, segmented controls, kebab triggers).

| | |
|---|---|
| **Variants** | `default` · `brand` (gradient CTA) · `glass` (neutral bordered pill) · `destructive` · `destructive-soft` · `outline` · `secondary` · `ghost` · `link` |
| **Sizes** | `default` · `sm` · `lg` · `icon` (**44×44 touch target**) · `icon-sm` (36px visual + 44px hit area, for dense tables/toolbars) · `pill` (rounded-full) |
| **Props** | `loading` / `loadingText` (spinner + auto-disable, sets `aria-busy`) · `asChild` |

**Icon-only buttons must carry an `aria-label`** (the glyph is not an accessible name). For
bespoke raw-`<button>` primitives that legitimately stay raw (kebabs, swatches, scanner /
lightbox controls), add the `hit-area` utility class so the tap target reaches 44px without
enlarging the visual — see the Accessibility baseline section.

## Header action rows (`src/components/layout/header-actions.tsx`)

**One 40px pill language for every page toolbar + mobile header — never hand-roll toolbar
controls.** Every control in a header row is exactly **40px tall**, `rounded-full`, with
`gap-2` between them (the `PageToolbar` default). Compose from these — they're the single
source of truth, so the row can't drift screen-to-screen (the bug this section fixed):

| Control | Component | Notes |
|---|---|---|
| Brand CTA | `AddButton` (`glass/empty-state`) | `h-10 rounded-full` gradient pill — the only header CTA |
| Icon button | `HeaderIconButton` | 40px circle (camera, overflow, `+`, import/export); 40px visual + ≥44px `hit-area`; requires `label` |
| Currency switcher | `HeaderCurrencyPill` | the **single** currency control (dashboard, group detail, …) — wraps `CurrencySelect`; don't re-wrap it per screen |
| Period stepper | `HeaderStepper` | 40px `‹ label ›` pill (dashboard month switcher) |

`ImportExportMenu` and the receipts `AddMenu` `+` trigger both compose `HeaderIconButton`.
Do **not** reintroduce `h-9`/`size-11`/`size-10`/`h-[38px]` header controls — they were the
mismatched heights this system replaced.

## Chips (`src/components/glass/chip.tsx`)

`Chip` is the **one** chip/pill toggle for the whole app — a 36px `rounded-full` bordered
pill with a ≥44px tap target, `tone` `dark` (high-contrast page chips) / `soft`
(primary-tinted, for cards/dialogs/sheets). Use it for every filter / category / member
picker. `receipts/filter-chip` is a thin re-export of it. Don't hand-roll
`h-[3Npx] … rounded-full … px-3.5` chips per screen. For a **non-toggle** action pill use
`<Button variant="glass" size="pill">` (e.g. the receipts Select/Cancel buttons).

## Primitives (`src/components/glass/glass.tsx`)

Generic, reusable across the app:

| Component | Notes |
|---|---|
| `Field` | floating-label glass input; props `label`, `icon`, `error`, `invalid` (border-only), `trailing` |
| `PasswordField` | `Field` + built-in eye toggle |
| `PasswordStrengthMeter` + `scorePassword` | 4-segment meter; scoring mirrors the sign-up zod rule |
| `Alert` | `kind`: `err`/`warn`/`ok`/`info` + leading icon |
| `Badge` | round icon badge; `kind`: `primary`/`ok`/`danger` |
| `Checkbox` | custom 20px control (no shadcn Checkbox in this app) |
| `Divider` | "or" divider with hairline rules |
| `BrandWash` | decorative blurred brand blobs |
| `GoogleGIcon` | official 4-color Google "G" |
| `IconTile` | 72×72 accent-tinted square; props `icon`, `accent` (`emerald`/`cyan`/`violet`/`pink`/`info`/`primary`), `size` (default 34); pairs with the `.icon-tile-*` classes |

Auth-specific helpers live in `src/components/auth/glass.tsx`: `CardHead`, `EmailChip`,
`BackLink`.

`src/components/glass/glass-dialog.tsx` holds **`GlassDialog`** — the shared responsive
overlay shell: a centered **frosted** modal on desktop (≥ md) and a slide-up bottom sheet on
mobile, composing Radix Dialog primitives (scrim/focus-trap/Esc) + Framer Motion +
`useReducedMotion`. Layout is header / scrollable body / pinned footer.

- **Mobile sheet = opaque white** (`bg-card`), *not* the frosted desktop glass — frosted reads
  as grey on a phone. Rounded top, top hairline, upward shadow. (Dark mode = the dark card.)
- **Notch**: the grab handle is a `motion.button` — **tap it to dismiss** (with a `whileTap`
  bounce). Drag-to-dismiss was intentionally dropped: tap + scrim + Esc cover it, and a plain
  `onClick` is reliable where drag-vs-tap on one handle was not.
- **Footer `actions` API** (preferred over the raw `footer` prop): `{ primary, secondary,
  destructive }` → **desktop right-aligned** (destructive far-left) / **mobile full-width
  stacked big buttons** (primary → secondary → destructive). Pass plain `<Button>`s; the shell
  lays them out + sizes them per breakpoint. Raw `footer` stays as a legacy escape hatch (the
  remaining modals migrate to `actions` under tech-debt TD-9).

The shared `ConfirmDialog`, all Recurring overlays, the **announcements panel**, and the
**mobile FAB Add/Scan sheet** compose from it. Use it for any new mobile-sheet/desktop-modal
surface instead of re-deriving the pattern.

### Form fields — one filled style
`Input`, `Textarea`, and the `Select`/`CurrencySelect` triggers all share the **DatePicker's
filled look**: `h-10 rounded-xl border-border bg-bg-subtle/70 dark:bg-input/55`, focus
`border-primary` + `ring-4 ring-primary/15`. This is the single field appearance across every
form — don't reintroduce `bg-transparent` / `bg-background` / `rounded-md` per field. Money &
number amounts render in the normal body font — the `.t-num` / `tabular-nums` utility was
**retired** (do not reintroduce it).

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
- `app-layout.tsx` — **no global mobile top bar** (removed; the bottom-bar **More** tab is the
  single mobile-nav entry — it already carries language · profile · account · theme · support).
  Content frame carries `env(safe-area-inset-top)` so page content clears the notch; + tab bar
  + shared modals.
- Language toggle is `LanguageSwitcher`: desktop sidebar = `pill fullWidth` (`compact` globe on
  the rail); **mobile = the `chip` variant in the More-drawer footer, on a 50/50 row next to
  Contact support** (matches the `footChip` style).

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
widget card + head + empty/stat tiles + trend pill (`dashboard/primitives.tsx`),
skeleton + empty state (inline per screen).

## Migration order (indicative)

Foundation → screen by screen. Each is its own cycle. Spec/plan templates live under
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
rate modal on `GlassDialog`; **accent picker retired → emerald locked app-wide**),
**dashboard** ("Focus" direction — the customizable 9-widget grid was **replaced** by a fixed,
curated two-column layout, so the drag/reorder/visibility plumbing was deleted: `widget-renderer`/
`widget-wrapper`/`widget-registry` + the `store/dashboard.ts` Zustand store are gone, along with the
`monthly-forecast`/`category-budget-progress`/`upcoming-recurring`/`coach-card` widgets it distilled.
Sticky `PageToolbar` still owns currency + month (mobile greeting header below it). New components in
`dashboard/focus/` — `primitives.tsx` [`FocusCard` frosted module, `FocusTrailing`, `AmountsEyeToggle`]
+ `modules.tsx` [`FocusHero`, `FocusSafeToSpend`, `FocusRankRibbon`, `FocusDailyFlow`, `FocusCategories`,
`FocusCoach`, `FocusBills`, `FocusRecent`]. Top band: a **hero** on `.glass-card` (28px) with the new
`.dash-hero-sheen` brand glow + the month budget **baked in** as a spent-of-budget meter with a
projected-pace tick, paired with a **Safe-to-spend** card (`bg-primary-soft`) that revives the forecast
(safe-per-day / projected month-end / daily avg). Then a slim amber **rank ribbon**, then two
independent columns: daily-flow **SVG area sparkline** (recharts dropped on the dashboard) + distilled
coach (`<Trans>` prose line + real insight chips) + recent on the left; share-bar category list +
compact bills on the right. **Monthly budget = sum of per-category budgets** (converted to the display
currency); when 0, the meter hides and Safe-to-spend shows a "set a budget" CTA. Reuses `WidgetHead`/
`WidgetEmpty`/`Shimmer`/`TrendPill`/`HiddenDots` from `dashboard/primitives.tsx`, `EmptyState`, and the
existing aggregated/coach/recurring data hooks. Still no `t-num`. `WidgetCard`/`StatTile` remain in
`primitives.tsx` (now unused by the dashboard).
