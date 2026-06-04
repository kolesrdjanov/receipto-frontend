# Warranties "Glass" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the Warranties page + overlays in the Glass design system — coverage-bar-hero cards, urgency status language, derived emoji tiles, glass overlays, zod-validated form — reusing the established shared primitives, with the data layer untouched.

**Architecture:** Pure helpers in `warranty-view.ts`; component-only primitives in `primitives.tsx`; overlays rebuilt on `GlassDialog` + shared `ConfirmDialog`; the page recomposed with `PageToolbar` + mobile header + `useFabStore`. Verify via a throwaway `/__warr-preview` harness, then lint + build + commit + push on `feature/redesign-main-branch`.

**Tech Stack:** React 19, TS, Tailwind v4 (glass tokens), shadcn/Radix, react-hook-form + zod 4 (`safeParse` via a tiny inline resolver), framer-motion, lucide, i18next.

**Reference patterns (mirror these):** `components/recurring-expenses/{status.ts,primitives.tsx}`, `pages/recurring-expenses/index.tsx`, `components/glass/{glass.tsx,glass-dialog.tsx}`, `components/receipts/primitives.tsx`, `hooks/auth/use-sign-up.ts` (zod `safeParse`).

---

## Task 1: i18n keys (en + sr)

**Files:** Modify `src/i18n/en.json`, `src/i18n/sr.json` (both under the existing `warranties` object).

- [ ] **Step 1:** Add these keys to `warranties` in **en.json** (merge with existing `tabs/stats/status/modal/export/import`):

```jsonc
"mobileSubtitle": "Track your product warranties",
"desktopSubtitle": "Track and manage your product warranties — never miss an expiry window.",
"tracked": "Tracked",
"warrantiesLabel": "warranties",
"warrantyCount_one": "{{count}} warranty",          // NOTE: repo convention is single form — see Step 3
"sortedByExpiry": "sorted by expiry",
"noFilesAttached": "No files attached",
"filesCount": "{{count}} files",
"tapHint": "Tap a card to edit · tap a file to view",
"countActive": "active",
"countExpiring": "expiring",
"countExpired": "expired",
"remaining": {
  "daysLeft": "{{count}} days left",
  "monthsLeft": "{{count}} mo left",
  "yearsLeft": "{{count}} yr left",
  "yearsMonthsLeft": "{{years}} yr {{months}} mo left",
  "expiredDaysAgo": "Expired {{count}} days ago",
  "expiredMonthsAgo": "Expired {{count}} mo ago",
  "expiredYearsAgo": "Expired {{count}} yr ago",
  "expiresToday": "Expires today"
},
"actions": { "viewFiles": "View files", "edit": "Edit", "delete": "Delete" }
```

And under `warranties.modal` add:

```jsonc
"expiryHint": "Warranty expires {{date}}",
"addUpToFiles": "Add up to 3 files",
"filesHint": "Images or PDFs · receipt, invoice, warranty card",
"errors": {
  "productNameRequired": "Product name is required",
  "purchaseDateRequired": "Purchase date is required",
  "durationInvalid": "Enter a valid number of months"
}
```

- [ ] **Step 2:** Add the **Serbian** equivalents to `warranties` in **sr.json** (same keys):

```jsonc
"mobileSubtitle": "Pratite garancije svojih proizvoda",
"desktopSubtitle": "Pratite i upravljajte garancijama — nikada ne propustite istek.",
"tracked": "Praćeno",
"warrantiesLabel": "garancija",
"sortedByExpiry": "sortirano po isteku",
"noFilesAttached": "Nema priloženih fajlova",
"filesCount": "{{count}} fajlova",
"tapHint": "Dodirnite karticu za izmenu · dodirnite fajl za pregled",
"countActive": "aktivnih",
"countExpiring": "ističe",
"countExpired": "isteklo",
"remaining": {
  "daysLeft": "još {{count}} dana",
  "monthsLeft": "još {{count}} mes",
  "yearsLeft": "još {{count}} god",
  "yearsMonthsLeft": "još {{years}} god {{months}} mes",
  "expiredDaysAgo": "Isteklo pre {{count}} dana",
  "expiredMonthsAgo": "Isteklo pre {{count}} mes",
  "expiredYearsAgo": "Isteklo pre {{count}} god",
  "expiresToday": "Ističe danas"
},
"actions": { "viewFiles": "Pregled fajlova", "edit": "Izmeni", "delete": "Obriši" }
```

And under `warranties.modal` in sr.json:

```jsonc
"expiryHint": "Garancija ističe {{date}}",
"addUpToFiles": "Dodajte do 3 fajla",
"filesHint": "Slike ili PDF · račun, faktura, garantni list",
"errors": {
  "productNameRequired": "Naziv proizvoda je obavezan",
  "purchaseDateRequired": "Datum kupovine je obavezan",
  "durationInvalid": "Unesite ispravan broj meseci"
}
```

- [ ] **Step 3:** Drop the `_one` suffix idea — this repo uses a **single `{{count}}` form** (no i18next plural suffixes; see recurring decisions). Use `"warrantyCount": "{{count}} warranties"` / `"{{count}} garancija"`. Verify both files are valid JSON: `node -e "require('./src/i18n/en.json'); require('./src/i18n/sr.json'); console.log('ok')"`.

- [ ] **Step 4:** Commit: `git add src/i18n/en.json src/i18n/sr.json && git commit -m "i18n(warranties): add Glass redesign keys (en + sr)"`

---

## Task 2: Pure helpers — `warranty-view.ts`

**Files:** Create `src/components/warranties/warranty-view.ts`.

- [ ] **Step 1:** Write the file. Reuses `getWarrantyStatus`/`getRemainingDays` from the hook; adds kind-emoji derivation, coverage %, the granular remaining label, and urgency sorting.

```ts
import type { TFunction } from 'i18next'
import { differenceInCalendarDays, differenceInCalendarMonths } from 'date-fns'
import { getWarrantyStatus, getRemainingDays, type Warranty } from '@/hooks/warranties/use-warranties'

export type WarrantyStatus = 'active' | 'expiring' | 'expired'

/* Most-urgent-first within the "All" tab: expiring → active → expired (dimmed last). */
export const STATUS_RANK: Record<WarrantyStatus, number> = { expiring: 0, active: 1, expired: 2 }

/** Derive a presentational emoji from the product name (EN + SR keywords). No backend field. */
const KIND_RULES: Array<{ emoji: string; re: RegExp }> = [
  { emoji: '📺', re: /\b(tv|televizor|qled|oled|monitor|display|ekran)\b/i },
  { emoji: '📱', re: /\b(phone|iphone|telefon|galaxy|pixel|xiaomi|mobilni|smartphone)\b/i },
  { emoji: '💻', re: /\b(laptop|notebook|macbook|thinkpad|računar|racunar|pc|desktop|tablet|ipad)\b/i },
  { emoji: '🧊', re: /\b(fridge|frižider|frizider|freezer|zamrziva)\b/i },
  { emoji: '🧺', re: /\b(washer|washing|veš|ves|mašina za veš|masina za ves|sušilica|susilica|dryer|dishwasher|sudoper)\b/i },
  { emoji: '☕', re: /\b(coffee|espresso|kafa|aparat za kafu|delonghi|mixer|blender|toster|toaster|kuhinj|kitchen)\b/i },
  { emoji: '🎧', re: /\b(headphone|slušalice|slusalice|earbuds|audio|speaker|zvučnik|zvucnik|soundbar)\b/i },
  { emoji: '🧹', re: /\b(vacuum|usisivač|usisivac|dyson|roomba|robot)\b/i },
]
export function deriveKindEmoji(name?: string | null): string {
  if (!name) return '📦'
  const hit = KIND_RULES.find((r) => r.re.test(name))
  return hit ? hit.emoji : '📦'
}

/** Kind tile tint — a stable accent colour derived from the emoji bucket. */
const KIND_COLOR: Record<string, string> = {
  '📺': '#0ea5e9', '📱': '#8b5cf6', '💻': '#06b6d4', '🧊': '#10b981',
  '🧺': '#22c55e', '☕': '#d97706', '🎧': '#ec4899', '🧹': '#f43f5e', '📦': '#64748b',
}
export function kindColor(emoji: string): string { return KIND_COLOR[emoji] || '#64748b' }

/** 0..1 share of the warranty window that has elapsed (drives the coverage-bar fill). */
export function coveragePercent(w: Warranty): number {
  const start = new Date(w.purchaseDate).getTime()
  const end = new Date(w.warrantyExpires).getTime()
  const now = Date.now()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1
  return Math.min(1, Math.max(0, (now - start) / (end - start)))
}

/** Granular human remaining label for the coverage bar centre, e.g. "1 yr 3 mo left". */
export function formatRemaining(w: Warranty, t: TFunction): string {
  const status = getWarrantyStatus(w)
  const expiry = new Date(w.warrantyExpires)
  if (status === 'expired') {
    const days = Math.abs(getRemainingDays(w))
    const months = Math.abs(differenceInCalendarMonths(expiry, new Date()))
    if (days < 31) return t('warranties.remaining.expiredDaysAgo', { count: days })
    if (months < 12) return t('warranties.remaining.expiredMonthsAgo', { count: months })
    return t('warranties.remaining.expiredYearsAgo', { count: Math.round(months / 12) })
  }
  const days = getRemainingDays(w)
  if (days <= 0) return t('warranties.remaining.expiresToday')
  if (days < 31) return t('warranties.remaining.daysLeft', { count: days })
  const months = differenceInCalendarMonths(expiry, new Date())
  if (months < 12) return t('warranties.remaining.monthsLeft', { count: Math.max(1, months) })
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem === 0
    ? t('warranties.remaining.yearsLeft', { count: years })
    : t('warranties.remaining.yearsMonthsLeft', { years, months: rem })
}

/** Urgency triage sort: expiring → active → expired; tie-break soonest expiry first. */
export function sortWarranties(list: Warranty[]): Warranty[] {
  return [...list].sort((a, b) => {
    const r = STATUS_RANK[getWarrantyStatus(a)] - STATUS_RANK[getWarrantyStatus(b)]
    if (r !== 0) return r
    return new Date(a.warrantyExpires).getTime() - new Date(b.warrantyExpires).getTime()
  })
}
```

- [ ] **Step 2:** Typecheck: `npx tsc -b --pretty false 2>&1 | grep warranty-view || echo "clean"`. Expected: `clean`.
- [ ] **Step 3:** Commit: `git add src/components/warranties/warranty-view.ts && git commit -m "feat(warranties): add view helpers (kind emoji, coverage %, remaining label, sort)"`

---

## Task 3: Card primitives — `primitives.tsx`

**Files:** Create `src/components/warranties/primitives.tsx` (component-only — no exported non-components, per the `react-refresh/only-export-components` lint rule).

- [ ] **Step 1:** Build the primitives. Anatomy from the handoff (`WarrantiesShared.jsx`).

**`StatusBadge`** — urgency pill (mirror `recurring-expenses/primitives.tsx` `DueBadge`):
- map: `active → {ShieldCheck, 'bg-success-soft text-success-foreground', t('warranties.status.active')}`, `expiring → {ShieldAlert, 'bg-warning-soft text-warning-foreground', `${getRemainingDays(w)} ${t('warranties.status.daysLeft')}`}`, `expired → {ShieldX, 'bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]', t('warranties.status.expired')}`.
- classes: `inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold` (+ `small` variant `px-2 py-0.5 text-[10.5px]`).

**`KindTile`** — `function KindTile({ name, size = 46 })`: derive `emoji = deriveKindEmoji(name)`, `color = kindColor(emoji)`; render `<span class="grid shrink-0 place-items-center" style={{ width:size, height:size, borderRadius:13, fontSize:size*0.5, background: color + '22' }}>{emoji}</span>`.

**`CoverageBar`** — `function CoverageBar({ w })`:
- `status = getWarrantyStatus(w)`, `pct = coveragePercent(w)`, `remain = formatRemaining(w, t)`.
- fill colour by status: expired `oklch(from var(--destructive) 0.62 0.20 h)`, expiring `oklch(from var(--warning) 0.72 0.16 h)`, active `oklch(from var(--success) 0.60 0.15 h)`. Remaining-label text colour: expired `text-destructive`, expiring `text-warning-foreground`, active `text-success-foreground`.
- ends row (`flex items-center justify-between text-[11px] text-fg-faint`): left `<Calendar 11px/> {formatDate(w.purchaseDate)}`; centre `<span class="font-semibold {toneText}">{remain}</span>`; right `{formatDate(w.warrantyExpires)} <Shield 11px/>`.
- track: `<div class="relative mt-1.5 h-[7px] rounded-full bg-bg-subtle">` with fill `<div class="absolute inset-y-0 left-0 rounded-full" style={{ width: max(4, pct*100)%, background: fill }}/>` and, when `status !== 'expired'`, the today knob `<span class="absolute top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-bg-elev shadow-glass-1" style={{ left: clamp(4,97,pct*100)%, background: fill }}/>`. (Use `border-card` if `border-bg-elev` util is absent.)

**`FileThumbStrip`** — `function FileThumbStrip({ files, onOpen })` (files = `WarrantyFile[]`):
- empty → `<div class="flex items-center gap-1.5 text-[12.5px] text-fg-faint"><Paperclip 13px/> {t('warranties.noFilesAttached')}</div>`.
- else → `flex items-center gap-2`: for each file a 54px button (`relative size-[54px] overflow-hidden rounded-xl border border-border`) that on click `e.stopPropagation(); onOpen(i)`; PDF (detect `file.type==='pdf' || url endsWith .pdf || includes /raw/upload/`) → centred `FileText` + `PDF` tag; image → `<img src={url + (?|&) + 'f_auto,q_auto'} class="size-full object-cover">`. Trailing `<span class="text-[12px] text-fg-faint">{t('warranties.filesCount',{count:files.length})}</span>`.

**`StatusTabs`** — `function StatusTabs({ value, counts, onChange })` where `counts = {all,active,expiring,expired}`:
- horizontally scrollable pill group: container `flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`; each tab a button `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors`; active = `bg-card shadow-glass-1 text-foreground` + count chip `bg-primary-soft text-primary`; inactive = `text-muted-foreground hover:bg-bg-subtle` + count chip `bg-bg-subtle text-fg-faint`. Tabs: all/active/expiring/expired using `t('warranties.tabs.*')`.

**`CardActionList`** — `function CardActionList({ hasFiles, onViewFiles, onEdit, onDelete })` (shared by desktop kebab Popover + mobile sheet), mirroring recurring's `RowActionList`: optional "View files" (`Image` icon) when `hasFiles`, "Edit" (`Pencil`), divider, "Delete" (`Trash2`, destructive). Item class `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium hover:bg-bg-subtle`.

**`WarrantyCard`** — `function WarrantyCard({ w, onEdit, onOpenFile, onMenu })`:
- root: `<div class="glass-card flex cursor-pointer flex-col gap-0 rounded-[18px] border border-border p-[18px] shadow-glass-1 transition-[box-shadow,border-color] hover:border-primary/35 hover:shadow-glass-2 {expired ? 'opacity-[0.72]' : ''}" onClick={()=>onEdit(w)}>`. (Use a plain `bg-card` div if `glass-card` over the grid feels heavy — match recurring's list card which uses `bg-card shadow-glass-1`. Prefer `bg-card` here so cards read as solid surfaces, glass reserved for floating overlays.)
- top row (`flex items-start gap-3`): `<KindTile name={w.productName}/>`, middle (`min-w-0 flex-1`) name `<div class="truncate text-[16px] font-bold tracking-[-0.01em]">{w.productName}</div>` + store line `<div class="mt-0.5 flex items-center gap-1 text-[12.5px] font-semibold text-muted-foreground"><Store 12px/>{w.storeName || ...faint 'No store'}</div>`, then `<StatusBadge w={w}/>`.
- `<div class="mt-3.5"><CoverageBar w={w}/></div>`.
- footer (`mt-4 flex items-center justify-between`): `<FileThumbStrip files={w.files||[]} onOpen={(i)=>onOpenFile(w,i)}/>` + kebab button (`grid size-[34px] place-items-center rounded-lg text-muted-foreground hover:bg-bg-subtle`, `onClick={e=>{e.stopPropagation(); onMenu(w, e)}}`).

**`WarrantyGrid`** — `function WarrantyGrid({ items, ...handlers })`: `<div class="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">` mapping `WarrantyCard`. (Mobile collapses to 1 col since minmax floor is 320.)

- [ ] **Step 2:** Typecheck: `npx tsc -b --pretty false 2>&1 | grep "warranties/primitives" || echo "clean"`. Expected: `clean`.
- [ ] **Step 3:** Commit: `git add src/components/warranties/primitives.tsx && git commit -m "feat(warranties): glass card primitives (badge, coverage bar, tile, thumbs, tabs, card)"`

---

## Task 4: Add/Edit form — rewrite `warranty-modal.tsx`

**Files:** Modify `src/components/warranties/warranty-modal.tsx` (full rewrite of presentation; **keep all file/HEIC/submit logic verbatim**).

- [ ] **Step 1:** Add the zod schema + a tiny inline resolver (no new dependency — mirrors the `safeParse` approach in `use-sign-up.ts`, adapted to react-hook-form's `resolver` shape):

```ts
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'

function createWarrantySchema(t: TFunction) {
  return z.object({
    productName: z.string().trim().min(1, t('warranties.modal.errors.productNameRequired')),
    storeName: z.string().optional(),
    purchaseDate: z.string().min(1, t('warranties.modal.errors.purchaseDateRequired')),
    warrantyDuration: z.coerce.number({ message: t('warranties.modal.errors.durationInvalid') })
      .int().positive().optional(),
    notes: z.string().optional(),
  })
}
type WarrantyForm = z.infer<ReturnType<typeof createWarrantySchema>>

function zodResolver<T extends z.ZodTypeAny>(schema: T): Resolver<z.infer<T>> {
  return async (values) => {
    const r = schema.safeParse(values)
    if (r.success) return { values: r.data, errors: {} }
    const errors: Record<string, { type: string; message: string }> = {}
    for (const issue of r.error.issues) {
      const path = String(issue.path[0] ?? 'root')
      if (!errors[path]) errors[path] = { type: issue.code, message: issue.message }
    }
    return { values: {}, errors: errors as never }
  }
}
```

- [ ] **Step 2:** Wire the form: `useForm<WarrantyForm>({ resolver: zodResolver(createWarrantySchema(t)), defaultValues: { productName:'', storeName:'', purchaseDate: today, warrantyDuration: 24, notes: '' } })`. Pull `formState.errors` and pass each to the glass `Field`. Keep the existing `useEffect` reset-on-open, `clearAll`, `addFiles`/HEIC/`removePreviewItem`/`buildPreviewItems`/`onSubmit` (create vs update) **unchanged**. Remove the in-file `AlertDialog`; add a `onRequestDelete?: (w: Warranty) => void` prop and make the Delete button call `onRequestDelete?.(warranty)` then `onOpenChange(false)`.

- [ ] **Step 3:** Replace the shell + fields with `GlassDialog` (`desktopWidth={520}`):
  - Header: `title` = create/edit title, `description` = create/edit description (existing keys).
  - Body fields (glass `Field` from `@/components/glass/glass`):
    - Product name → `<Field label icon={Package} error={errors.productName?.message} {...register('productName')} placeholder=.../>`.
    - Store → `<Field label icon={Store} {...register('storeName')} .../>`.
    - Row (`grid grid-cols-2 gap-3`): Purchase date → `<Controller name="purchaseDate" .../>` wrapping `<DatePicker className="h-[50px] rounded-[14px]" .../>` with a `gfield-label`-style `<label class="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">` above; show `errors.purchaseDate?.message` below in `text-destructive`. Duration → `<Field label icon={undefined} type="number" min={1} {...register('warrantyDuration')} error={errors.warrantyDuration?.message}/>` + help text `t('warranties.modal.durationHelp')`.
    - Edit-only expiry hint strip: `<div class="flex items-center gap-2 rounded-xl bg-bg-subtle px-3.5 py-3 text-[13px]"><Shield 15px/> <span>{t('warranties.modal.expiryHint',{date: formatDate(warranty.warrantyExpires)})}</span> <StatusBadge w={warranty} small class="ml-auto"/></div>`.
    - Notes → a glass-styled `<textarea>` (Field is input-only): label above + `<textarea class="min-h-[76px] w-full rounded-[14px] border border-border bg-muted/60 px-3.5 py-3 text-[15px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" {...register('notes')}/>`.
    - Files block: reuse existing `previewItems`/`totalFileCount`/`canAddMore`. Empty → dashed dropzone `<label for="warranty-files" class="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-bg-subtle/50 px-6 py-7 text-center cursor-pointer"><UploadCloud/> <b>{t('warranties.modal.addUpToFiles')}</b> <span class="text-fg-faint">{t('warranties.modal.filesHint')}</span></label>`. With files → `grid grid-cols-3 gap-3` of 84px tiles (image `object-cover` / PDF `FileText`+tag / HEIC placeholder) each with destructive ✕ overlay (`absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-destructive text-white`), plus an "Add file" dashed tile while `canAddMore`. Keep the `<input id="warranty-files" type="file" .../>` and HEIC info tip (`warranties.modal.heicNotice`).
  - Footer (passed to `GlassDialog` `footer` prop). Use `useIsMobile(768)` for layout. Desktop: `flex items-center gap-2` → edit-only Delete (destructive, `mr-auto`) · Cancel (outline) · Submit (primary solid `bg-primary`). Mobile: `flex flex-col gap-2` → Submit (full) → Cancel (full) → edit-only Delete (full, destructive text). Submit button uses `form` attr or an `onClick={handleSubmit(onSubmit)}` since the footer is outside the `<form>`; simplest: wrap body in `<form id="warranty-form" onSubmit={handleSubmit(onSubmit)}>` and footer buttons use `form="warranty-form"` (mirrors GlassDialog forms note).

- [ ] **Step 4:** Typecheck + lint the file: `npx tsc -b --pretty false 2>&1 | grep "warranty-modal" || echo "clean"` then `npx eslint src/components/warranties/warranty-modal.tsx`. Expected: clean (no new errors).
- [ ] **Step 5:** Commit: `git add src/components/warranties/warranty-modal.tsx && git commit -m "feat(warranties): rebuild add/edit form on GlassDialog with zod validation"`

---

## Task 5: CSV import dialog — `warranty-import-dialog.tsx`

**Files:** Create `src/components/warranties/warranty-import-dialog.tsx`.

- [ ] **Step 1:** Extract the import guide into a `GlassDialog` (`desktopWidth={500}`). Props: `{ open, onOpenChange, onDownloadTemplate, onSelectFile, importing }`. Body: a `t('warranties.import.guide.columns')` heading + the 7 existing `columnProductName…columnFileUrls` keys each as a mono chip `<code class="block rounded-lg bg-bg-subtle px-2.5 py-1.5 font-mono text-[12px]">`; then a tip `<div class="flex items-start gap-2.5 rounded-xl bg-info-soft/60 px-3.5 py-3 text-[13px] text-info-foreground"><Info/> {dateFormats}. {defaultDuration}</div>`. Footer (`flex flex-col gap-2 sm:flex-row`): Download template (outline, `onDownloadTemplate`) + Select CSV file (primary, `onSelectFile`, disabled while `importing`). The hidden `<input type=file>` + `handleImportFile` stay in the page (passed via `onSelectFile` → triggers the page's ref).

- [ ] **Step 2:** Typecheck: `npx tsc -b --pretty false 2>&1 | grep "warranty-import" || echo "clean"`. Expected `clean`.
- [ ] **Step 3:** Commit: `git add src/components/warranties/warranty-import-dialog.tsx && git commit -m "feat(warranties): CSV import guide on GlassDialog"`

---

## Task 6: Gallery lightbox restyle — `warranty-gallery-modal.tsx`

**Files:** Modify `src/components/warranties/warranty-gallery-modal.tsx` (keep ALL logic; restyle chrome only).

- [ ] **Step 1:** Keep `useState/useMemo/useCallback` logic, `isPdf`, `currentDeliverUrl`, `pdfViewerUrl`, `goPrev/goNext`, keyboard effect, download/open handlers — **unchanged**. Restyle:
  - Top bar buttons → translucent-white round buttons: `grid size-[38px] place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors` (replace the shadcn `Button variant=secondary size=icon`).
  - Prev/next nav → `size-11 rounded-full bg-white/10 text-white hover:bg-white/20`.
  - Bottom: add thumbnail dots — for each file a 42px tile (`grid place-items-center rounded-lg`; active `border-2 border-white`, else `bg-white/10`) showing `FileText`/`Image` glyph, plus the existing `{i+1} / {n}` counter. Clicking a dot sets index.
  - Surface stays `bg-black` fullscreen.

- [ ] **Step 2:** Typecheck: `npx tsc -b --pretty false 2>&1 | grep "warranty-gallery" || echo "clean"`. Expected `clean`.
- [ ] **Step 3:** Commit: `git add src/components/warranties/warranty-gallery-modal.tsx && git commit -m "style(warranties): restyle gallery lightbox chrome (translucent buttons, thumbnail dots)"`

---

## Task 7: Page recomposition — `pages/warranties/index.tsx`

**Files:** Modify `src/pages/warranties/index.tsx` (full rewrite of presentation; keep the data hooks, the 4 status queries, `useWarrantyStats`, CSV handlers, gallery/modal/import local state).

- [ ] **Step 1:** Rewrite. Keep all the existing state + `handleAdd/handleEditWarranty/openGallery/handleExport/handleDownloadTemplate/handleSelectFile/handleImportFile/getWarrantiesForTab` logic; add: `sortWarranties()` around the per-tab list, `useFabStore` takeover (`setFab(handleAdd)` in an effect), a delete-confirm via shared `ConfirmDialog` (`warrantyToDelete` state + `useDeleteWarranty`), and desktop kebab Popover / mobile action sheet wired to `CardActionList`.

  - **Desktop** `PageToolbar` (full-bleed `md:-mx-8 md:-mt-8 md:mb-6`): title `t('warranties.title')`, subtitle `t('warranties.desktopSubtitle')`, actions = outline Export + Import buttons (h-10) + a gradient **Add warranty** CTA (the `AddButton` pattern from recurring — `btn-brand inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-white`).
  - **Mobile header** (`md:hidden`): `<h1 class="t-h1 text-[28px]">{t('warranties.title')}</h1>` + `t('warranties.mobileSubtitle')`, with a smaller gradient Add (h-9) top-right (`flex items-end justify-between`).
  - **Desktop stat cards** (`hidden gap-4 md:grid md:grid-cols-4`): 4 glass cards — Total / Active / Expiring soon / Expired. Each: label (`t-xs` or `text-[13px] text-muted-foreground`) top-left + tinted icon tile top-right (`grid size-8 place-items-center rounded-lg`, tones: total `bg-bg-subtle text-foreground`, active `bg-success-soft text-success-foreground`, expiring `bg-warning-soft text-warning-foreground`, expired `bg-destructive-soft text-[color:var(--destructive-foreground-on-soft)]`), big number `text-[30px] font-extrabold tabular-nums` (tone-coloured). Use `stats.total/active/expiringSoon/expired`.
  - **Mobile summary strip** (`md:hidden`, `rounded-2xl border border-border bg-card p-4 shadow-glass-1`): left `t('warranties.tracked')` (`t-xs`) over hero `{stats.total}` (`text-[30px] font-extrabold`) + `t('warranties.warrantiesLabel')` baseline; right wrap of 3 count pills (`rounded-full px-2.5 h-7 inline-flex items-center gap-1`): `<b>{active}</b> {countActive}` (success-soft), expiring (warn-soft), expired (danger-soft).
  - **Filter row**: `<StatusTabs value={activeTab} counts={{all:allWarranties.length, active:activeWarranties.length, expiring:expiringWarranties.length, expired:expiredWarranties.length}} onChange={setActiveTab}/>` + desktop-only right text `{t('warranties.warrantyCount',{count:list.length})} · {t('warranties.sortedByExpiry')}`.
  - **Grid**: `const list = sortWarranties(getWarrantiesForTab())` → `<WarrantyGrid items={list} onEdit={handleEditWarranty} onOpenFile={openGallery} onMenu={...}/>`. Desktop menu = a Popover anchored on the kebab (state `{menuFor, anchor}` — simplest: store `menuFor` id and render the Popover inside the card via primitives; OR use a controlled `Popover` per card). To keep primitives dumb, pass `onMenu` and render a single mobile action sheet (`GlassDialog`) for mobile; for desktop, wrap the kebab in a `Popover` inside `WarrantyCard` (add an internal `menuOpen` state + `CardActionList` in `PopoverContent`, mirroring `RecurringRow`). **Decision:** put the desktop Popover INSIDE `WarrantyCard` (like `RecurringRow`), and on mobile call `onMenu(w)` to open the page-level action sheet. Update Task 3's `WarrantyCard` accordingly (add `wide`/`isMobile` prop + handlers `onViewFiles/onDelete`).
  - **Empty** (no items in current tab): centred glass card with `Shield` tile, `t('warranties.noWarranties')`, `t('warranties.noWarrantiesText')`, gradient Add CTA (mirror recurring empty).
  - **Loading skeleton**: 3 skeleton cards (emoji tile + 2 lines + bar + thumb block), mirror recurring's skeleton.
  - **Mobile hint**: `t('warranties.tapHint')` centred under the grid.
  - **Overlays**: existing `WarrantyModal` (now `onRequestDelete={handleDelete}`), `WarrantyGalleryModal`, the new `WarrantyImportDialog`, the shared `ConfirmDialog` (delete), and the mobile `GlassDialog` action sheet rendering `CardActionList`.
  - Keep `<AppLayout>` + wrap content in `<PageTransition>` (match recurring).

- [ ] **Step 2:** Reconcile Task 3: `WarrantyCard` gains props `{ w, wide, onEdit, onOpenFile, onViewFiles, onDelete, onOpenActions }`; desktop renders an internal kebab `Popover` → `CardActionList`; mobile kebab calls `onOpenActions(w)`. (Edit the primitives file to add this; commit folded into Step 4.)
- [ ] **Step 3:** Typecheck whole project: `npx tsc -b --pretty false`. Expected: no errors in warranties files.
- [ ] **Step 4:** Commit: `git add src/pages/warranties/index.tsx src/components/warranties/primitives.tsx && git commit -m "feat(warranties): recompose page (toolbar, stats, tabs, sorted grid, FAB, states, menus)"`

---

## Task 8: Verify, lint, build, docs, push

**Files:** temporary `src/pages/__warr-preview.tsx` + a route in `src/routes.tsx` (both deleted after); modify `docs/design-system.md`.

- [ ] **Step 1:** Add a throwaway public route `/__warr-preview` rendering: the status scale (3 `WarrantyCard`s — active/expiring/expired with fake `Warranty` objects incl. files), the mobile summary strip + `StatusTabs`, the empty + skeleton states, and the `WarrantyModal` (create) + `WarrantyImportDialog` open — each block once in light and once inside a `<div class="dark">` panel. (Mirror the `/__rec-preview` harness from the recurring cycle.)
- [ ] **Step 2:** Start preview: `npm run dev -- --port 5180 --strictPort` (config `.claude/launch.json`). Use `preview_start`, then `preview_screenshot` at mobile (390) + desktop (1280) widths, light + dark. Check `preview_console_logs` for errors. Fix any visual issues by editing source.
- [ ] **Step 3:** Remove the harness: delete `src/pages/__warr-preview.tsx` and its route line in `routes.tsx`.
- [ ] **Step 4:** Update `docs/design-system.md` "Migrated so far" + "Ported" lists to include warranties (card primitives, coverage bar, derived emoji tile, zod-validated GlassDialog form).
- [ ] **Step 5:** Lint + build: `npm run lint` (confirm no NEW errors in warranties files vs the repo's pre-existing ones) and `npm run build`. Both must pass.
- [ ] **Step 6:** Commit + push: `git add -A && git commit -m "docs(warranties): mark Glass redesign migrated in design-system.md" && git push origin feature/redesign-main-branch`.

---

## Self-review notes
- **Spec coverage:** page (T7), card+coverage bar (T3), form+zod (T4), import (T5), gallery (T6), helpers (T2), i18n (T1), verify/lint/build/push (T8) — all spec sections covered.
- **Type consistency:** `WarrantyStatus`/`getWarrantyStatus` reused everywhere; `WarrantyForm` from the schema; `WarrantyCard` prop set finalized in T7 Step 2 (supersedes the T3 sketch).
- **No new deps:** zod present; resolver is inline. `date-fns` already a dep (used by date-picker).
- **Honest gap:** authed end-to-end (real Cloudinary thumbs, FAB tap, toolbar breakout) not run live — verified in isolation + build, per prior cycles.
