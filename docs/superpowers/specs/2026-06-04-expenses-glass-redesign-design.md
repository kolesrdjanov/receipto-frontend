# Expenses "Glass" Redesign — Design

**Date:** 2026-06-04
**Branch:** `feature/redesign-main-branch`
**Status:** Approved design — decomposed into chunks; each chunk gets its own plan/session
**Cycle:** Screen migration #3 (after Phase-0 foundation, auth, onboarding) — **the largest so far**

## Context

Redesign the **Expenses** page (route `src/pages/receipts/`, nav label/title "Expenses") onto
the Glass system, plus the **shared app chrome** it depends on. Handoff:
`~/Downloads/design_handoff_expenses/` (README is authoritative; `.ex-*` styles live inline in
`Expenses.html`; `ExpensesScreens/Overlays/States/Shared.jsx` are prototypes). **Keep the data
layer, replace presentation.** The current page (`src/pages/receipts/index.tsx`) is a **1,046-line
monolith** that renders the toolbar, a desktop `<Table>`, mobile `<Card>`s, filters, selection,
and every dialog inline; list rows are not extracted.

This is too large for one session. It is decomposed into **9 ordered chunks (0–8)**, each its own
plan + implement + verify cycle. This spec is the shared contract all chunks compose from.

## Settled decisions (resolved with the user)

1. **Global mobile bottom tab-bar + FAB** is introduced app-wide in a dedicated **chrome chunk**
   (Chunk 1), before the page — matching the design-system migration order (chrome → modules). The
   FAB is contextual: on Expenses it opens the Add/Scan action sheet.
2. **Desktop sidebar gets its glass restyle now**, in the same chrome chunk.
3. **Day-grouped feed = client-side**, no backend change. Group by local calendar day; raise page
   size from 10 → **50** (API cap 100) so days rarely split across pages; **mobile uses
   `useInfiniteQuery` "Load more"** (append), **desktop keeps numbered pages**. Header total/count
   come from `meta.total` + `totalAmounts` (already whole-filtered-set). A day straddling a page
   boundary (rare at 50) may show a partial subtotal — accepted; revisit with an optional backend
   `groupByDay` summary only if it proves visibly wrong.
4. **Shared components glass-restyled now** (app-wide, props unchanged): `confirm-dialog` (×10),
   `pagination` (×7), `date-picker` (×6 — fixes the broken filter-rail picker by reusing the real
   component). Requires a light cross-screen sanity check (admin/groups/recurring/warranties/templates).

## Scope

**In:** the Expenses page (day-grouped feed, desktop filter rail + mobile filter sheet, sticky
toolbar, mobile frosted header + quick-chips, summary row, pagination/load-more); all overlays
(Add menu/sheet, template picker, import guide, assign category, remove/delete confirm, receipt
viewer, desktop row kebab, mobile "…" menu); the **scan flow** restyle (`qr-scanner.tsx`); bulk
select + per-row actions with gating; all states (empty, loading skeleton, selection+bulk bars,
scan camera/processing/retry/non-fiscal-error, locked rows, import partial-success toast); the
**shared chrome** (sidebar, mobile tab-bar/FAB, sticky toolbar); the **shared components**
(confirm-dialog, pagination, date-picker, receipt-viewer-modal).

**Out (do NOT build/restyle this cycle):** the Add/Edit **ReceiptModal** form (out of scope per
handoff — leave as-is), anything **PFR** (`pfr-entry-modal`, the "Via PFR Number" path — dropped
per product), and **text search** (no backend support; not added).

## Data contracts (verified — wire to these, don't change)

- `useReceipts(filters)` → `{ data: Receipt[], meta: {page,limit,total,totalPages}, totalAmounts: {currency,total}[] }`.
  `meta.total` and `totalAmounts` are over the **whole filtered set** (backend `getCount()` +
  separate `SUM … GROUP BY currency`), so the header total/count are correct independent of the page.
- `ReceiptsFilters`: `groupId? categoryId? minAmount? maxAmount? startDate? endDate? page? limit?
  sortBy?('receiptDate'|'createdAt') sortOrder?('ASC'|'DESC')`. Backend defaults `receiptDate DESC`;
  `limit` capped at **100**. Filters are **debounced 400ms** and **URL-synced** (preserve both).
- `Receipt` key fields: `id, storeName?, totalAmount?(string|number), currency?(RSD default),
  receiptDate?, createdAt, receiptNumber?, hasJournal?, status('pending'|'scraped'|'failed'|'manual'|
  'completed'|'recurring'), category?{id,name,color?,icon?}, group?{id,name,color?,icon?,isArchived?},
  scrapedData?.journal`, auto-categorization fields. `receiptDate` is reliably set on create (manual
  falls back to `new Date()`), safe to group on.
- Mutations (keep): `useBulkDeleteReceipts(ids)→{deleted,skipped}`, `useBulkUpdateCategory({ids,
  categoryId|null})→{updated,skipped}`, `useDeleteReceipt`, `useExportReceipts`, `useImportReceipts(file)
  →{total,imported,errors:{row,message}[]}`.
- Scan: `useReceiptScanner()` → `{openQrScanner, openGalleryScanner, scannerModals(ReactNode),
  isCreating, isGalleryProcessing, scanFlowState, retryMeta}` — **don't use `openPfrEntry`**.
  `ScanFlowState`: `idle|camera_loading|scanning|submitting|retrying_portal|failed_terminal|success`.
- `useTemplates()`, `useCategories()` (`icon` is a **real emoji** — render it, never substitute a
  lucide glyph), `useCurrencyConverter()` → `{convert, preferredCurrency}`.
- **Day grouping (new, frontend-only):** group the loaded receipts by local calendar day of
  `receiptDate` (newest first); per-day subtotal = `Σ totalAmount` of that day's loaded rows; relative
  day labels (Today / Yesterday / weekday / `d MMM`); a month header tops the feed. Mobile accumulates
  pages via `useInfiniteQuery`; desktop fetches one page at a time.

## Token & class mapping (handoff → app)

Most Glass tokens already shipped (`--brand-*`, `--success/-soft/-foreground`, `--info/-soft/-foreground`,
`--warning/-soft/-foreground`, `--bg-subtle`, `--hairline-soft`, `--fg-faint`, `--primary-soft`,
`--sh-1..4`/`shadow-glass-*`, `.t-*`, `.glass-card`, `.btn-brand`, `.icon-tile-*`). Mappings/gaps:

| Handoff | App | Action |
|---|---|---|
| `--warn`/`--warn-soft` | `--warning`/`--warning-soft` | use app name |
| `--danger`/`--danger-soft` | `--destructive` (no soft) | **add `--destructive-soft` (+ `-foreground`)** light+dark |
| `--bg-elev` | `--card` | use `--card`; sheets reuse the `.glass-card` recipe |
| `--bg-elev-2` | — | reuse `--card`/`--popover`; **no new tier** |
| `--fg`/`--fg-2`/`--fg-muted` | `--foreground` / **missing** / `--muted-foreground` | **add `--fg-2`** (mid-tone) light+dark |
| `--hairline` | `--border` | use app name |
| `--r-1..6`/`--r-pill` | Tailwind `rounded-*` | `r-2`=lg(10) `r-3`=xl(14) `r-4`=2xl(18) `r-6`=`glass-card`28 `r-pill`=full |
| `.btn-grad` | `.btn-brand` | use app name |
| recurring badge violet-soft | — | **add `--brand-violet-soft` (+ fg)** or a `.badge-recurring` class |

The `.ex-*` classes are **not** in glass.css — rebuild them as **React components + Tailwind
utilities**, adding only a small set of genuinely-reusable classes to `index.css` (status-badge
tints, the frosted toolbar/rail recipe). Keep the established "translate to shadcn, don't port
foundations.css" approach.

## Cross-cutting conventions (every chunk)

- **Gradient only** on the logo, the primary **Scan** CTA, and the mobile **FAB**. Everything else
  neutral. Icon tiles use soft tints, never gradient fills.
- **Glass surfaces** (toolbar, filter rail, sheets, modals, bulk bars) = real `backdrop-filter`
  (`-webkit-` prefixed) + semi-opaque fallback bg; reuse `.glass-card` where it fits.
- **Category = emoji** (`category.icon`) in a tile tinted `color + '1f'`; uncategorized → dashed
  neutral tile + `Receipt` glyph + muted "Uncategorized". In list rows the **name** is plain muted
  text (no second chip).
- **Preserve all gating:** View only when `hasJournal`; Edit/Delete disabled for `group.isArchived`
  or `status==='recurring'` with the right tooltip; bulk ops surface `{skipped}`.
- **i18n:** all strings via `t('receipts.*' / 'common.*')` (keys already exist; flag any net-new).
  Serbian always updated. Tabular-nums (`.t-num`) on all amounts.
- **Motion:** entrance fade+rise (existing `StaggerContainer/Item`), sheets slide ~300ms, modals
  fade/scale; respect `prefers-reduced-motion`. Reuse the onboarding sheet/Dialog patterns.
- **Mobile** edge-to-edge, honor `env(safe-area-inset-*)`; all mobile modals are **bottom sheets**,
  desktop modals are centered over a dim+blur scrim.

## Decomposition — 9 chunks (each its own plan + session)

Dependencies are noted; Chunk 0 unblocks the rest; Chunk 1 (chrome) and Chunk 2 (feed) are the
backbone. Chunks 3–8 can be reordered somewhat but the listed order minimizes rework.

- **Chunk 0 — Foundation: tokens + list primitives.** Add `--fg-2`, `--destructive-soft(+fg)`,
  `--brand-violet-soft(+fg)` (light+dark); build `StatusBadge`, `Amount`, `CatTile`, `CatName`,
  `Check`/selection-checkbox, and the frosted toolbar/rail surface helper. Pure primitives + a
  preview harness. *Deps: none.*
- **Chunk 1 — App chrome: sidebar glass + mobile tab-bar/FAB + sticky PageToolbar.** Restyle
  `app-sidebar.tsx`; add a global `MobileTabBar` (Home/Expenses/FAB/Groups/More) + FAB to
  `app-layout.tsx` (keep the full nav reachable via "More"); add a reusable sticky glass
  `PageToolbar` (title/subtitle/actions slot). App-wide — verify every route mobile+desktop,
  light+dark, safe-areas. *Deps: 0. May split into 1a (sidebar+toolbar) / 1b (tab-bar+FAB).*
- **Chunk 2 — Expenses feed core.** Replace the monolith's table+cards with `ExpenseFeed`
  (month header → day groups → per-day subtotal), `ExpenseRow`/`ExpenseCard` (desktop wide +
  mobile), summary row (Total + Select + showing-range; mobile header total/count + quick-chips),
  desktop numbered pagination + **mobile `useInfiniteQuery` Load-more**, raise `limit` to 50,
  empty + loading-skeleton states. Wire to `useReceipts`; thread existing handlers. *Deps: 0,1.*
- **Chunk 3 — Filters: desktop rail + mobile sheet.** Persistent glass `FilterRail` (category
  checklist, amount min/no-limit, date-range preset chips + From/To via the **real date-picker**,
  Clear all; auto-apply) and the mobile **Filters bottom sheet** (same controls, "Show N results"
  footer that closes the sheet). Replace `receipts-filters.tsx`. *Deps: 0,2.*
- **Chunk 4 — Add / templates / import-export overlays.** Desktop `+` menu (Blank / From template
  / Import / Export); mobile Add action sheet via the FAB (Scan / Gallery / Add manually / From
  template / Import-Export); restyle `template-selector-modal` + the import-CSV guide to glass
  sheet/modal; export wiring; mobile header "…" menu (Select / Sort / Import-Export). *Deps: 0,1,2.*
- **Chunk 5 — Bulk select + per-row actions + confirms.** Selection mode (enter via desktop
  "Select" button / mobile "…"→Select), checkboxes + row highlight, desktop floating bulk bar +
  mobile bottom bulk bar, desktop **kebab** (View/Edit/Delete with gating), Assign-category overlay,
  Remove + single-Delete confirms (glass `ConfirmDialog`), locked rows. *Deps: 0,2; uses Chunk 7's
  glass `ConfirmDialog`.*
- **Chunk 6 — Scan flow restyle (`qr-scanner.tsx`, 674 lines).** Glass sheet (mobile) / modal
  (desktop): camera viewport, camera select, torch, processing, retry (2-min portal,
  Retry/Cancel/Gallery), non-fiscal error, gallery entry. Wire to existing `scan-flow` states +
  `retryMeta`. *Deps: 0,1.*
- **Chunk 7 — Shared component glass restyle (app-wide).** `confirm-dialog`, `pagination`,
  `date-picker`, `receipt-viewer-modal` → glass; cross-screen sanity check. *Deps: 0. Best done
  early enough that Chunks 3/5 consume the glass versions.*
- **Chunk 8 — Polish, states, i18n, verify, docs.** Import partial-success toast, converted-currency
  note (mixed currencies only), optional AI-suggestion card on fresh uncategorized scans, motion +
  reduced-motion pass, full verification matrix, update `design-system.md` + `recent-changes.md`,
  flag/add any net-new i18n keys. *Deps: all.*

**Suggested execution order:** 0 → 7 → 1 → 2 → 3 → 4 → 5 → 6 → 8. (Chunk 7 early so glass
`ConfirmDialog`/`date-picker`/`pagination` exist before the feed/filters/bulk consume them.)

## Out-of-scope confirmations & risks

- Add/Edit ReceiptModal, PFR, and text search stay untouched (see Scope).
- **Monolith extraction risk:** threading the URL-synced + debounced filters and the `selectedIds`
  Set into new components without behavior change is the main hazard — Chunk 2 must preserve the
  exact filter→URL→debounce→refetch loop.
- **App-wide blast radius:** Chunks 1 and 7 change chrome + shared components on every screen — each
  needs a cross-route verification pass, not just Expenses.
- **Split-day subtotals:** accepted at `limit:50`; escalate to a backend `groupByDay` summary only
  if visibly wrong.
- **Mobile filters "Apply" discrepancy:** handoff README says auto-apply/no Apply button, but the
  mobile FiltersSheet prototype shows a "Show N results" CTA. Resolution: filters **auto-apply live**;
  the mobile sheet's "Show N results" button simply **closes the sheet** (a "done" affordance showing
  the live result count) — it does not gate application.

## Verification (per chunk + final)

`npm run build` after each chunk. Preview on **port 5180 `--strictPort`** (5173 is another project).
Per-chunk: screenshot the chunk's surfaces mobile+desktop, light+dark; confirm behavior. Final
(Chunk 8): full matrix + the data-loop checks (filters↔URL↔debounce, selection, bulk skip-reporting,
scan states, import partial-success, gating tooltips). Commit + push per chunk to
`feature/redesign-main-branch` (pre-push build hook runs).
