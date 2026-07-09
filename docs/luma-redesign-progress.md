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
1. **Groups functional rework** (Phase 3b below) — the one large frontend piece left. The app
   currently works and is Luma-reskinned with the OLD group structure (Activity tab, 3-tier
   RolePill, ~11 dialogs). Backend already enforces owner/member. Do this on a box with the
   backend + Postgres running so you can QA the balance/settle/add-expense flows with data.
2. **Backend verification** (Phase 4) — code-complete but not built/tested here: run
   typecheck/tests/migrations up+down + export openapi. See Phase 4.
3. **Phase 5 cleanup** — orphaned i18n keys, docs, lint gate, and **delete `.env.local`**
   (the dead-port API override added for styling review; it will break real local dev).
4. Data-QA the reskinned + restructured screens (Dashboard hero/chart, Categories/Loyalty color)
   once a backend is available — only empty states were verifiable in the build box.

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
- `[x]` Warranties — inherited (StatusBadge tones + coverage bar now Luma). Confirm expired-card
  opacity/danger with data when backend available.
- `[x]` Categories — inherited; color picker retained (accent exception). Default swatch is still
  emerald `#22C55E` in `components/categories/primitives.tsx:14` — consider a neutral default.
- `[x]` Recurring — inherited (due-badge tones via StatusBadge: overdue→danger, due-soon→solid).
- `[x]` Loyalty — inherited; color strip retained. Show-code white panel: confirm it stays white
  in dark with data (uses fixed white bg — should be fine).
  NOTE: all reskin residue auto-neutralized by the token remap; no genuine color leaks remain.
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
- `[ ]` **Groups functional rework** (`pages/groups`, `components/groups`) — see Phase 3b.
- `[x]` Auth (`pages/auth`, `layout/auth-layout`) — verified via inheritance (split screen already
  monochrome/flat; brand CTAs → primary, glass-card flat, BrandWash null). Logic unchanged.
- `[x]` Onboarding (`components/onboarding/onboarding-modal.tsx`) — Luma cleanup DONE & verified
  (flat card, neutral tile, monochrome CTA, no scrim blur, border-strong grab handle). OPTIONAL
  future enhancement: the handoff's larger immersive full-screen tour with big feature previews +
  spotlight/side variants — current is the clean on-system step-modal.
- `[ ]` Admin (low priority) — inherits tokens; light cleanup only.

### Phase 3b — Groups rework detail `[ ]`
Keep `lib/groups.ts` (`simplifyDebts`, balance model) + `hooks/groups/*` untouched.
- Drop Activity tab; delete `group-activity-timeline.tsx` (keep `groups.activities.loadMore` key).
- Roles 3→2 (owner/member): trim `RolePill`/`ROLE_TONE`/`ROLE_ORDER`; `[id].tsx` `isAdmin`→`isOwner`.
- Collapse ~11 overlays → 3 (Manage / Settle / Add-expense). Retire members sub-screen,
  `hub-menu-dialog`, `group-menu-dialog`, `invite-dialog`, `group-history-dialog` (fold history inline).
- New group-native Add-expense sheet (posts via existing `POST /receipts` groupId/paidById/splitAmong).
- Conditional `HeaderCurrencyPill` (only when `useGroupStats` byCurrency > 1).
- Monochrome balances: owe=danger, owed=foreground, settled=muted.

## Phase 4 — Backend `[x]` CODE-COMPLETE (not built/tested here — no node_modules/DB in this box)
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

## Phase 5 — i18n, cleanup, verify `[ ]`
- Remove orphaned keys (both en+sr): `groups.roles.admin`, `settings.profile.address.*`.
- Add new keys (Add-expense sheet, onboarding steps). Keep category/loyalty color keys + `groups.activities.loadMore`.
- Update `docs/design-system.md` (Glass→Luma), trim emerald refs in `CLAUDE.md`.
- Delete dead files (`group-activity-timeline.tsx`, retired dialogs).
- `npm run build` + lint (0 new errors in touched files). Backend migration up+down. Browser QA all screens.

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
