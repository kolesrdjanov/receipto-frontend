# Recurring Expenses — "Glass" redesign (design + plan)

**Date:** 2026-06-04 · **Branch:** `feature/redesign-main-branch` · Handoff: `~/Downloads/design_handoff_recurring/`

The 4th screen cycle (after auth, onboarding, expenses). Replaces the presentation of the
Recurring Expenses page; the **data layer is kept verbatim** (hooks/endpoints unchanged).

## The point of the round
Today the page is a stats-grid + donut + dense table whose only status is
Active/Paused/Ended; the real urgency (overdue / due-soon / upcoming) lives only in the
dashboard widget. The redesign pulls urgency **into the page** as a **single flat list
sorted by next due date**, where each row's **status badge carries the urgency** (sort =
triage) and **Mark-as-paid is the hero action**. The category breakdown is demoted to calm
monthly-equivalent bars; the donut/recharts is dropped.

## Status derivation (the heart of it)
Derived **purely per-row** from `nextDueDate` / `isPaused` / `endDate` — verified against
the backend: `nextDueDate` is the next *unpaid* due date (today-or-future, or `null` when
caught up). So there is **no `/upcoming` fetch** (it would be equivalent, and its overdue
bucket never populates — its range starts at today). Counts in the summary are derived from
the same per-row statuses, so badges and counts always agree.

- `isPaused` → **paused**; `endDate < today` → **ended**; `nextDueDate == null` → **paid**
  (caught up); `diff < 0` → **overdue**; `diff ≤ 7` → **duesoon**; else **upcoming**.
- Sort by `STATUS_RANK` (overdue→duesoon→upcoming→paid→paused→ended), then soonest due first.
- Relative labels ("Overdue 11 days", "Due tomorrow", "in 8 days", "Up to date") via
  `relativeDueLabel`. Plural forms follow the repo convention (single `{{count}}` form, no
  i18next plural suffixes).

## Decisions (resolved with the user)
1. **ConfirmDialog made responsive app-wide** — centered glass modal on desktop, slide-up
   bottom sheet on mobile (via the new `GlassDialog`). Props unchanged; improves all ~10
   call sites consistently.
2. **"Paid" badge = caught-up only** — shown when `nextDueDate` is `null` (no pending
   obligation). A bill paid this month but due again next month honestly shows its next due
   as "upcoming"; no fragile frontend period-math, no backend change. The summary's
   "Paid · month" count still comes from `summary.paidThisMonth`.

## Architecture / files
- **`components/glass/glass-dialog.tsx`** — shared responsive overlay shell (desktop
  centered glass modal / mobile Framer slide-up sheet; header / scrollable body / pinned
  footer). New reusable primitive; documented in `docs/design-system.md`.
- **`components/recurring-expenses/status.ts`** — pure helpers: `RecurringStatus`,
  `STATUS_RANK`, `deriveStatus`, `buildRecurringRows`, `relativeDueLabel`.
- **`components/recurring-expenses/primitives.tsx`** — `DueBadge`, `RowActionList`,
  `RecurringRow` (desktop kebab Popover + inline mark-paid pill / mobile kebab→action
  sheet), `RecurringList`. Reuses `CatTile`/`CatName`/`Amount` from `receipts/primitives`.
- **`components/recurring-expenses/category-bars.tsx`** — `CategoryBars` (demoted monthly-
  equivalent bars); `category-breakdown.tsx` keeps `useCategoryChartData`.
- **Overlays rebuilt on `GlassDialog`**, data contracts intact: `recurring-expense-modal`
  (segmented frequency, conditional day-of-month, neutral solid submit, edit-mode delete +
  pause), `mark-paid-modal` (`isFixed` lock + receipt note; keeps the `UpcomingExpense` API
  used by the dashboard widget), `payment-history` → `PaymentHistoryModal` (late "due"
  marker). Delete = shared `ConfirmDialog`.
- **`pages/recurring-expenses/index.tsx`** — `PageToolbar` (desktop, gradient Add CTA, full-
  bleed via negative margins) + mobile page header; desktop two-card overview / mobile slim
  summary; dismissible info banner (`localStorage['recurring-info-dismissed']`); flat sorted
  list; empty + loading-skeleton states; mobile row action sheet.
- **`store/fab.ts` + `mobile-tab-bar.tsx`** — the page registers its Add action so the
  global gradient FAB opens the Add sheet on `/recurring` (reusable for Expenses Chunk 4).
- **i18n** — `recurring.{status,dueLabels,overview,actions,modal,markPaid,payments,…}` added
  to `en.json` **and** `sr.json`.

## Verification
`tsc -b` + `vite build` pass; the changed files are eslint-clean (repo has unrelated
pre-existing lint errors). Visually verified via a throwaway `/__rec-preview` harness (since
the page needs auth): status scale, overview, bars, list (wide + compact), empty state in
light + dark, and `GlassDialog` as both a desktop centered modal and a mobile bottom sheet.

## Out of scope / honest gaps
- Gradient stays only on the logo, the Add CTA, and the mobile FAB.
- The authed end-to-end page (PageToolbar full-bleed breakout, FAB tap) was not run live
  (needs auth + backend); the presentational pieces and the overlay shell were verified in
  isolation, and the build passes.
