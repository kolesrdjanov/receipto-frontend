# Luma Redesign — Progress Tracker

Full visual migration of Receipto from the emerald **"Glass"** system to the flat,
monochrome **"Luma"** system (Geist type, near-black primary, 1px hairlines, red reserved
for destructive/expired only). This file is the single source of truth for resuming the
work on any machine. **Keep it updated as phases land.**

- **Design source of truth:** `~/Downloads/design_handoff_receipto_luma 2/` (README + the two
  `.html` references). Where a value differs from the old app, the design wins.
- **Approved decisions:** keep per-category **and** per-loyalty-card color (the retained accent
  exception, restyled into Luma chrome); full Groups **functional** rework; coordinate the
  backend (drop user address fields; collapse group role enum 3→2).
- **Skip:** Price Tracker (`pages/items`). **Low priority (last):** Admin pages.

---

## NEXT UP (resume here)
**The redesign is COMPLETE — full app migrated + data-QA'd (2026-07-09).** All phases done incl.
Groups 3b, backend verification, docs, and a full-polish pass. No known Luma residuals remain.
Screens data-QA'd against a live seeded stack (light+dark): Dashboard (mono bar chart), Warranties
(mono coverage bars — fixed a pink leak), Categories, Groups (hub/detail/Manage/balances), Loyalty
(opaque cards, white show-code panel), Admin Users.

**Full-polish pass (this session):**
- Removed every frosted `backdrop-filter` (Luma = opaque): bulk-bar, expenses-mobile-header,
  filter-rail, mobile-tab-bar, dashboard/focus/primitives, loyalty card, categories summary rail;
  dropped the filter-sheet scrim blur. (qr-scanner's camera-overlay blur intentionally kept.)
- Neutralized remaining chromatic residue: warranty `KindTile` rainbow tint → `bg-bg-subtle`;
  `DEFAULT_CATEGORY_COLOR` `#22C55E` → neutral `#6B7280`. Confirmed all `--success/--warning/
  --info/--brand-violet` `-soft`/`-foreground` tokens are zero-chroma grey in `index.css`, so the
  ~70 stray `text-success`/`bg-warning-soft`/etc. usages already render monochrome (no churn needed).
- **Out of scope, left as-is:** Price Tracker (`pages/items`) chart hexes; the category/loyalty
  color-picker palettes + per-item colors (the retained color exception); dead `category-breakdown.tsx`.

`.env.local` holds `VITE_APP_API_URL=http://localhost:3000` (correct local-dev value; gitignored).

### Local QA harness (reusable)
Backend + Postgres come up clean: `docker run … postgres:16-alpine` on :5432, `.env` from
`.env.example` (+ JWT secrets), `npm run migration:run`, `npm run start:dev`. OTP email is
disabled without a Resend key, so mint a login code directly:
`INSERT INTO login_codes(codeHash=sha256('123456'), email, expiresAt=now()+'8h'…)` — note the
`timestamp without time zone` reads back in the Node TZ, so pad expiry by the local UTC offset.
Then `POST /auth/verify-code`, seed a group + members (join via invite link) + split expense via
the API, and inject the returned tokens into `auth-storage` in localStorage.

## Status legend
`[x]` done & verified · `[~]` in progress · `[ ]` not started

## Phase 0 — Foundation `[x]`
- `[x]` `src/index.css` `:root`/`.dark` tokens → Luma values (names kept so consumers cascade).
- `[x]` Added `--border-strong`, `--subtle`/`--color-subtle`, `--font-mono`,
  `--destructive-foreground-on-soft` color alias. Neutralized `success/warning/info` + `--brand-*`.
- `[x]` Radii retuned (control 10 / tile 12 `--radius-xl` / card 16 `--radius-2xl`).
- `[x]` 2-tier shadow (`--shadow-1`/`--shadow-2`); legacy `--sh-*`/`shadow-glass-*` alias onto them.
- `[x]` `.t-*` type scale rewritten; `.t-num` kept retired (amounts stay Geist, not mono).
- `[x]` Glass utilities retired in place (`.glass-card` flat, `.btn-brand/.btn-violet`→primary,
  `.bg-brand-gradient`→primary, `.icon-tile-*`→neutral, `.dash-hero-sheen`→hidden).
- `[x]` `index.html`: Google Fonts → Geist + Geist Mono. Verified light+dark.

## Phase 1 — Shared components `[x]` (tsc clean)
- `[x]` `ui/button.tsx` — Luma variants; **`brand`/`brand-violet` re-pointed to primary** (call
  sites update for free). Radius `rounded-lg` (10px). Sizes sm32/def36/lg44/icon/pill.
- `[x]` `ui/input`, `ui/textarea`, `ui/select`, `ui/date-picker`, `ui/input-otp` — unified 36px
  card-bg outline-trigger look, ring focus.
- `[x]` `glass/primitives.tsx` `StatusBadge`+`Tone` → 4 looks (neutral/outline/solid/danger);
  legacy tone keys remapped. `SelectCheck`/`CatTile` tweaks.
- `[x]` `glass/chip`, `glass/empty-state` (AddButton→primary, 56px outlined tile), `glass/glass.tsx`
  (auth Field→card bg+ring; `BrandWash`→null; Checkbox border-strong).
- `[x]` `ui/badge` (success/warning→neutral), `ui/progress` (subtle track/foreground fill),
  `ui/table` (hairlines, faint th), `ui/skeleton`, `ui/switch` (40×23), `ui/checkbox` (20px),
  `ui/avatar` (neutral).
- `[x]` `glass/glass-dialog.tsx` — flat modal + opaque sheet (24px top, 40×4 handle, no scrim blur).
- `[x]` `App.tsx` Sonner toast → flat card, 22px status circle (primary success / danger-soft error).
- `[x]` `ui/language-switcher` compact active → neutral.

## Phase 2 — Nav shell `[x]` (verified light+dark, desktop)
- `[x]` `ui/logo.tsx` — **new monochrome `LogoMark`** (near-black square + white receipt glyph);
  retired the emerald/gradient `logo-*.svg` render. `Logo` renders mark + "Receipto" wordmark.
- `[x]` `layout/app-sidebar.tsx` — neutral active nav (`bg-subtle`+foreground+semibold), logo header
  via `LogoMark`, monochrome rank icons, admin sub-item neutral active.
- `[x]` `layout/mobile-tab-bar.tsx` — FAB `variant="default"` (50px primary circle), active tab foreground.
- `[x]` `layout/page-toolbar` (flat, no frost), `header-actions` (flat pill), `theme-segmented`
  (radius 10/7), `fab-action-sheet` (neutral chips).

## Phase 3 — Screens `[~]`
Reskin screens inherit Luma from Phases 0–2 (token remap neutralizes residue). Verified:
Expenses shell + Dashboard shell (empty states) render correct Luma.
- `[x]` Expenses (`pages/receipts`) — verified, inherited. No edits needed beyond primitives.
- `[x]` Warranties — data-QA'd (2026-07-09, light+dark). **Fixed a real color leak:** the
  `CoverageBar` `FILL_COLOR`/`STATUS_TONE`/`STATUS_TEXT` still derived from the neutralized
  `--success`/`--warning` tokens via `oklch(from … 0.6 0.15 h)`, which forced chroma onto hue 0 →
  rendered **pink**. Now monochrome: bar fill = `--foreground` (active+expiring), `--destructive`
  (expired); badge tones active→neutral / expiring→solid / expired→danger. Expired card
  opacity+danger confirmed with data.
- `[x]` Categories — inherited; color picker retained (accent exception). Default swatch is still
  emerald `#22C55E` in `components/categories/primitives.tsx:14` — consider a neutral default.
- `[x]` Recurring — inherited (due-badge tones via StatusBadge: overdue→danger, due-soon→solid).
- `[x]` Loyalty — inherited; color strip retained. **Feature-flagged OFF by default**
  (`feature_loyalty_cards` ✗) so `/loyalty-cards` redirects to /dashboard until the flag is enabled
  in admin app-settings; primitives are Luma-clean at build/type level. Show-code white panel: still
  worth confirming it stays white in dark once the flag is on.
  NOTE: the token remap neutralizes most residue, BUT watch for `oklch(from var(--success|--warning)
  …)` expressions that re-inject chroma onto the now-hueless tokens (see the Warranties fix above) —
  grep for `oklch(from` if any status tints still look colored.
- `[x]` **Dashboard restructure** (`pages/dashboard`, `components/dashboard/focus/*`) — DONE
  (code-complete; **data-view unverified — needs backend to QA visually**). Daily-flow chart
  rewritten as a **monochrome bar chart** (grey bars, near-black peak, faint zero stubs,
  gridlines + k-axis, hover caption). **Rank ribbon removed** → demoted to a neutral chip in the
  hero corner (`FocusHero rankLabel`). Over-pace badge → danger; budget-left → foreground;
  fallback category colors → neutral greys (kept per-category colors still render). `dash-hero-sheen`
  already hidden by Phase 0.
- `[x]` **Settings restructure** (`pages/settings/index.tsx`, `components/settings`) — DONE & verified.
  Desktop nav rail now switches one section at a time (dropped scroll-spy); **Address form removed**
  (fields, draft, MapPin, save payload); AccentRetired note monochrome. Danger zone type-DELETE intact.
  NOTE: `me.street/zipCode/city` still exist in `hooks/users/use-me.ts` types — clean in Phase 4.
- `[x]` **Groups functional rework** (`pages/groups`, `components/groups`) — DONE & data-QA'd. See Phase 3b.
- `[x]` Auth (`pages/auth`, `layout/auth-layout`) — verified via inheritance (split screen already
  monochrome/flat; brand CTAs → primary, glass-card flat, BrandWash null). Logic unchanged.
- `[x]` Onboarding (`components/onboarding/onboarding-modal.tsx`) — Luma cleanup DONE & verified
  (flat card, neutral tile, monochrome CTA, no scrim blur, border-strong grab handle). OPTIONAL
  future enhancement: the handoff's larger immersive full-screen tour with big feature previews +
  spotlight/side variants — current is the clean on-system step-modal.
- `[x]` Admin (low priority) — data-QA'd (Users table): Luma hairline table, faint uppercase th,
  **monochrome role pills** (Admin/User neutral, not emerald), neutral active nav. Inherits tokens.

### Phase 3b — Groups rework detail `[x]` DONE (data-QA'd 2026-07-09)
Keep `lib/groups.ts` (`simplifyDebts`, balance model) + `hooks/groups/*` untouched.
- `[x]` Roles 3→2 (owner/member): `RolePill`/`ROLE_TONE` monochrome + typed `owner|member`,
  `ROLE_ORDER` trimmed, `use-groups.ts` `GroupMember.role` typed `owner|member`, `[id].tsx`
  `isAdmin` aliased to `isOwner` (temporary alias — remove during dialog collapse).
- `[x]` Dropped Activity tab: deleted `group-activity-timeline.tsx`; `[id].tsx` detail is now
  tabs-less (plain "Expenses · N" header + feed). `GroupTabs` (primitives) and `useGroupActivities`
  (use-groups) are now UNUSED exports — remove when convenient. Backend activities endpoint left intact.
- `[x]` **Collapsed overlays → Manage / Settle / expense editor+detail.** New
  `components/groups/group-manage-sheet.tsx` folds edit-details (→ GroupModal), members list w/
  remove, email invite, invite-link toggle+copy+regenerate+share grid, and Archive/Leave/Delete.
  Owner-gated bits hide for members; invite link open to all (matches backend). `[id].tsx` rewired:
  dropped the `screen==='members'` sub-screen, kebab + avatar-stack now open Manage, settlement
  **history folded inline** under the expenses feed. **Deleted** `group-menu-dialog`, `invite-dialog`,
  `group-history-dialog`, `group-members-panel`, `invite-link-card`, `hub-menu-dialog`; removed dead
  `GroupTabs` (primitives) + `useGroupActivities` (use-groups). Hub archived toggle is now an inline
  chip (no ⋯ menu).
- `[x]` **Add-expense** kept on the existing `ReceiptModal` (already supports
  groupId/paidById/splitAmong) rather than a parallel editor — deliberate scoping call; the modal
  is opened from the FAB/Add-expense CTA with group prefill. A bespoke group-native editor remains
  an OPTIONAL future refinement.
- `[x]` Conditional currency control: `HeaderCurrencyPill` only when `stats.byCurrency.length > 1`;
  otherwise a plain muted currency caption. Verified (single-currency group shows "RSD" caption).
- `[x]` Monochrome balances audit: owe=danger, owed=**foreground** (not green), settled=muted —
  `group-hero` STATE, `primitives` Money/BalancePill, hub overall-net + invite card, history-list +
  settlement-modal amounts. Verified with a seeded balance (owed RSD 1,400 renders near-black).
- NOTE: hardened three pre-existing non-array crashes surfaced during data-QA (never hit before
  because Groups-with-data was never QA'd): `announcement-list.tsx:31` (mirror the Array.isArray
  guard already at :91), `computeConvertedBalances` (lib/groups.ts), `group-history-list`. Root
  trigger was a missing `VITE_APP_API_URL` (SPA HTML returned for API calls) — but the guards are
  correct defensive hardening regardless.

## Phase 4 — Backend `[x]` VERIFIED (2026-07-09: typecheck 0, 98 specs pass, migrations up+down+reapply clean on Docker PG, openapi exported)
- `[x]` **A. Dropped user address** (`street`/`zipCode`/`city`): removed from `user.entity.ts`,
  `update-me.dto.ts`, `users.service.ts` (PublicUserProfile, updateMe, buildPublicProfile,
  getUserDetails), `users.service.spec.ts`. Migration
  `migrations/1783600000000-DropUserAddressFields.ts` (up drops, down re-adds). Frontend side also
  cleaned: `hooks/users/use-me.ts` (Me/UpdateMeData), `hooks/admin/use-admin-users.ts` (UserDetails),
  `pages/admin/user-details.tsx` (address InfoItem + MapPin import removed), Settings form removed.
- `[x]` **B. Role enum 3→2**: dropped `ADMIN` from `entities/group-member.entity.ts`. Replaced
  `checkAdminAccess` with `checkOwnerAccess` (update/inviteMember/removeMember/archive/unarchive)
  and `checkMemberAccess` (invite-link get/generate/update — everyone can invite via link).
  Updated `groups.service.spec.ts:325-334` (owner not admin). Migration
  `migrations/1783600000001-CollapseGroupRoleEnum.ts` (up migrates admin→member + recreates enum
  without admin; down restores). Stale `// checkAdminAccess` comments in the spec are harmless.
- Activities endpoint left intact (frontend just stops calling it after Phase 3b).
- **REMAINING verification (run on a box with backend deps + Docker Postgres):**
  `npm ci` → `npm run typecheck` → `npm test` (users + groups specs) → `npm run migration:run`
  then `migration:revert` ×2 to prove up/down → `npm run export-openapi` (with `ENABLE_DOCS=true`)
  to refresh `docs-site/static/openapi.json` → update `docs/requirements/modules/{users,groups}.md`.
- Frontend `role: 'owner'|'admin'|'member'` union in `hooks/groups/use-groups.ts:9` still lists
  admin (harmless superset; backend never returns it now) — trim during Phase 3b.

## Phase 5 — i18n, cleanup, verify `[~]` (mostly done 2026-07-09)
- `[x]` Removed orphaned keys (en+sr): `groups.roles.admin`, `settings.profile.address.*`,
  admin `addressLabel`/`noAddress`, `groups.hub.options`/`showArchivedGroups`. Added
  `groups.manage.*` + `groups.hub.showArchived`/`hideArchived` (both locales).
- `[x]` Deleted dead files (retired group dialogs — see 3b). `group-activity-timeline.tsx` was
  already gone.
- `[x]` `npm run build` passes (tsc + vite); touched files lint clean (0 new errors); backend
  migrations up+down verified.
- `[ ]` **Docs copy pass** — `docs/design-system.md` (Glass→Luma), trim emerald refs in `CLAUDE.md`.
  (Only remaining item.)

---

## Environment / gotchas for resuming
- **No backend/DB in the current dev box** → data pages only show empty/loading states. A gitignored
  `.env.local` (`VITE_APP_API_URL=http://127.0.0.1:3999`) was added so pages render for styling review.
  **Delete `.env.local` for real local dev** (it overrides `env.local`). To QA with data, run the
  NestJS backend + Postgres and remove `.env.local`.
- Preview: dev on `:5173`. Inject `auth-storage` localStorage + set `receipto-onboarding-completed`
  to reach app screens; toggle `receipto-settings.state.theme` for dark.
- Buttons must stay the shared `<Button>` (ESLint/hook enforced); brand variants now alias primary.
- Verified so far: sign-in, dashboard shell, expenses shell — all Luma, both themes, tsc clean.
