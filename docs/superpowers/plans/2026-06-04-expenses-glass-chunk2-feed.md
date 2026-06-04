# Expenses "Glass" — Chunk 2: Day-Grouped Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the monolith's desktop `<Table>` + mobile `<Card>` list (and the summary/empty/loading blocks) with a day-grouped glass feed wired to the existing hooks — desktop numbered pages, mobile `useInfiniteQuery` "Load more" — preserving the exact filter→URL→debounce→refetch loop, selection, sort, and every dialog/handler.

**Architecture:** One feed component (`ExpenseFeed` → day groups of `ExpenseRow`s) rendered from **one** data source chosen by viewport (`useIsMobile(768)`): desktop uses the existing page-based `useReceipts`; mobile uses a new `useInfiniteReceipts` (`useInfiniteQuery`) that appends pages. Day grouping is a pure client-side util. The toolbar, filters bar, and all dialogs are **left untouched** (Chunks 3–5 replace them).

**Tech Stack:** React 19, TypeScript (strict), TanStack Query 5 (`useInfiniteQuery`), date-fns (en/sr locales), Tailwind v4, lucide-react, i18next.

**Companion spec:** `docs/superpowers/specs/2026-06-04-expenses-glass-redesign-design.md`. **Master plan:** `docs/superpowers/plans/2026-06-04-expenses-glass-redesign.md` (Chunk 2). **Chunk 0 primitives** (`StatusBadge/CatTile/CatName/SelectCheck/Amount`) are in `src/components/receipts/primitives.tsx`.

---

## Decisions to confirm (flagged)

- **D1 — Single data source per viewport.** Both desktop+mobile views are in the DOM today (CSS-hidden). To avoid a double network fetch, render **only one** feed via `useIsMobile(768)`: desktop → `useReceipts` (numbered pages), mobile → `useInfiniteReceipts` (Load more). A resize across 768px refetches the other path (acceptable; rare).
- **D2 — Keep inline row actions + always-visible selection in Chunk 2.** The master plan's *kebab menu* + *explicit selection mode* + *glass bulk bars* are **Chunk 5**. To avoid regressing View/Edit/Delete and selection between chunks, `ExpenseRow` keeps **inline View/Edit/Delete buttons** (desktop) with full gating, and the existing **always-visible checkbox + selection bar** stay. Chunk 5 converts them to kebab + selection mode + glass bulk bars. (Lower-regret; everything keeps working.)
- **D3 — Day labels are locale-aware in the component, not the util.** `groupReceiptsByDay` is pure/locale-neutral (returns `Date` + items + subtotals). `ExpenseFeed` formats Today/Yesterday via `t('common.today/yesterday')` and weekday/date/month via date-fns with the active locale.
- **D4 — Mixed-currency subtotal.** Per-day subtotal shows the native amount when the day is single-currency; when mixed, shows a single converted amount (`useCurrencyConverter`) in `preferredCurrency`.

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/group-receipts-by-day.ts` | create | Pure day-grouping + per-day per-currency subtotals |
| `src/hooks/receipts/use-infinite-receipts.ts` | create | `useInfiniteQuery` wrapper (mobile Load-more) |
| `src/components/receipts/expense-row.tsx` | create | One expense row (CatTile · store · Amount · CatName · group pill · StatusBadge · time · checkbox · inline actions) |
| `src/components/receipts/expense-feed.tsx` | create | Month header → day groups (header + subtotal) → `.ex-list` of rows |
| `src/components/receipts/expenses-summary.tsx` | create | Total (+ converted note) · count · desktop showing-range |
| `src/pages/receipts/index.tsx` | modify | Raise limit→50; swap summary (561–584), loading/empty (586–601), and list (637–887) for the new feed + Pagination/Load-more; keep ALL state/handlers/dialogs |
| `src/i18n/en.json` + `sr.json` | modify | net-new: `common.today/yesterday`, `receipts.loadMore/select/count` |

No unit-test harness (Playwright-only). Per-step verify = `npm run build` + a `node` check for the pure util + preview on **5180 `--strictPort`** (the page is behind auth; use a throwaway harness that feeds sample receipts into `ExpenseFeed`/`ExpensesSummary`, plus a logged-in real-route pass if the backend is up).

---

## Task 1 — i18n keys (net-new, en + sr)

**Files:** `src/i18n/en.json`, `src/i18n/sr.json`

- [ ] **Step 1:** In `common`, add `"today"`/`"yesterday"` → en `"Today"`/`"Yesterday"`, sr `"Danas"`/`"Juče"`.
- [ ] **Step 2:** In `receipts`, add:
  - `"loadMore"` → en `"Load more"`, sr `"Učitaj još"`
  - `"select"` → en `"Select"`, sr `"Izaberi"`
  - `"count"` → en `"{{count}} total"`, sr `"{{count}} ukupno"`
- [ ] **Step 3:** `node -e "require('./src/i18n/en.json'); require('./src/i18n/sr.json')"` → both parse.
  (Reuse the existing `common.pagination.showing` = "Showing {{from}}-{{to}} of {{total}}" for the desktop range; `receipts.total`/`filteredTotal`/`convertedNote`/`convertedDisclaimer` already exist.)

---

## Task 2 — `group-receipts-by-day.ts` (pure util)

**Files:** create `src/lib/group-receipts-by-day.ts`

- [ ] **Step 1: Write the util** (locale-neutral; labels computed in the component):

```ts
import type { Receipt } from '@/hooks/receipts/use-receipts'

export interface DayGroup {
  /** local-calendar-day key, e.g. "2026-5-4" */
  key: string
  /** the day's Date (midnight-ish; the first receipt's date) */
  date: Date
  items: Receipt[]
  /** Σ totalAmount per currency for this day's loaded rows */
  subtotalsByCurrency: Record<string, number>
}

/** Group receipts by local calendar day of receiptDate (fallback createdAt), preserving input order (API returns receiptDate DESC). */
export function groupReceiptsByDay(receipts: Receipt[]): DayGroup[] {
  const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const groups = new Map<string, DayGroup>()
  for (const r of receipts) {
    const d = new Date(r.receiptDate || r.createdAt)
    const k = dayKey(d)
    let g = groups.get(k)
    if (!g) {
      g = { key: k, date: d, items: [], subtotalsByCurrency: {} }
      groups.set(k, g)
    }
    g.items.push(r)
    const cur = r.currency || 'RSD'
    g.subtotalsByCurrency[cur] = (g.subtotalsByCurrency[cur] || 0) + (Number(r.totalAmount) || 0)
  }
  return [...groups.values()]
}
```

- [ ] **Step 2: Verify (scratch node run)** — confirm grouping + subtotals:

```bash
node --input-type=module -e "
const { groupReceiptsByDay } = await import('./src/lib/group-receipts-by-day.ts').catch(async () => {
  // ts not directly runnable; inline a JS copy for the smoke check:
  globalThis.x = 1; return {};
});
"
```
  (Since `.ts` isn't node-runnable without a loader, instead temporarily import `groupReceiptsByDay` in the Task-7 harness and `console.log` the groups for the sample receipts; confirm same-day rows merge and `subtotalsByCurrency` sums correctly.)

- [ ] **Step 3:** `npm run build` → PASS.

---

## Task 3 — `use-infinite-receipts.ts` (mobile Load-more)

**Files:** create `src/hooks/receipts/use-infinite-receipts.ts`

Reuses the same `/receipts` endpoint + a parallel query-key family so the cache stays coherent. `fetchReceipts` isn't exported, so re-implement the tiny fetch via the shared `api` client (same param names).

- [ ] **Step 1: Write the hook:**

```ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { PaginatedReceipts, ReceiptsFilters } from '@/hooks/receipts/use-receipts'

function buildQuery(filters: ReceiptsFilters & { page: number }): string {
  const p = new URLSearchParams()
  if (filters.groupId) p.append('groupId', filters.groupId)
  if (filters.categoryId) p.append('categoryId', filters.categoryId)
  if (filters.minAmount !== undefined) p.append('minAmount', String(filters.minAmount))
  if (filters.maxAmount !== undefined) p.append('maxAmount', String(filters.maxAmount))
  if (filters.startDate) p.append('startDate', filters.startDate)
  if (filters.endDate) p.append('endDate', filters.endDate)
  p.append('page', String(filters.page))
  if (filters.limit !== undefined) p.append('limit', String(filters.limit))
  if (filters.sortBy) p.append('sortBy', filters.sortBy)
  if (filters.sortOrder) p.append('sortOrder', filters.sortOrder)
  return p.toString()
}

/** Mobile feed: appends pages. `enabled` lets the page run only one data path per viewport. */
export function useInfiniteReceipts(filters: ReceiptsFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.receipts.lists(), 'infinite', filters] as const,
    queryFn: ({ pageParam }) =>
      api.get<PaginatedReceipts>(`/receipts?${buildQuery({ ...filters, page: pageParam })}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled,
  })
}
```

- [ ] **Step 2:** `npm run build` → PASS (verify `api`/`queryKeys` import paths resolve).

**Consumer shape:** flatten `data.pages.flatMap(p => p.data)`; first page gives `meta`/`totalAmounts` (whole filtered set).

---

## Task 4 — `expense-row.tsx`

**Files:** create `src/components/receipts/expense-row.tsx`

Row anatomy (handoff `.ex-row`): CatTile left; line 1 = store (ellipsis) + `Amount`; line 2 = `CatName` · group pill (`Users`/`Archive` glyph) · `StatusBadge` (desktop always; mobile only `pending|recurring|failed`) + time right. Selection checkbox when `selectMode`; inline View/Edit/Delete (D2) when not.

- [ ] **Step 1: Write the component:**

```tsx
import { useTranslation } from 'react-i18next'
import { Users, Archive, Eye, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Amount, CatTile, CatName, SelectCheck, StatusBadge } from '@/components/receipts/primitives'
import type { Receipt } from '@/hooks/receipts/use-receipts'

const NOTABLE = new Set(['pending', 'recurring', 'failed'])

interface ExpenseRowProps {
  receipt: Receipt
  wide?: boolean
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onView?: (r: Receipt) => void
  onEdit?: (r: Receipt) => void
  onDelete?: (r: Receipt) => void
}

export function ExpenseRow({
  receipt: r, wide, selectMode, selected, onToggleSelect, onView, onEdit, onDelete,
}: ExpenseRowProps) {
  const { t } = useTranslation()
  const locked = !!r.group?.isArchived || r.status === 'recurring'
  const lockTitle = r.group?.isArchived
    ? t('receipts.archivedGroupLocked')
    : r.status === 'recurring' ? t('receipts.recurringLocked') : undefined
  const time = r.receiptDate ? format(new Date(r.receiptDate), 'HH:mm') : ''
  const showBadge = wide || NOTABLE.has(r.status)

  return (
    <div
      className={cn(
        'flex items-center gap-3.5 px-4 py-3 transition-colors',
        wide && 'px-[18px] py-[15px]',
        selectMode ? 'cursor-pointer' : '',
        selected ? 'bg-primary-soft' : 'hover:bg-bg-subtle',
      )}
      onClick={selectMode ? () => onToggleSelect?.(r.id) : undefined}
    >
      {selectMode && <SelectCheck on={selected} />}
      <CatTile category={r.category} size={wide ? 44 : 42} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2.5">
          <span className="truncate text-[15px] font-semibold">{r.storeName || t('receipts.unknownStore')}</span>
          <Amount value={r.totalAmount ?? 0} currency={r.currency || 'RSD'} size={wide ? 16 : 15.5} />
        </div>
        <div className="mt-[5px] flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <CatName name={r.category?.name} />
            {r.group && (
              <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted-foreground', r.group.isArchived && 'opacity-70')}>
                {r.group.isArchived && <Archive className="size-2.5" />}
                <Users className="size-2.5" />
                <span className="max-w-[120px] truncate">{r.group.name}</span>
              </span>
            )}
            {showBadge && <StatusBadge status={r.status} />}
          </div>
          {time && <span className="shrink-0 text-[11px] text-fg-faint">{time}</span>}
        </div>
      </div>
      {!selectMode && (
        <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          {r.hasJournal && (
            <button className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-bg-subtle hover:text-foreground" title={t('receipts.viewer.viewReceipt')} onClick={() => onView?.(r)}>
              <Eye className="size-4" />
            </button>
          )}
          <button className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-bg-subtle hover:text-foreground disabled:opacity-40" disabled={locked} title={lockTitle} onClick={() => onEdit?.(r)}>
            <Pencil className="size-4" />
          </button>
          <button className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40" disabled={locked} title={lockTitle} onClick={() => onDelete?.(r)}>
            <Trash2 className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 5 — `expense-feed.tsx`

**Files:** create `src/components/receipts/expense-feed.tsx`

Month header when `monthLabel` changes → per day a header (`t-xs` label·date left, tabular subtotal right) over an `.ex-list` card of `ExpenseRow`s. Reuses `StaggerContainer/StaggerItem` for entrance.

- [ ] **Step 1: Write the component:**

```tsx
import { useTranslation } from 'react-i18next'
import { format, isToday, isYesterday } from 'date-fns'
import { enUS, sr } from 'date-fns/locale'
import { StaggerContainer, StaggerItem } from '@/components/ui/animated'
import { Amount } from '@/components/receipts/primitives'
import { ExpenseRow } from '@/components/receipts/expense-row'
import { groupReceiptsByDay } from '@/lib/group-receipts-by-day'
import { useCurrencyConverter } from '@/hooks/currencies/use-currency-converter'
import type { Receipt } from '@/hooks/receipts/use-receipts'

const LOCALES = { en: enUS, sr } as const

interface ExpenseFeedProps {
  receipts: Receipt[]
  wide?: boolean
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onView?: (r: Receipt) => void
  onEdit?: (r: Receipt) => void
  onDelete?: (r: Receipt) => void
}

export function ExpenseFeed({ receipts, wide, selectMode, selectedIds, onToggleSelect, onView, onEdit, onDelete }: ExpenseFeedProps) {
  const { t, i18n } = useTranslation()
  const locale = LOCALES[i18n.language as keyof typeof LOCALES] || enUS
  const { convert, preferredCurrency } = useCurrencyConverter()
  const groups = groupReceiptsByDay(receipts)

  const dayLabel = (d: Date) =>
    isToday(d) ? t('common.today') : isYesterday(d) ? t('common.yesterday') : format(d, 'EEEE', { locale })

  const subtotal = (by: Record<string, number>) => {
    const curs = Object.keys(by)
    if (curs.length === 1) return <Amount value={by[curs[0]]} currency={curs[0]} size={12} weight={600} muted />
    const total = curs.reduce((s, c) => s + convert(by[c], c), 0)
    return <Amount value={total} currency={preferredCurrency} size={12} weight={600} muted />
  }

  let lastMonth = ''
  return (
    <StaggerContainer key={receipts.map((r) => r.id).join()} className="flex flex-col gap-[18px] md:gap-[22px]">
      {groups.map((g) => {
        const monthLabel = format(g.date, 'LLLL yyyy', { locale })
        const showMonth = monthLabel !== lastMonth
        lastMonth = monthLabel
        return (
          <StaggerItem key={g.key}>
            {showMonth && <div className="t-xs mb-1 px-1 text-fg-faint">{monthLabel}</div>}
            <div className="flex items-baseline justify-between px-1 py-2">
              <span className="t-xs">{dayLabel(g.date)} · {format(g.date, 'd LLL', { locale })}</span>
              {subtotal(g.subtotalsByCurrency)}
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-glass-1 [&>div+div]:border-t [&>div+div]:border-hairline-soft">
              {g.items.map((r) => (
                <ExpenseRow
                  key={r.id}
                  receipt={r}
                  wide={wide}
                  selectMode={selectMode}
                  selected={!!selectedIds?.has(r.id)}
                  onToggleSelect={onToggleSelect}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </StaggerItem>
        )
      })}
    </StaggerContainer>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 6 — `expenses-summary.tsx`

**Files:** create `src/components/receipts/expenses-summary.tsx`

Desktop = Total + converted note + "Showing X–Y of N" + a **Select** button (D2 toggles `selectMode`). Mobile = total + count.

- [ ] **Step 1: Write the component:**

```tsx
import { useTranslation } from 'react-i18next'
import { Info, CheckSquare, X } from 'lucide-react'
import { Amount } from '@/components/receipts/primitives'
import { useCurrencyConverter } from '@/hooks/currencies/use-currency-converter'
import type { CurrencyTotal } from '@/hooks/receipts/use-receipts'

interface ExpensesSummaryProps {
  totalAmounts: CurrencyTotal[]
  total: number
  filtersActive: boolean
  selectMode: boolean
  onToggleSelectMode: () => void
  rangeFrom?: number
  rangeTo?: number
}

export function ExpensesSummary({ totalAmounts, total, filtersActive, selectMode, onToggleSelectMode, rangeFrom, rangeTo }: ExpensesSummaryProps) {
  const { t } = useTranslation()
  const { convert, preferredCurrency } = useCurrencyConverter()
  const convertedTotal = totalAmounts.reduce((s, { currency, total }) => s + convert(total, currency), 0)
  const mixed = !(totalAmounts.length === 1 && totalAmounts[0].currency === preferredCurrency)

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-sm font-medium text-muted-foreground">
        {filtersActive ? t('receipts.filteredTotal') : t('receipts.total')}:
      </span>
      <Amount value={convertedTotal} currency={preferredCurrency} size={15} />
      {mixed && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={t('receipts.convertedDisclaimer')}>
          <Info className="size-3" />
          {t('receipts.convertedNote')}
        </span>
      )}
      <span className="ml-auto hidden items-center gap-3 md:flex">
        {rangeFrom !== undefined && rangeTo !== undefined && (
          <span className="text-sm text-muted-foreground">
            {t('common.pagination.showing', { from: rangeFrom, to: rangeTo, total })}
          </span>
        )}
        <button
          onClick={onToggleSelectMode}
          className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[13px] font-semibold text-fg-2 transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          {selectMode ? <X className="size-3.5" /> : <CheckSquare className="size-3.5" />}
          {selectMode ? t('common.cancel') : t('receipts.select')}
        </button>
      </span>
    </div>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 7 — Rewire `pages/receipts/index.tsx`

**Files:** modify `src/pages/receipts/index.tsx` — keep ALL state/handlers/dialogs/toolbar/filters; swap three regions.

- [ ] **Step 1: Imports + data source.** Add imports for `ExpenseFeed`, `ExpensesSummary`, `useInfiniteReceipts`, `useIsMobile`; add a `selectMode` state. Change the data line (108) to `limit: 50` and add the mobile infinite path gated by viewport:

```tsx
const isMobile = useIsMobile(768)
const [selectMode, setSelectMode] = useState(false)
const { data: response, isLoading } = useReceipts({ ...debouncedFilters, page, limit: 50, sortBy, sortOrder }, /* enabled */ !isMobile)
const inf = useInfiniteReceipts({ ...debouncedFilters, limit: 50, sortBy, sortOrder }, isMobile)
const desktopReceipts = response?.data ?? []
const mobileReceipts = inf.data?.pages.flatMap((p) => p.data) ?? []
const receipts = isMobile ? mobileReceipts : desktopReceipts
const meta = isMobile ? inf.data?.pages[0]?.meta : response?.meta
const totalAmounts = (isMobile ? inf.data?.pages[0]?.totalAmounts : response?.totalAmounts) ?? []
const loading = isMobile ? inf.isLoading : isLoading
```
  (Requires adding an `enabled` arg to `useReceipts` — see Step 1a.)

- [ ] **Step 1a: Add `enabled` to `useReceipts`** in `src/hooks/receipts/use-receipts.ts` (backward-compatible default `true`):
  ```ts
  export function useReceipts(filters?: ReceiptsFilters, enabled = true) {
    return useQuery({ queryKey: ..., queryFn: ..., enabled, ... })
  }
  ```
  (Find the existing `useReceipts` definition; thread `enabled` into its `useQuery` options. All current call-sites pass one arg → unaffected.)

- [ ] **Step 2: Replace the summary block (current lines ~561–584)** with:
  ```tsx
  {totalAmounts.length > 0 && !loading && receipts.length > 0 && (
    <ExpensesSummary
      totalAmounts={totalAmounts}
      total={meta?.total ?? 0}
      filtersActive={filtersActive}
      selectMode={selectMode}
      onToggleSelectMode={() => { setSelectMode((v) => !v); setSelectedIds(new Set()) }}
      rangeFrom={meta && !isMobile ? (meta.page - 1) * meta.limit + 1 : undefined}
      rangeTo={meta && !isMobile ? Math.min(meta.page * meta.limit, meta.total) : undefined}
    />
  )}
  ```

- [ ] **Step 3: Replace the loading + empty blocks (current lines ~586–601)** — loading → glass skeleton; empty stays but glass-styled:
  ```tsx
  {loading ? (
    <div className="flex flex-col gap-3" data-testid="receipts-loading">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-2xl border border-border bg-bg-subtle" />
      ))}
    </div>
  ) : receipts.length === 0 ? (
    <div className="empty-state" data-testid="receipts-empty">
      <Camera className="empty-state-icon" />
      <h3 className="mb-2 text-lg font-semibold">{t('receipts.noReceipts')}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">{t('receipts.noReceiptsText')}</p>
      <Button variant="default" onClick={openQrScanner}><Camera className="h-4 w-4" />{t('receipts.scanQr')}</Button>
    </div>
  ) : (
  ```

- [ ] **Step 4: Replace the whole list region (current lines ~604–887: selection bar + mobile cards + desktop table + both paginations)** with the feed + selection bar + pagination/load-more:
  ```tsx
    <>
      {selectedIds.size > 0 && (
        /* keep the EXISTING selection bar JSX verbatim (assign / remove / clear) */
      )}
      <ExpenseFeed
        receipts={receipts}
        wide={!isMobile}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onView={handleViewReceipt}
        onEdit={handleEditReceipt}
        onDelete={handleDeleteReceipt}
      />
      {isMobile ? (
        inf.hasNextPage && (
          <div className="flex justify-center py-4">
            <Button variant="outline" className="rounded-full" disabled={inf.isFetchingNextPage} onClick={() => inf.fetchNextPage()}>
              {inf.isFetchingNextPage ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('receipts.loadMore')}
            </Button>
          </div>
        )
      ) : (
        meta && meta.totalPages > 1 && (
          <div className="pt-3">
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </div>
        )
      )}
    </>
  )}
  ```
  Remove now-unused imports (`Table*`, `Card*`, `Checkbox`, `formatDateTime`, `getStatusBadge`, `formatAmount`, `getSortIcon`/`handleSort` if no longer referenced — **verify** before deleting; the desktop sort buttons in the table header are removed, so `handleSort`/`getSortIcon`/`sortBy`/`sortOrder` may become unused for rendering but are still passed to the query — keep `sortBy/sortOrder` state + pass to hooks; drop only the now-dead `getSortIcon`/`handleSort` if unreferenced, else leave for Chunk 4's "…" sort).

- [ ] **Step 5:** `npm run build` → PASS (fix any unused-import errors flagged by tsc strict).

---

## Task 8 — Build + verify

- [ ] **Step 1:** `npm run build` → PASS.
- [ ] **Step 2: Throwaway harness** `/__chunk2-preview` (public): feed sample receipts (mixed days/currencies/statuses, one with `group.isArchived`, one `recurring`, one `hasJournal`) into `<ExpensesSummary>` + `<ExpenseFeed wide>` (desktop) and `wide={false}` (mobile), light + dark; also `console.log(groupReceiptsByDay(sample))` to verify Task 2. Screenshot mobile+desktop, light+dark. Remove harness after.
- [ ] **Step 3: Real-route pass (if backend up):** `/receipts` — day groups + subtotals correct, month header, desktop numbered pagination + mobile Load-more append, empty + loading skeleton, **filter→refetch still works**, **URL params still sync**, selection bar + assign/remove still work, View/Edit/Delete gating intact.
- [ ] **Step 4:** `npm run build` → PASS after harness removal.

---

## Task 9 — Commit + push

- [ ] **Step 1:** Stage the 5 new files + `index.tsx` + `use-receipts.ts` + 2 i18n files + this plan (exclude `.claude/`).
- [ ] **Step 2:** Commit: `feat(receipts): day-grouped glass feed (desktop pages + mobile load-more)`.
- [ ] **Step 3:** `git push origin feature/redesign-main-branch`.

---

## Self-review

- **Spec coverage:** day-grouped feed + month header + subtotals ✓T5; client-side grouping ✓T2; limit→50 ✓T7; desktop numbered pages ✓T7; mobile useInfiniteQuery load-more ✓T3,T7; header total/count from meta+totalAmounts ✓T6; converted note on mixed ✓T6,D4; empty + loading skeleton ✓T7; filter→URL→debounce→refetch + selectedIds preserved ✓T7; primitives reused ✓T4,T5; i18n en+sr ✓T1.
- **Deferred (later chunks):** kebab + selection mode + glass bulk bars (C5, D2); PageToolbar adoption + remove old button row (C4); filter rail/sheet (C3); page-level mobile frosted header + quick-chips (C3/C4).
- **Decisions flagged:** D1 (single data source via useIsMobile), D2 (keep inline actions + selection bar), D3 (locale labels in component), D4 (mixed-currency subtotal) — all reversible.
- **Type consistency:** `groupReceiptsByDay`/`DayGroup`, `useInfiniteReceipts`, `ExpenseFeed`/`ExpenseRow`/`ExpensesSummary` match the master-plan file table; `PaginatedReceipts`/`CurrencyTotal`/`ReceiptsFilters` reused from `use-receipts.ts`.
```
