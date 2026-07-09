# Receipto "Luma" Design System

Luma is the app-wide visual system: **flat, monochrome, near-black primary** — neutral
surfaces, 1px hairline borders, minimal shadow, **Geist / Geist Mono** typography, and
**red (`--destructive`) as the only chromatic hue**, reserved for destructive, expired,
overdue, and you-owe states. It replaced the emerald "Glass" system (frosted
`backdrop-filter` surfaces, brand gradients, Plus Jakarta Sans) in 2026; the migration
record lives in `docs/luma-redesign-progress.md` and the remediation plan in
`docs/luma-remediation-plan.md`.

This is the reference. **Compose from here — don't re-derive per screen.** The
foundation is `src/index.css` (tokens, `.t-*` type scale, utilities) +
`src/components/glass/` (shared list/overlay primitives) + `src/components/ui/`
(shadcn-derived controls).

## Principle

One locked set of primitives; every screen is a composition of them. The system exists
to stop consistency drift — if a screen needs a new look for an input, chip, card, or
badge, extend the shared primitive (new variant/prop), never redraw it locally. Token
*names* kept the shadcn vocabulary (`--background`/`--card`/`--primary`/…), so shadcn
components drop in unchanged; the *values* are Luma.

## Tokens (`src/index.css`)

All tokens have light (`:root`) and dark (`.dark`) values and are registered in
`@theme inline`, so each is available as a Tailwind utility (`bg-subtle`,
`text-fg-faint`, …).

### Color

Fully monochrome (chroma 0) except the destructive family:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `oklch(0.985 0 0)` | `oklch(0.165 0 0)` | page wash |
| `--card` / `--popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | elevated surfaces |
| `--foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` | primary text |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.68 0 0)` | secondary text |
| `--fg-2` | `oklch(0.45 0 0)` | `oklch(0.78 0 0)` | mid-tone text |
| `--fg-faint` | `oklch(0.65 0 0)` | `oklch(0.6 0 0)` | tertiary / placeholder (AA-tuned) |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / .10)` | hairlines + dividers |
| `--border-strong` | `oklch(0.87 0 0)` | `oklch(1 0 0 / .18)` | switch track, scrollbar, grab handle |
| `--subtle` / `--bg-subtle` | `oklch(0.968 0 0)` | `oklch(0.255 0 0)` | tiles, tracks, hover fill |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` | buttons/active (inverts in dark) |
| `--ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | focus ring |
| `--destructive` | `oklch(0.55 0.2 27)` | `oklch(0.68 0.19 25)` | destructive fill |
| `--destructive-soft` | `oklch(0.955 0.03 25)` | `oklch(0.3 0.07 25)` | danger-soft bg |
| `--destructive-foreground-on-soft` | `oklch(0.5 0.2 27)` | `oklch(0.82 0.12 25)` | text on danger-soft |

- `--success`/`--warning`/`--info` (+ `-soft`/`-foreground`) and the `--brand-*` stops
  are **neutralized to zero-chroma greys** — legacy call sites render monochrome. Don't
  build new UI on them; use the neutral tiers or `--destructive` explicitly.
- **Never re-inject chroma** onto a neutralized token (`oklch(from var(--success) L C h)`
  was a real bug — it rendered pink). Grep for `oklch(from` if a status tint ever looks
  colored.
- Charts are monochrome: `--chart-1…5` is a grey ramp; the near-black tier marks the
  peak/emphasis. Per-category **data color is the one retained exception** (user-owned
  hex, independent of tokens; neutral fallback `DEFAULT_CATEGORY_COLOR = #6B7280`, grey
  ramps for colorless categories). Per-loyalty-card color was **dropped** per the
  handoff (cards are neutral — the QR/barcode glyph tile + format badge carry identity;
  the backend `color` column is simply unused).

### Elevation & radii

Flat by default — borders do the work.

- `--shadow-1` resting (`0 1px 2px / .05`), `--shadow-2` floating (popovers, sheets,
  toasts, modals; `0 8px 30px / .12` light, `/ .5` dark). Legacy `--sh-*` /
  `shadow-glass-*` aliases collapse onto these two tiers.
- Radius base `--radius: 0.625rem` (10px) → controls are `rounded-lg`; tiles 12px
  (`rounded-xl`); cards/sheets 16px (`rounded-2xl`); pills/chips/avatars/FAB
  `rounded-full`. Mobile sheets: 24px top corners.
- Spacing on a 4px grid; **44px minimum touch target** (see a11y baseline).

### Legacy Glass aliases

`.glass-card` (→ flat card: `bg-card` + hairline + 16px radius + `--shadow-2`),
`.btn-brand`/`.btn-violet` (→ primary fill), `.bg-brand-gradient` (→ solid primary),
`.icon-tile-*` (→ neutral subtle tile) are kept as thin flat aliases in `index.css` so
stragglers render monochrome. Don't use them in new code — write plain tokens.

## Type scale (`.t-*`)

Geist everywhere; Geist Mono (`font-mono`) only for codes, invite URLs, receipt IDs.
`.t-num` is retired — amounts render in normal Geist.

| Class | Spec | Use |
|---|---|---|
| `.t-display` | 38/600, −0.03em | rare page hero |
| `.t-h1` | 26/600, −0.02em | page title |
| `.t-h2` | 21/600 | section title |
| `.t-h3` | 17/600 | dialog titles |
| `.t-title` | 16/600 | card titles, store names |
| `.t-body` | 15/400 | default |
| `.t-body-strong` | 15/600 | amounts, emphasis |
| `.t-sm` | 13/500 | meta, muted labels |
| `.t-xs` | 11/600, +0.06em, UPPERCASE | section eyebrows, table headers |

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
color with an icon **and/or** text. (`StatusBadge` always renders its label; keep it
that way.)

**Contrast.** Body/label text ≥ 4.5:1 on its background. `--fg-faint` is tuned to AA
(~4.65:1 light / ~5.44:1 dark) — verify any new low-emphasis token the same way; don't
eyeball OKLCH. Use `--fg-2` for mid-tone text that must stay readable, `--fg-faint` only
for genuinely de-emphasized text.

**Focus.** Visible `focus-visible:ring-2 focus-visible:ring-ring` on every custom
interactive element (swatches, chips, nav tabs, link cards). Don't leave `outline-none`
without a replacement ring.

**Motion.** The global `@media (prefers-reduced-motion)` rule in `index.css` neutralizes
CSS `animation`/`transition`. **Framer Motion is NOT covered** — guard Framer animations
with `useReducedMotion()` (collapse to opacity/instant). `GlassDialog` and the
onboarding tour already do this.

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
- **Monochrome guardrail** (ESLint `luma/no-chroma`, a local plugin rule in
  `eslint.config.js` — deliberately not `no-restricted-syntax`, which the touch-target/
  raw-button blocks already own; sharing one rule name makes flat config drop whichever
  block loses the last-write-wins merge): errors on
  legacy chromatic palette hexes and on `oklch(from var(--…))` chroma re-injection in
  `src/` (approved exception files — category/card palettes, Price Tracker, Admin — are
  exempt). Opt out with a `chroma-ok: <reason>` disable comment (e.g. a brand asset).

## Components

Every shared primitive below already exists — change its styling only there, never
per-screen. (Hooks/ESLint enforce the button/input/overlay rules; see `CLAUDE.md`.)

- **Button** (`ui/button.tsx`) — 36px default, `rounded-lg`, `gap-2`, 14/500.
  `default` = primary fill (hover opacity .88); `outline` = card bg + hairline (hover
  subtle); `ghost`; `destructive` (red fill). Sizes `sm` 32 / `default` 36 / `lg` 44 /
  `icon` 44 / `icon-sm` 36 visual with 44 hit-area / `pill`. Disabled opacity .45;
  `loading` renders a leading spinner. Legacy `brand`/`brand-violet` alias `default`.
- **Input / Textarea** (`ui/input.tsx`, `ui/textarea.tsx`) — 36px, `rounded-lg`, 1px
  `--border`, `bg-card`, placeholder `--fg-faint`; focus `border-ring` + 3px `ring/25`.
  Field label: the shared `.field-label` class in `index.css` (13/500 `--foreground`,
  7px below-gap — the handoff's label spec); every form modal's local `fieldLabel`
  const points at it. Select + DatePicker triggers reuse the same outline look. Auth
  pages (only) use the 50px glass `Field`.
- **SelectCheck** (`glass/primitives.tsx`) — the app's checkbox: 20px, 6px radius, 2px
  `--border-strong`; checked inverts to primary with a stroke-3 check. There is no
  shadcn Checkbox.
- **Switch** (`ui/switch.tsx`) — 40×23 full-radius track; off `--border-strong`, on
  `--primary`; 18px white knob.
- **Segmented** (`layout/theme-segmented.tsx` + inline mirrors in Settings/Loyalty) —
  track `bg-bg-subtle p-[3px] rounded-[10px]`; options 30px `rounded-[7px]`; active
  `bg-card + shadow-glass-1 + text-foreground`.
- **Chip** (`glass/chip.tsx`) — 34px pill, hairline, card bg, 13/500 muted; hover
  subtle; selected inverts to primary.
- **StatusBadge** (`glass/primitives.tsx`) — the single status pill. Four tones:
  `neutral` (subtle bg), `outline` (hairline, transparent), `solid` (primary), `danger`
  (destructive-soft). Legacy tone keys (`ok`/`info` → neutral, `warn`/`violet`/`primary`
  → solid) are remapped. Feature maps: receipts `completed·scraped·manual → neutral`,
  `pending → outline`, `recurring → solid`, `failed → danger`; warranties `active →
  neutral`, `expiring → solid`, `expired → danger`; recurring `overdue → danger`,
  `duesoon → solid`, `upcoming·paid → neutral`, `paused·ended → outline` (row dimmed).
- **ListCard + rows** (`glass/primitives.tsx`) — one rounded-2xl card whose direct
  children are hairline-divided rows; rows hover `bg-subtle`, tap = smart-open, kebab on
  desktop. `RowActionItem` is the shared action row (supports `danger`, and
  `disabled`+`hint` for gated-not-hidden actions).
- **CatTile / emoji tiles** — square `rounded-xl` `bg-subtle` tiles; uncategorized =
  dashed hairline + receipt glyph. Category color (when set) tints at ~12% alpha.
- **Table** (`ui/table.tsx`) — th `.t-xs`-style 11/600 uppercase `--fg-faint`, hairline
  row dividers, last row borderless.
- **Progress** (`ui/progress.tsx`) — 6px full-radius `bg-subtle` track, `bg-foreground`
  fill; pass `indicatorColor: var(--destructive)` for expired/danger.
- **Pagination** (`ui/pagination.tsx`) — 32px buttons; current = primary fill; others
  ghost; prev/next arrows = outline.
- **Skeleton** (`ui/skeleton.tsx`) — `bg-subtle`, 6px radius, 1.4s left-to-right
  shimmer (`.skeleton-shimmer`).
- **EmptyState** (`glass/empty-state.tsx`) — 56px outlined icon tile, title, muted
  description, one primary CTA (`AddButton`).
- **Toast** (Sonner, configured in `App.tsx`) — flat popover card, hairline, 12px
  radius, 22px status circle (success = primary + check; error = destructive-soft + ✕);
  bottom-right on desktop.
- **GlassDialog** (`glass/glass-dialog.tsx`) — the one overlay shell. Desktop: centered
  flat card, `--shadow-2`, 16px radius, hairline-separated header/footer, plain dim
  scrim (no blur). Mobile: opaque `bg-card` bottom sheet, 24px top corners, 40×4
  `--border-strong` grab handle (tap-to-dismiss), stacked full-width `actions`. Prefer
  the `actions` API (TD-9). `ConfirmDialog` wraps it for destructive confirms
  (destructive-soft icon tile, Cancel ghost + destructive fill).

## Brand

The mark is a charcoal `#343434` rounded square with a white "R" monogram
(`public/brand/receipto-icon.svg` + lockup; masters checked in). In-app it renders via
the inline `LogoMark` (`ui/logo.tsx`) — brand-constant colors that do **not** invert
with the theme, plus an `onPrimary` variant (token-driven inverse) for `--primary`
surfaces like the auth brand panel. Favicon + PWA icon set (`public/icons/`) are
generated from the same master: 72–152 transparent-rounded (`purpose: any`), 192/384/512
full-bleed (`purpose: maskable any`), plus an opaque `apple-touch-icon.png`.
Transactional emails embed `https://receipto.io/img-logo-full.png` from the marketing
site — replace that asset there when rebranding.

## Navigation shell (`components/layout/`)

- **Sidebar** (`app-sidebar.tsx`) — card bg, hairline right border; logo row (30px
  `LogoMark` + wordmark + version); MONEY / WALLET groups with 11px uppercase faint
  labels; items 40px `rounded-lg`, muted + 19px Lucide icons, hover subtle, **active =
  `bg-subtle` + foreground + semibold** (monochrome — never a tinted active state);
  footer avatar + rank + kebab popover.
- **Page toolbar** (`page-toolbar.tsx` / `page-header.tsx`) — card bg, hairline bottom
  border; title + 13px muted subtitle; right-side actions per page (primary CTA hidden
  when a screen has no add action). The toolbar band spans the **full app width**
  (never capped/centered); page content below it is capped at **1180px** by the shared
  `<PageContent>` wrapper (`layout/page-content.tsx`) that every page renders inside
  (some pages use tighter inner caps: groups 1080, settings 1000, categories 880).
- **Mobile tab bar** (`mobile-tab-bar.tsx`) — card bg, hairline top border; Home ·
  Expenses · **center FAB** (50px primary circle) · Warranties · More. The FAB is a
  global context-action slot (`store/fab.ts`) each page rebinds: Expenses → scan/add,
  Warranties → add warranty, Group detail → add expense, Hub → new group, ….
- **Manageable pattern** — desktop kebab menu AND tappable row body; mobile row tap →
  bottom-sheet action list that includes Delete; destructive always routes through
  `ConfirmDialog`; disallowed actions are **gated (disabled + reason), not hidden**.

## Money & i18n

`formatMoney` (`lib/utils.ts`) is the single money formatter — locale-aware (`sr` →
`sr-Latn-RS` → `2.450 RSD`; `en` → `en-US` → `RSD 2,450`; an accepted deviation from the
handoff's fixed de-DE style). Every user-facing string exists in BOTH `en.json` and
`sr.json`.
