# Luma Remediation Plan — close the audit gaps + new brand rollout

Drafted 2026-07-09 from the completion audit (report:
https://claude.ai/code/artifact/2c61f940-4ee2-4cdd-975d-8554378285b6). The audit found the
Glass→Luma migration ~75–80% delivered: tokens/components/nav/overlays/Groups/Settings/backend
are genuinely done; the gaps are four structural items (Dashboard hero+KPI, Auth brand panel,
Onboarding tour, Groups add-expense sheet), live chromatic residue, ~15 fidelity drifts, and an
unfinished docs pass. Separately, a **new brand identity landed** (`~/Downloads/brand/`):
charcoal `#343434` rounded-square + white "R" monogram (`receipto-icon.svg`, 512² PNG master)
and a lockup with the wordmark + period accent (`receipto-lockup.svg`, 1056×264 PNG). Monochrome
— fits Luma; replaces both the emerald-gradient icon set *and* the interim inline receipt-glyph
`LogoMark`.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done & verified.
Keep this file updated as phases land (same convention as `luma-redesign-progress.md`).

---

## Decisions needed before/while building (each blocks one item only)

> **Chosen (2026-07-09):** D1 Equally-only (by-amount awaits API support) · D2 neutralize
> avatars · D3 keep locale-aware money (accepted deviation) · D4 build the tour ·
> D5 descope the mobile dashboard split · D6 drop filter-rail counts.

| # | Decision | Blocks | Recommendation |
|---|---|---|---|
| D1 | **Groups "By amount" split** — backend `splitAmong` is a plain userId list; per-person amounts need API + entity work. Build now, or ship the bespoke sheet Equally-only? | P5.1 | Ship sheet Equally-only now; schedule backend split-amounts separately |
| D2 | **Group avatar identity colors** — neutralize to grey tones, or bless as a 3rd approved color exception? | P1.4 | Neutralize (identity still reads via initials); if kept, must be documented in design-system.md |
| D3 | **Money format** — keep locale-aware (`en-US` → "RSD 2,450"), or force the handoff's de-DE grouping ("2.450 RSD") for all locales? | P6 accept-list | Keep locale-aware; record as accepted deviation |
| D4 | **Onboarding tour** — build the specced full-screen tour, or formally descope (amend handoff + tracker)? | P4 | Build; it's the largest remaining visible gap |
| D5 | **Mobile dashboard Overview/Insights split** — build or descope? | P2.6 | Descope this pass; single scroll works, revisit after P2 lands |
| D6 | **Filter-rail category counts** — needs backend (per-category receipt counts in the categories or stats response). Build endpoint work or drop from spec? | P6 fix-list | Drop for now; needs API design, low value vs cost |

---

## Phase 0 — New brand rollout `[x]` (2026-07-09)

Assets: copy from `~/Downloads/brand/` into the repo first (Downloads is volatile).

- `[x]` 0.1 Copy `receipto-icon.svg` + `receipto-lockup.svg` (+ PNG masters) into `public/brand/`.
- `[x]` 0.2 **Favicon**: replace `public/icons/icon.svg` (currently emerald `#08A373` + `#059669/#06B6D4/#8B5CF6` gradient) with the new icon. `index.html:5` link unchanged.
- `[x]` 0.3 **PWA raster set**: regenerate `public/icons/icon-{72,96,128,144,152,192,384,512}.png`
  from the 512² master. `purpose:"any"` = rounded square on transparent; `purpose:"maskable"`
  (192/512) = full-bleed `#343434` canvas with the R centered in the 80% safe zone.
- `[x]` 0.4 **apple-touch-icon**: full-bleed opaque PNG (no transparent corners — iOS composites
  them black) for the 152/180/192 links in `index.html:17-20`.
- `[x]` 0.5 **`ui/logo.tsx`**: replace the inline receipt-glyph `LogoMark` with the new R mark
  (import the SVG asset; fixed brand `#343434` + white in both themes — stop inverting via
  `bg-primary`). Consumers to verify: sidebar 30px (`app-sidebar.tsx:190`), auth
  (`auth-layout.tsx:66,92`, `auth/glass.tsx:29`). Wordmark stays HTML text next to the mark;
  use `receipto-lockup.svg` only where a standalone lockup is wanted.
- `[x]` 0.6 Delete the orphaned old-brand `public/logo-icon.svg`, `logo-text.svg`,
  `logo-full.svg` (verified: zero references in frontend src or backend).
- `[x]` 0.7 Align chrome colors (optional polish): `index.html:11` `theme-color #0a0a0a` and
  `manifest.json` `theme_color #18181b` / `background_color #09090b` → Luma `--background`
  values; add light/dark `theme-color` media variants.
- `[!]` 0.8 **Coordination (outside this repo — still open)**: transactional emails embed
  `https://receipto.io/img-logo-full.png` (`receipto-backend …/email-templates.ts:24`) — the
  marketing-site asset must be replaced with the new lockup or emails keep the old brand.

Verify: build; favicon in a real tab (light + dark browser theme); installed-PWA icon on one
device or Lighthouse; sidebar + auth mark in both app themes.

## Phase 1 — Purge live chromatic residue `[x]` (2026-07-09)

- `[x]` 1.1 Settings "accent retired" copy still says *emerald* in **both locales**
  (`settings.accentColor.retiredHelp`, en + sr) → rewrite for monochrome; fix the stale
  "emerald-locked" comment near `AccentRetired` (`components/settings/primitives.tsx`).
- `[x]` 1.2 `recurring-expenses/category-breakdown.tsx:4-7,55` — chromatic `FALLBACK_COLORS`
  (indigo/pink/amber/emerald…) → neutral grey ramp (mirror `pages/dashboard/index.tsx:38`).
  While there: make the bars two-column per spec (see P6).
- `[x]` 1.3 `loyalty-cards/loyalty-card-scanner.tsx:17,170` — emerald laser
  `oklch(0.78 0.15 165)` → foreground/white.
- `[x]` 1.4 `groups/primitives.tsx:30,78` — avatar gradients (chroma .13–.16, hues 165–345):
  apply D2. Also fix undefined `var(--bg-elev)` at `:58,:126` (avatar ring silently absent) →
  `--card`.
- `[x]` 1.5 Delete dead chromatic code: `KIND_COLOR`/`kindColor()` in
  `warranties/warranty-view.ts:32-46` (zero callers); never-imported legacy widgets
  `dashboard/category-insights.tsx`, `savings-opportunities.tsx`, `frequent-items.tsx`;
  unused `WidgetCard`/`StatTile` exports in `dashboard/primitives.tsx`.

Verify: grep sweep — chromatic hexes / `oklch(` with nonzero chroma outside `--destructive`,
approved per-item colors, Google G, and `pages/items` + admin charts (out of scope) = zero hits.

## Phase 2 — Finish the Dashboard restructure `[x]` (2026-07-09, data-QA’d on the seeded stack)

All in `pages/dashboard/index.tsx` + `components/dashboard/focus/*`.

- `[x]` 2.1 **One-card two-zone hero**: merge `FocusHero` + the standalone safe-to-spend card
  (`modules.tsx:182,210` — currently `rounded-[28px] bg-primary-soft`, old composition). Left:
  "Spent in {month}" + big amount + vs-last-month badge + budget meter; right: `--subtle` tinted
  zone with Safe-to-spend/day + "for N more days" + Projected month-end row with "Over by X"
  **danger** badge. Rank chip stays in the hero corner. Remove the dead sheen node
  (`modules.tsx:74`) and the `.dash-hero-sheen` CSS.
- `[x]` 2.2 **KPI strip** — 4 flat tiles: Daily average · Budget left · Days left · Receipts
  (receipts count from the aggregated endpoint). Then **de-dupe**: each number appears exactly
  once (today daily-avg ×2, vs-last-month ×3).
- `[x]` 2.3 Pace marker on the budget meter → `--destructive` (currently `bg-foreground`,
  `modules.tsx:111`).
- `[x]` 2.4 Retire old Glass leftovers in focus modules: `rounded-[28px]`/`rounded-3xl` →
  16px cards, `bg-primary-soft` → tokens, `variant="glass"` button (`modules.tsx:193`),
  legacy `TrendPill` success/warn token styling → explicit neutral/danger.
- `[x]` 2.5 Desktop control row gets the greeting (today mobile-only); chart X-axis day ticks.
- `[–]` 2.6 Mobile Overview/Insights split — **descoped per D5** (single scroll kept).

Verify: seeded stack (QA harness in `luma-redesign-progress.md`), light + dark, over-budget and
under-budget fixtures.

## Phase 3 — Auth brand panel `[x]` (2026-07-09, verified light+dark)

All in `components/layout/auth-layout.tsx` + i18n.

- `[x]` 3.1 Left `<aside>` → **near-black brand panel**: `bg-primary` (inverts in dark per
  handoff), new logo mark, tagline, 3 feature rows restyled for on-primary contrast, © line
  moved into the panel.
- `[x]` 3.2 Remove the Glass-era `MiniDashboard` decoration (rotated fake cards + 64% budget
  bar, `auth-layout.tsx:21-54`).
- `[x]` 3.3 Copy: `auth.brandTagline` → "Every receipt, in order." (+ Serbian), code-step title
  → "Check your inbox", divider → "or continue with email", email chip gets an inline
  **Change** affordance (replaces the bottom "Use a different email" link). Both locales.
- `[x]` 3.4 Decide PayPal "Support us" link placement (unspecced; keep in form footer or drop).

Verify: preview `/sign-in` light + dark (no backend needed — this session confirmed it renders);
OTP step + resend countdown still work (logic untouched).

## Phase 4 — Onboarding tour (per D4) `[x]` (2026-07-09, all 6 steps verified)

`components/onboarding/onboarding-modal.tsx` → full-screen guided tour per handoff §10:

- `[x]` 4.1 Full-screen layout replacing the 432px modal; `variant` prop — `spotlight`
  (default, centered preview + copy beneath) and `side` (preview + text side-by-side).
- `[x]` 4.2 Six steps stay (Language → Install → Track → Categories → Warranties → Groups);
  build **large feature previews** by composing real Luma primitives (budget bars, a warranty
  card, the group balance card, a scanned-expense row) instead of 72px icon tiles.
- `[x]` 4.3 Top progress bar with "N / 6"; persistent Skip (all steps) + Back/Next → Get
  started; animated step transitions behind `useReducedMotion`.
- `[x]` 4.4 Keep: `receipto-onboarding-completed` gate, language wiring, completing → dashboard.
  Drop unused `onboarding.step5` key (or re-home if the tour re-adds price tracking later).

Verify: preview both themes + reduced-motion; mobile full-screen variant.

## Phase 5 — Groups finishers `[x]` (2026-07-09, add-expense E2E against live backend)

- `[x]` 5.1 **Bespoke add-expense sheet** (per D1): "What for", big amount + currency, paid-by
  **avatar chips** (default you), Split segmented (Equally now; By-amount when backend lands),
  member checklist with per-person share display, Category + Date outline triggers. Reuse
  ReceiptModal's mutation hooks; stop leaking receipt-only fields (receipt number, AI
  suggestions) into the group flow. FAB + CTA rebind to it.
- `[x]` 5.2 Balance hero: member balances **always shown** — remove the expander
  (`group-hero.tsx:150-161`); "simplest way to settle" row highlight `--subtle` (not
  primary-soft).
- `[x]` 5.3 Manage sheet: inline name + emoji editing (fold the two GroupModal fields in;
  GroupModal becomes create-only) — kills the 4th overlay the spec collapsed.
- `[x]` 5.4 New-group modal: add the invite-after-creating hint.
- `[x]` 5.5 Cleanup: dead `onOpenHistory`/`flush` props (`group-hero.tsx`,
  `group-history-list.tsx`), `groups.activities.*` i18n family (13 strings — first re-home
  `groups.activities.loadMore` used by `group-expenses-list.tsx:115`), stale green/red comments
  in `groups/primitives.tsx:18,136,305`, `.t-num` class references (undefined utility) in
  `expense-row.tsx` / `primitives.tsx`.

Verify: seeded multi-member group — add expense (equal split), settle, manage-edit name/icon,
archive/leave/delete; both breakpoints.

## Phase 6 — Fidelity-drift triage `[x]` (2026-07-09 — fix list applied; accept list recorded in the tracker)

**Fix list** (cheap, high alignment — one sitting each):

- `[x]` Content cap: shared page-container (`max-w-[1180px] mx-auto`) in `app-layout.tsx` or
  per page; remove the no-op `max-w-unset` (not a real utility — confirmed absent from built
  CSS). Groups 1080 / Settings 1000 / Categories 880 stay per-page if preferred.
- `[x]` Badge tones: receipt `pending` → outline (`receipts/primitives.tsx:9-16`); recurring
  `paused` → outline (`recurring-expenses/primitives.tsx:25-32`).
- `[x]` Toasts → bottom-right desktop (`App.tsx:97`).
- `[x]` GlassDialog header 1px bottom border + footer 1px top border; ConfirmDialog Cancel →
  ghost; pagination prev/next → outline.
- `[x]` Skeleton: 1.4s left-to-right shimmer keyframes (replace `animate-pulse`); radius 6.
- `[x]` Checkbox consolidation: one 20px/6px-radius checkbox — either adopt orphaned
  `ui/checkbox.tsx` and migrate `SelectCheck` + `glass.tsx:206-221`, or delete the orphan and
  keep `SelectCheck` as canonical. Update CLAUDE.md rule 7 to match (see P7).
- `[x]` Settings: rename "Danger zone" → "Account", add **Sign out** to it, add the
  progress-to-next-rank bar (key `settings.profile.rank.progress` already exists), add
  **Discard** next to Save; language as segmented control.
- `[x]` Loyalty editor: manual Barcode/QR type toggle (today type changes only via scan —
  hand-typed QR values can't be saved as QR).
- `[x]` Expenses summary: total → 22/600, "N receipts" as a neutral badge; day-group header →
  12.5/600 muted (not `.t-xs` full-foreground).
- `[x]` Mobile manageability: journal-receipt viewer gets gated Edit/Delete actions (parity
  with the desktop kebab); recurring desktop rows body-tappable.

**Accept list** (record in tracker as accepted deviations, then stop tracking):
dimension batch (sidebar 280, tab bar 72, avatar 92, confirm tile 48, rail 240, coverage track
8px, expired dim 0.72, warranty grid 320) · warranty tabs via 4 status queries · money format
(per D3) · categories mobile row-tap = edit (deliberate, hinted in UI copy) · warranty-card
file thumbnails (richer than spec) · real `react-barcode` render (better than spec) · underline
Tabs variant (no current consumer — build only when a screen needs it).

## Phase 7 — Docs, guardrails, loose ends `[x]` (2026-07-09)

- `[x]` 7.1 Rewrite `docs/design-system.md` body for Luma (it still teaches brand gradients,
  frosted `.glass-card`, `--brand-emerald` under a "superseded" banner).
- `[x]` 7.2 CLAUDE.md: fix "radius default is rounded-xl" (code: `rounded-lg` = 10px), "40px
  inputs" (36px), "no Checkbox component" (per P6 outcome); rule 1's variant list
  (`brand`/`glass` are aliases now); note the new brand assets.
- `[x]` 7.3 Correct `luma-redesign-progress.md`'s "COMPLETE / no known residuals" headline;
  link this plan; log phases as they land.
- `[x]` 7.4 Stale-comment sweep: "scroll-spy" (`pages/settings/index.tsx:52`,
  `settings/primitives.tsx:265`), "emerald-soft" (`App.tsx:12-15`), "frosted glass" JSDoc
  (`glass/glass-dialog.tsx`).
- `[x]` 7.5 Quick audit of `pages/templates` (in neither the handoff scope nor the tracker;
  composes shared primitives so likely fine — 30 min).
- `[x]` 7.6 Guardrail — shipped as an ESLint `no-restricted-syntax` rule (no hooks dir exists in this checkout): blocks chromatic
  hexes and `oklch(from var(--` in `src/` outside the approved-exception files — makes the
  monochrome invariant machine-enforced instead of audit-enforced.

---

## Sequencing & effort

P0 and P1 are independent half-days — do first (highest visibility per effort; P0 unblocks the
brand everywhere). P3 (auth, ~half-day) and P2 (dashboard, 1–1.5d) are independent of each
other. P4 (onboarding, 1–2d) and P5 (groups, 1–2d) independent. P6 fix-list ~1d spread across
files; P7 half-day, last (docs describe the end state). **Total ≈ 5.5–8 dev-days** for the
build phases depending on D1/D4/D5; every phase is independently shippable and verifiable.

Definition of done: re-run the audit checklist — structural gaps closed or formally descoped
(handoff/tracker amended), chroma sweep clean, docs match code, tracker headline true.
