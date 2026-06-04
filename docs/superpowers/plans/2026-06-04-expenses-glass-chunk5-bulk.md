# Expenses "Glass" — Chunk 5: Bulk select + per-row actions + confirms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the C2 **interim** inline View/Edit/Delete row buttons + the always-visible selection bar + the inline shadcn `<Dialog>`/`<Select>` bulk-category overlay with the approved Glass design: a **desktop row kebab** (View/Edit/Delete with gating), an explicit **selection mode** (checkboxes, row highlight, summary/header swap to "{n} selected", select-all), **glass bulk bars** (desktop floating pill + mobile bottom bar), and a **GlassDialog assign-category overlay** — all routed through the page's existing handlers/mutations. The two delete confirms already use the glass `ConfirmDialog` (C7) and only get **rewired**, not restyled.

**Architecture:** Three new dumb presentation components (`row-kebab.tsx`, `bulk-bar.tsx`, `assign-category-dialog.tsx`) compose from the existing Radix `Popover`, the shared `GlassDialog`, and Chunk-0 primitives (`SelectCheck`, `CatTile`, `Amount`). `expense-row.tsx` swaps its interim inline buttons for the kebab (desktop) and a smart-open row tap (both viewports); `expense-feed.tsx` forwards the new `onOpen`; `expenses-summary.tsx` + `expenses-mobile-header.tsx` gain a select-mode swap. `pages/receipts/index.tsx` mounts the bulk bar, swaps the assign overlay, adds select-all + smart-open, and deletes the interim selection bar + inline dialog. **The data layer is untouched** — every action calls the page's existing `toggleSelect`, `handleViewReceipt`, `handleEditReceipt`, `handleDeleteReceipt`, `confirmBulkDelete`, `confirmBulkCategoryUpdate`, and the existing `useBulkDeleteReceipts`/`useBulkUpdateCategory` mutations.

**Tech Stack:** React 19, TypeScript (strict), Tailwind v4, shadcn/ui + Radix (Popover, Dialog via `GlassDialog`), Framer Motion (inside `GlassDialog`), TanStack Query 5, lucide-react, i18next, Sonner.

**Companion spec:** `docs/superpowers/specs/2026-06-04-expenses-glass-redesign-design.md`. **Master plan:** `docs/superpowers/plans/2026-06-04-expenses-glass-redesign.md` (Chunk 5). **Prior chunks:** `…-chunk2-feed.md` (D2 = the interim inline actions + selection bar THIS chunk replaces), `…-chunk4-overlays.md` (Popover/`MenuItem` pattern, `GlassDialog` usage, split + verify workflow, shared-branch lessons). **Reuses:** `components/glass/glass-dialog.tsx` (`GlassDialog`), `components/ui/confirm-dialog.tsx` (already glass — **don't restyle**), `components/ui/popover.tsx`, `components/receipts/primitives.tsx` (`SelectCheck`/`CatTile`/`Amount`/`StatusBadge`), `components/receipts/add-menu.tsx` (the `MenuItem` recipe). **Handoff:** `~/Downloads/design_handoff_expenses/` — `ExpensesOverlays.jsx` (`RowMenu`, `AssignSheet`/`AssignModal`, `RemoveConfirmSheet`/`DeleteConfirmModal`), `ExpensesStates.jsx` (`SelectionMobile`, `SelectionBarDesktop`, `LockedCard`), `ExpensesScreens.jsx` (`.ex-deskbulk`, `.ex-selectbtn`, select-mode summary swap, `.ex-kebab`), and the inline `.ex-deskbulk / .ex-bulkbar / .ex-bulkbtn / .ex-kebab / .ex-selectbtn / .ex-menu / .ex-menu-item / .ex-locknote / .ex-iconmini / .ex-fchip / .ex-action` CSS in `Expenses.html`.

---

## Decisions (settled — flagged for visibility, not re-litigation)

- **D1 — Mobile row tap = "Smart open + select-mode" (resolved via AskUserQuestion).** Outside selection mode, tapping a mobile row body: **`hasJournal` → Receipt viewer**; else **editable → Edit modal**; else (**locked, no journal**) → a Sonner toast with the lock reason (`archivedGroupLocked`/`recurringLocked`). There is **no mobile kebab and no inline mobile buttons**. Single-row **Delete** (and editing scraped/locked rows) is done via selection mode (select one → bulk Remove). The **same smart-open** is wired to the **desktop** row body too (matching the handoff `Feed onRow={(r) => onOpen('view', r)}`), so a row-body click opens the row on both viewports while the desktop kebab carries the explicit View/Edit/Delete.
- **D2 — Desktop locked-row gating lives *inside* the kebab (per the chunk's pre-resolved decision #1), not as separate disabled mini-buttons.** Every desktop non-select row shows the kebab. For locked rows the kebab renders a **lock-reason note line** (lock glyph + full reason) and **disables Edit + Delete** (greyed, `title` = reason); **View** stays enabled when `hasJournal`. This honors "preserve gating … locked rows show the reason" with one uniform interaction (kebab), and is a deliberate, flagged deviation from the handoff `LockedCard` illustration (which drew disabled mini-buttons + an inline `.ex-locknote` pill). The row's existing `StatusBadge` (Recurring) / archived group pill already hint lockedness inline; the kebab supplies the explicit reason.
- **D3 — Select-all placement is per-platform (one control each).** Desktop: the **bulk-bar leading `SelectCheck` is the select-all toggle** (clickable, `on` when every loaded row is selected), matching `.ex-deskbulk`'s leading Check. Mobile: a **"Select all"/"Deselect all" text link** in the mobile-header select-mode swap, matching `SelectionMobile`. "Current page" = the rows currently loaded (`receipts`): on desktop that's the page; on mobile (infinite) it's everything loaded — both are exactly `receipts.map(r => r.id)`.
- **D4 — Two distinct "exit selection" affordances, preserved from the interim.** **Cancel** (desktop summary swap / mobile header X) exits select mode **and** clears the set (`onToggleSelectMode` = `setSelectMode(false); setSelectedIds(new Set())`). **Clear** (desktop bulk-bar trailing X = `receipts.clearSelection`) empties the set but **stays** in select mode (bar disappears, summary shows "0 selected", checkboxes remain). Mobile bulk bar has **no Clear** (Category + Remove only) — clearing is the header X (matches `.ex-bulkbar`).
- **D5 — Bulk-bar / summary swap shows the converted selected sum, computed from loaded rows.** `selectedTotal` = Σ `convert(totalAmount, currency)` over `receipts.filter(selectedIds.has)` in `preferredCurrency` (via `useCurrencyConverter`). On **desktop pagination**, selecting on page A then paging to B keeps the count accurate but the **sum reflects only loaded rows** (an accepted approximation — the interim showed no sum at all; selection is virtually always within one page). Mobile (infinite) is always exact because every selectable row is loaded. **Mobile header swap shows count only** (no sum) per `SelectionMobile`; the sum lives in the mobile bulk bar.
- **D6 — Assign-category keeps interim parity: a category is required (no "remove category"/null path in the UI).** The handoff `AssignBody` shows only category chips; the interim `<Select>` required a pick (Save disabled until chosen). The dialog single-selects a category chip → `onAssign(categoryId)`; the page handler still calls `useBulkUpdateCategory({ ids, categoryId })`. (The hook supports `categoryId | null`, but exposing "remove category" is out of scope and would need a new key — not added.)
- **D7 — The two ConfirmDialogs are NOT restyled — only rewired.** `confirm-dialog.tsx` is already glass (C7). The single-delete confirm already fires from `handleDeleteReceipt` (kebab Delete reuses it). The bulk-delete confirm already exists; its trigger moves from the interim selection bar to the bulk bar's "Remove selected". No change to `confirm-dialog.tsx`.
- **D8 — Scope-file note.** The task's "scope (files)" line lists only `bulk-bar/row-kebab/assign-category-dialog` (create) + `expense-row.tsx` + `index.tsx` (modify). Pre-resolved decisions #2/#3 also require the **summary/header select-mode swap** and the row-tap **`onOpen`** plumbing, so this plan additionally modifies `expenses-summary.tsx`, `expenses-mobile-header.tsx`, and `expense-feed.tsx`. All three are receipts-only redesign components created earlier this cycle (low blast radius); each change is small and contained. Flagged, not silent.

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `src/i18n/en.json` + `sr.json` | modify | net-new: `common.edit`, `receipts.selectAll`, `receipts.deselectAll` (reuse everything else) |
| `src/components/receipts/row-kebab.tsx` | create | Desktop trailing kebab (Radix Popover, `.ex-menu` recipe): View (if `hasJournal`) / Edit / — / Delete, with locked-row gating + reason note (D2) |
| `src/components/receipts/bulk-bar.tsx` | create | Self-switching `BulkBar` — desktop floating glass pill (`.ex-deskbulk`) + mobile bottom glass bar (`.ex-bulkbar`); count + converted sum + Assign / Remove (+ desktop select-all check + Clear) |
| `src/components/receipts/assign-category-dialog.tsx` | create | `AssignCategoryDialog` via `GlassDialog` — category chips (single-select) → `onAssign(categoryId)` |
| `src/components/receipts/expense-row.tsx` | modify | Drop interim inline View/Edit/Delete; desktop non-select → `<RowKebab>`; row body tap → `onOpen` (smart-open); keep select-mode highlight + `SelectCheck` |
| `src/components/receipts/expense-feed.tsx` | modify | Forward the new `onOpen` prop to `ExpenseRow` |
| `src/components/receipts/expenses-summary.tsx` | modify | Desktop select-mode swap → "{n} selected · sum / Cancel" |
| `src/components/receipts/expenses-mobile-header.tsx` | modify | Mobile select-mode swap → X · "{n} selected" · "Select all" (hides menu/total/chips while selecting) |
| `src/pages/receipts/index.tsx` | modify | Mount `<BulkBar>`; swap inline `<Dialog>` → `<AssignCategoryDialog>`; add select-all + smart-open; rewire confirms; remove the interim selection bar + inline dialog + dead state/imports |
| `src/pages/__chunk5-preview.tsx` | create→delete | throwaway verification harness (removed before commit) |
| `src/routes.tsx` | modify→revert | temporary public harness route (reverted before commit; use the **atomic `node` read-replace-write**, not Edit — concurrent sessions cause "modified since read" races) |

No component-unit-test harness exists (Playwright E2E only). Per-step verification = `npm run build` (tsc strict + vite) + preview on port **5180 `--strictPort`** (config at `receipto-frontend/.claude/launch.json`; **5173 is a different project**) + screenshots mobile+desktop, light+dark.

---

## Optional split (use only if the single chunk runs long)

The plan is one chunk, but it splits cleanly into **two fully-working commits** if needed (every interim stays functional — the C2 interim selection bar + inline bulk dialog keep working until 5b removes them, and the single-delete confirm already works):

- **5a — Kebab + smart-open (Tasks 2, 5, 6 + i18n `common.edit`).** Swap the interim inline row buttons for the desktop kebab and the row-tap smart-open. The interim selection bar + inline bulk-category dialog **remain untouched and working**. Commit: `feat(receipts): desktop row kebab + smart-open row tap`.
- **5b — Selection mode + bulk bars + assign (Tasks 1-remaining, 3, 4, 7, 8, 9).** Add the summary/header swaps, the glass bulk bars, the assign-category dialog; rewire the confirms; delete the interim selection bar + inline dialog. Commit: `feat(receipts): selection mode, bulk bars, assign-category overlay`.

Default is **one commit** (`feat(receipts): selection mode, bulk bars, kebab actions + gating`). The verification (Task 10) covers both.

---

## Task 1 — i18n keys (net-new, en + sr)

**Files:** `src/i18n/en.json`, `src/i18n/sr.json`

Reuse existing keys (do **not** duplicate): `receipts.selected` ("{{count}} selected"), `assignCategory`, `removeSelected`, `clearSelection`, `bulkCategoryDescription`, `bulkCategoryPartial`/`bulkCategorySuccess`, `bulkDeletePartial`/`bulkDeleteSuccess`, `bulkDeleteConfirm`, `archivedGroupLocked`, `recurringLocked`, `viewer.viewReceipt` ("View Receipt"), `unknownStore`, `select` ("Select", added C2), `status.*`; `common.delete`, `common.cancel`, `common.actions` ("Actions"), `common.save`.

- [ ] **Step 1:** In **both** files, add `"edit"` to the `common` object:
  - en: `"edit": "Edit"`
  - sr: `"edit": "Izmeni"`

- [ ] **Step 2:** In **both** files, inside the `receipts` object, add:

  | key | en | sr |
  |---|---|---|
  | `selectAll` | `Select all` | `Izaberi sve` |
  | `deselectAll` | `Deselect all` | `Poništi izbor` |

- [ ] **Step 3:** Validate JSON parses:
  Run: `node -e "require('./src/i18n/en.json'); require('./src/i18n/sr.json'); console.log('ok')"`
  Expected: `ok`

> Shared-branch i18n hazard (recurred in C4): only stage `en.json`/`sr.json` if their diff is **yours alone**. If another session's uncommitted keys are present, commit code first and add these 3 keys in their own fast commit (or stage just your hunks via `git apply --cached` of a filtered diff). See `git diff src/i18n/en.json` before staging.

---

## Task 2 — `row-kebab.tsx` (desktop kebab + gating)

**Files:** create `src/components/receipts/row-kebab.tsx`

Recipe: `.ex-kebab` trigger (34px, `MoreVertical`) → Radix `Popover` `.ex-menu` content (mirror `add-menu.tsx`'s `MenuItem`, extended with `disabled` + `danger`). Trigger + content **`stopPropagation`** so the kebab doesn't fire the row's smart-open `onClick`. Gating per D2.

- [ ] **Step 1: Write the component:**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreVertical, Eye, Pencil, Trash2, Lock, type LucideIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Receipt } from '@/hooks/receipts/use-receipts'

function KebabItem({
  icon: Icon, label, onClick, disabled, danger, title,
}: { icon: LucideIcon; label: string; onClick: () => void; disabled?: boolean; danger?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-semibold transition-colors',
        'disabled:pointer-events-none disabled:opacity-45',
        danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-bg-subtle',
      )}
    >
      <Icon className={cn('size-[17px] shrink-0', danger ? 'text-destructive' : 'text-muted-foreground')} />
      <span>{label}</span>
    </button>
  )
}

interface RowKebabProps {
  receipt: Receipt
  onView?: (r: Receipt) => void
  onEdit?: (r: Receipt) => void
  onDelete?: (r: Receipt) => void
}

/** Desktop per-row actions menu: View (if hasJournal) / Edit / — / Delete; locked rows show the reason + disable Edit/Delete. */
export function RowKebab({ receipt: r, onView, onEdit, onDelete }: RowKebabProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const locked = !!r.group?.isArchived || r.status === 'recurring'
  const lockReason = r.group?.isArchived
    ? t('receipts.archivedGroupLocked')
    : r.status === 'recurring'
      ? t('receipts.recurringLocked')
      : undefined
  const run = (fn?: (r: Receipt) => void) => () => { setOpen(false); fn?.(r) }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('common.actions')}
          data-testid={`receipt-kebab-${r.id}`}
          onClick={(e) => e.stopPropagation()}
          className="grid size-[34px] shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          <MoreVertical className="size-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
        className="w-[208px] rounded-xl border-border bg-popover p-1.5 shadow-lg"
      >
        {r.hasJournal && (
          <KebabItem icon={Eye} label={t('receipts.viewer.viewReceipt')} onClick={run(onView)} />
        )}
        {locked && (
          <div className="flex items-start gap-2 px-3 py-2 text-[12px] leading-snug text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            <span>{lockReason}</span>
          </div>
        )}
        <KebabItem icon={Pencil} label={t('common.edit')} onClick={run(onEdit)} disabled={locked} title={lockReason} />
        <div className="mx-2 my-1 h-px bg-hairline-soft" />
        <KebabItem icon={Trash2} label={t('common.delete')} onClick={run(onDelete)} disabled={locked} danger title={lockReason} />
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 3 — `bulk-bar.tsx` (desktop pill + mobile bottom bar)

**Files:** create `src/components/receipts/bulk-bar.tsx`

One self-switching component via `useIsMobile(768)`. Returns `null` when `count === 0`. **Desktop** = `.ex-deskbulk` floating glass pill, viewport-centered, leading `SelectCheck` = select-all toggle (D3), trailing X = Clear (D4). **Mobile** = `.ex-bulkbar` bottom glass bar sitting **above the tab-bar** via `bottom: calc(env(safe-area-inset-bottom) + 84px)` (tab-bar is ~68px + safe-area; verify the gap in Task 10), Category + Remove only. Hand-rolled frosted surface (avoid `glass-card`'s radius clashing with the pill). Gradient is **never** used here (neutral / destructive only).

- [ ] **Step 1: Write the component:**

```tsx
import { useTranslation } from 'react-i18next'
import { Tag, Trash2, X, Loader2 } from 'lucide-react'
import { SelectCheck, Amount } from '@/components/receipts/primitives'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface BulkBarProps {
  count: number
  total: number
  currency: string
  allSelected: boolean
  onToggleSelectAll: () => void
  onAssign: () => void
  onRemove: () => void
  onClear: () => void
  removing?: boolean
}

export function BulkBar({
  count, total, currency, allSelected, onToggleSelectAll, onAssign, onRemove, onClear, removing,
}: BulkBarProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile(768)
  if (count === 0) return null

  if (isMobile) {
    return (
      <div
        className="fixed inset-x-3 z-30 flex items-center gap-2.5 rounded-2xl border border-border bg-card/92 px-3.5 py-2.5 shadow-glass-3 [backdrop-filter:blur(20px)] [-webkit-backdrop-filter:blur(20px)]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
        data-testid="bulk-bar-mobile"
      >
        <div className="flex min-w-0 flex-col">
          <span className="text-[14px] font-semibold text-foreground">{t('receipts.selected', { count })}</span>
          <Amount value={total} currency={currency} size={12} weight={600} muted />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onAssign}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-full bg-bg-subtle px-3.5 text-[13px] font-semibold text-fg-2 transition-colors hover:text-foreground"
          >
            <Tag className="size-[17px]" />
            {t('receipts.assignCategory')}
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-full bg-destructive-soft px-3.5 text-[13px] font-semibold text-[color:var(--destructive-foreground-on-soft)] transition-opacity disabled:opacity-60"
          >
            {removing ? <Loader2 className="size-[17px] animate-spin" /> : <Trash2 className="size-[17px]" />}
            {t('receipts.removeSelected')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixed bottom-7 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full',
        'border border-border bg-card/92 px-[18px] py-3 shadow-glass-3',
        '[backdrop-filter:blur(20px)_saturate(1.4)] [-webkit-backdrop-filter:blur(20px)_saturate(1.4)]',
        'min-w-[540px] max-w-[calc(100vw-2rem)]',
      )}
      data-testid="bulk-bar-desktop"
    >
      <button
        type="button"
        onClick={onToggleSelectAll}
        aria-label={allSelected ? t('receipts.deselectAll') : t('receipts.selectAll')}
        title={allSelected ? t('receipts.deselectAll') : t('receipts.selectAll')}
        className="shrink-0"
      >
        <SelectCheck on={allSelected} />
      </button>
      <span className="text-[15px] font-semibold text-foreground">{t('receipts.selected', { count })}</span>
      <span className="text-[13px] text-muted-foreground">·</span>
      <Amount value={total} currency={currency} size={13} weight={600} muted />
      <div className="flex-1" />
      <button
        type="button"
        onClick={onAssign}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[13px] font-semibold text-fg-2 transition-colors hover:bg-bg-subtle hover:text-foreground"
      >
        <Tag className="size-[15px]" />
        {t('receipts.assignCategory')}
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-destructive px-3.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {removing ? <Loader2 className="size-[15px] animate-spin" /> : <Trash2 className="size-[15px]" />}
        {t('receipts.removeSelected')}
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label={t('receipts.clearSelection')}
        title={t('receipts.clearSelection')}
        className="grid size-[34px] shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 4 — `assign-category-dialog.tsx` (glass bulk assign overlay)

**Files:** create `src/components/receipts/assign-category-dialog.tsx`

`GlassDialog` (desktop modal / mobile sheet) with `.ex-fchip` category chips (single-select) + Cancel/Assign footer (Assign disabled until a chip is chosen, D6). Replaces the inline shadcn `<Dialog>`+`<Select>`. Local `selectedId` resets each time the dialog opens.

- [ ] **Step 1: Write the component:**

```tsx
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { cn } from '@/lib/utils'
import type { Category } from '@/hooks/categories/use-categories'

interface AssignCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  count: number
  onAssign: (categoryId: string) => void
  isLoading?: boolean
}

export function AssignCategoryDialog({
  open, onOpenChange, categories, count, onAssign, isLoading,
}: AssignCategoryDialogProps) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Reset the chosen chip whenever the dialog opens.
  useEffect(() => { if (open) setSelectedId(null) }, [open])

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('receipts.assignCategory')}
      description={t('receipts.bulkCategoryDescription', { count })}
      desktopWidth={480}
      footer={
        <div className="flex gap-2 md:justify-end">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl md:flex-none"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl md:flex-none"
            onClick={() => selectedId && onAssign(selectedId)}
            disabled={!selectedId || isLoading}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            {t('receipts.assignCategory')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const on = selectedId === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={cn(
                'inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                on
                  ? 'border-transparent bg-primary-soft text-primary'
                  : 'border-border bg-bg-subtle text-fg-2 hover:text-foreground',
              )}
            >
              {c.icon && <span className="text-[14px] leading-none">{c.icon}</span>}
              {c.name}
            </button>
          )
        })}
      </div>
    </GlassDialog>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 5 — `expense-row.tsx` (kebab + smart-open; drop interim inline buttons)

**Files:** modify `src/components/receipts/expense-row.tsx`

Replace the whole file. Changes vs current: drop the `Eye/Pencil/Trash2` inline-button block + the `locked`/`lockTitle` locals (gating now lives in `RowKebab`); add `onOpen` (row-body smart-open, both viewports); desktop non-select → `<RowKebab>`; mobile non-select → no trailing actions (tap opens). Keep `wide`, `selectMode`, `selected`, `SelectCheck`, the `showCatName` compaction, the desktop-only time, and all `data-testid`s.

- [ ] **Step 1: Replace the file body:**

```tsx
import { useTranslation } from 'react-i18next'
import { Users, Archive } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Amount, CatTile, CatName, SelectCheck, StatusBadge } from '@/components/receipts/primitives'
import { RowKebab } from '@/components/receipts/row-kebab'
import type { Receipt } from '@/hooks/receipts/use-receipts'

const NOTABLE = new Set(['pending', 'recurring', 'failed'])

interface ExpenseRowProps {
  receipt: Receipt
  wide?: boolean
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: (id: string) => void
  /** Row-body tap (smart-open): hasJournal → viewer, else editable → edit, else locked toast. */
  onOpen?: (r: Receipt) => void
  onView?: (r: Receipt) => void
  onEdit?: (r: Receipt) => void
  onDelete?: (r: Receipt) => void
}

export function ExpenseRow({
  receipt: r,
  wide,
  selectMode,
  selected,
  onToggleSelect,
  onOpen,
  onView,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  const { t } = useTranslation()
  const time = r.receiptDate ? format(new Date(r.receiptDate), 'HH:mm') : ''
  const showBadge = wide || NOTABLE.has(r.status)
  // On a narrow compact row, group pill + badge + name don't all fit — drop the name
  // (the emoji tile already conveys category). Wide rows always show it.
  const showCatName = wide || !(r.group && showBadge)

  const handleClick = selectMode ? () => onToggleSelect?.(r.id) : () => onOpen?.(r)

  return (
    <div
      data-testid={`receipt-row-${r.id}`}
      className={cn(
        'flex items-center gap-3.5 px-4 py-3 transition-colors',
        wide && 'px-[18px] py-[15px]',
        'cursor-pointer',
        selected ? 'bg-primary-soft' : 'hover:bg-bg-subtle',
      )}
      onClick={handleClick}
    >
      {selectMode && <SelectCheck on={selected} />}
      <CatTile category={r.category} size={wide ? 44 : 42} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2.5">
          <span className="truncate text-[15px] font-semibold" data-testid={`receipt-store-${r.id}`}>
            {r.storeName || t('receipts.unknownStore')}
          </span>
          <Amount value={r.totalAmount ?? 0} currency={r.currency || 'RSD'} size={wide ? 16 : 15.5} />
        </div>
        <div className="mt-[5px] flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {showCatName && <CatName name={r.category?.name} />}
            {r.group && (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-muted-foreground',
                  r.group.isArchived && 'opacity-70',
                )}
              >
                {r.group.isArchived && <Archive className="size-2.5" />}
                <Users className="size-2.5" />
                <span className="max-w-[120px] truncate">{r.group.name}</span>
              </span>
            )}
            {showBadge && <StatusBadge status={r.status} />}
          </div>
          {/* Time only on wide (desktop) rows — compact rows keep the date in the day header. */}
          {time && wide && <span className="shrink-0 text-[11px] text-fg-faint">{time}</span>}
        </div>
      </div>
      {/* Desktop kebab (View/Edit/Delete + gating). Mobile has no kebab — tap opens (D1). */}
      {wide && !selectMode && (
        <RowKebab receipt={r} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      )}
    </div>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 6 — `expense-feed.tsx` (forward `onOpen`)

**Files:** modify `src/components/receipts/expense-feed.tsx`

- [ ] **Step 1:** Add `onOpen` to `ExpenseFeedProps` (next to the existing `onView`/`onEdit`/`onDelete`):
  ```tsx
    onOpen?: (r: Receipt) => void
  ```
- [ ] **Step 2:** Add `onOpen` to the destructured props of `ExpenseFeed({ ... })`.
- [ ] **Step 3:** Pass it through to each `<ExpenseRow … />` (add the prop alongside `onView={onView}`):
  ```tsx
    onOpen={onOpen}
  ```
- [ ] **Step 4:** `npm run build` → PASS.

---

## Task 7 — `expenses-summary.tsx` (desktop select-mode swap)

**Files:** modify `src/components/receipts/expenses-summary.tsx`

In select mode the desktop summary swaps to **"{n} selected · sum"** (left) + **Cancel** (right); otherwise it keeps today's Total + converted note + showing-range + Select. Add `selectedCount` + `selectedTotal` props.

- [ ] **Step 1:** Extend the props interface:
  ```tsx
  interface ExpensesSummaryProps {
    totalAmounts: CurrencyTotal[]
    total: number
    filtersActive: boolean
    selectMode: boolean
    onToggleSelectMode: () => void
    rangeFrom?: number
    rangeTo?: number
    selectedCount: number
    selectedTotal: number
  }
  ```
- [ ] **Step 2:** Add `selectedCount, selectedTotal` to the destructured params.
- [ ] **Step 3:** Add an early select-mode return **above** the existing `return (` (uses the already-imported `Amount`, `preferredCurrency`, `t`):
  ```tsx
    if (selectMode) {
      return (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold text-foreground">{t('receipts.selected', { count: selectedCount })}</span>
            <span className="text-sm text-muted-foreground">·</span>
            <Amount value={selectedTotal} currency={preferredCurrency} size={15} muted />
          </div>
          <button
            onClick={onToggleSelectMode}
            className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-[13px] font-semibold text-fg-2 transition-colors hover:bg-bg-subtle hover:text-foreground"
          >
            <X className="size-3.5" />
            {t('common.cancel')}
          </button>
        </div>
      )
    }
  ```
  (`X` is already imported in this file.)
- [ ] **Step 4:** `npm run build` → PASS.

---

## Task 8 — `expenses-mobile-header.tsx` (mobile select-mode swap + select-all)

**Files:** modify `src/components/receipts/expenses-mobile-header.tsx`

In select mode the mobile header collapses to a single row: **X (cancel) · "{n} selected"** (left) + **"Select all"/"Deselect all"** link (right) — the `…` menu, total/count line, quick-chips, and filter button are hidden (matches `SelectionMobile`). Add `selectedCount`, `allSelected`, `onToggleSelectAll` props. Reuse `onToggleSelectMode` for the X.

- [ ] **Step 1:** Extend the props interface (append):
  ```tsx
    selectedCount: number
    allSelected: boolean
    onToggleSelectAll: () => void
  ```
- [ ] **Step 2:** Add `selectedCount, allSelected, onToggleSelectAll` to the destructured params, and add `X` to the lucide import:
  ```tsx
  import { MoreHorizontal, CircleCheckBig, ArrowDownWideNarrow, ArrowDownUp, SlidersHorizontal, X, type LucideIcon } from 'lucide-react'
  ```
- [ ] **Step 3:** Just inside the outer frosted `<div …>` (keeping its sticky/frosted classes + `paddingTop` style), add a select-mode early branch that renders **instead of** the title row + chip row. Wrap the existing two inner blocks (`<div className="mb-4 flex items-end justify-between">…</div>` and `<div className="-mx-5 flex …">…</div>`) so they render only when **not** selecting, and add the select-mode block:
  ```tsx
      {selectMode ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onToggleSelectMode}
              aria-label={t('common.cancel')}
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
            >
              <X className="size-5" />
            </button>
            <span className="t-h3 truncate">{t('receipts.selected', { count: selectedCount })}</span>
          </div>
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="shrink-0 text-[14px] font-semibold text-primary"
          >
            {allSelected ? t('receipts.deselectAll') : t('receipts.selectAll')}
          </button>
        </div>
      ) : (
        <>
          {/* existing title row (title + total + count + "…" menu) */}
          {/* existing chip row (QuickChips + filter button) */}
        </>
      )}
  ```
  (Place the existing two blocks verbatim inside the `<>…</>` "else" branch. The select-mode block needs no menu/converter — it uses only `selectMode`, `selectedCount`, `allSelected`, `t`.)
- [ ] **Step 4:** `npm run build` → PASS.

---

## Task 9 — Wire Chunk 5 into `pages/receipts/index.tsx`

**Files:** modify `src/pages/receipts/index.tsx`

Mount the bulk bar; swap the inline assign `<Dialog>` for `<AssignCategoryDialog>`; add select-all + the smart-open handler + the converted selected sum; rewire the bulk confirm/assign triggers; remove the interim selection bar, the inline `<Dialog>`/`<Select>`, the `bulkCategoryId` state, and now-dead imports.

- [ ] **Step 1: Imports.**
  - Remove the inline dialog scaffolding import (lines 7-14: `Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle`) and the Select import block (lines 15-21: `Select, SelectContent, SelectItem, SelectTrigger, SelectValue`) — both are only used by the inline bulk-category dialog being removed. **Verify with tsc** (Step 9) before deleting; if any other usage remains, keep the needed symbols.
  - Add with the other receipts-component imports:
    ```tsx
    import { BulkBar } from '@/components/receipts/bulk-bar'
    import { AssignCategoryDialog } from '@/components/receipts/assign-category-dialog'
    import { useCurrencyConverter } from '@/hooks/currencies/use-currency-converter'
    ```
  - In the lucide import (line 52), drop `Tag`, `Trash2`, `X` (they move into `bulk-bar.tsx`); keep `Camera, Loader2, QrCode`:
    ```tsx
    import { Camera, Loader2, QrCode } from 'lucide-react'
    ```

- [ ] **Step 2: Remove dead bulk-category state.** Delete `bulkCategoryId`/`setBulkCategoryId` (line 127):
  ```tsx
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('')   // DELETE this line
  ```

- [ ] **Step 3: Selection helpers + smart-open + selected sum.** After the `toggleSelect` definition (around line 226), add:
  ```tsx
  const { convert, preferredCurrency } = useCurrencyConverter()

  // Select-all toggles every currently-loaded row (desktop = page, mobile = all loaded).
  const currentPageIds = receipts.map((r) => r.id)
  const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id))
  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (currentPageIds.every((id) => prev.has(id))) currentPageIds.forEach((id) => next.delete(id))
      else currentPageIds.forEach((id) => next.add(id))
      return next
    })
  }

  // Converted sum of selected (loaded) rows — see plan D5 for the desktop cross-page caveat.
  const selectedTotal = receipts.reduce(
    (s, r) => (selectedIds.has(r.id) ? s + convert(Number(r.totalAmount) || 0, r.currency || 'RSD') : s),
    0,
  )

  // Smart-open (D1): hasJournal → viewer, else editable → edit, else locked toast.
  const handleOpenReceipt = (r: Receipt) => {
    if (r.hasJournal) { handleViewReceipt(r); return }
    if (r.group?.isArchived) { toast.info(t('receipts.archivedGroupLocked')); return }
    if (r.status === 'recurring') { toast.info(t('receipts.recurringLocked')); return }
    handleEditReceipt(r)
  }
  ```

- [ ] **Step 4: `confirmBulkCategoryUpdate` takes the categoryId from the dialog.** Replace the current handler (lines 244-262) with:
  ```tsx
  const confirmBulkCategoryUpdate = async (categoryId: string) => {
    try {
      const result = await bulkUpdateCategory.mutateAsync({
        ids: Array.from(selectedIds),
        categoryId,
      })
      if (result.skipped > 0) {
        toast.warning(t('receipts.bulkCategoryPartial', { updated: result.updated, skipped: result.skipped }))
      } else {
        toast.success(t('receipts.bulkCategorySuccess', { updated: result.updated }))
      }
      setSelectedIds(new Set())
      setBulkCategoryOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)
    }
  }
  ```

- [ ] **Step 5: Pass the new props to the summary + mobile header.**
  - `ExpensesMobileHeader` (lines 362-375) — append:
    ```tsx
        selectedCount={selectedIds.size}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
    ```
  - `ExpensesSummary` (lines 386-396) — append:
    ```tsx
              selectedCount={selectedIds.size}
              selectedTotal={selectedTotal}
    ```

- [ ] **Step 6: Remove the interim selection bar; thread `onOpen` into the feed.** Replace the list region's `<>` opening (lines 417-460) — i.e. delete the entire `{selectedIds.size > 0 && ( …selection bar… )}` block (lines 418-449) and add `onOpen` to the feed:
  ```tsx
          ) : (
            <>
              <ExpenseFeed
                receipts={receipts}
                wide={!isMobile}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onOpen={handleOpenReceipt}
                onView={handleViewReceipt}
                onEdit={handleEditReceipt}
                onDelete={handleDeleteReceipt}
              />
  ```
  (Leave the `{isMobile ? (Load more) : (Pagination)}` block and the closing `</>` exactly as-is.)

- [ ] **Step 7: Replace the inline bulk-category `<Dialog>` with `<AssignCategoryDialog>`.** Delete the whole `<Dialog open={bulkCategoryOpen} …> … </Dialog>` block (lines 570-604) and put in its place:
  ```tsx
      <AssignCategoryDialog
        open={bulkCategoryOpen}
        onOpenChange={setBulkCategoryOpen}
        categories={categories}
        count={selectedIds.size}
        onAssign={confirmBulkCategoryUpdate}
        isLoading={bulkUpdateCategory.isPending}
      />
  ```

- [ ] **Step 8: Mount `<BulkBar>`.** Just before the closing `</PageTransition>` (after `<ImportExportSheet … />`, around line 629), add:
  ```tsx
      <BulkBar
        count={selectedIds.size}
        total={selectedTotal}
        currency={preferredCurrency}
        allSelected={allSelected}
        onToggleSelectAll={toggleSelectAll}
        onAssign={() => setBulkCategoryOpen(true)}
        onRemove={() => setBulkDeleteConfirmOpen(true)}
        onClear={() => setSelectedIds(new Set())}
        removing={bulkDelete.isPending}
      />
  ```
  (`BulkBar` returns `null` when `count === 0`, so it only appears once rows are selected. The single-delete `ConfirmDialog`, the bulk-delete `ConfirmDialog` + `confirmBulkDelete`, and `setBulkDeleteConfirmOpen` already exist and are unchanged — the kebab Delete reuses `handleDeleteReceipt`; the bulk bar's Remove reuses `setBulkDeleteConfirmOpen`.)

- [ ] **Step 9:** `npm run build` → PASS. Resolve tsc-strict unused-symbol errors. Expect now-unused after this task: the `Dialog*`/`Select*` imports, `Tag`/`Trash2`/`X` from lucide, `bulkCategoryId`/`setBulkCategoryId`. Confirm `Button`/`Loader2`/`Camera`/`QrCode` are still referenced (empty state Scan, Load-more spinner, scan CTA) and keep them.

---

## Task 10 — Build + verify (throwaway harness + real route)

- [ ] **Step 1:** `npm run build` → PASS.
- [ ] **Step 2: Throwaway harness** `src/pages/__chunk5-preview.tsx` (public) — renders the feed + bulk bar + overlays against sample data (one `hasJournal`, one `recurring` locked, one archived-group locked, mixed statuses), screenshot-able without auth:
  ```tsx
  import { useState } from 'react'
  import { ExpenseFeed } from '@/components/receipts/expense-feed'
  import { BulkBar } from '@/components/receipts/bulk-bar'
  import { AssignCategoryDialog } from '@/components/receipts/assign-category-dialog'
  import { ConfirmDialog } from '@/components/ui/confirm-dialog'
  import type { Receipt } from '@/hooks/receipts/use-receipts'
  import type { Category } from '@/hooks/categories/use-categories'

  const CATS = [
    { id: '1', name: 'Groceries', color: '#10b981', icon: '🛒' },
    { id: '2', name: 'Coffee', color: '#a855f7', icon: '☕' },
    { id: '3', name: 'Transport', color: '#3b82f6', icon: '🚗' },
  ] as Category[]

  const today = new Date().toISOString()
  const SAMPLE = [
    { id: 'r1', storeName: 'Maxi Supermarket', totalAmount: 2450, currency: 'RSD', receiptDate: today, createdAt: today, status: 'scraped', hasJournal: true, category: CATS[0] },
    { id: 'r2', storeName: 'Coffeedream', totalAmount: 380, currency: 'RSD', receiptDate: today, createdAt: today, status: 'manual', category: CATS[1] },
    { id: 'r3', storeName: 'NIS Petrol', totalAmount: 5200, currency: 'RSD', receiptDate: today, createdAt: today, status: 'recurring', category: CATS[2] },
    { id: 'r4', storeName: 'Roommate dinner', totalAmount: 3800, currency: 'RSD', receiptDate: today, createdAt: today, status: 'completed', hasJournal: true, group: { id: 'g1', name: 'Flat 3B', isArchived: true } },
  ] as unknown as Receipt[]

  export default function Chunk5Preview() {
    const [selectMode, setSelectMode] = useState(true)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['r1', 'r4']))
    const [assign, setAssign] = useState(false)
    const [del, setDel] = useState(false)
    const toggle = (id: string) => setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-4 flex gap-2">
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setSelectMode((v) => !v)}>Toggle select ({selectMode ? 'on' : 'off'})</button>
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setAssign(true)}>Assign</button>
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setDel(true)}>Delete confirm</button>
        </div>
        <div className="mx-auto max-w-[720px]">
          <ExpenseFeed
            receipts={SAMPLE}
            wide
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggle}
            onOpen={() => {}}
            onView={() => {}}
            onEdit={() => {}}
            onDelete={() => setDel(true)}
          />
        </div>
        <BulkBar
          count={selectedIds.size}
          total={6250}
          currency="RSD"
          allSelected={SAMPLE.every((r) => selectedIds.has(r.id))}
          onToggleSelectAll={() => setSelectedIds((p) => (p.size === SAMPLE.length ? new Set() : new Set(SAMPLE.map((r) => r.id))))}
          onAssign={() => setAssign(true)}
          onRemove={() => setDel(true)}
          onClear={() => setSelectedIds(new Set())}
        />
        <AssignCategoryDialog open={assign} onOpenChange={setAssign} categories={CATS} count={selectedIds.size} onAssign={() => setAssign(false)} />
        <ConfirmDialog open={del} onOpenChange={setDel} onConfirm={() => {}} title="Remove selected" description="Are you sure you want to delete 2 receipts? This action cannot be undone." variant="destructive" />
      </div>
    )
  }
  ```
  Add a temporary **public** route in `src/routes.tsx`: `const Chunk5Preview = lazy(() => import('./pages/__chunk5-preview'))` + `{ path: '/__chunk5-preview', element: <Chunk5Preview /> }` as a sibling of `/sign-in` (no `ProtectedRoute`).
  > `routes.tsx` is edited by parallel sessions → the Edit tool hits "modified since read" races. If Edit fails, add/revert the route with an **atomic `node` read-replace-write** (`fs.readFileSync` → `.replace(...)` → `fs.writeFileSync`), not Edit.

- [ ] **Step 3: Build + preview** on port **5180 `--strictPort`**. Screenshot `/__chunk5-preview`:
  - **Desktop (≥1024px):** selection mode (checkboxes + highlighted rows + floating **desktop bulk pill** with leading select-all check, count + sum, Assign / Remove / Clear); toggle select off → **kebab** visible on rows; open a kebab on the **recurring** and **archived** rows (lock note + disabled Edit/Delete, View enabled on the archived `hasJournal` row); the **Assign-category** modal (chips); the **Delete confirm**. Light + dark.
  - **Mobile (390px):** selection mode (checkboxes + **mobile bottom bulk bar** above where the tab-bar sits, Category + Remove); the **Assign-category** sheet; the **Delete confirm** sheet. Light + dark.
  > After `preview_resize`, dispatch a `resize` event so `useIsMobile`/`GlassDialog`/`BulkBar` switch modal↔sheet. Dark mode is **class-based** (`documentElement.classList.add('dark')`) — `preview_resize colorScheme:dark` does **not** flip it. Set an explicit viewport width/height (never the desktop preset — it has silently collapsed to `innerW:1`). The preview dev server + tab are **SHARED** — another session may navigate it away mid-check; re-navigate if so.
- [ ] **Step 4: Real-route pass (if backend up + logged in):** `/receipts`:
  - Desktop: row kebab opens View (only on `hasJournal`) / Edit / Delete; locked (recurring / archived-group) rows show the reason note + disabled Edit/Delete in the kebab; clicking a row body opens the viewer (hasJournal) or the edit modal; **Select** (summary) enters selection mode → summary swaps to "{n} selected · sum / Cancel", checkboxes appear, kebabs hide, the floating bulk pill shows; leading check = select-all; Assign category → glass dialog → assigns (toast incl. skipped); Remove selected → bulk confirm → deletes (toast incl. skipped); Clear empties but stays in select mode; Cancel exits + clears.
  - Mobile: `…` → "Select expenses" enters selection mode → header swaps to X · "{n} selected" · "Select all"; checkboxes + bottom bulk bar (Category / Remove); tapping a row (outside select) opens viewer / edit / lock toast per D1; Assign sheet + Remove confirm sheet work; the bulk bar clears the bottom tab-bar.
- [ ] **Step 5: Remove the harness** — delete `src/pages/__chunk5-preview.tsx`; revert the route + import in `src/routes.tsx` (atomic `node` if Edit races).
  Run: `grep -rn "__chunk5-preview\|Chunk5Preview" src/` → expected: no matches.
- [ ] **Step 6:** `npm run build` → PASS (after harness removal).

---

## Task 11 — Commit + push — FAST (shared branch)

- [ ] **Step 1:** Stage **explicit paths only** (a parallel session may be on this branch — **never** `git add -A`):
  ```bash
  git add src/components/receipts/row-kebab.tsx \
          src/components/receipts/bulk-bar.tsx \
          src/components/receipts/assign-category-dialog.tsx \
          src/components/receipts/expense-row.tsx \
          src/components/receipts/expense-feed.tsx \
          src/components/receipts/expenses-summary.tsx \
          src/components/receipts/expenses-mobile-header.tsx \
          src/pages/receipts/index.tsx \
          src/i18n/en.json src/i18n/sr.json \
          docs/superpowers/plans/2026-06-04-expenses-glass-chunk5-bulk.md
  ```
  Confirm nothing else is staged: `git status --short`. **If `en.json`/`sr.json` carry another session's uncommitted keys beyond your 3**, unstage them and commit code first, then add only your i18n hunk in a second fast commit (`git diff` to confirm the hunk is yours; `git apply --cached` a filtered patch if needed).
- [ ] **Step 2:** Commit: `feat(receipts): selection mode, bulk bars, kebab actions + gating`.
- [ ] **Step 3:** `git push origin feature/redesign-main-branch` (pre-push build hook builds the WHOLE working tree — another session's broken WIP can block the push; if it fails on a file you don't own, coordinate / retry). Push immediately.

---

## Self-review

- **Spec coverage (Chunk 5):** selection mode entered via desktop "Select" + mobile "…"→Select (existing state) ✓T7,T8; checkboxes + `bg-primary-soft` row highlight ✓T5; kebabs hide in select mode ✓T5; summary/header swap to "{n} selected · sum / Cancel" ✓T7,T8; select-all current page ✓T3(desktop check),T8(mobile link),T9; desktop floating glass bulk pill (count + sum + Assign + Remove + Clear) ✓T3; mobile bottom glass bar above the tab-bar (count/sum + Category + Remove) ✓T3; desktop kebab (View if hasJournal / Edit / — / Delete[danger]) with gating + reason note on locked rows ✓T2; Assign-category via GlassDialog → `useBulkUpdateCategory` + `{updated,skipped}` toasts ✓T4,T9; single + bulk delete via the glass `ConfirmDialog` (rewired, not restyled) + `{deleted,skipped}` toasts ✓T9,D7; remove interim selection bar + inline `<Dialog>`/`<Select>` ✓T9; route through existing handlers/mutations (toggleSelect, confirmBulkDelete, confirmBulkCategoryUpdate, handleView/Edit/DeleteReceipt) ✓T9.
- **Open-question resolution:** mobile per-row behavior settled via AskUserQuestion = **Smart open + select-mode** (D1) — tap = hasJournal→viewer / editable→edit / locked→toast; single delete via selection mode; no mobile kebab, no inline mobile buttons. Same smart-open wired to desktop row body (kebab carries explicit actions).
- **Carryover constraints:** data layer untouched (components are dumb, route through existing handlers; no hook/endpoint change) ✓; gradient only on logo + Scan CTA + mobile FAB — bulk-bar actions are neutral/destructive, never gradient ✓; net-new i18n (`common.edit`, `receipts.selectAll`, `receipts.deselectAll`) in **both** en+sr, everything else reused ✓T1; out of scope (ReceiptModal form, PFR, text search, scan flow) untouched ✓; reuse `GlassDialog` (assign), `ConfirmDialog` (confirms), `Popover` (kebab) + the `add-menu` `MenuItem` recipe + Chunk-0 primitives, not hand-rolled ✓; mobile overlays = bottom sheets / desktop = centered modals (via `GlassDialog`), desktop menus = Popover ✓.
- **Decisions flagged:** D1 (mobile smart-open, AskUserQuestion), D2 (locked gating inside the kebab vs the handoff mini-button illustration), D3 (per-platform single select-all control), D4 (Cancel vs Clear semantics), D5 (converted selected-sum from loaded rows + desktop cross-page caveat + mobile-header count-only), D6 (assign requires a category, no null path), D7 (ConfirmDialog rewired not restyled), D8 (scope-file list under-specified → also modifying summary/header/feed, all low-blast-radius redesign components).
- **Placeholder scan:** the only "line-range" markers (T9) point at existing JSX/handlers/state to delete or relocate — not new code to invent; all new components + the row replacement ship complete code.
- **Type consistency:** `RowKebab`/`BulkBar`/`AssignCategoryDialog` match the file table; `ExpenseRow`/`ExpenseFeed` gain `onOpen?: (r: Receipt) => void`; `ExpensesSummary` gains `selectedCount`+`selectedTotal`; `ExpensesMobileHeader` gains `selectedCount`+`allSelected`+`onToggleSelectAll`; `BulkBarProps` (`count,total,currency,allSelected,onToggleSelectAll,onAssign,onRemove,onClear,removing`) match the page wiring; `Receipt`/`Category`/`CurrencyTotal` reused from existing hooks; `useCurrencyConverter`/`useIsMobile`/`GlassDialog`/`Popover` APIs used as defined; `confirmBulkCategoryUpdate(categoryId: string)` signature matches `AssignCategoryDialog.onAssign`.
- **Shared-branch hygiene:** explicit-path staging only (never `-A`); i18n staged only if the diff is yours; `routes.tsx` harness via atomic `node` revert; preview tab/server shared (re-navigate); pre-push builds the whole tree. ✓T10,T11.
- **E2E:** the Playwright suite is already out of sync with this branch (asserts removed `receipts-table`/`receipts-filter-button`); C1-C4 deferred the refresh. Chunk 5 keeps that convention — preserves the still-meaningful row ids (`receipt-row-*`/`receipt-store-*`), adds `receipt-kebab-*` + `bulk-bar-desktop`/`bulk-bar-mobile`, drops the orphaned interim `receipt-view-*`/`receipt-edit-*`/`receipt-delete-*` ids (those inline buttons are gone) — leaving the suite refresh to the dedicated Chunk 8 pass. Flagged, not silent.
```
