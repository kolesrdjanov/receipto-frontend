# Settings & Account — "Glass" redesign (design)

**Date:** 2026-06-04 · **Branch:** `feature/redesign-main-branch` · Handoff: `~/Downloads/design_handoff_settings/`

The 8th screen cycle (after auth, onboarding, expenses, recurring, categories, warranties,
loyalty, navigation shell). Re-presents the four **Settings & account** surfaces; the **data
layer is kept verbatim** (`useSettingsStore`, `use-me.ts` hooks, `use-ratings.ts`, `lib/rank.ts`,
routes, validation, i18n keys — all unchanged). Net-new code is presentation, a small per-module
primitives file, one extracted shared control, a handful of translation keys, and one
cross-cutting theming change (emerald lock).

## The four surfaces
1. **App settings** (`/settings/app`) — Appearance (theme + retired-accent note), Language, Currency, Notifications.
2. **Profile** (`/settings/profile`) — avatar, names, email, address, income, receipt **rank**, dirty-gated Save.
3. **Account** (`/settings/account`) — change password + a destructive **Danger Zone**.
4. **Rate app modal** — 5-star rating dialog reached from the profile popover / mobile drawer.

All four live **inside the finalized app shell** (`AppLayout` + sidebar + `PageToolbar` on desktop;
frosted mobile header + bottom tab bar on mobile) shipped in the navigation-shell cycle (`90107d7`).
The shell is reused, not re-derived. Per the handoff IA: **no settings sub-nav** — the three pages
stay separate destinations, "Settings" stays active in the sidebar on all three, and `settings.tabs.*`
keys stay intentionally unused.

## Decisions (resolved with the user)
1. **Accent color is fully retired → emerald locked app-wide.** The 6-swatch picker is removed and
   replaced by the dashed **"Accent color · Retired"** note (lock tile + uppercase warn-tinted
   "Retired" tag + explanation + a locked emerald gradient swatch). Theming is forced to brand
   emerald everywhere (not just the settings subtree): base `:root`/`.dark` `--primary` (+ `--ring`)
   point at brand emerald, `--primary-soft` auto-derives via `oklch(from var(--primary) …)`, and
   `applyAccentColor` stops adding `accent-*` classes (strips any stale one). The dead 6 `.accent-*`
   CSS blocks are removed. The `accentColor` store field is **kept** (no longer affects theming) so
   persisted state migrates safely; the `setAccentColor`/`AccentColor` type stay for now. This
   supersedes the accent-aware sidebar behavior from the nav-shell cycle — everyone becomes emerald.
2. **Theme control unified via a shared `ThemeSegmented`.** The icon-only segmented control currently
   private to `app-sidebar.tsx` is extracted to `components/layout/theme-segmented.tsx` with a
   `labeled` variant (icon-only in the sidebar, icon + "Light/Dark/System" label on the settings
   row). Both bind the same `useSettingsStore().theme`; App settings drops its `Select`.
3. **Notifications = one grouped switch list.** The 3 email toggles render as a single iOS-style list
   of rows (label + help + `Switch`) inside the Notifications card, not 3 bordered blocks. Same
   `updateMe.mutate({ <flag>: checked })` wiring (`receiptMilestoneEmailsEnabled`,
   `warrantyReminderEnabled`, `budgetAlertEnabled`).
4. **Rank card → Glass tier crest.** Crest tile + "RECEIPT RANK" kicker + tier name (22/800) +
   "Receipts tracked: {count}" + progress block (label/pct row, 8px tier-colored fill, next-rank
   line) + per-tier description. Tinted per tier; same data from `lib/rank.ts` (`normalizeRank`,
   `getNextRank`, `getProgressToNextRank`) — unchanged.
5. **Password form matched to Auth.** Change-password fields adopt the glass `Field`/`PasswordField`
   treatment and gain the auth `PasswordStrengthMeter` under New Password. **Validation rules are
   unchanged** (current required, new required, ≥ 8 chars, `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/`,
   new === confirm; same error keys). Kept as the existing local-state form (no RHF/zod migration —
   that is TD-1, out of scope here).
6. **Destructive delete is responsive.** Desktop = the current **inline** type-DELETE expand inside
   the card. Mobile = a **`GlassDialog` bottom sheet** confirm (danger badge, warning + bullets +
   type-DELETE input + full-width destructive confirm → ghost Cancel). Same gate
   (`deleteConfirmText === 'DELETE'`).
7. **Rate modal → `GlassDialog`.** Replaces the shadcn `Dialog` so it is a centered 480px glass
   modal on desktop and a slide-up sheet on mobile. Star picker (34px, amber when filled/hovered,
   `displayRating = hover || rating`), optional `Textarea` (4 rows, max 1000, live `{n}/1000`
   counter), glass `Checkbox` "Allow displaying…", dirty-gated submit (disabled at 0 stars),
   edit-prefill + "Update Rating" label. All `use-ratings` wiring unchanged.

## Architecture / files
- **`components/settings/primitives.tsx`** *(new, component-only — keeps the
  `react-refresh/only-export-components` lint rule happy)*: `SettingsCard` (icon + title + desc head,
  `danger` variant), `SettingRow` (label/help left, control right, stacks on mobile), `AccentRetired`
  note, `RankCard` (tier crest, tone map), `NotifList`/`NotifRow`, `SaveBar` (clean/dirty/saving),
  `StarPicker`. Tier tone map drives crest-tile bg + card tint + progress fill (amber/blue/emerald/muted).
- **`components/layout/theme-segmented.tsx`** *(new, extracted)*: `ThemeSegmented({ labeled? })`;
  `app-sidebar.tsx` imports it (replacing its private copy) in both the desktop popover and mobile
  drawer footer.
- **`pages/settings/app.tsx`** *(rewrite)*: `PageToolbar` (desktop, full-bleed via
  `md:-mx-8 md:-mt-8 md:mb-6`) + mobile header (matching warranties); cards Appearance
  (`ThemeSegmented labeled` + `AccentRetired`), Language (`Select`, globe lead), Currency
  (`CurrencySelect variant="full"`), Notifications (`NotifList`). Wiring verbatim.
- **`pages/settings/profile.tsx`** *(rewrite)*: identity `SettingsCard` (avatar block: `Avatar` +
  Upload/Remove, divider, names 2-col, disabled email), Address card, Monthly Income card, `RankCard`,
  `SaveBar`. Keeps the full draft/`isDirty`/upload/validation logic verbatim.
- **`pages/settings/account.tsx`** *(rewrite)*: Security card (glass `Field`/`PasswordField` +
  `PasswordStrengthMeter` + inline `Alert` error + right-aligned Change Password) + Danger Zone card
  (warning box + bullets; desktop inline expand / mobile `GlassDialog` sheet). Keeps password +
  delete logic verbatim.
- **`components/rating/rate-app-modal.tsx`** *(rewrite)*: `GlassDialog` + `StarPicker` + `Textarea`
  w/ counter + glass `Checkbox` + dirty-gated footer. `useMyRating`/`useSubmitRating` unchanged.
- **`index.css`** *(edit)*: base `:root`/`.dark` `--primary` + `--ring` → brand emerald; remove the 6
  `.accent-*` blocks. (Keep `.auth-emerald`/`.onboarding-emerald` — now redundant but harmless.)
- **`store/settings.ts`** *(edit)*: `applyAccentColor` strips `accent-*` and adds nothing; keep the
  field/type/setter for migration.
- **`i18n/{en,sr}.json`** *(edit)*: add the retired-accent note keys (both locales).

## Reuse (no re-derivation)
`AppLayout`, `PageToolbar`, `GlassDialog`, `glass/glass.tsx` (`Field`, `PasswordField`,
`PasswordStrengthMeter`, `Checkbox`, `IconTile`), shadcn `Switch`/`Select`/`Textarea`/`Progress`,
`CurrencySelect`, `Avatar`, the gradient `AddButton`/`btn-brand` pattern, `t-*` type scale, the
`shadow-glass-*` / `bg-card` / `*-soft` tokens.

## Net-new i18n (en + sr)
`settings.accentColor.retiredTag` ("Retired"), `settings.accentColor.retiredTitle`
("Accent color"), `settings.accentColor.retiredHelp` ("The Glass redesign uses one fixed brand
accent — emerald — so surfaces stay calm and legible across light and dark. The six-color picker is
being removed."). Verify-and-add only if missing: `settings.profile.unsavedChanges`,
`common.uploading`. Everything else reuses existing `settings.*` / `rating.*` / `common.*` keys.

## Verification
Throwaway public preview route (the pages need auth) rendering App settings (theme segmented +
retired-accent note + notifications list), the Profile rank crest at two tiers + Save states, the
Account password card (rest / show + meter / error) + Danger Zone (collapsed / inline expand /
mobile sheet), and the Rate modal (empty / filled / editing) — desktop modal + mobile sheet, light +
dark. Screenshot via the preview server (port 5180, `.claude/launch.json`), then delete the harness.
Then `npm run lint` + `npm run build` pass; commit on `feature/redesign-main-branch`; push.

## Out of scope / honest gaps
- Emerald lock changes `--primary` for the **whole app** (admin/dashboard included) — intended per
  the user's "lock emerald app-wide" call; the accent-aware sidebar active state simply renders
  emerald now.
- `accentColor` store field + `setAccentColor` + the `AccentColor` type are **left in place**
  (dead for theming); a later sweep can delete them with product sign-off.
- No RHF/zod migration of the password/profile forms (that is TD-1).
- The authed end-to-end pages (real avatar upload, live `updateMe`, the PageToolbar full-bleed
  breakout, FAB) are not run live (need auth + backend); presentational pieces + overlays are
  verified in isolation and the build passes.
