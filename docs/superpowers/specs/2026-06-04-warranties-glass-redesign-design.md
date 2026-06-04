# Warranties — "Glass" redesign (design)

**Date:** 2026-06-04 · **Branch:** `feature/redesign-main-branch` · Handoff: `~/Downloads/design_handoff_warranties/`

The 5th screen cycle (after auth, onboarding, expenses, recurring). Replaces the
presentation of the Warranties page and its overlays; the **data layer is kept verbatim**
(`use-warranties.ts` hooks, endpoints, `getWarrantyStatus`/`getRemainingDays`,
`MAX_WARRANTY_FILES`, i18n keys — all unchanged). Net-new code is presentation plus a few
pure helpers and translation keys.

## The point of the round
Today the page is a stats-grid + a shadcn `Tabs` card wrapping a plain card grid; each card
shows two date rows and the photos large. The redesign turns the three statuses into a
single **urgency language** and makes each card's **coverage bar** (purchase → expiry, with a
"today" marker) the hero element, so remaining-warranty time reads instantly. It follows the
established Glass direction: frosted floating surfaces over a soft brand wash, near-monochrome
neutrals, brand gradient reserved for the logo + the primary "Add" CTA + the mobile FAB only.

## Status scale (the urgency language)
Unchanged from `use-warranties.ts` — `getWarrantyStatus()` returns `expired` (expiry < today)
/ `expiring` (expiry ≤ today+30d) / `active`. The badge, the coverage-bar fill color, and the
ordering are all driven by it:

| Status | Tone | Icon | Badge label |
|---|---|---|---|
| `expired` | danger (red) | `shield-x` | "Expired" |
| `expiring` | warn (orange) | `shield-alert` | "{N} days left" (`getRemainingDays`) |
| `active` | success (green) | `shield-check` | "Active" |

## Decisions (resolved with the user)
1. **Product "kind" emoji is derived client-side** from the product name (EN + SR keyword
   map → 📺/📱/💻/🧺/☕/🧹/🎧/🧊, fallback 📦). The data model has **no** kind/category field
   and none is added (per the README's "no backend field without sign-off"). The mock's
   "Kind" select is **dropped** from the form — there is nothing to persist.
2. **"All" tab ordering = urgency triage:** expiring soon first (action needed) → active
   (soonest expiry first) → expired last (dimmed). Matches the Recurring cycle's triage
   philosophy and the expired-card dimming. Each filtered tab is likewise sorted soonest-
   expiry-first within its status.
3. **Delete routes through the shared responsive `ConfirmDialog`** (consistent with
   Recurring), replacing the form's old nested `AlertDialog`.
4. **The gallery lightbox stays a dark fullscreen surface** (intentionally not a glass
   sheet) — only its chrome is restyled.

## Architecture / files
- **`components/warranties/warranty-view.ts`** *(new, pure helpers — kept out of component
  files for the `react-refresh/only-export-components` lint rule)*: `deriveKindEmoji(name)`,
  `coveragePercent(w)` (`clamp(elapsed/total, 0, 1)`), `formatRemaining(w, t)` (granular
  "2 mo left" / "1 yr 3 mo left" / "16 days left" / "Expired 13 days ago" label),
  `STATUS_RANK`, `sortWarranties(list)` (urgency triage, tie-break soonest-expiry). Reuses
  `getWarrantyStatus`/`getRemainingDays` from the hook.
- **`components/warranties/primitives.tsx`** *(new, component-only)*: `StatusBadge` (urgency
  pill), `KindTile` (derived emoji tile), `CoverageBar` (ends row + status-tinted fill +
  "today" knob, omitted when expired), `FileThumbStrip` (54px tiles + count / "No files
  attached"), `WarrantyCard`, `WarrantyGrid`, `StatusTabs` (scrollable pill tabs w/ count
  chips), `CardActionList` (shared list for desktop kebab Popover + mobile action sheet).
- **`components/warranties/warranty-modal.tsx`** *(rewrite)*: `GlassDialog` shell +
  react-hook-form **+ zod (`zodResolver`)** + glass `Field` inputs + restyled file block.
  **All file logic kept verbatim** (HEIC convert, localImages/localPreviews,
  removeFileIndices, `MAX_WARRANTY_FILES`). Delete button calls `onRequestDelete(warranty)`
  up to the page. Edit-only expiry-hint strip ("Warranty expires {date}" + status badge).
- **`components/warranties/warranty-import-dialog.tsx`** *(new)*: `GlassDialog` with monospace
  column chips + supported-formats tip + Download template / Select CSV file (extracted from
  `index.tsx`, reuses `CSV_TEMPLATE`, `useImportWarranties`, `useExportWarranties`).
- **`components/warranties/warranty-gallery-modal.tsx`** *(light restyle)*: keep all logic
  (keyboard nav, PDF Google-viewer embed, download / open-in-new-tab, blob/data passthrough);
  restyle chrome to translucent-white buttons + thumbnail dots + counter.
- **`pages/warranties/index.tsx`** *(rewrite)*: desktop `PageToolbar` (Export/Import outline +
  gradient "Add warranty", full-bleed via `md:-mx-8 md:-mt-8 md:mb-6`) / mobile page header +
  gradient "Add"; desktop 4 stat cards / mobile summary strip (hero "Tracked" count +
  active/expiring/expired count pills); `StatusTabs`; sorted `WarrantyGrid`; `useFabStore` FAB
  takeover → opens Add sheet; empty state + skeleton loading. Keeps the existing 4 per-status
  queries + `useWarrantyStats` (sorted client-side); local UI state unchanged.

## Form + zod
Schema (`zodResolver`): `productName` required (min 1), `storeName` optional, `purchaseDate`
required (non-empty ISO date), `warrantyDuration` optional positive int (`z.coerce.number`,
default 24), `notes` optional. Inline errors via the glass `Field` `error` prop. Footer pinned
by `GlassDialog`: desktop `[Delete · spacer · Cancel · Save]`, mobile stacked `Save → Cancel →
Delete`.

## Net-new i18n (en + sr, single-`{{count}}` convention)
`warranties.remaining.*` (daysLeft / monthsLeft / yearsLeft / yearsMonthsLeft /
expiredDaysAgo / expiredMonthsAgo / expiredYearsAgo), `warranties.tracked`,
`warrantiesLabel`, `noFilesAttached`, `filesCount`, `tapHint`, `sortedByExpiry`,
`warrantyCount`, `mobileSubtitle`, `desktopSubtitle`, `warranties.actions.{viewFiles,edit,
delete}`, `warranties.modal.errors.{productNameRequired,purchaseDateRequired,durationInvalid}`,
dropzone copy (`addUpToFiles`, `filesHint`), `warranties.modal.expiryHint`. Reuses existing
`status.*`, `stats.*`, `tabs.*`, `import.guide.*`, `modal.*`.

## Verification
Throwaway `/__warr-preview` public route (the page needs auth) rendering the card status
scale, summary/stat cards, `StatusTabs`, empty + skeleton states, and the `GlassDialog` form
as both a desktop centered modal and a mobile bottom sheet — in light + dark, mobile +
desktop. Screenshot via the preview server (port 5180, config in `.claude/launch.json`), then
delete the harness. Then `npm run lint` + `npm run build` pass on the changed files; commit on
`feature/redesign-main-branch`; push.

## Out of scope / honest gaps
- No backend `kind` field; the emoji is purely presentational.
- Gradient stays only on the logo, the Add CTA, and the mobile FAB.
- The authed end-to-end page (PageToolbar full-bleed breakout, FAB tap, real Cloudinary
  thumbnails) is not run live (needs auth + backend); presentational pieces + the overlay
  shell are verified in isolation and the build passes.
