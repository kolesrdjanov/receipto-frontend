# Expenses "Glass" — Chunk 4: Add menu / templates / import-export overlays + mobile frosted header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the receipts page's three top dropdowns (Scan / Add / Import-Export) + the inline import `<Dialog>` + the old `<h2>` header with (a) a sticky glass **desktop `PageToolbar`** carrying a `+` popover menu + a gradient **Scan** CTA, (b) a mobile **FAB-driven Add action sheet**, (c) glass-restyled **template picker** + **import-CSV guide** overlays, and (d) a mobile **frosted page header** hosting the title/total/count, a `…` overflow menu (Select / Sort / Import-Export), and the C3 quick-chips + filter button — replacing the global mobile header on `/receipts`.

**Architecture:** New presentation components compose from the shared `GlassDialog` (desktop modal / mobile sheet) and the existing Radix `Popover`; they are dumb and route every action through the page's existing handlers (`handleAddManually`, `handleAddFromTemplate`, `handleTemplateSelect`, `handleExport`, the import flow, `openQrScanner`/`openGalleryScanner`). The page keeps owning all state, data, and the filter→URL→debounce loop. The mobile FAB is taken over via `store/fab.ts`; the global mobile header is suppressed on `/receipts` via a new `AppLayout` prop. **The data layer is untouched.**

**Tech Stack:** React 19, TypeScript (strict), Tailwind v4, shadcn/ui + Radix (Dialog via `GlassDialog`, Popover), Framer Motion (inside `GlassDialog`), TanStack Query 5, lucide-react, i18next, Sonner.

**Companion spec:** `docs/superpowers/specs/2026-06-04-expenses-glass-redesign-design.md`. **Master plan:** `docs/superpowers/plans/2026-06-04-expenses-glass-redesign.md` (Chunk 4). **Reuses:** `components/glass/glass-dialog.tsx` (`GlassDialog`), `store/fab.ts` (`useFabStore`), `components/layout/page-toolbar.tsx` (`PageToolbar`, C1), Chunk-0 primitives (`Amount`, `CatTile`), `components/ui/popover.tsx`. **Handoff:** `~/Downloads/design_handoff_expenses/` (README "Add / Import-Export / Template picker / Overlays" sections, `ExpensesOverlays.jsx`, `ExpensesScreens.jsx`, the `.ex-action / .ex-menu / .ex-tpl / .ex-toolbar / .ex-mhead` CSS in `Expenses.html`).

---

## Split: ship 4a, then 4b (this session, two commits)

Chunk 4 is large and touches `index.tsx` + i18n. It splits cleanly so **every interim state stays fully working**:

- **4a — Desktop toolbar + overlays + mobile Add entry (Tasks 1–7).** PageToolbar (`+` menu + gradient Scan), glass template picker + import guide + import/export chooser, export wiring, **mobile FAB → Add action sheet**, remove the old button-row + the dropped PFR path, extract the inline import `<Dialog>`. After 4a: desktop is fully redesigned; **mobile keeps the global app-layout header + the C3 quick-chip row, and the FAB opens the new Add sheet** (so removing the old button-row doesn't strand mobile users). Sort stays fixed (Newest). Commit + push.
- **4b — Mobile frosted header + `…` menu + sort (Tasks 8–13).** The `.ex-mhead` page header (title + total + count + `…` menu), suppressing the global mobile header on `/receipts`; the `…` menu (Select / Sort / Import-Export); restore the sort toggle (un-hardcode `sortBy`/`sortOrder`); fold the C3 quick-chips + filter button into the header; hide the desktop summary on mobile. Commit + push.

> **Deviation from the task's suggested split (flagged):** the task's outline lists the "FAB Add sheet" under 4b. It is moved to **4a** because 4a removes the old top button-row — the *only* mobile add entry today — so the FAB Add sheet must land in the same commit to avoid a broken mobile interim. 4b is then purely the frosted header + `…` menu + sort.

---

## Decisions (settled — flagged for visibility, not re-litigation)

- **D1 — Single mobile "Import / Export" entry → a chooser sheet.** The handoff (and the task scope) give mobile a *single* "Import / Export" row in both the Add sheet and the `…` menu, while desktop's `+` menu has *two* items (Import CSV / Export CSV). Resolution: the single mobile entry opens a small `ImportExportSheet` (`GlassDialog`) with two `.ex-action` rows — **Import CSV** (→ import guide) and **Export CSV** (→ `handleExport`). Desktop keeps the two direct `+`-menu items (no chooser). Both route to the same existing handlers.
- **D2 — Add-sheet "Scan QR" row uses a soft-primary tint, not the prototype's gradient icon tile.** The prototype fills the Scan row's icon tile with the brand gradient, but the carryover constraint is **gradient only on logo + Scan CTA + mobile FAB; icon tiles use soft tints**. The Scan row stays visually primary (soft-primary row background + `text-primary` icon tile) without a gradient. On mobile the gradient lives on the FAB that opens the sheet; on desktop it lives on the `PageToolbar` Scan CTA.
- **D3 — Desktop gallery folds into the scan flow.** Per the approved design, desktop has only the gradient **Scan** CTA (→ `openQrScanner`) + the `+` menu; there is no separate desktop "From gallery" item (gallery is reached from inside the scanner, restyled in Chunk 6, and from the mobile Add sheet). No data path is lost.
- **D4 — Sort is mobile-only (`…` menu), default Newest.** The design exposes sort only in the mobile `…` menu (Newest first ↔ Oldest first on `receiptDate`). Desktop has no sort control in the design; the shared `sortBy`/`sortOrder` state defaults to Newest (`receiptDate DESC`) and is toggled from the mobile menu. No "date added" option.
- **D5 — Desktop `+` menu is a controlled Radix `Popover`.** No `dropdown-menu` component or `@radix-ui/react-dropdown-menu` exists; the project ships `components/ui/popover.tsx` (Radix Popover). The `+` menu reuses it (free focus/Esc/click-outside), with `PopoverContent` restyled to the `.ex-menu` recipe and a local `open` state so items close it on click.
- **D6 — Mobile loses the global top header (avatar/logo/language) on `/receipts`.** The frosted page header replaces it; profile, language, and full nav stay reachable via the bottom tab-bar **More** sheet (and Settings). This matches the handoff ("mobile uses a page-level frosted header, not the global one").

---

## File structure

| File | Chunk | Action | Responsibility |
|---|---|---|---|
| `src/i18n/en.json` + `sr.json` | 4a | modify | net-new `receipts.*` keys (add-sheet title/subtitle + action hints, `importCsv`/`exportCsv`) |
| `src/components/receipts/add-menu.tsx` | 4a | create | `AddMenu` (desktop `+` Popover), `AddSheet` (mobile FAB action sheet), `ImportExportSheet` (mobile chooser) |
| `src/components/receipts/import-guide-dialog.tsx` | 4a | create | `ImportGuideDialog` — CSV column list + date-format tip + Download template / Select file (extracted from the page) |
| `src/components/receipts/template-selector-modal.tsx` | 4a | modify | glass restyle via `GlassDialog`; `.ex-tpl` cards (name, store, currency pill, category chip); props unchanged |
| `src/pages/receipts/index.tsx` | 4a, 4b | modify | adopt `PageToolbar`; FAB takeover; remove old button-row + PFR + inline import `<Dialog>`; (4b) mobile header + sort state + hide mobile summary |
| `src/i18n/en.json` + `sr.json` | 4b | modify | net-new `receipts.selectExpenses`, `sortNewest`, `sortOldest`, `sortLabel` |
| `src/components/receipts/expenses-mobile-header.tsx` | 4b | create | `.ex-mhead` frosted sticky header: title + total + count + `…` Popover menu + QuickChips + filter button |
| `src/components/layout/app-layout.tsx` | 4b | modify | add `hideMobileHeader?: boolean` prop (suppress the global mobile `<header>`) |
| `src/pages/__chunk4-preview.tsx` | 4a, 4b | create→delete | throwaway verification harness (removed before each commit) |
| `src/routes.tsx` | 4a, 4b | modify→revert | temporary public harness route (removed before each commit) |

No component-unit-test harness exists (Playwright E2E only). Per-step verification = `npm run build` (tsc strict + vite) + preview on port **5180 `--strictPort`** (config at `receipto-frontend/.claude/launch.json`; **5173 is a different project**) + screenshots mobile+desktop, light+dark.

---

# CHUNK 4a — Desktop toolbar + overlays + mobile Add entry

## Task 1 — i18n keys (net-new, en + sr)

**Files:** `src/i18n/en.json`, `src/i18n/sr.json`

Reuse existing keys where present (do **not** duplicate): `addBlank` ("Blank Receipt"), `addFromTemplate` ("From Template"), `addManually` ("Add Manually"), `scanCamera` ("Scan QR Code"), `scanGallery` ("From Gallery"), `scanQr` ("Scan"), `importExport` ("Import / Export"), `manageTemplates`, `subtitle`, `title`, `import.guide.*`, `export.button`, `import.button`, `templateSelector.*`, `unknownStore`, `common.cancel`.

- [ ] **Step 1:** In **both** files, inside the `receipts` object, add (en value / sr value):

  | key | en | sr |
  |---|---|---|
  | `addSheetTitle` | `Add an expense` | `Dodaj trošak` |
  | `addSheetSubtitle` | `Scan, type it in, or import from a file.` | `Skenirajte, unesite ručno ili uvezite iz fajla.` |
  | `scanQrHint` | `Point at the fiscal receipt QR` | `Usmerite na QR kôd fiskalnog računa` |
  | `scanGalleryHint` | `Pick a photo of the QR code` | `Izaberite fotografiju QR koda` |
  | `addManuallyHint` | `Enter a blank receipt` | `Unesite prazan račun` |
  | `addFromTemplateHint` | `Prefill from a saved store` | `Popunite iz sačuvane prodavnice` |
  | `importExportHint` | `Import or export a CSV file` | `Uvezite ili izvezite CSV fajl` |
  | `importCsv` | `Import CSV` | `Uvezi CSV` |
  | `exportCsv` | `Export CSV` | `Izvezi CSV` |

- [ ] **Step 2:** Validate JSON parses:
  Run: `node -e "require('./src/i18n/en.json'); require('./src/i18n/sr.json'); console.log('ok')"`
  Expected: `ok`

---

## Task 2 — `add-menu.tsx` (desktop `+` menu + mobile Add sheet + import/export chooser)

**Files:** create `src/components/receipts/add-menu.tsx`

Recipe: `.ex-menu` / `.ex-menu-item` / `.ex-menu-sep` (desktop popover); `.ex-action` / `.ex-action-ic` / `.ex-action-t` / `.ex-action-s` (mobile sheet rows). Mobile sheets use `GlassDialog`. Scan row = soft-primary tint (D2).

- [ ] **Step 1: Write the component:**

```tsx
import { useState, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Copy, Upload, Download, ArrowDownUp, QrCode, Image, Loader2, ChevronRight, type LucideIcon,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { cn } from '@/lib/utils'

/* ---------- desktop "+" popover menu ---------- */

interface AddMenuProps {
  onAddBlank: () => void
  onAddFromTemplate: () => void
  onImport: () => void
  onExport: () => void
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-semibold transition-colors hover:bg-bg-subtle',
        danger ? 'text-destructive' : 'text-foreground',
      )}
    >
      <Icon className={cn('size-[17px] shrink-0', danger ? 'text-destructive' : 'text-muted-foreground')} />
      <span>{label}</span>
    </button>
  )
}

/** Desktop `+` menu: Blank receipt / From template / — / Import CSV / Export CSV. */
export function AddMenu({ onAddBlank, onAddFromTemplate, onImport, onExport }: AddMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const run = (fn: () => void) => () => { setOpen(false); fn() }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('receipts.addManually')}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground shadow-glass-1 transition-colors hover:bg-bg-subtle"
        >
          <Plus className="size-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[210px] rounded-xl border-border bg-popover p-1.5 shadow-lg">
        <MenuItem icon={Plus} label={t('receipts.addBlank')} onClick={run(onAddBlank)} />
        <MenuItem icon={Copy} label={t('receipts.addFromTemplate')} onClick={run(onAddFromTemplate)} />
        <div className="my-1.5 mx-2 h-px bg-hairline-soft" />
        <MenuItem icon={Upload} label={t('receipts.importCsv')} onClick={run(onImport)} />
        <MenuItem icon={Download} label={t('receipts.exportCsv')} onClick={run(onExport)} />
      </PopoverContent>
    </Popover>
  )
}

/* ---------- mobile Add action sheet (opened by the FAB) ---------- */

function ActionRow({
  icon: Icon, title, subtitle, onClick, primary,
}: { icon: LucideIcon; title: string; subtitle: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3.5 rounded-2xl border px-3.5 py-3 text-left transition-colors',
        primary ? 'border-transparent bg-primary-soft' : 'border-hairline-soft bg-card hover:bg-bg-subtle',
      )}
    >
      <span
        className={cn(
          'grid size-[42px] shrink-0 place-items-center rounded-xl',
          primary ? 'bg-primary/15 text-primary' : 'bg-bg-subtle text-fg-2',
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-[18px] shrink-0 text-fg-faint" />
    </button>
  )
}

interface AddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanQr: () => void
  onScanGallery: () => void
  onAddManually: () => void
  onAddFromTemplate: () => void
  onImportExport: () => void
}

/** Mobile Add action sheet: Scan QR / From gallery / Add manually / From template / — / Import-Export. */
export function AddSheet({ open, onOpenChange, onScanQr, onScanGallery, onAddManually, onAddFromTemplate, onImportExport }: AddSheetProps) {
  const { t } = useTranslation()
  const pick = (fn: () => void) => () => { onOpenChange(false); fn() }

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('receipts.addSheetTitle')}
      description={t('receipts.addSheetSubtitle')}
    >
      <div className="flex flex-col gap-2">
        <ActionRow primary icon={QrCode} title={t('receipts.scanCamera')} subtitle={t('receipts.scanQrHint')} onClick={pick(onScanQr)} />
        <ActionRow icon={Image} title={t('receipts.scanGallery')} subtitle={t('receipts.scanGalleryHint')} onClick={pick(onScanGallery)} />
        <ActionRow icon={Plus} title={t('receipts.addManually')} subtitle={t('receipts.addManuallyHint')} onClick={pick(onAddManually)} />
        <ActionRow icon={Copy} title={t('receipts.addFromTemplate')} subtitle={t('receipts.addFromTemplateHint')} onClick={pick(onAddFromTemplate)} />
        <div className="my-1 h-px bg-hairline-soft" />
        <ActionRow icon={ArrowDownUp} title={t('receipts.importExport')} subtitle={t('receipts.importExportHint')} onClick={pick(onImportExport)} />
      </div>
    </GlassDialog>
  )
}

/* ---------- mobile Import/Export chooser (D1) ---------- */

interface ImportExportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: () => void
  onExport: () => void
  exporting?: boolean
}

/** Mobile chooser behind the single "Import / Export" entry. */
export function ImportExportSheet({ open, onOpenChange, onImport, onExport, exporting }: ImportExportSheetProps) {
  const { t } = useTranslation()

  return (
    <GlassDialog open={open} onOpenChange={onOpenChange} title={t('receipts.importExport')}>
      <div className="flex flex-col gap-2">
        <ActionRow icon={Upload} title={t('receipts.importCsv')} subtitle={t('receipts.import.guide.description')} onClick={() => { onOpenChange(false); onImport() }} />
        <ActionRow
          icon={exporting ? (Loader2 as unknown as LucideIcon) : Download}
          title={t('receipts.exportCsv')}
          subtitle={t('receipts.export.button')}
          onClick={() => { onOpenChange(false); onExport() }}
        />
      </div>
    </GlassDialog>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS. (If tsc objects to the `Loader2 as unknown as LucideIcon` cast, replace the export row's `icon` with a plain `Download` — the spinner is optional polish.)

> Note the unused `ComponentType` import was illustrative — remove it; only `LucideIcon` is needed.

---

## Task 3 — `import-guide-dialog.tsx` (glass CSV import guide)

**Files:** create `src/components/receipts/import-guide-dialog.tsx`

Extracts the inline `<Dialog>` from the page (index.tsx ~639–693) into a `GlassDialog`. The hidden file `<input>` + `useImportReceipts` + `handleDownloadTemplate`/`handleImportFile` **stay in the page**; this component just renders the guide body + the two footer buttons and calls `onDownloadTemplate` / `onSelectFile`. Reuses the existing `receipts.import.guide.*` keys (no new keys).

- [ ] **Step 1: Write the component:**

```tsx
import { useTranslation } from 'react-i18next'
import { Download, Upload, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassDialog } from '@/components/glass/glass-dialog'

const COLUMN_KEYS = [
  'columnStoreName',
  'columnTotalAmount',
  'columnCurrency',
  'columnReceiptDate',
  'columnReceiptNumber',
  'columnCategoryName',
] as const

interface ImportGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDownloadTemplate: () => void
  onSelectFile: () => void
  importing?: boolean
}

export function ImportGuideDialog({ open, onOpenChange, onDownloadTemplate, onSelectFile, importing }: ImportGuideDialogProps) {
  const { t } = useTranslation()

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('receipts.import.guide.title')}
      description={t('receipts.import.guide.description')}
      desktopWidth={520}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="rounded-xl" onClick={onDownloadTemplate}>
            <Download className="size-4" />
            {t('receipts.import.guide.downloadTemplate')}
          </Button>
          <Button className="rounded-xl" onClick={onSelectFile} disabled={importing}>
            {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {t('receipts.import.guide.selectFile')}
          </Button>
        </div>
      }
    >
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-fg-faint">
        {t('receipts.import.guide.columns')}
      </div>
      <ul className="flex flex-col gap-1">
        {COLUMN_KEYS.map((k) => (
          <li
            key={k}
            className="rounded-md bg-bg-subtle px-2.5 py-1.5 font-mono text-[12px] leading-snug text-foreground"
          >
            {t(`receipts.import.guide.${k}`)}
          </li>
        ))}
      </ul>
      <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-bg-subtle px-3.5 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="text-[12.5px] leading-[1.45] text-muted-foreground">
          {t('receipts.import.guide.dateFormats')}
        </span>
      </div>
    </GlassDialog>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 4 — `template-selector-modal.tsx` glass restyle

**Files:** modify `src/components/receipts/template-selector-modal.tsx` — keep props (`open`, `onOpenChange`, `onSelect`) + `useTemplates()` + `handleCreateTemplate` (navigate `/templates`). Swap the shadcn `Dialog`/`Card` for `GlassDialog` + `.ex-tpl` cards.

- [ ] **Step 1: Replace the file body** (keep imports for `useTranslation`, `useNavigate`, `useTemplates`/`Template`):

```tsx
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassDialog } from '@/components/glass/glass-dialog'
import { useTemplates, type Template } from '@/hooks/templates/use-templates'

interface TemplateSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: Template) => void
}

export function TemplateSelectorModal({ open, onOpenChange, onSelect }: TemplateSelectorModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: templates, isLoading, error } = useTemplates()

  const handleSelect = (template: Template) => {
    onSelect(template)
    onOpenChange(false)
  }

  const handleCreateTemplate = () => {
    onOpenChange(false)
    navigate('/templates')
  }

  const hasTemplates = !isLoading && !error && !!templates && templates.length > 0

  return (
    <GlassDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('receipts.templateSelector.title')}
      description={t('receipts.templateSelector.description')}
      desktopWidth={520}
      footer={
        hasTemplates ? (
          <div className="flex">
            <Button variant="outline" className="rounded-xl" onClick={handleCreateTemplate}>
              <Plus className="size-4" />
              {t('receipts.templateSelector.createTemplate')}
            </Button>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-destructive">
          {t('receipts.templateSelector.loadError', { message: error instanceof Error ? error.message : 'Unknown error' })}
        </div>
      ) : !hasTemplates ? (
        <div className="py-8 text-center">
          <p className="mb-2 text-muted-foreground">{t('receipts.templateSelector.noTemplates')}</p>
          <p className="mb-6 text-sm text-muted-foreground">{t('receipts.templateSelector.noTemplatesText')}</p>
          <Button className="rounded-xl" onClick={handleCreateTemplate}>
            <Plus className="size-4" />
            {t('receipts.templateSelector.createTemplate')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {templates!.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelect(template)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-bg-subtle"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-[15px] font-semibold text-foreground">{template.name}</span>
                {template.storeName && (
                  <span className="truncate text-[12.5px] text-muted-foreground">{template.storeName}</span>
                )}
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  {template.currency && (
                    <span className="inline-flex items-center rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {template.currency}
                    </span>
                  )}
                  {template.category && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-foreground"
                      style={{ backgroundColor: (template.category.color || '#888') + '20' }}
                    >
                      {template.category.icon && <span>{template.category.icon}</span>}
                      {template.category.name}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-[18px] shrink-0 text-fg-faint" />
            </button>
          ))}
        </div>
      )}
    </GlassDialog>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 5 — Wire 4a into `pages/receipts/index.tsx`

**Files:** modify `src/pages/receipts/index.tsx`. Adopt `PageToolbar`; add the FAB takeover + Add/import-export sheets; remove the old button-row, the PFR path, and the three `show*Dropdown` states + click-outside effect; extract the inline import `<Dialog>` to `ImportGuideDialog`. **Keep all data wiring, filters, selection, and the C3 mobile quick-chip row (replaced in 4b).**

- [ ] **Step 1: Imports.**
  - Remove the now-unused dialog scaffolding import block (lines 7–14: `Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle`) **only if** no other dialog remains — the bulk-category `<Dialog>` (lines 721–755) still uses them, so **keep this import**. (Chunk 5 replaces that dialog.)
  - Add after the existing receipts-component imports:
    ```tsx
    import { PageToolbar } from '@/components/layout/page-toolbar'
    import { AddMenu, AddSheet, ImportExportSheet } from '@/components/receipts/add-menu'
    import { ImportGuideDialog } from '@/components/receipts/import-guide-dialog'
    import { useFabStore } from '@/store/fab'
    ```
  - Add `useCallback` to the React import (line 1): `import { useState, lazy, Suspense, useRef, useEffect, useCallback } from 'react'`.
  - In the lucide import (line 48), drop the now-unused glyphs and add `QrCode`. After edits the only icons still referenced in the page are: `Camera, Loader2, SlidersHorizontal, Trash2, X, Tag, QrCode` (verify against tsc; `Plus`/`ChevronDown`/`Archive`/`Info`/`Download`/`Upload`/`Image` move into the new components). Set:
    ```tsx
    import { Camera, Loader2, SlidersHorizontal, Trash2, X, Tag, QrCode } from 'lucide-react'
    ```

- [ ] **Step 2: Remove dropped state + the PFR path.**
  - Delete the three dropdown states (lines 88–90): `showAddDropdown`, `showScanDropdown`, `showImportExportDropdown`.
  - Delete the three dropdown refs (lines 98–100): `dropdownRef`, `scanDropdownRef`, `importExportDropdownRef`.
  - Delete the entire click-outside `useEffect` (lines 141–160).
  - Remove `openPfrEntry` from the `useReceiptScanner()` destructure (line 112) → `const { openQrScanner, openGalleryScanner, scannerModals, isCreating, isGalleryProcessing } = useReceiptScanner()`.
  - Delete `handlePfrEntry` (lines 207–210).
  - In `handleAddManually` / `handleAddFromTemplate`, delete the trailing `setShowAddDropdown(false)` lines (the dropdown no longer exists).

- [ ] **Step 3: Add the Add/Import-Export sheet state + FAB takeover.** After the existing UI state (e.g. after `filterSheetOpen`):
  ```tsx
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [importExportSheetOpen, setImportExportSheetOpen] = useState(false)
  const setFab = useFabStore((s) => s.setFab)
  const clearFab = useFabStore((s) => s.clearFab)
  const openAddSheet = useCallback(() => setAddSheetOpen(true), [])
  useEffect(() => {
    setFab(openAddSheet)
    return () => clearFab()
  }, [setFab, clearFab, openAddSheet])
  ```

- [ ] **Step 4: Replace the old header + button-row (lines 346–470)** — the whole `<div className="flex flex-col gap-4 mb-6 ...">…</div>` block — with the desktop `PageToolbar` + a minimal `md:hidden` interim mobile title (replaced by the frosted header in 4b):
  ```tsx
      {/* Desktop sticky toolbar (breaks out of page padding to sit flush) */}
      <PageToolbar
        className="md:-mx-8 md:-mt-8 md:mb-6"
        title={t('receipts.title')}
        subtitle={
          <>
            {t('receipts.subtitle')}{' '}
            <Link to="/templates" className="text-primary hover:underline" data-testid="receipts-manage-templates-link">
              {t('receipts.manageTemplates')}
            </Link>
          </>
        }
        actions={
          <>
            <AddMenu
              onAddBlank={handleAddManually}
              onAddFromTemplate={handleAddFromTemplate}
              onImport={() => setImportDialogOpen(true)}
              onExport={handleExport}
            />
            <button
              type="button"
              onClick={openQrScanner}
              disabled={isCreating || isGalleryProcessing}
              className="btn-brand inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-white disabled:opacity-60"
              data-testid="receipts-scan-button"
            >
              {(isCreating || isGalleryProcessing) ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
              {t('receipts.scanQr')}
            </button>
          </>
        }
      />

      {/* Mobile interim title (replaced by the frosted header in Chunk 4b) */}
      <div className="mb-4 md:hidden" data-testid="receipts-title">
        <h1 className="t-h1 text-[28px]">{t('receipts.title')}</h1>
        <p className="t-sm mt-1 text-muted-foreground" data-testid="receipts-subtitle">
          {t('receipts.subtitle')}{' '}
          <Link to="/templates" className="text-primary hover:underline">{t('receipts.manageTemplates')}</Link>
        </p>
      </div>
  ```
  > Keeps the still-relevant `data-testid` hooks (`receipts-title`, `receipts-subtitle`, `receipts-manage-templates-link`; `receipts-empty`/`receipts-loading` live in the feed). The old Add-dropdown ids (`receipts-add-dropdown(-button)`, `receipts-add-blank-button`, `receipts-add-from-template-button`, `receipts-add-pfr-button`, `receipts-scan-dropdown-button`) are removed with the button-row and have no glass equivalent. **The E2E suite is already out of sync with this branch** — it still asserts `receipts-table` (removed in C2) and `receipts-filter-button` (removed in C3); C1–C3 did not refresh it in-chunk. Chunk 4 stays consistent (build + preview verification), leaving the Playwright refresh to a dedicated pass (Chunk 8 / separate task). Confirm the current state with `grep -rhoE "receipts-[a-z-]+" ../receipto-e2e/`.

- [ ] **Step 5: Keep the C3 mobile quick-filter row** (current lines 472–485) untouched — it is replaced by the frosted header in 4b.

- [ ] **Step 6: Replace the inline import `<Dialog>` (lines 639–693)** with the extracted component (placed where the old `<Dialog>` was; keep the hidden file input in the page):
  ```tsx
      <ImportGuideDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onDownloadTemplate={handleDownloadTemplate}
        onSelectFile={handleSelectImportFile}
        importing={importReceipts.isPending}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleImportFile}
        className="hidden"
      />
  ```

- [ ] **Step 7: Render the Add sheet + Import/Export chooser** just before the closing `</PageTransition>` (after `<FilterSheet ... />`):
  ```tsx
      <AddSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onScanQr={openQrScanner}
        onScanGallery={openGalleryScanner}
        onAddManually={handleAddManually}
        onAddFromTemplate={handleAddFromTemplate}
        onImportExport={() => setImportExportSheetOpen(true)}
      />
      <ImportExportSheet
        open={importExportSheetOpen}
        onOpenChange={setImportExportSheetOpen}
        onImport={() => setImportDialogOpen(true)}
        onExport={handleExport}
        exporting={exportReceipts.isPending}
      />
  ```

- [ ] **Step 8:** `npm run build` → PASS. Resolve any tsc-strict unused-symbol errors (expect: PFR/`openPfrEntry`/`handlePfrEntry` gone; `show*Dropdown` + refs gone; the dropped lucide glyphs gone; `Link` is still used by the toolbar subtitle + interim title — keep its import).

---

## Task 6 — Build + verify (throwaway harness + real route) — 4a

- [ ] **Step 1:** `npm run build` → PASS.
- [ ] **Step 2: Throwaway harness** `src/pages/__chunk4-preview.tsx` (public) — renders the overlays against sample data so they are screenshot-able without auth:
  ```tsx
  import { useState } from 'react'
  import { AddMenu, AddSheet, ImportExportSheet } from '@/components/receipts/add-menu'
  import { ImportGuideDialog } from '@/components/receipts/import-guide-dialog'

  export default function Chunk4Preview() {
    const [add, setAdd] = useState(true)
    const [imp, setImp] = useState(false)
    const [guide, setGuide] = useState(false)
    const noop = () => {}
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-6 flex items-center justify-end gap-2 rounded-2xl border border-border bg-card/70 p-4">
          <AddMenu onAddBlank={noop} onAddFromTemplate={noop} onImport={() => setGuide(true)} onExport={noop} />
          <button className="btn-brand inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-white">Scan</button>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setAdd(true)}>Add sheet</button>
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setImp(true)}>Import/Export</button>
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => setGuide(true)}>Import guide</button>
        </div>
        <AddSheet open={add} onOpenChange={setAdd} onScanQr={noop} onScanGallery={noop} onAddManually={noop} onAddFromTemplate={noop} onImportExport={() => setImp(true)} />
        <ImportExportSheet open={imp} onOpenChange={setImp} onImport={() => setGuide(true)} onExport={noop} />
        <ImportGuideDialog open={guide} onOpenChange={setGuide} onDownloadTemplate={noop} onSelectFile={noop} />
      </div>
    )
  }
  ```
  Add a temporary **public** route in `src/routes.tsx`: `const Chunk4Preview = lazy(() => import('./pages/__chunk4-preview'))` + `{ path: '/__chunk4-preview', element: <Chunk4Preview /> }` as a sibling of `/sign-in` (no `ProtectedRoute`). *(The `TemplateSelectorModal` glass restyle is auth-gated — verify it on the real route, or temporarily render it in the harness with mock `useTemplates` if the backend is down.)*

- [ ] **Step 3: Build + preview** on port **5180 `--strictPort`**. Screenshot `/__chunk4-preview`:
  - **Desktop (≥1024px):** the `+` popover menu open (Blank receipt / From template / — / Import CSV / Export CSV) beside the gradient Scan CTA; the Import guide **modal** (column mono rows + date tip + Download template / Select CSV file). Light + dark.
  - **Mobile (390px):** the Add **sheet** (Scan QR primary soft tile / From gallery / Add manually / From template / — / Import-Export, each with subtitle + chevron, drag handle); the Import/Export **chooser** sheet; the Import guide **sheet**. Light + dark.
- [ ] **Step 4: Real-route pass (if backend up + logged in):** `/receipts`:
  - Desktop: toolbar shows title + "Manage templates" link + `+` menu + gradient Scan; `+`→Blank opens the create modal; `+`→From template opens the **glass** template picker (cards: name/store/currency pill/category chip, "Create template" → `/templates`); `+`→Import opens the glass guide; `+`→Export downloads a CSV (success toast); Scan opens the scanner.
  - Mobile: the FAB opens the Add sheet; Scan QR / From gallery launch the scanner; Add manually opens the create modal; From template opens the glass picker; Import-Export opens the chooser → Import guide / Export. No old top button-row remains; no "Via PFR" entry anywhere.
- [ ] **Step 5: Remove the harness** — delete `src/pages/__chunk4-preview.tsx`; revert the route + import in `src/routes.tsx`.
  Run: `grep -rn "__chunk4-preview\|Chunk4Preview" src/` → expected: no matches.
- [ ] **Step 6:** `npm run build` → PASS (after harness removal).

---

## Task 7 — Commit + push (4a) — FAST (shared branch)

- [ ] **Step 1:** Stage **explicit paths only** (a parallel session may be on this branch — never `git add -A`):
  ```bash
  git add src/components/receipts/add-menu.tsx \
          src/components/receipts/import-guide-dialog.tsx \
          src/components/receipts/template-selector-modal.tsx \
          src/pages/receipts/index.tsx \
          src/i18n/en.json src/i18n/sr.json \
          docs/superpowers/plans/2026-06-04-expenses-glass-chunk4-overlays.md
  ```
  Confirm nothing else is staged: `git status --short`.
- [ ] **Step 2:** Commit: `feat(receipts): + menu / FAB add sheet, glass template picker + import guide`.
- [ ] **Step 3:** `git push origin feature/redesign-main-branch` (pre-push build hook runs). Push immediately.

---

# CHUNK 4b — Mobile frosted header + `…` menu + sort toggle

## Task 8 — i18n keys (net-new, en + sr)

**Files:** `src/i18n/en.json`, `src/i18n/sr.json`

- [ ] **Step 1:** In **both** files, inside `receipts`, add:

  | key | en | sr |
  |---|---|---|
  | `selectExpenses` | `Select expenses` | `Izaberi troškove` |
  | `sortNewest` | `Newest first` | `Najnovije prvo` |
  | `sortOldest` | `Oldest first` | `Najstarije prvo` |
  | `sortLabel` | `Sort · {{value}}` | `Sortiraj · {{value}}` |

  (Reuse `receipts.count` = "{{count}} total" (added in C2) for the header count, `receipts.total`/`filteredTotal` for the total label, `importExport` + `importCsv`/`exportCsv` (4a) for the menu, `common.cancel`.)

- [ ] **Step 2:** Validate: `node -e "require('./src/i18n/en.json'); require('./src/i18n/sr.json'); console.log('ok')"` → `ok`.

---

## Task 9 — `expenses-mobile-header.tsx` (frosted sticky header + `…` menu)

**Files:** create `src/components/receipts/expenses-mobile-header.tsx`

Recipe `.ex-mhead` (sticky, frosted `blur(18px) saturate(1.4)`, semi-opaque `--bg/0.82`, bottom hairline). Breaks out of the page padding (`-mx-4 -mt-6`) and supplies its own safe-area top padding (the global header — which provided it — is suppressed on this route, Task 10). Hosts: title row (Expenses + total + count + `…` Popover menu) and the chip row (`QuickChips` + filter button). The `…` menu (Popover, `.ex-menu`) holds Select expenses / Sort / Import-Export (D1: single Import-Export → chooser).

- [ ] **Step 1: Write the component:**

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal, CircleCheckBig, ArrowDownWideNarrow, ArrowDownUp, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Amount } from '@/components/receipts/primitives'
import { QuickChips } from '@/components/receipts/quick-chips'
import { useCurrencyConverter } from '@/hooks/currencies/use-currency-converter'
import { cn } from '@/lib/utils'
import type { Category } from '@/hooks/categories/use-categories'
import type { ReceiptsFilters, CurrencyTotal } from '@/hooks/receipts/use-receipts'

function MenuItem({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-semibold text-foreground transition-colors hover:bg-bg-subtle"
    >
      <Icon className="size-[17px] shrink-0 text-muted-foreground" />
      <span>{label}</span>
    </button>
  )
}

interface ExpensesMobileHeaderProps {
  totalAmounts: CurrencyTotal[]
  count: number
  hasReceipts: boolean
  filters: ReceiptsFilters
  categories: Category[]
  onFiltersChange: (filters: ReceiptsFilters) => void
  onOpenFilters: () => void
  selectMode: boolean
  onToggleSelectMode: () => void
  sortOrder: 'ASC' | 'DESC'
  onToggleSort: () => void
  onImportExport: () => void
}

export function ExpensesMobileHeader({
  totalAmounts, count, hasReceipts, filters, categories, onFiltersChange,
  onOpenFilters, selectMode, onToggleSelectMode, sortOrder, onToggleSort, onImportExport,
}: ExpensesMobileHeaderProps) {
  const { t } = useTranslation()
  const { convert, preferredCurrency } = useCurrencyConverter()
  const [menuOpen, setMenuOpen] = useState(false)
  const convertedTotal = totalAmounts.reduce((s, { currency, total }) => s + convert(total, currency), 0)
  const sortValue = sortOrder === 'DESC' ? t('receipts.sortNewest') : t('receipts.sortOldest')
  const run = (fn: () => void) => () => { setMenuOpen(false); fn() }

  return (
    <div
      className="sticky top-0 z-20 -mx-4 -mt-6 mb-3 border-b border-hairline-soft bg-[oklch(from_var(--background)_l_c_h/0.82)] px-5 pb-3.5 [backdrop-filter:blur(18px)_saturate(1.4)] [-webkit-backdrop-filter:blur(18px)_saturate(1.4)] md:hidden"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)' }}
    >
      <div className="mb-4 flex items-end justify-between">
        <div className="min-w-0">
          <h1 className="t-h1 text-[28px]">{t('receipts.title')}</h1>
          {hasReceipts && (
            <div className="mt-1.5 flex items-baseline gap-2">
              <Amount value={convertedTotal} currency={preferredCurrency} size={15} />
              <span className="text-[12.5px] text-muted-foreground">· {t('receipts.count', { count })}</span>
            </div>
          )}
        </div>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('common.more', { defaultValue: 'More' })}
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-bg-subtle hover:text-foreground"
            >
              <MoreHorizontal className="size-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-[210px] rounded-xl border-border bg-popover p-1.5 shadow-lg">
            <MenuItem icon={CircleCheckBig} label={selectMode ? t('common.cancel') : t('receipts.selectExpenses')} onClick={run(onToggleSelectMode)} />
            <MenuItem icon={ArrowDownWideNarrow} label={t('receipts.sortLabel', { value: sortValue })} onClick={run(onToggleSort)} />
            <div className="my-1.5 mx-2 h-px bg-hairline-soft" />
            <MenuItem icon={ArrowDownUp} label={t('receipts.importExport')} onClick={run(onImportExport)} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="-mx-5 flex items-center gap-2 px-5">
        <div className="min-w-0 flex-1">
          <QuickChips filters={filters} categories={categories} onFiltersChange={onFiltersChange} />
        </div>
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label={t('receipts.filtersButton')}
          className="grid size-[42px] shrink-0 place-items-center rounded-[14px] border border-border bg-card text-fg-2 shadow-glass-1 transition-colors hover:bg-bg-subtle hover:text-foreground"
        >
          <SlidersHorizontal className="size-[18px]" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS. (If `common.more` is missing, the `defaultValue` covers it; optionally add `common.more` to en/sr — verify with `node -e "console.log(require('./src/i18n/en.json').common.more)"`.)

---

## Task 10 — `AppLayout` — suppress the global mobile header on `/receipts`

**Files:** modify `src/components/layout/app-layout.tsx`

- [ ] **Step 1:** Add the prop to the interface + signature:
  ```tsx
  interface AppLayoutProps {
    children: React.ReactNode
    /** Hide the global mobile <header> (a page provides its own frosted header). */
    hideMobileHeader?: boolean
  }

  export function AppLayout({ children, hideMobileHeader = false }: AppLayoutProps) {
  ```
- [ ] **Step 2:** Wrap the mobile `<header>` (lines 46–67) so it renders only when not suppressed:
  ```tsx
  {!hideMobileHeader && (
    <header className="flex flex-col border-b md:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      … (unchanged) …
    </header>
  )}
  ```
- [ ] **Step 3:** `npm run build` → PASS. Spot-check another route (e.g. `/dashboard`) still shows the global mobile header (default `false`).

---

## Task 11 — Wire 4b into `pages/receipts/index.tsx`

**Files:** modify `src/pages/receipts/index.tsx`

- [ ] **Step 1: Suppress the global mobile header.** Change `<AppLayout>` (line 344) to `<AppLayout hideMobileHeader>`.

- [ ] **Step 2: Restore the sort toggle state.** Replace the fixed sort consts (lines 95–97):
  ```tsx
  const sortBy: 'receiptDate' | 'createdAt' = 'receiptDate'
  const sortOrder: 'ASC' | 'DESC' = 'DESC'
  ```
  with state (default Newest = `receiptDate DESC`):
  ```tsx
  const sortBy: 'receiptDate' | 'createdAt' = 'receiptDate'
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const toggleSort = () => { setSortOrder((o) => (o === 'DESC' ? 'ASC' : 'DESC')); setPage(1) }
  ```
  (`sortBy` stays constant — only the order toggles, per D4. Both `useReceipts` + `useInfiniteReceipts` already receive `sortOrder`; the query-key change refetches automatically.)

- [ ] **Step 3: Add the mobile header import** (with the other receipts-component imports):
  ```tsx
  import { ExpensesMobileHeader } from '@/components/receipts/expenses-mobile-header'
  ```

- [ ] **Step 4: Replace the 4a interim mobile title (the `md:hidden` block from Task 5 Step 4) AND the standalone C3 mobile quick-filter row (current lines 472–485)** with the frosted header — rendered right after `<PageToolbar … />`:
  ```tsx
      <ExpensesMobileHeader
        totalAmounts={totalAmounts}
        count={meta?.total ?? 0}
        hasReceipts={!loading && receipts.length > 0}
        filters={filters}
        categories={categories}
        onFiltersChange={handleFiltersChange}
        onOpenFilters={() => setFilterSheetOpen(true)}
        selectMode={selectMode}
        onToggleSelectMode={() => { setSelectMode((v) => !v); setSelectedIds(new Set()) }}
        sortOrder={sortOrder}
        onToggleSort={toggleSort}
        onImportExport={() => setImportExportSheetOpen(true)}
      />
  ```
  Delete both the interim `<div className="mb-4 md:hidden">…title…</div>` and the `<div className="mb-3 flex items-center gap-2 md:hidden">…QuickChips + filter button…</div>` (their content now lives in the header).

- [ ] **Step 5: Hide the desktop summary on mobile** (the mobile header now carries total + count). The summary render (current lines 496–506) is gated by data; add a desktop-only guard so it doesn't double up the total on mobile — wrap its render with `!isMobile`:
  ```tsx
  {!isMobile && totalAmounts.length > 0 && !loading && receipts.length > 0 && (
    <ExpensesSummary … />
  )}
  ```
  (Mobile keeps the inline selection bar + feed; only the total/Select row moves to the header. The mobile header's `…`→Select toggles the same `selectMode`, so the interim selection bar still appears — bulk bars are Chunk 5.)

- [ ] **Step 6:** `npm run build` → PASS. Resolve any tsc-strict unused-symbol errors (expect `SlidersHorizontal` may now be unused in the page if the mobile filter button moved entirely into the header — drop it from the page's lucide import if so; it remains imported inside `expenses-mobile-header.tsx`).

---

## Task 12 — Build + verify (throwaway harness + real route) — 4b

- [ ] **Step 1:** `npm run build` → PASS.
- [ ] **Step 2: Throwaway harness** — recreate `src/pages/__chunk4-preview.tsx` (public) rendering the mobile header with sample data, in a narrow frame:
  ```tsx
  import { useState } from 'react'
  import { ExpensesMobileHeader } from '@/components/receipts/expenses-mobile-header'
  import type { Category } from '@/hooks/categories/use-categories'
  import type { ReceiptsFilters } from '@/hooks/receipts/use-receipts'

  const CATS = [
    { id: '1', name: 'Groceries', color: '#10b981', icon: '🛒' },
    { id: '2', name: 'Coffee', color: '#a855f7', icon: '☕' },
    { id: '3', name: 'Transport', color: '#3b82f6', icon: '🚗' },
  ] as Category[]

  export default function Chunk4Preview() {
    const [filters, setFilters] = useState<ReceiptsFilters>({})
    const [selectMode, setSelectMode] = useState(false)
    const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC')
    return (
      <div className="mx-auto max-w-[390px] bg-background px-4 py-6">
        <ExpensesMobileHeader
          totalAmounts={[{ currency: 'RSD', total: 248900 }] as any}
          count={934}
          hasReceipts
          filters={filters}
          categories={CATS}
          onFiltersChange={setFilters}
          onOpenFilters={() => {}}
          selectMode={selectMode}
          onToggleSelectMode={() => setSelectMode((v) => !v)}
          sortOrder={order}
          onToggleSort={() => setOrder((o) => (o === 'DESC' ? 'ASC' : 'DESC'))}
          onImportExport={() => {}}
        />
        <div className="h-64 rounded-2xl border border-dashed border-border" />
      </div>
    )
  }
  ```
  Add the temporary public route in `src/routes.tsx` (as in Task 6).
- [ ] **Step 3: Build + preview** on **5180 `--strictPort`**. Screenshot `/__chunk4-preview` at 390px, light + dark: frosted header (title + 248.900 RSD + "934 total"), the `…` menu open (Select expenses / Sort · Newest first / — / Import / Export), quick-chips + filter button. Toggle Sort → label flips to "Oldest first"; toggle Select → label flips to Cancel.
- [ ] **Step 4: Real-route pass (if backend up + logged in):** `/receipts` mobile (390px): no global top header (no logo/avatar bar); the frosted page header shows title + live total + count + the `…` menu; quick-chips + filter button work; `…`→Select shows the inline selection bar; `…`→Sort flips the order (feed reorders, page resets to 1); `…`→Import-Export opens the chooser. Desktop unchanged (toolbar + rail + summary). Confirm **More** in the bottom tab-bar still opens the sidebar sheet (profile/settings reachable). Light + dark.
- [ ] **Step 5: Remove the harness** — delete `src/pages/__chunk4-preview.tsx`; revert the route + import. `grep -rn "__chunk4-preview\|Chunk4Preview" src/` → no matches.
- [ ] **Step 6:** `npm run build` → PASS (after harness removal).

---

## Task 13 — Commit + push (4b) — FAST

- [ ] **Step 1:** Stage explicit paths only:
  ```bash
  git add src/components/receipts/expenses-mobile-header.tsx \
          src/components/layout/app-layout.tsx \
          src/pages/receipts/index.tsx \
          src/i18n/en.json src/i18n/sr.json \
          docs/superpowers/plans/2026-06-04-expenses-glass-chunk4-overlays.md
  ```
  Confirm with `git status --short`.
- [ ] **Step 2:** Commit: `feat(receipts): mobile frosted header + … menu + sort toggle`.
- [ ] **Step 3:** `git push origin feature/redesign-main-branch`. Push immediately.

---

## Self-review

- **Spec coverage (Chunk 4):** desktop `+` menu (Blank / From template / — / Import CSV / Export CSV) ✓T2,T5; mobile FAB Add action sheet (Scan QR / gallery / manually / template / — / Import-Export) ✓T2,T5; glass template picker (name/store/currency pill/category chip + Create template) ✓T4; glass import-CSV guide (columns + date tip + download/select, extracted) ✓T3,T5; export wiring ✓T5; `PageToolbar` adoption (actions = `+` menu + gradient Scan, "Manage templates" in subtitle) ✓T5; mobile frosted header (title + total + count) hosting the `…` menu + the C3 quick-chips + filter button, replacing the global mobile header ✓T9,T10,T11; `…` menu (Select → toggles existing `selectMode`; Sort Newest/Oldest; Import-Export) ✓T9,T11; sort restored by un-hardcoding `sortBy`/`sortOrder` (default Newest) ✓T11; FAB takeover via `store/fab.ts` ✓T5; remove old button-row + 3 dropdown states + click-outside effect + old `<h2>`, extract inline import `<Dialog>`, drop PFR ✓T5.
- **Carryover constraints:** data layer untouched (components route through existing handlers; no hook/endpoint change) ✓; gradient only on logo + Scan CTA (PageToolbar) + mobile FAB — Add-sheet Scan row uses a soft-primary tint, not the prototype gradient (D2) ✓; net-new i18n in **both** en + sr ✓T1,T8; reuse existing `receipts.*` keys (addBlank/addFromTemplate/scanCamera/scanGallery/importExport/manageTemplates/import.guide.*/templateSelector.*/count) ✓; out of scope (ReceiptModal form, PFR, text search) untouched ✓ (PFR actively removed per spec); shared `GlassDialog` + `useFabStore` + `PageToolbar` reused, not hand-rolled ✓; mobile overlays = bottom sheets / desktop = centered modals (via `GlassDialog`), desktop `+` = Popover (D5) ✓.
- **Decisions flagged:** D1 (single mobile Import/Export → chooser), D2 (Scan-row soft tint vs prototype gradient), D3 (desktop gallery via scan flow), D4 (sort mobile-only, default Newest), D5 (`+` = Radix Popover, no dropdown-menu dep), D6 (mobile drops global top header on `/receipts`), plus the split deviation (FAB Add sheet → 4a not 4b, to keep the mobile interim working).
- **Split:** 4a (T1–7) and 4b (T8–13) each leave the app fully working; 4a ships first. Two fast, explicit-path commits on the shared branch.
- **Placeholder scan:** the only "verbatim/line-range" markers (T5, T11) point at existing JSX/handlers to delete or relocate — not new code to invent; all new components ship real code.
- **Type consistency:** `AddMenu`/`AddSheet`/`ImportExportSheet`/`ImportGuideDialog`/`ExpensesMobileHeader` match the file table; props route to the page's existing `handleAddManually`/`handleAddFromTemplate`/`handleTemplateSelect`/`handleExport`/`handleSelectImportFile`/`handleDownloadTemplate` + `openQrScanner`/`openGalleryScanner`; `ReceiptsFilters`/`Category`/`CurrencyTotal`/`Template` reused from existing hooks; `GlassDialogProps`/`useFabStore`/`PageToolbar` APIs used as defined.
- **E2E:** the Playwright suite is **already out of sync with this branch** (still asserts `receipts-table` removed in C2 + `receipts-filter-button` removed in C3); C1–C3 deferred the refresh. Chunk 4 keeps that convention — preserves the still-meaningful ids (`receipts-title`/`receipts-subtitle`/`receipts-manage-templates-link`/`receipts-empty`/`receipts-loading`), removes the orphaned Add-dropdown/PFR ids, and leaves the suite update to a dedicated pass (flagged, not silent — see T5 Step 4).
```
