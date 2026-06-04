# Expenses "Glass" Redesign — Master Implementation Plan (chunked)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each chunk task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Migrate the Expenses page + its shared app chrome + shared components onto the Glass design system, keeping the data layer intact, delivered in 9 ordered chunks (each its own session).

**Architecture:** Replace the 1,046-line `pages/receipts/index.tsx` monolith with composed presentation components wired to the existing hooks; introduce shared chrome (sidebar restyle, mobile tab-bar/FAB, sticky toolbar) and glass-restyle shared components (confirm-dialog, pagination, date-picker). Day-grouping is client-side; mobile uses `useInfiniteQuery` Load-more, desktop numbered pages.

**Tech Stack:** React 19, TypeScript (strict), Tailwind v4, shadcn/ui + Radix, Framer Motion, TanStack Query 5, lucide-react, i18next.

**Companion spec:** `docs/superpowers/specs/2026-06-04-expenses-glass-redesign-design.md` (read it first — data contracts, token map, conventions, decisions).

---

## How to use this plan

This is a **multi-session master plan**. The spec authorizes each chunk as its own spec→plan→implement cycle. Here:
- **Chunks 0, 7, 1, 2** are detailed enough to execute directly (real code for primitives; concrete file/step lists).
- **Chunks 3–6, 8** give the exact scope, files (create/modify with paths), ordered steps, and acceptance — each should be **expanded into its own full per-chunk plan at session start** (re-run writing-plans for that chunk, pulling the prototype JSX details from `~/Downloads/design_handoff_expenses/` and the `.ex-*` CSS from `Expenses.html`).
- **Recommended order:** 0 → 7 → 1 → 2 → 3 → 4 → 5 → 6 → 8.
- **No component-unit-test harness exists** (Playwright E2E only). Per-step verification = `npm run build` (tsc strict + vite) + preview on port **5180 `--strictPort`** + screenshots. The one pure function (`groupReceiptsByDay`) is checked with a scratch `node` run.
- **Per chunk:** branch is `feature/redesign-main-branch`; build, preview-verify the chunk's surfaces (mobile+desktop, light+dark), commit, push (pre-push build hook runs).

---

## File structure (created across chunks)

| File | Chunk | Responsibility |
|---|---|---|
| `src/components/receipts/primitives.tsx` | 0 | `StatusBadge`, `CatTile`, `CatName`, `SelectCheck`, `Amount` |
| `src/index.css` (edit) | 0 | `--fg-2`, `--destructive-soft(+fg)`, `--brand-violet-soft(+fg)`, badge tints |
| `src/components/ui/confirm-dialog.tsx` (edit) | 7 | glass restyle (props unchanged) |
| `src/components/ui/pagination.tsx` (edit) | 7 | glass restyle |
| `src/components/ui/date-picker.tsx` (edit) | 7 | glass field restyle |
| `src/components/receipts/receipt-viewer-modal.tsx` (edit) | 7 | glass journal viewer |
| `src/components/layout/app-sidebar.tsx` (edit) | 1 | glass sidebar |
| `src/components/layout/mobile-tab-bar.tsx` | 1 | mobile bottom tab-bar + FAB |
| `src/components/layout/page-toolbar.tsx` | 1 | sticky glass title+actions toolbar |
| `src/components/layout/app-layout.tsx` (edit) | 1 | mount tab-bar, drop/relocate mobile header |
| `src/lib/group-receipts-by-day.ts` | 2 | pure day-grouping + subtotal util |
| `src/hooks/receipts/use-infinite-receipts.ts` | 2 | `useInfiniteQuery` wrapper for mobile load-more |
| `src/components/receipts/expense-feed.tsx` | 2 | month header → day groups → subtotals |
| `src/components/receipts/expense-row.tsx` | 2 | desktop wide + mobile row/card |
| `src/components/receipts/expenses-summary.tsx` | 2 | total + Select + showing-range / mobile header |
| `src/components/receipts/filter-rail.tsx` | 3 | desktop persistent filter rail |
| `src/components/receipts/filter-sheet.tsx` | 3 | mobile filters bottom sheet |
| `src/components/receipts/quick-chips.tsx` | 3 | mobile quick-filter chip row |
| `src/components/receipts/add-menu.tsx` | 4 | desktop `+` menu + mobile Add action sheet |
| `src/components/receipts/import-guide-dialog.tsx` | 4 | CSV import guide (extracted from page) |
| `src/components/receipts/bulk-bar.tsx` | 5 | desktop floating + mobile bottom bulk bar |
| `src/components/receipts/row-kebab.tsx` | 5 | desktop row View/Edit/Delete menu |
| `src/components/receipts/assign-category-dialog.tsx` | 5 | bulk assign-category overlay |
| `src/components/receipts/qr-scanner.tsx` (edit) | 6 | glass scan sheet/modal + states |
| `src/pages/receipts/index.tsx` (edit, shrinks) | 2–5 | orchestrates the new components, keeps state/handlers |

---

## Chunk 0 — Foundation: tokens + list primitives

**Goal:** Add the few missing tokens and the reusable presentation primitives every later chunk composes from. No page changes.

**Files:**
- Modify: `src/index.css` (token block ~119–196; append badge tints near `.icon-tile-*` ~617)
- Create: `src/components/receipts/primitives.tsx`

- [ ] **Step 1: Add tokens to `:root` and `.dark`**

In `src/index.css` `:root` (after `--fg-faint`):
```css
  --fg-2: oklch(0.45 0.01 260);            /* mid-tone text (between fg & muted) */
  --destructive-soft: oklch(0.95 0.04 25);
  --destructive-foreground-on-soft: oklch(0.5 0.18 25);
  --brand-violet-soft: oklch(0.95 0.04 295);
  --brand-violet-foreground: oklch(0.45 0.2 295);
```
In `.dark` (after the dark `--fg-faint`):
```css
  --fg-2: oklch(0.78 0.01 260);
  --destructive-soft: oklch(0.3 0.08 25);
  --destructive-foreground-on-soft: oklch(0.82 0.12 25);
  --brand-violet-soft: oklch(0.32 0.06 295);
  --brand-violet-foreground: oklch(0.85 0.12 295);
```
Register utilities in `@theme inline`:
```css
  --color-fg-2: var(--fg-2);
  --color-destructive-soft: var(--destructive-soft);
  --color-brand-violet-soft: var(--brand-violet-soft);
  --color-brand-violet-foreground: var(--brand-violet-foreground);
```

- [ ] **Step 2: Build the primitives** in `src/components/receipts/primitives.tsx`

```tsx
import { useTranslation } from 'react-i18next'
import { Receipt as ReceiptIcon, Check, QrCode, Pencil, Clock, X, Repeat, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Tabular formatted amount (sr-RS dinar style, rounded). */
export function Amount({
  value, currency = 'RSD', size = 15.5, weight = 700, muted = false, className,
}: { value: number | string; currency?: string; size?: number; weight?: number; muted?: boolean; className?: string }) {
  const n = Math.round(Number(value) || 0).toLocaleString('sr-RS')
  return (
    <span
      className={cn('t-num shrink-0 tabular-nums', muted ? 'text-muted-foreground' : 'text-foreground', className)}
      style={{ fontSize: size, fontWeight: weight, lineHeight: 1 }}
    >
      {n} {currency}
    </span>
  )
}

/** Category emoji tile; uncategorized → dashed neutral tile + receipt glyph. */
export function CatTile({
  category, size = 42, radius = 13, font = 20, className,
}: { category?: { color?: string; icon?: string } | null; size?: number; radius?: number; font?: number; className?: string }) {
  if (category?.icon) {
    return (
      <div
        className={cn('grid shrink-0 place-items-center', className)}
        style={{ width: size, height: size, borderRadius: radius, fontSize: font, lineHeight: 1, background: (category.color || '#888') + '1f' }}
      >
        <span>{category.icon}</span>
      </div>
    )
  }
  return (
    <div
      className={cn('grid shrink-0 place-items-center border border-dashed border-border bg-bg-subtle text-fg-faint', className)}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <ReceiptIcon style={{ width: font, height: font }} />
    </div>
  )
}

/** Category name as plain muted text (list rows). */
export function CatName({ name, className }: { name?: string | null; className?: string }) {
  const { t } = useTranslation()
  return (
    <span className={cn('truncate text-[13px] font-medium text-muted-foreground', className)} style={{ maxWidth: 140 }}>
      {name || t('receipts.uncategorized', { defaultValue: 'Uncategorized' })}
    </span>
  )
}

/** Selection checkbox (on / off). */
export function SelectCheck({ on, className }: { on?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors',
        on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
        className,
      )}
    >
      <Check className={cn('size-3.5', on ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
    </span>
  )
}

type Tone = 'ok' | 'info' | 'warn' | 'danger' | 'violet'
const STATUS: Record<string, { tone: Tone; icon: LucideIcon; key: string }> = {
  scraped:   { tone: 'ok',     icon: QrCode, key: 'receipts.status.completed' },
  completed: { tone: 'ok',     icon: QrCode, key: 'receipts.status.completed' },
  manual:    { tone: 'info',   icon: Pencil, key: 'receipts.status.manual' },
  pending:   { tone: 'warn',   icon: Clock,  key: 'receipts.status.pending' },
  failed:    { tone: 'danger', icon: X,      key: 'receipts.status.failed' },
  recurring: { tone: 'violet', icon: Repeat, key: 'receipts.status.recurring' },
}
const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-success-soft text-success-foreground',
  info: 'bg-info-soft text-info-foreground',
  warn: 'bg-warning-soft text-warning-foreground',
  danger: 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]',
  violet: 'bg-brand-violet-soft text-brand-violet-foreground',
}
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useTranslation()
  const s = STATUS[status]
  if (!s) return null
  const Icon = s.icon
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TONE_CLASS[s.tone], className)}>
      <Icon className="size-3" />
      {t(s.key)}
    </span>
  )
}
```

- [ ] **Step 3: Build** — `npm run build` → PASS.
- [ ] **Step 4: Verify primitives** — add a throwaway `/__exp-preview` route (like the onboarding harness) rendering all `StatusBadge` tones, `CatTile` (categorized + uncategorized), `Amount`, `SelectCheck` in light+dark; screenshot; confirm tints read correctly; remove the harness.
- [ ] **Step 5: Commit** — `feat(receipts): glass list primitives + tokens (StatusBadge/CatTile/CatName/Amount)`.

**Acceptance:** tokens compile; primitives render correct in light+dark; no page wired yet.

---

## Chunk 7 — Shared component glass restyle (do early; app-wide)

**Goal:** Glass-restyle the shared components the feed/filters/bulk will consume, props unchanged.

**Files (modify):** `src/components/ui/confirm-dialog.tsx`, `src/components/ui/pagination.tsx`, `src/components/ui/date-picker.tsx`, `src/components/receipts/receipt-viewer-modal.tsx`.

- [ ] **Step 1: `confirm-dialog.tsx`** — keep the prop API (`open,onOpenChange,onConfirm,title,description,confirmText?,cancelText?,variant?,isLoading?`). Restyle the `DialogContent` to the glass card recipe (reuse `.glass-card` or the onboarding Dialog composition), danger variant uses `bg-destructive` confirm + `bg-destructive-soft` accents. Verify the existing i18n fallbacks still apply.
- [ ] **Step 2: `pagination.tsx`** — restyle to the `.ex-pagefoot` look: a `card rounded-2xl` footer, prev / numbered `pagebtn` (active = `bg-foreground text-background`) / next, disabled at bounds. Keep props (`page,totalPages,total,limit,onPageChange`) and i18n.
- [ ] **Step 3: `date-picker.tsx`** — restyle the trigger to a **glass field** (h-40px, `rounded-xl`, `bg-bg-subtle/70`, focus ring `ring-primary/15`, calendar icon, `dd.mm.yyyy` display) so it matches `.ex-railinput`/`.gfield`. Keep the Popover+Calendar internals + props. **This fixes the broken filter-rail picker** — the real component is now glass and used in the rail and sheet (Chunk 3).
- [ ] **Step 4: `receipt-viewer-modal.tsx`** — glass modal (desktop) / sheet (mobile); journal in a mono `.ex-journal`-style block (`bg-bg-subtle`, `rounded-xl`, max-h 300, scroll); Share / Print / Close. Keep props.
- [ ] **Step 5: Build + cross-screen sanity check** — `npm run build`; preview the consumers (a confirm in templates/recurring, pagination in admin/groups, a date-picker in warranty/recurring modals) light+dark — confirm no breakage, just glassier.
- [ ] **Step 6: Commit** — `feat(ui): glass restyle confirm-dialog, pagination, date-picker, receipt-viewer`.

**Acceptance:** all consumers still work (props unchanged); visuals are glass; the date-picker is consistent everywhere.

---

## Chunk 1 — App chrome: sidebar glass + mobile tab-bar/FAB + sticky toolbar

**Goal:** Restyle the desktop sidebar to glass; add a global mobile bottom tab-bar + center FAB; add a reusable sticky glass `PageToolbar`. App-wide.

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`, `src/components/layout/app-layout.tsx`
- Create: `src/components/layout/mobile-tab-bar.tsx`, `src/components/layout/page-toolbar.tsx`

- [ ] **Step 1: `page-toolbar.tsx`** — sticky glass bar: `sticky top-0 z-30` frosted (`backdrop-blur-[22px]` + `bg-card/72` + bottom hairline), `px-8 py-[18px]`, `flex items-center justify-between`. Props: `{ title: string; subtitle?: ReactNode; actions?: ReactNode }`. Title `.t-h2`, subtitle `.t-sm` muted. Render only `>= md` (mobile uses its own frosted header per page).
- [ ] **Step 2: `mobile-tab-bar.tsx`** — `fixed inset-x-0 bottom-0 z-30` frosted tab bar (78px, safe-area bottom padding), 5 slots: Home (`/dashboard`), Expenses (`/receipts`), **center FAB** (gradient circle, `-mt-5`, `onPress` prop), Groups (`/groups`), More (opens the existing sidebar sheet via `setOpenMobile(true)`). Active item = `text-primary`. Use `NavLink`. FAB `onPress` default = open scan (via a context or prop); on Expenses it opens the Add sheet (wired in Chunk 4).
- [ ] **Step 3: Wire into `app-layout.tsx`** — render `<MobileTabBar/>` (`md:hidden`); keep the off-canvas sidebar reachable from "More"; ensure main content has bottom padding (`pb-28 md:pb-0`) so the feed clears the bar; keep `SidebarProvider`/`AppSidebar` for desktop + the More sheet. Decide the mobile header: keep a slim version or fold its bits (language, profile) into the sidebar sheet — match the handoff (mobile uses a page-level frosted header, not the global one).
- [ ] **Step 4: `app-sidebar.tsx` glass restyle** — frosted sidebar surface, glass active-item treatment, the "Scan receipt" gradient button at top, sectioned nav (Money / Wallet) per handoff; keep all feature-flag gating + `closeMobile()` behavior + the footer user popover.
- [ ] **Step 5: Build + cross-route verification** — `npm run build`; preview `/dashboard`, `/receipts`, `/groups`, `/categories`, `/settings` on **mobile** (tab-bar shows, FAB works, More opens sheet, safe-areas) and **desktop** (glass sidebar), light+dark.
- [ ] **Step 6: Commit** — `feat(layout): glass sidebar + mobile tab-bar/FAB + sticky PageToolbar`.

**Acceptance:** every route has the new chrome; mobile nav works (tab-bar + More sheet); no route regressions; safe-areas respected. *(If large, split: 1a = sidebar + PageToolbar; 1b = mobile tab-bar/FAB.)*

---

## Chunk 2 — Expenses feed core (the backbone)

**Goal:** Replace the monolith's table + cards with a day-grouped feed wired to the existing hooks; desktop numbered pages, mobile Load-more; empty + loading states. Preserve the filter→URL→debounce→refetch loop and `selectedIds` plumbing.

**Files:**
- Create: `src/lib/group-receipts-by-day.ts`, `src/hooks/receipts/use-infinite-receipts.ts`, `src/components/receipts/expense-feed.tsx`, `src/components/receipts/expense-row.tsx`, `src/components/receipts/expenses-summary.tsx`
- Modify: `src/pages/receipts/index.tsx` (replace lines ~638–887 list rendering + ~561–601 summary/empty/loading; keep all state/handlers)

- [ ] **Step 1: `group-receipts-by-day.ts`** — pure util:
```ts
import type { Receipt } from '@/hooks/receipts/use-receipts'

export interface DayGroup { key: string; label: string; date: string; monthLabel: string; items: Receipt[]; subtotalsByCurrency: Record<string, number> }

export function groupReceiptsByDay(receipts: Receipt[], now = new Date()): DayGroup[] {
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const today = dayKey(now)
  const yest = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  const groups = new Map<string, DayGroup>()
  for (const r of receipts) {
    const d = new Date(r.receiptDate || r.createdAt)
    const k = dayKey(d)
    let g = groups.get(k)
    if (!g) {
      const label = k === today ? 'Today' : k === yest ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'short' })
      g = { key: k, label, date: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
            monthLabel: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), items: [], subtotalsByCurrency: {} }
      groups.set(k, g)
    }
    g.items.push(r)
    const cur = r.currency || 'RSD'
    g.subtotalsByCurrency[cur] = (g.subtotalsByCurrency[cur] || 0) + (Number(r.totalAmount) || 0)
  }
  return [...groups.values()] // already in receiptDate-DESC order from the API
}
```
  (Today/Yesterday/weekday should use i18n in the component layer; keep the util locale-neutral or pass labels in — finalize at session start. Use `useCurrencyConverter` in the component to show a single converted subtotal when currencies are mixed.)
- [ ] **Step 2: Verify the util** — scratch run:
  `node -e "require('esbuild')..."` is overkill; instead temporarily import it in the `/__exp-preview` harness and log groups for sample receipts; confirm Today/Yesterday/weekday + subtotals. (No vitest in repo.)
- [ ] **Step 3: `expense-row.tsx`** — `ExpenseRow({ receipt, wide, selectMode, selected, onOpen, onKebab })` per the row anatomy: `CatTile` left; line 1 store (ellipsis) + `Amount`; line 2 `CatName` · group pill (`Users`/`Archive` glyph) · `StatusBadge` (desktop always; mobile only `pending|recurring|failed`) + time right; desktop trailing kebab (Chunk 5 fills the menu — here just the button + `onKebab`). Selection checkbox when `selectMode`. Wrap rows in an `.ex-list`-style card (`bg-card border rounded-2xl divide-y divide-hairline-soft shadow-glass-1`).
- [ ] **Step 4: `expense-feed.tsx`** — `ExpenseFeed({ groups, wide, selectMode, selectedIds, onOpen, onKebab })`: render a month header when `monthLabel` changes; per day group a header (`t-xs` label·date left, tabular subtotal right) over an `.ex-list` of `ExpenseRow`s. Reuse `StaggerContainer/StaggerItem` for entrance.
- [ ] **Step 5: `use-infinite-receipts.ts`** — `useInfiniteQuery` wrapper over `GET /receipts` (page param, `getNextPageParam` from `meta.page < meta.totalPages`), flattens `data`, exposes `meta`/`totalAmounts` from the first page. For **mobile** only; desktop keeps `useReceipts` per-page. Keep the same query-key family so cache is coherent.
- [ ] **Step 6: `expenses-summary.tsx`** — desktop summary row (Total + `Amount`, `Select` button, "Showing X–Y of N"); mobile lives in the page-level frosted header (title + total + count). Use `meta.total` + converted `totalAmounts`; show the mixed-currency `info` note only when currencies differ.
- [ ] **Step 7: Rewire `pages/receipts/index.tsx`** — raise `limit` 10→50; replace the table/cards block with `<ExpenseFeed>` fed by `groupReceiptsByDay(...)`; desktop `<Pagination>` (glass, Chunk 7) footer; mobile `<button>Load more</button>` calling `fetchNextPage`. Keep `filters`/URL-sync/debounce, `sortBy/sortOrder`, `selectedIds`, and all handlers untouched. Replace empty/loading blocks with the glass empty state + `SkelRow` skeleton.
- [ ] **Step 8: Build + verify** — `npm run build`; preview `/receipts` mobile+desktop, light+dark: day groups + subtotals correct, month header, pagination (desktop) + Load-more (mobile), empty + loading, filter→refetch still works, URL params still sync.
- [ ] **Step 9: Commit** — `feat(receipts): day-grouped glass feed (desktop pages + mobile load-more)`.

**Acceptance:** feed renders grouped by day with subtotals; pagination + load-more work; header total/count from whole filtered set; filters/URL/debounce/selection plumbing unchanged; empty + loading states.

---

## Chunk 3 — Filters: desktop rail + mobile sheet

**Goal:** Persistent glass `FilterRail` (desktop) + `FilterSheet` (mobile) + mobile `QuickChips`, using the **real glass date-picker** (fixes the broken rail picker). Auto-apply (debounce already exists).

**Files:** Create `filter-rail.tsx`, `filter-sheet.tsx`, `quick-chips.tsx`; modify `pages/receipts/index.tsx` (swap `ReceiptsFiltersBar`); deprecate/remove `components/receipts/receipts-filters.tsx`.

- [ ] **Step 1: `filter-rail.tsx`** — desktop `aside` glass rail (sticky `top-24`, 240px): category checklist (`SelectCheck` + emoji + name, "Show all categories" expander), Amount min / "No limit" glass fields, Date range preset chips (This month / Last 30 days / Custom) + From/To via `<DatePicker>` (glass), "Clear all". Map to `categoryId, minAmount, maxAmount, startDate, endDate`; call `onFiltersChange` (auto-applies via existing debounce). **No Apply button.**
- [ ] **Step 2: `quick-chips.tsx`** — mobile horizontal scroll chip row (All / This month / category quick-picks); active chip inverted; maps to the same filter setters.
- [ ] **Step 3: `filter-sheet.tsx`** — mobile bottom sheet (reuse the onboarding sheet pattern: Radix Dialog + Framer slide-up) with the same controls; footer "Clear all" + "Show N results" (the button **closes the sheet**; filters already applied live — see spec). Drag handle, safe-area, reduced-motion.
- [ ] **Step 4: Wire into the page** — desktop renders `<FilterRail>` in the `ex-body` flex; mobile renders `<QuickChips>` in the header + a filter button opening `<FilterSheet>`. Remove the old show/hide filter panel + `ReceiptsFiltersBar`.
- [ ] **Step 5: Build + verify** — date-pickers render as glass fields (the reported bug), presets set ranges, category checklist filters, auto-apply refetches, URL sync intact; mobile sheet slides + "Show N results" reflects live count.
- [ ] **Step 6: Commit** — `feat(receipts): glass filter rail + mobile filter sheet (real date-pickers)`.

**Acceptance:** filters work identically to today (same query params, debounce, URL), now as a glass rail/sheet; the rail date-pickers match the app's real component.

---

## Chunk 4 — Add / templates / import-export overlays

**Goal:** Replace the three top dropdowns with the `+` menu (desktop) and the FAB Add action sheet (mobile); restyle template picker + import guide; wire export; mobile "…" menu.

**Files:** Create `add-menu.tsx`, `import-guide-dialog.tsx`; modify `template-selector-modal.tsx` (glass), `pages/receipts/index.tsx`, and the Chunk-1 `mobile-tab-bar.tsx` FAB wiring.

- [ ] **Step 1: `add-menu.tsx`** — desktop `+` dropdown (Blank receipt → `handleAddManually`; From template → opens template picker; sep; Import CSV → import guide; Export CSV → `handleExport`) as a glass `.ex-menu`. Mobile Add **action sheet** (Scan QR → `openQrScanner`; From gallery → `openGalleryScanner`; Add manually; From template; sep; Import/Export) opened by the FAB.
- [ ] **Step 2: Wire FAB → Add sheet** on the Expenses route (the tab-bar FAB `onPress` opens this sheet when on `/receipts`).
- [ ] **Step 3: `template-selector-modal.tsx` glass** — restyle to glass sheet (mobile) / modal (desktop): template cards (name, store, currency pill, `CatChip`), "Create template" → `/templates`. Keep `useTemplates()` + `onSelect` wiring.
- [ ] **Step 4: `import-guide-dialog.tsx`** — extract the inline import guide (page lines ~926–980) into a glass sheet/modal: CSV column list (mono names + "required" tags), date-format tip, Download template + Select file (hidden input). Keep `useImportReceipts` + result toast wiring.
- [ ] **Step 5: Toolbar actions** — desktop `PageToolbar` `actions` = `[+ menu, gradient Scan CTA]`; "Manage templates" link in the subtitle. Remove the old `flex flex-wrap` button row (page lines ~432–555).
- [ ] **Step 6: Mobile "…" menu** — header overflow menu: Select expenses (Chunk 5), Sort (Newest/Oldest toggling `sortBy/sortOrder`), Import/Export.
- [ ] **Step 7: Build + verify** — every Add path opens the right flow; Scan CTA + FAB scan work; template prefill works; import guide + export work; sort toggles.
- [ ] **Step 8: Commit** — `feat(receipts): + menu / FAB add sheet, glass template picker + import guide`.

**Acceptance:** all Add/Scan/Import/Export entry points work via the new menus; no top button-row remains.

---

## Chunk 5 — Bulk select + per-row actions + confirms

**Goal:** Explicit selection mode, bulk bars, kebab row actions with gating, assign-category + delete confirms.

**Files:** Create `bulk-bar.tsx`, `row-kebab.tsx`, `assign-category-dialog.tsx`; modify `pages/receipts/index.tsx`, `expense-row.tsx`.

- [ ] **Step 1: Selection mode** — enter via desktop summary "Select" button and mobile "…"→"Select expenses". In select mode: rows show `SelectCheck`, kebabs hide, row highlight (`bg-primary-soft`), header swaps to "{n} selected / Cancel". Keep the `selectedIds: Set<string>` + select-all (current page) logic.
- [ ] **Step 2: `bulk-bar.tsx`** — desktop floating glass pill (`.ex-deskbulk`): count + sum + Assign category + Remove selected + Clear; mobile bottom glass bar (`.ex-bulkbar`, above the tab bar): count/sum + Category + Remove. Copy via `receipts.selected/assignCategory/removeSelected/clearSelection`.
- [ ] **Step 3: `assign-category-dialog.tsx`** — glass sheet/modal of category chips → `useBulkUpdateCategory({ ids, categoryId|null })`; report `{updated,skipped}` via `receipts.bulkCategoryPartial/Success`.
- [ ] **Step 4: `row-kebab.tsx`** — desktop row menu: View (only if `hasJournal` → `ReceiptViewerModal`), Edit (disabled if `group.isArchived` or `status==='recurring'`, tooltip `archivedGroupLocked`/`recurringLocked`), Delete (same gating → glass `ConfirmDialog`). Locked rows render the reason note + disabled mini-actions.
- [ ] **Step 5: Confirms** — single delete + bulk delete via the glass `ConfirmDialog` (Chunk 7); bulk delete reports `{deleted,skipped}` (`receipts.bulkDeletePartial/Success`).
- [ ] **Step 6: Build + verify** — select/cancel, select-all, assign (incl. skipped archived), remove (incl. skipped), gating tooltips on locked rows, view gated by `hasJournal`.
- [ ] **Step 7: Commit** — `feat(receipts): selection mode, bulk bars, kebab actions + gating`.

**Acceptance:** bulk ops + per-row actions match today's behavior with the new UI; all gating + skip-reporting preserved.

---

## Chunk 6 — Scan flow restyle (`qr-scanner.tsx`)

**Goal:** Restyle the 674-line scanner to a glass sheet (mobile) / modal (desktop) across all `scan-flow` states; keep all logic.

**Files:** Modify `src/components/receipts/qr-scanner.tsx` (and gallery entry in `use-receipt-scanner` if presentational only).

- [ ] **Step 1** — glass shell: bottom sheet (mobile) / centered modal (desktop), header (camera icon + "Scan" + sub), privacy `info` tip, Cancel footer.
- [ ] **Step 2** — camera viewport (`.ex-camera` black 230px), finder reticle, `.ex-cam-hint`, torch button, camera-select control (Auto/Rear/Front/devices, persisted to `receipto-camera-selection`).
- [ ] **Step 3** — `processing` state (`loader-2` spin + `qrScanner.processing/processingDescription`).
- [ ] **Step 4** — `retrying_portal` state: spinner + "Waiting for fiscal server · Retrying {{attempt}}/{{max}}" from `retryMeta`, Retry now / Cancel retry / Use gallery, `qrScanner.portalDelayHint`.
- [ ] **Step 5** — non-fiscal `error` state: red circle + `qrScanner.nonFiscalQrError` + Try again / Use gallery.
- [ ] **Step 6** — gallery path errors (`gallery.noQrFound/invalidImage`).
- [ ] **Step 7: Build + verify** — drive each state (mock `flowState`/`retryMeta` via a harness), screenshot all four states mobile+desktop light+dark.
- [ ] **Step 8: Commit** — `feat(receipts): glass scan flow (camera/processing/retry/error)`.

**Acceptance:** all scan states render glass; wiring to `scan-flow` + `retryMeta` unchanged; QR validation + 2-min portal retry intact.

---

## Chunk 8 — Polish, states, i18n, verify, docs

**Goal:** Finishing pass + full verification + docs.

**Files:** misc small edits; `docs/design-system.md`, `docs/recent-changes.md`.

- [ ] **Step 1** — import partial-success toast (`receipts.import.partialSuccess/errorsOccurred`) via Sonner; converted-currency `info` note when `totalAmounts` has mixed currencies.
- [ ] **Step 2** — optional AI-suggestion card on fresh uncategorized scanned rows (`category-suggestion-card` look, `.ex-ai`) — only if cheap; else defer.
- [ ] **Step 3** — motion + `prefers-reduced-motion` pass (sheets, stagger); tabular-nums on all amounts.
- [ ] **Step 4** — i18n: confirm every visible string uses an existing `receipts.*`/`common.*` key; add any net-new keys to **both** en.json + sr.json (e.g. `receipts.uncategorized` if missing, `loadMore`, quick-chip labels). Verify localized exceptions unaffected.
- [ ] **Step 5: Full verification matrix** — `/receipts` mobile+desktop, light+dark: feed/grouping, filters↔URL↔debounce, selection+bulk skip-reporting, scan states, import partial-success, gating tooltips, pagination+load-more, empty+loading. Plus the cross-route chrome check from Chunk 1.
- [ ] **Step 6: Docs** — update `docs/design-system.md` (new primitives: StatusBadge/CatTile/CatName/Amount, tab-bar, PageToolbar, the new tokens) and `docs/recent-changes.md`; mark Expenses migrated.
- [ ] **Step 7: Commit** — `feat(receipts): polish, states, i18n, docs for Expenses redesign`.

**Acceptance:** all states present; full matrix passes; i18n complete (en+sr); docs updated.

---

## Self-review

- **Spec coverage:** list/feed+grouping ✓C2; filters rail+sheet+date-picker fix ✓C3,C7; toolbar ✓C1,C4; sidebar+tab-bar/FAB ✓C1; scan flow ✓C6; add/template/import/export ✓C4; bulk+kebab+gating+confirms ✓C5,C7; states (empty/loading/selection/scan/locked/import-toast) ✓C2,C5,C6,C8; shared comps glass ✓C7; tokens/primitives ✓C0; day-grouping client-side + load-more + limit 50 ✓C2; converted note ✓C2,C8; i18n+docs ✓C8. Out-of-scope (ReceiptModal/PFR/search) correctly excluded.
- **Placeholder scan:** Chunks 3–6/8 are intentionally chunk-scoped roadmaps (per the multi-session model stated up top), each with concrete files + ordered steps + acceptance; expand each into a full per-chunk plan at session start. Chunk 0 ships real code.
- **Type consistency:** `groupReceiptsByDay`/`DayGroup`, `StatusBadge`/`CatTile`/`CatName`/`Amount`/`SelectCheck`, `PageToolbar`/`MobileTabBar`, `useInfiniteReceipts` names are used consistently across chunks and match the file-structure table.
