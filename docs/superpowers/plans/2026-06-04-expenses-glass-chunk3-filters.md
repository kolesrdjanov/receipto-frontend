# Expenses "Glass" — Chunk 3: Filters (desktop rail + mobile sheet) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the show/hide filter panel (`ReceiptsFiltersBar`) with a persistent glass **desktop filter rail** + a **mobile filter bottom sheet** + a **mobile quick-chip row**, all auto-applying through the existing 400ms-debounced, URL-synced `handleFiltersChange` loop and mapping only to the real query params (`categoryId`, `minAmount`, `maxAmount`, `startDate`, `endDate`). The date fields use the **real glass `<DatePicker>`** (already restyled in Chunk 7), fixing the previously-broken rail picker.

**Architecture:** Three new presentation components (`FilterRail`, `FilterSheet`, `QuickChips`) + one tiny shared chip (`FilterChip`) + one pure date-preset util (`filter-presets.ts`). They are dumb: they receive `filters` + `categories` and call `onFiltersChange(next)` — the page keeps owning all state, debounce, URL-sync, and page-reset. The page body becomes a desktop two-column flex (sticky rail | feed column); mobile gets a quick-chip + filter-button row above the feed and the sheet portal. `receipts-filters.tsx` is deleted.

**Tech Stack:** React 19, TypeScript (strict), Tailwind v4, shadcn/ui + Radix Dialog, Framer Motion (slide-up sheet, `prefers-reduced-motion`), date-fns (via the shared `DatePicker`), lucide-react, i18next.

**Companion spec:** `docs/superpowers/specs/2026-06-04-expenses-glass-redesign-design.md`. **Master plan:** `docs/superpowers/plans/2026-06-04-expenses-glass-redesign.md` (Chunk 3). **Reuses:** Chunk 0 primitives (`SelectCheck`), Chunk 7 glass `DatePicker`, the onboarding sheet pattern (`components/onboarding/onboarding-modal.tsx`).

---

## Decisions (flagged for approval)

- **D1 — Category filter is single-select (data-layer constraint).** The handoff renders the desktop category list with checkboxes (`SelectCheck`) implying multi-select, but the API exposes a **single `categoryId`** and the chunk constraint is "keep the data layer untouched." So the checklist behaves as a **single-select toggle**: clicking a row selects that category (replacing any prior one); clicking the selected row clears it. Visuals stay as checkboxes per the design. *(Surfaced via AskUserQuestion — multi-select would be a backend change, out of scope.)*
- **D2 — Mobile quick-chips = `All` · `This month` · top categories.** The prototype hard-codes `['All','This month','Groceries','Restaurants','Transport','Shared']`. Real categories are user-defined and there is no group/"Shared" param on this screen, so the chip row is: **All** (clears category + dates), **This month** (date preset), then the user's first 4 categories (each maps to `categoryId`). *(Surfaced via AskUserQuestion.)*
- **D3 — Date presets fill always-visible From/To fields.** Per the handoff, both the rail and the sheet show the two `<DatePicker>` fields **always** (not only under "Custom"). The three chips are shortcuts: **This month** / **Last 30 days** set the range; **Custom** clears the range so the user picks their own. Active chip is derived from the current `startDate`/`endDate` (`activeDatePreset`) — a manual range that matches neither preset auto-highlights "Custom".
- **D4 — Chunk-3 mobile placement is a lightweight filter row, not the full frosted header.** The page-level mobile frosted header (title + total + `…` menu) is **Chunk 4**. Chunk 3 adds only a `md:hidden` row above the feed: `<QuickChips>` + a glass filter button that opens `<FilterSheet>`. Chunk 4 will fold this into the real header.
- **D5 — "This month" = first→last calendar day of the current month.** Future days have no receipts, so end-of-month vs today is equivalent; whole-month bounds are cleaner and make `activeDatePreset` detection stable.

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/filter-presets.ts` | create | Pure date-preset helpers: `thisMonthRange`, `last30DaysRange`, `activeDatePreset` |
| `src/components/receipts/filter-chip.tsx` | create | Shared pill chip (`tone='dark'` for quick-chips/rail presets, `tone='soft'` for sheet) |
| `src/components/receipts/filter-rail.tsx` | create | Desktop persistent glass rail (category checklist, amount, date presets + From/To, Clear all) |
| `src/components/receipts/quick-chips.tsx` | create | Mobile horizontal quick-filter chip row |
| `src/components/receipts/filter-sheet.tsx` | create | Mobile filters bottom sheet (same controls; "Show N results" closes it) |
| `src/pages/receipts/index.tsx` | modify | Remove `showFilters`/`ReceiptsFiltersBar`/Filters toggle; add rail + quick-chip row + sheet; two-column desktop body |
| `src/components/receipts/receipts-filters.tsx` | delete | Replaced by the rail/sheet |
| `src/pages/__chunk3-preview.tsx` | create→delete | Throwaway verification harness (removed before commit) |
| `src/routes.tsx` | modify→revert | Temporary public harness route (removed before commit) |
| `src/i18n/en.json` + `src/i18n/sr.json` | modify | net-new `receipts.filters.*` keys |

No component-unit-test harness exists (Playwright E2E only). Per-step verification = `npm run build` (tsc strict + vite) + preview on port **5180 `--strictPort`** (config at `receipto-frontend/.claude/launch.json`; **5173 is a different project**) + screenshots mobile+desktop, light+dark.

---

## Task 1 — i18n keys (net-new, en + sr)

**Files:** `src/i18n/en.json`, `src/i18n/sr.json`

- [ ] **Step 1:** In **both** files, inside the existing `receipts.filters` object (en ~line 416, sr ~line 416), add the following keys (en value / sr value). Reuse the existing `maxAmountPlaceholder` ("No limit" / "Bez limita") for the max-amount placeholder — do **not** duplicate it.

  | key | en | sr |
  |---|---|---|
  | `title` | `Filters` | `Filteri` |
  | `all` | `All` | `Sve` |
  | `amount` | `Amount` | `Iznos` |
  | `min` | `Min` | `Min` |
  | `dateRange` | `Date range` | `Period` |
  | `thisMonth` | `This month` | `Ovaj mesec` |
  | `last30Days` | `Last 30 days` | `Poslednjih 30 dana` |
  | `custom` | `Custom` | `Prilagođeno` |
  | `showAllCategories` | `Show all categories` | `Prikaži sve kategorije` |
  | `showLess` | `Show less` | `Prikaži manje` |
  | `clearAll` | `Clear all` | `Obriši sve` |
  | `showResults` | `Show {{count}} results` | `Prikaži {{count}} rezultata` |

  (The mobile filter-button aria-label reuses the existing `receipts.filtersButton`. `receipts.filters.category` / `minAmount` / `fromDate` / `toDate` already exist.)

- [ ] **Step 2:** Validate JSON parses:
  Run: `node -e "require('./src/i18n/en.json'); require('./src/i18n/sr.json'); console.log('ok')"`
  Expected: `ok`

---

## Task 2 — `filter-presets.ts` (pure date-preset util)

**Files:** create `src/lib/filter-presets.ts`

- [ ] **Step 1: Write the util:**

```ts
import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'

export type DatePreset = 'thisMonth' | 'last30Days' | 'custom' | null

/** Local-timezone YYYY-MM-DD (matches the backend's date-only filter contract). */
function iso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** First → last calendar day of the current month (D5). */
export function thisMonthRange(now = new Date()): { startDate: string; endDate: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { startDate: iso(start), endDate: iso(end) }
}

/** Today and the 29 days before it (30-day inclusive window). */
export function last30DaysRange(now = new Date()): { startDate: string; endDate: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
  return { startDate: iso(now > start ? start : start), endDate: iso(now) }
}

/** Which preset (if any) the current filter range matches. */
export function activeDatePreset(filters: Pick<ReceiptsFilters, 'startDate' | 'endDate'>, now = new Date()): DatePreset {
  if (!filters.startDate && !filters.endDate) return null
  const tm = thisMonthRange(now)
  if (filters.startDate === tm.startDate && filters.endDate === tm.endDate) return 'thisMonth'
  const l30 = last30DaysRange(now)
  if (filters.startDate === l30.startDate && filters.endDate === l30.endDate) return 'last30Days'
  return 'custom'
}
```

- [ ] **Step 2: Verify (scratch node run)** — the file is TS, so check the logic with an inline JS mirror:
  Run:
  ```bash
  node -e "
  const iso=(d)=>\`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
  const now=new Date(2026,5,15);
  const tm={startDate:iso(new Date(2026,5,1)),endDate:iso(new Date(2026,6,0))};
  console.log('thisMonth', tm);
  console.log('last30 start', iso(new Date(2026,5,15-29)), 'end', iso(now));
  "
  ```
  Expected: `thisMonth { startDate: '2026-06-01', endDate: '2026-06-30' }` and `last30 start 2026-05-17 end 2026-06-15`.

- [ ] **Step 3:** `npm run build` → PASS.

---

## Task 3 — `filter-chip.tsx` (shared pill)

**Files:** create `src/components/receipts/filter-chip.tsx`

Recipe from handoff `.ex-chip` (dark-fill active = `bg-foreground text-background`) and `.ex-fchip` (soft active = `bg-primary-soft text-primary`).

- [ ] **Step 1: Write the component:**

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FilterChipProps {
  label: string
  icon?: ReactNode
  active?: boolean
  /** 'dark' = quick-chips + rail date presets; 'soft' = sheet chips. */
  tone?: 'dark' | 'soft'
  onClick?: () => void
  className?: string
}

export function FilterChip({ label, icon, active, tone = 'dark', onClick, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
        active
          ? tone === 'soft'
            ? 'border-transparent bg-primary-soft text-primary'
            : 'border-transparent bg-foreground text-background'
          : 'border-border bg-card text-fg-2 hover:bg-bg-subtle hover:text-foreground',
        className,
      )}
    >
      {icon}
      {label}
    </button>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 4 — `filter-rail.tsx` (desktop persistent glass rail)

**Files:** create `src/components/receipts/filter-rail.tsx`

Recipe from handoff `.ex-rail` (240px, sticky, frosted, gap-4, p-18, r-4), `.ex-rail-label`, `.ex-railcat`, `.ex-railinput`. Category = single-select toggle (D1); date presets fill always-visible `<DatePicker>` fields (D3).

- [ ] **Step 1: Write the component:**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SelectCheck } from '@/components/receipts/primitives'
import { FilterChip } from '@/components/receipts/filter-chip'
import { DatePicker } from '@/components/ui/date-picker'
import { activeDatePreset, thisMonthRange, last30DaysRange } from '@/lib/filter-presets'
import type { Category } from '@/hooks/categories/use-categories'
import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'

interface FilterRailProps {
  filters: ReceiptsFilters
  categories: Category[]
  onFiltersChange: (filters: ReceiptsFilters) => void
  className?: string
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-[11px] text-[11px] font-bold uppercase tracking-[0.05em] text-fg-faint">{children}</div>
}

export function FilterRail({ filters, categories, onFiltersChange, className }: FilterRailProps) {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const preset = activeDatePreset(filters)
  const shown = showAll ? categories : categories.slice(0, 6)

  const toggleCategory = (id: string) =>
    onFiltersChange({ ...filters, categoryId: filters.categoryId === id ? undefined : id })
  const setAmount = (key: 'minAmount' | 'maxAmount', v: string) =>
    onFiltersChange({ ...filters, [key]: v ? Number(v) : undefined })
  const setDate = (key: 'startDate' | 'endDate', v: string) =>
    onFiltersChange({ ...filters, [key]: v || undefined })

  return (
    <aside
      className={cn(
        'sticky top-8 flex w-60 shrink-0 flex-col gap-4 rounded-2xl border border-border p-[18px] shadow-glass-1',
        'bg-card/74 [backdrop-filter:blur(20px)_saturate(1.4)] [-webkit-backdrop-filter:blur(20px)_saturate(1.4)]',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold">{t('receipts.filters.title')}</span>
        <button type="button" onClick={() => onFiltersChange({})} className="text-[12.5px] font-semibold text-primary hover:underline">
          {t('receipts.filters.clearAll')}
        </button>
      </div>

      {/* Category */}
      <div className="border-b border-hairline-soft pb-4">
        <RailLabel>{t('receipts.filters.category')}</RailLabel>
        <div className="flex flex-col gap-1">
          {shown.map((c) => {
            const on = filters.categoryId === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[13.5px] font-semibold transition-colors hover:bg-bg-subtle',
                  on ? 'text-foreground' : 'text-fg-2',
                )}
              >
                <SelectCheck on={on} />
                <span className="grid size-[26px] shrink-0 place-items-center rounded-lg text-sm" style={{ background: (c.color || '#888') + '24' }}>
                  {c.icon}
                </span>
                <span className="truncate">{c.name}</span>
              </button>
            )
          })}
          {categories.length > 6 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="px-0.5 py-1 text-left text-[12.5px] font-semibold text-primary hover:underline">
              {showAll ? t('receipts.filters.showLess') : t('receipts.filters.showAllCategories')}
            </button>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="border-b border-hairline-soft pb-4">
        <RailLabel>{t('receipts.filters.amount')}</RailLabel>
        <div className="flex items-center gap-2">
          <RailAmountInput placeholder={t('receipts.filters.min')} value={filters.minAmount} onChange={(v) => setAmount('minAmount', v)} />
          <span className="text-fg-faint">–</span>
          <RailAmountInput placeholder={t('receipts.filters.maxAmountPlaceholder')} value={filters.maxAmount} onChange={(v) => setAmount('maxAmount', v)} />
        </div>
      </div>

      {/* Date range */}
      <div>
        <RailLabel>{t('receipts.filters.dateRange')}</RailLabel>
        <div className="mb-2.5 flex flex-wrap gap-2">
          <FilterChip label={t('receipts.filters.thisMonth')} active={preset === 'thisMonth'} onClick={() => onFiltersChange({ ...filters, ...thisMonthRange() })} />
          <FilterChip label={t('receipts.filters.last30Days')} active={preset === 'last30Days'} onClick={() => onFiltersChange({ ...filters, ...last30DaysRange() })} />
          <FilterChip label={t('receipts.filters.custom')} active={preset === 'custom'} onClick={() => onFiltersChange({ ...filters, startDate: undefined, endDate: undefined })} />
        </div>
        <div className="flex flex-col gap-2">
          <DatePicker value={filters.startDate ?? ''} onChange={(v) => setDate('startDate', v)} placeholder={t('receipts.filters.fromDate')} />
          <DatePicker value={filters.endDate ?? ''} onChange={(v) => setDate('endDate', v)} placeholder={t('receipts.filters.toDate')} />
        </div>
      </div>
    </aside>
  )
}

function RailAmountInput({ placeholder, value, onChange }: { placeholder: string; value?: number; onChange: (v: string) => void }) {
  return (
    <div className="flex h-10 flex-1 items-center rounded-[10px] border border-border bg-bg-subtle/70 px-3 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 dark:bg-input/55">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-[13.5px] font-medium text-foreground outline-none placeholder:text-fg-faint"
      />
    </div>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 5 — `quick-chips.tsx` (mobile quick-filter row)

**Files:** create `src/components/receipts/quick-chips.tsx`

Implements D2 (All · This month · top 4 categories). Horizontal scroll, no scrollbar (`.ex-chiprow`).

- [ ] **Step 1: Write the component:**

```tsx
import { useTranslation } from 'react-i18next'
import { FilterChip } from '@/components/receipts/filter-chip'
import { activeDatePreset, thisMonthRange } from '@/lib/filter-presets'
import type { Category } from '@/hooks/categories/use-categories'
import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'

const MAX_CATEGORY_CHIPS = 4

interface QuickChipsProps {
  filters: ReceiptsFilters
  categories: Category[]
  onFiltersChange: (filters: ReceiptsFilters) => void
}

export function QuickChips({ filters, categories, onFiltersChange }: QuickChipsProps) {
  const { t } = useTranslation()
  const preset = activeDatePreset(filters)
  const noFilters = !filters.categoryId && !filters.startDate && !filters.endDate

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <FilterChip
        label={t('receipts.filters.all')}
        active={noFilters}
        onClick={() => onFiltersChange({ ...filters, categoryId: undefined, startDate: undefined, endDate: undefined })}
      />
      <FilterChip
        label={t('receipts.filters.thisMonth')}
        active={preset === 'thisMonth'}
        onClick={() => onFiltersChange({ ...filters, ...thisMonthRange() })}
      />
      {categories.slice(0, MAX_CATEGORY_CHIPS).map((c) => (
        <FilterChip
          key={c.id}
          label={c.name}
          icon={c.icon ? <span className="text-[13px] leading-none">{c.icon}</span> : undefined}
          active={filters.categoryId === c.id}
          onClick={() => onFiltersChange({ ...filters, categoryId: filters.categoryId === c.id ? undefined : c.id })}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 6 — `filter-sheet.tsx` (mobile bottom sheet)

**Files:** create `src/components/receipts/filter-sheet.tsx`

Reuses the onboarding sheet pattern (Radix `Dialog` + Framer slide-up, drag handle, glass-card, safe-area bottom, `prefers-reduced-motion`). Category = soft chips (per the `FiltersSheet` prototype); amount = glass fields; date = preset chips + two real `<DatePicker>`. Footer: "Clear all" (ghost) + "Show N results" (primary) that just **closes** the sheet (filters already applied live).

- [ ] **Step 1: Write the component:**

```tsx
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { FilterChip } from '@/components/receipts/filter-chip'
import { activeDatePreset, thisMonthRange, last30DaysRange } from '@/lib/filter-presets'
import type { Category } from '@/hooks/categories/use-categories'
import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'

const SHEET_EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: ReceiptsFilters
  categories: Category[]
  onFiltersChange: (filters: ReceiptsFilters) => void
  /** Whole-filtered-set count for the "Show N results" button. */
  resultCount: number
}

function Section({ label, last, children }: { label: string; last?: boolean; children: ReactNode }) {
  return (
    <div className={last ? '' : 'mb-4 border-b border-hairline-soft pb-4'}>
      <div className="mb-[11px] text-[11px] font-bold uppercase tracking-[0.05em] text-fg-faint">{label}</div>
      {children}
    </div>
  )
}

function SheetAmountInput({ placeholder, value, onChange }: { placeholder: string; value?: number; onChange: (v: string) => void }) {
  return (
    <div className="flex h-[50px] flex-1 items-center rounded-[14px] border border-border bg-bg-subtle/65 px-3.5 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 dark:bg-input/55">
      <input
        type="number"
        min={0}
        inputMode="numeric"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-fg-faint"
      />
    </div>
  )
}

export function FilterSheet({ open, onOpenChange, filters, categories, onFiltersChange, resultCount }: FilterSheetProps) {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const preset = activeDatePreset(filters)

  const toggleCategory = (id: string) =>
    onFiltersChange({ ...filters, categoryId: filters.categoryId === id ? undefined : id })
  const setAmount = (key: 'minAmount' | 'maxAmount', v: string) =>
    onFiltersChange({ ...filters, [key]: v ? Number(v) : undefined })
  const setDate = (key: 'startDate' | 'endDate', v: string) =>
    onFiltersChange({ ...filters, [key]: v || undefined })

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-[oklch(0_0_0/0.45)] backdrop-blur-[5px] dark:bg-[oklch(0_0_0/0.55)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center">
                <motion.div
                  className="glass-card pointer-events-auto flex max-h-[88vh] w-full flex-col px-0 pt-3 pb-[calc(20px+env(safe-area-inset-bottom))]"
                  style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: SHEET_EASE }}
                >
                  <div className="mx-auto mb-3.5 h-[5px] w-9 shrink-0 rounded-full bg-border" />
                  <DialogPrimitive.Title className="shrink-0 px-[22px] text-[19px] font-bold">{t('receipts.filters.title')}</DialogPrimitive.Title>

                  <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pt-4">
                    <Section label={t('receipts.filters.category')}>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <FilterChip
                            key={c.id}
                            tone="soft"
                            label={c.name}
                            icon={c.icon ? <span className="text-sm leading-none">{c.icon}</span> : undefined}
                            active={filters.categoryId === c.id}
                            onClick={() => toggleCategory(c.id)}
                          />
                        ))}
                      </div>
                    </Section>

                    <Section label={t('receipts.filters.amount')}>
                      <div className="flex items-center gap-2">
                        <SheetAmountInput placeholder={t('receipts.filters.min')} value={filters.minAmount} onChange={(v) => setAmount('minAmount', v)} />
                        <span className="text-fg-faint">–</span>
                        <SheetAmountInput placeholder={t('receipts.filters.maxAmountPlaceholder')} value={filters.maxAmount} onChange={(v) => setAmount('maxAmount', v)} />
                      </div>
                    </Section>

                    <Section label={t('receipts.filters.dateRange')} last>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <FilterChip tone="soft" label={t('receipts.filters.thisMonth')} active={preset === 'thisMonth'} onClick={() => onFiltersChange({ ...filters, ...thisMonthRange() })} />
                        <FilterChip tone="soft" label={t('receipts.filters.last30Days')} active={preset === 'last30Days'} onClick={() => onFiltersChange({ ...filters, ...last30DaysRange() })} />
                        <FilterChip tone="soft" label={t('receipts.filters.custom')} active={preset === 'custom'} onClick={() => onFiltersChange({ ...filters, startDate: undefined, endDate: undefined })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <DatePicker value={filters.startDate ?? ''} onChange={(v) => setDate('startDate', v)} placeholder={t('receipts.filters.fromDate')} />
                        <DatePicker value={filters.endDate ?? ''} onChange={(v) => setDate('endDate', v)} placeholder={t('receipts.filters.toDate')} />
                      </div>
                    </Section>
                  </div>

                  <div className="flex shrink-0 gap-2 px-[22px] pt-4">
                    <Button variant="ghost" className="flex-1 rounded-full" onClick={() => onFiltersChange({})}>
                      {t('receipts.filters.clearAll')}
                    </Button>
                    <Button className="flex-1 rounded-full" onClick={() => onOpenChange(false)}>
                      {t('receipts.filters.showResults', { count: resultCount })}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 7 — Wire into `pages/receipts/index.tsx`

**Files:** modify `src/pages/receipts/index.tsx` — remove the old filter UI, add the rail/quick-chips/sheet, restructure the body into a desktop two-column layout. **Keep all state/handlers/dialogs/data wiring.**

- [ ] **Step 1: Swap imports.**
  - Remove: `import { ReceiptsFiltersBar } from '@/components/receipts/receipts-filters'` (line 26).
  - Add after the existing receipts component imports:
    ```tsx
    import { FilterRail } from '@/components/receipts/filter-rail'
    import { FilterSheet } from '@/components/receipts/filter-sheet'
    import { QuickChips } from '@/components/receipts/quick-chips'
    ```
  - In the lucide import (line 46): remove `Filter`, add `SlidersHorizontal`. Result:
    ```tsx
    import { Camera, Plus, Loader2, Trash2, ChevronDown, Archive, Info, Download, Upload, X, Image, Tag, SlidersHorizontal } from 'lucide-react'
    ```

- [ ] **Step 2: Remove `showFilters` state + add `filterSheetOpen`.**
  - Delete line 81: `const [showFilters, setShowFilters] = useState(() => hasActiveFilters(initialFilters))`.
  - Add near the other UI state (e.g. after `const [filters, setFilters] = useState(...)`):
    ```tsx
    const [filterSheetOpen, setFilterSheetOpen] = useState(false)
    ```

- [ ] **Step 3: Drop the `setShowFilters` call in the URL-sync effect.** In the `useEffect([searchParams])` (lines 127–139), remove:
  ```tsx
  if (hasActiveFilters(newFilters)) {
    setShowFilters(true)
  }
  ```
  Keep `setFilters(newFilters)` and `setPage(1)`.

- [ ] **Step 4: Remove the desktop "Filters" toggle button.** Delete the `<Button ... data-testid="receipts-filter-button">…</Button>` block (lines 358–366) — the whole first `<Button variant={showFilters ? ...}>`. Leave the Scan / Add / Import-Export dropdowns untouched (Chunk 4 replaces them).

- [ ] **Step 5: Remove the old filter panel.** Delete the block (lines 482–484):
  ```tsx
  {showFilters && (
    <ReceiptsFiltersBar filters={filters} onFiltersChange={handleFiltersChange} />
  )}
  ```

- [ ] **Step 6: Restructure the body into a desktop two-column layout.** Replace the region from the summary block (currently line 486) through the end of the list conditional (currently the closing of the `loading ? … : … : ( … )` at line 590) with the structure below. **The summary + states + feed + pagination move into the right-hand feed column; the rail sits to its left; a mobile-only quick-chip + filter-button row sits above the whole thing. All inner JSX (summary props, loading skeleton, empty state, selection bar, `<ExpenseFeed>`, Load-more / `<Pagination>`) is copied verbatim from the current file — only the wrappers are new.**

  ```tsx
      {/* Mobile quick-filter row (full frosted header lands in Chunk 4) */}
      <div className="mb-3 flex items-center gap-2 md:hidden">
        <div className="min-w-0 flex-1">
          <QuickChips filters={filters} categories={categories} onFiltersChange={handleFiltersChange} />
        </div>
        <button
          type="button"
          onClick={() => setFilterSheetOpen(true)}
          aria-label={t('receipts.filtersButton')}
          className="grid size-[42px] shrink-0 place-items-center rounded-[14px] border border-border bg-card text-fg-2 shadow-glass-1 transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          <SlidersHorizontal className="size-[18px]" />
        </button>
      </div>

      <div className="md:flex md:items-start md:gap-6">
        <FilterRail
          className="hidden md:flex"
          filters={filters}
          categories={categories}
          onFiltersChange={handleFiltersChange}
        />

        <div className="min-w-0 flex-1">
          {/* ── summary block (verbatim from current lines 486–496) ── */}
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

          {/* ── loading / empty / feed (verbatim from current lines 498–590) ── */}
          {loading ? (
            <div className="flex flex-col gap-3" data-testid="receipts-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[68px] animate-pulse rounded-2xl border border-border bg-bg-subtle" />
              ))}
            </div>
          ) : receipts.length === 0 ? (
            <div className="empty-state" data-testid="receipts-empty">
              <Camera className="empty-state-icon" />
              <h3 className="text-lg font-semibold mb-2">{t('receipts.noReceipts')}</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">{t('receipts.noReceiptsText')}</p>
              <Button variant="default" onClick={openQrScanner}>
                <Camera className="h-4 w-4" />
                {t('receipts.scanQr')}
              </Button>
            </div>
          ) : (
            <>
              {selectedIds.size > 0 && (
                /* keep the EXISTING selection bar JSX verbatim (lines 519–548) */
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
                      {inf.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
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
        </div>
      </div>
  ```
  > Implementation note: copy the real selection-bar JSX (current lines 519–548) into the placeholder comment above — do not abbreviate it. Everything else here matches the current file 1:1.

- [ ] **Step 7: Render the mobile filter sheet.** Just before the closing `</PageTransition>` (after the bulk-category `<Dialog>` at line 743), add:
  ```tsx
      <FilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        filters={filters}
        categories={categories}
        onFiltersChange={handleFiltersChange}
        resultCount={meta?.total ?? 0}
      />
  ```

- [ ] **Step 8:** `npm run build` → PASS. Fix any unused-symbol errors flagged by tsc strict (expect: `Filter` removed from imports; `showFilters`/`setShowFilters` fully gone; `ReceiptsFiltersBar` import gone).

---

## Task 8 — Delete `receipts-filters.tsx`

**Files:** delete `src/components/receipts/receipts-filters.tsx`

- [ ] **Step 1: Confirm no remaining references:**
  Run: `grep -rn "receipts-filters\|ReceiptsFiltersBar" src/`
  Expected: no matches (after Task 7).
- [ ] **Step 2:** Delete the file.
  Run: `rm src/components/receipts/receipts-filters.tsx`
- [ ] **Step 3:** `npm run build` → PASS.

---

## Task 9 — Build + verify (throwaway harness + real route)

- [ ] **Step 1:** `npm run build` → PASS.

- [ ] **Step 2: Create the throwaway harness** `src/pages/__chunk3-preview.tsx` — renders the rail, quick-chips, and an always-open sheet against sample categories with a local `filters` state, so the surfaces are screenshot-able without auth:

  ```tsx
  import { useState } from 'react'
  import { FilterRail } from '@/components/receipts/filter-rail'
  import { QuickChips } from '@/components/receipts/quick-chips'
  import { FilterSheet } from '@/components/receipts/filter-sheet'
  import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'
  import type { Category } from '@/hooks/categories/use-categories'

  const CATS: Category[] = [
    { id: '1', name: 'Groceries', color: '#10b981', icon: '🛒' },
    { id: '2', name: 'Restaurants', color: '#f59e0b', icon: '🍽️' },
    { id: '3', name: 'Transport', color: '#3b82f6', icon: '🚗' },
    { id: '4', name: 'Coffee', color: '#a855f7', icon: '☕' },
    { id: '5', name: 'Health', color: '#ef4444', icon: '💊' },
    { id: '6', name: 'Home', color: '#6366f1', icon: '🏠' },
    { id: '7', name: 'Bills', color: '#14b8a6', icon: '🧾' },
  ] as Category[]

  export default function Chunk3Preview() {
    const [filters, setFilters] = useState<ReceiptsFilters>({ categoryId: '1' })
    const [sheetOpen, setSheetOpen] = useState(true)
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-4 md:hidden">
          <QuickChips filters={filters} categories={CATS} onFiltersChange={setFilters} />
        </div>
        <div className="flex items-start gap-6">
          <FilterRail filters={filters} categories={CATS} onFiltersChange={setFilters} />
          <div className="flex-1 rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
            filters: <code>{JSON.stringify(filters)}</code>
          </div>
        </div>
        <button className="mt-6 rounded-full border px-4 py-2 text-sm" onClick={() => setSheetOpen(true)}>Open sheet</button>
        <FilterSheet open={sheetOpen} onOpenChange={setSheetOpen} filters={filters} categories={CATS} onFiltersChange={setFilters} resultCount={124} />
      </div>
    )
  }
  ```

  Add a temporary **public** route in `src/routes.tsx`: import `const Chunk3Preview = lazy(() => import('./pages/__chunk3-preview'))` and add `{ path: '/__chunk3-preview', element: <Chunk3Preview /> }` to the top-level `routes` array (a sibling of `/sign-in`, no `ProtectedRoute`).

- [ ] **Step 3: Build + preview.** `npm run build`; start the preview on **port 5180 `--strictPort`** (per `.claude/launch.json`). Screenshot `/__chunk3-preview`:
  - **Desktop (≥1024px):** rail shows Filters title + Clear all, category checklist (single-select highlight on "Groceries"), "Show all categories" expander, Amount min/max glass fields, date preset chips (active "Custom" only when a manual range is set), two glass `<DatePicker>` fields. Light + dark.
  - **Mobile (390px):** quick-chip row (All · This month · 4 categories, active highlight), the open filter sheet (drag handle, soft category chips, amount fields, preset chips, date pickers, "Clear all" / "Show 124 results" footer). Light + dark.
  - Click a date field → the glass calendar popover opens (confirms the Chunk-7 picker, not the old broken one).

- [ ] **Step 4: Real-route pass (if backend up + logged in):** preview `/receipts`:
  - Desktop: rail beside the feed; toggling a category / setting amounts / picking dates **refetches** (auto-apply) and **updates the URL** (`?categoryId=…&startDate=…`); "Clear all" empties filters + URL; range presets set From/To; "Showing X–Y of N" + total reflect the filtered set.
  - Mobile: quick-chips filter live; the filter button opens the sheet; changing controls refetches behind the dim; "Show N results" closes the sheet; "Clear all" resets.
  - Reload a filtered URL → filters are reflected in the rail/chips on mount (URL→state still works).

- [ ] **Step 5: Remove the harness** — delete `src/pages/__chunk3-preview.tsx` and revert the temporary route + import in `src/routes.tsx`.
  Run: `grep -rn "__chunk3-preview\|Chunk3Preview" src/` → expected: no matches.

- [ ] **Step 6:** `npm run build` → PASS (after harness removal).

---

## Task 10 — Commit + push

- [ ] **Step 1:** Stage the new components + util + edited page + i18n + deleted file + this plan (exclude `.claude/`):
  - create: `src/lib/filter-presets.ts`, `src/components/receipts/{filter-chip,filter-rail,quick-chips,filter-sheet}.tsx`
  - modify: `src/pages/receipts/index.tsx`, `src/i18n/en.json`, `src/i18n/sr.json`
  - delete: `src/components/receipts/receipts-filters.tsx`
  - doc: `docs/superpowers/plans/2026-06-04-expenses-glass-chunk3-filters.md`
- [ ] **Step 2:** Commit: `feat(receipts): glass filter rail + mobile filter sheet (real date-pickers)`.
- [ ] **Step 3:** `git push origin feature/redesign-main-branch` (pre-push build hook runs).

---

## Self-review

- **Spec coverage:** desktop persistent glass rail (category checklist + amount + date presets + From/To + Clear all, auto-apply, no Apply button) ✓T4; mobile filter bottom sheet w/ same controls + "Show N results" that closes the sheet ✓T6; mobile quick-chip row ✓T5; real glass `<DatePicker>` reused in both rail + sheet (fixes the broken picker) ✓T4,T6; map to `categoryId/minAmount/maxAmount/startDate/endDate` ✓T4–T6; preserve filter→URL→debounce→refetch + `selectedIds` plumbing (untouched — only wrappers change) ✓T7; remove old show/hide panel + `ReceiptsFiltersBar`, deprecate `receipts-filters.tsx` ✓T7,T8; gradient untouched (none added) ✓; i18n en+sr ✓T1.
- **Carryover constraints:** data layer untouched (components are pure, route through existing `handleFiltersChange`) ✓; gradient only on logo/Scan/FAB — none added here ✓; net-new i18n in both en + sr ✓T1; verify on 5180 `--strictPort`, screenshots mobile+desktop / light+dark, delete harness, commit, push ✓T9,T10.
- **Decisions flagged:** D1 (single-select category — data-layer-forced), D2 (quick-chips set), D3 (presets fill always-visible From/To; Custom clears), D4 (lightweight mobile row, full header deferred to C4), D5 (this-month = whole calendar month). D1 + D2 surfaced via AskUserQuestion.
- **Placeholder scan:** the only `/* verbatim */` markers are explicit "copy existing JSX 1:1" instructions in T7 (summary block + selection bar already exist in the file and are quoted by line range) — not new code to invent.
- **Type consistency:** `FilterChip`/`FilterRail`/`QuickChips`/`FilterSheet`, `thisMonthRange`/`last30DaysRange`/`activeDatePreset`/`DatePreset` match the file table and are used consistently across T2–T7; `ReceiptsFilters`/`Category` reused from existing hooks; `onFiltersChange` signature matches the page's `handleFiltersChange`.
