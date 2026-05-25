# 03 — Receipts

The core domain object. Users create receipts by scanning fiscal QR codes (see `06-scanning.md`), picking images from the gallery, manually entering PFR data, or creating one entirely by hand.

Web reference: `src/pages/receipts/index.tsx` (1,047 lines), `src/components/receipts/*`, `src/hooks/receipts/use-receipts.ts`.

---

## Data model

```ts
type ReceiptStatus =
  | 'pending'    // queued, no data yet
  | 'scraped'    // fiscal portal scrape succeeded — has scrapedData
  | 'failed'     // scrape failed terminally
  | 'manual'     // user-entered, no QR
  | 'completed'  // edited / finalized by user
  | 'recurring'  // generated from a recurring expense

type Receipt = {
  id: string
  userId: string
  categoryId?: string
  groupId?: string                  // out of scope for this clone — never set
  paidById?: string                 // out of scope — never set
  qrCodeUrl?: string                // https://suf.purs.gov.rs/v/?vl=…
  storeName?: string
  totalAmount?: string | number
  currency?: string
  receiptDate?: string              // ISO datetime
  receiptNumber?: string
  scrapedData?: ScrapedData
  hasJournal?: boolean
  status: ReceiptStatus
  category?: { id; name; color?; icon? }
  merchant?: { id; companyName; storeName? }
  autoSuggestedCategoryId?: string
  autoSuggestedCategory?: { id; name; color?; icon? }
  suggestionConfidence?: number
  suggestionAccepted?: boolean
  createdAt: string
  updatedAt: string
}

type ScrapedData = {
  tin?: string                      // tax ID
  companyName?: string
  storeName?: string
  address?: string
  city?: string
  municipality?: string
  totalAmount?: number
  currency?: string
  receiptNumber?: string
  receiptDate?: string
  invoiceType?: string
  transactionType?: string
  paymentMethod?: string
  invoiceCounter?: string
  totalCounter?: string
  items?: { name: string; quantity: number; unitPrice: number; totalPrice: number; taxLabel?: string }[]
  taxes?: { label: string; name: string; rate: number; amount: number }[]
  journal?: string                   // full plaintext receipt
  error?: string
}
```

**Drop `groupId`, `paidById`, `splitAmong`, `participants` from the create/update payloads** — groups are out of scope. The fields exist on the type for backward compat with the API; just never set them.

---

## API endpoints

| Endpoint                            | Method | Body / Query                                                                                              | Returns                                  |
| ----------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `/receipts`                         | GET    | `?page&limit&categoryId&startDate&endDate&minAmount&maxAmount&sortBy&sortOrder`                            | `{ data: Receipt[]; total; page; limit }` |
| `/receipts/:id`                     | GET    | —                                                                                                         | `Receipt`                                |
| `/receipts`                         | POST   | `{ qrCodeUrl? } \| { pfrData: { pfr; counter; date; amount } } \| { storeName; totalAmount; currency; receiptDate; categoryId? }` | `Receipt`                                |
| `/receipts/:id`                     | PATCH  | Any subset of `{ storeName, totalAmount, currency, receiptDate, receiptNumber, categoryId }`              | `Receipt`                                |
| `/receipts/:id`                     | DELETE | —                                                                                                         | —                                        |
| `/receipts/bulk`                    | DELETE | `{ ids: string[] }`                                                                                       | —                                        |
| `/receipts/bulk/category`           | PATCH  | `{ ids: string[]; categoryId: string \| null }`                                                          | —                                        |
| `/receipts/suggest-category`        | GET    | `?storeName=`                                                                                             | `{ categoryId; categoryName; categoryIcon?; categoryColor?; confidence; reason }` |
| `/receipts/export`                  | GET    | —                                                                                                         | CSV blob                                 |
| `/receipts/import`                  | POST   | `FormData { file }`                                                                                       | `{ imported: number; errors?: [] }`      |

Note: `/receipts/export` and `/receipts/import` are **optional for v1** of the RN app — skip unless explicitly requested. They're useful but desktop-class flows.

---

## Screens

### 1. Receipts list (`/receipts`)

A scrollable list of receipt rows with filters, sort, and pagination.

**Header**:

- Title "Receipts"
- Right-side icons: search (toggles search bar), filter (opens filter sheet), sort (opens sort sheet)
- Below header (when active): horizontally scrolling chip row showing active filters with × to remove.

**Search**:

- Filters by `storeName` client-side _on the current page_ if the API doesn't support q-string. Confirm with backend; if backend supports `?q=`, use it.

**Sort options**:

- `receiptDate` desc (default)
- `receiptDate` asc
- `totalAmount` desc
- `totalAmount` asc
- `createdAt` desc

**Filter sheet** (bottom sheet):

- Category — single-select dropdown of `useCategories()`
- Start date / End date — date pickers (range)
- Min amount / Max amount — numeric inputs
- Currency — single-select (optional)
- Buttons: "Clear all", "Apply"

State lives in URL params on web; on RN, hold it in the screen's local state (or a Zustand slice if you want it to survive screen unmount).

**List row**:

- Left: small color circle with category icon emoji (`category.icon`, background `category.color` at 15% opacity); if no category, gray circle with `?`.
- Middle, top line: `storeName` (or `t('receipts.unknownStore')` fallback). Bold.
- Middle, bottom line: `receiptDate` formatted as e.g. "Apr 12, 14:32" + `•` + status badge.
- Right: `totalAmount` with currency (right-aligned, bold).
- Tap → Receipt detail screen.
- Swipe-left → reveal "Delete" action with confirmation.
- Long-press → enters selection mode (see below).

**Status badge** colors:

| Status     | Color           | Label                          |
| ---------- | --------------- | ------------------------------ |
| pending    | amber / muted   | `t('receipts.status.pending')`   |
| scraped    | green / success | `t('receipts.status.scraped')`   |
| failed     | red / destructive | `t('receipts.status.failed')`  |
| manual     | neutral / outline | `t('receipts.status.manual')`  |
| completed  | green           | `t('receipts.status.completed')` |
| recurring  | purple / accent | `t('receipts.status.recurring')` |

**Selection mode** (multi-select):

- Entered via long-press on a row.
- Header changes to: `← N selected` with bulk actions on the right (delete, change category).
- Tap rows to add / remove from selection.
- Bulk delete → `DELETE /receipts/bulk { ids }`.
- Bulk change category → opens category picker sheet → `PATCH /receipts/bulk/category { ids, categoryId }`.

**Pagination**:

- Infinite scroll. Load next page when the user is within 4 rows of the end.
- Page size 10 (web default).

**Empty state**:

- Receipt icon centered, headline `t('receipts.empty.title')` ("No receipts yet"), subcopy ("Scan a QR code to get started"), primary button "Scan now" opening the QR scanner.

**Loading / error**:

- Loading: skeleton rows (5 rows shimmer).
- Error: error icon + retry button.

### 2. Receipt detail / edit

The web app uses a modal (`ReceiptModal` in `src/components/receipts/receipt-modal.tsx`). On mobile, this is a **full screen** when opened from the list, and a **bottom sheet** when opened post-scan in the create flow.

Sections:

#### Header

- Status badge (top-left)
- Created/updated timestamp (small, muted)
- Edit icon (top-right) → toggles into edit mode (all fields become editable)
- Delete icon (top-right) → confirmation → `DELETE /receipts/:id` → pop screen

#### Summary (read mode)

Large amount in display currency at the top:

> **3,420.00 RSD**
> Mercator d.o.o. · Apr 12, 14:32

#### Form fields (edit mode)

- **Store name** (text)
- **Total amount** (number, step 0.01)
- **Currency** (dropdown from `useCurrencies()`)
- **Date** (date picker — **preserve the time component on edit**; only update the date portion. See `src/components/receipts/receipt-modal.tsx:95-99`.)
- **Receipt number** (text, optional)
- **Category** (picker, see below)

#### Category picker

A row showing the current category (icon + name) or "Uncategorized". Tapping opens a sheet with the user's categories.

If the receipt has `autoSuggestedCategoryId` and the user hasn't already set one, render a **suggestion card** above the picker:

- Icon + suggested category name
- Confidence as percentage (e.g. "85% confidence")
- Optional `reason` text
- "Apply" button → sets `categoryId` to the suggestion, marks it accepted (sends `suggestionAccepted: true` on next PATCH).

In create mode (after a new manual receipt's `storeName` blur), call `GET /receipts/suggest-category?storeName=…` (`useSuggestCategory`) and show the same card.

#### Items / line-items (read-only)

If `scrapedData.items` is present, render a table:

| Item             | Qty | Unit price | Total | Tax |
| ---------------- | --- | ---------- | ----- | --- |
| Mleko 1L         | 2   | 129.99     | 259.98 | Ђ |
| Hleb crni        | 1   | 89.50      | 89.50  | Ђ |
| ...              |     |            |        |   |

Below the table: tax summary table with `taxes[]` (label, rate, amount).

#### Receipt details (collapsed accordion)

When `scrapedData` is present, show a collapsed section with:

- Company name, TIN
- Address, city, municipality
- Payment method
- Invoice type, transaction type
- Invoice counter, total counter

#### View full journal

Button "View full receipt" — opens a full-screen modal showing the raw `scrapedData.journal` as monospaced text. Provides Share (system share sheet) and Print (export to system print dialog if available, else "not supported on this platform"). See `src/components/receipts/receipt-viewer-modal.tsx`.

#### QR code

If `qrCodeUrl` is present, show a "View on fiscal portal" link that opens the URL in the system browser.

### 3. New receipt: manual entry

Opened via the FAB long-press → "Manual entry" or from the list header "+" → "Manual receipt".

A full-screen form with:

- Store name (required)
- Total amount (required, number)
- Currency (defaults to settings.currency)
- Date (defaults to now)
- Category (optional, with suggestion card after store-name blur)

Submit → `POST /receipts { storeName, totalAmount, currency, receiptDate, categoryId }`. Receipt is created with `status: 'manual'`. Navigate to its detail.

### 4. New receipt: PFR entry

For users with a Serbian fiscal receipt that has no QR code visible. See `src/components/receipts/pfr-entry-modal.tsx`.

Form fields:

- **PFR ID** — 3 segments: `[A-Z0-9]{8}` - `[A-Z0-9]{8}` - `[A-Z0-9]{6}`. Auto-uppercase input. Auto-focus next segment on completion.
- **Counter** — 2 segments: `\d{6}` - `\d{6}`. Auto-focus next segment.
- **Date/time** — datetime string (the fiscal portal accepts a specific format).
- **Amount** — decimal.

Submit → `POST /receipts { pfrData: { pfr, counter, date, amount } }`. The backend constructs the fiscal portal URL and scrapes it (same retry semantics as scanning — see `06-scanning.md`).

### 5. New receipt: scan QR

See `06-scanning.md`. Submits `POST /receipts { qrCodeUrl }`.

---

## Hooks (port to RN)

`src/hooks/receipts/use-receipts.ts` defines:

- `useReceipts(filters)` — list, filterable & paginated.
- `useReceipt(id)` — single receipt.
- `useCreateReceipt()` — POST. On success: invalidate `receipts`, `dashboard`, `recurring-expenses` queries.
- `useUpdateReceipt()` — PATCH. Same invalidations + `setQueryData` for the single receipt key.
- `useDeleteReceipt()` — DELETE. Removes from cache.
- `useBulkDeleteReceipts()`, `useBulkUpdateCategory()` — bulk variants.
- `useSuggestCategory(storeName, enabled)` — debounced suggestion query.

The query-key conventions live in `src/lib/query-keys.ts`. Port that file verbatim.

---

## Visual spec

See `../design-output/receipts/` for the full visual spec (row layouts, status badge styling, edit-mode transitions, suggestion card visuals, selection-mode chrome). This doc owns the data model, API endpoints, hook ports, and behavior rules (like preserving the time portion when editing only the date).

---

## Acceptance checklist

- [ ] List loads, paginates, refreshes via pull-to-refresh.
- [ ] Filters apply and combine; chip row reflects active filters.
- [ ] Sort options change the order.
- [ ] Swipe-to-delete prompts and removes from cache optimistically.
- [ ] Long-press enters selection mode; bulk delete and bulk-category work.
- [ ] Detail screen renders all available fields, including scrapedData if present.
- [ ] Edit mode preserves the time portion when only the date is changed.
- [ ] Category suggestion appears on store-name blur in create mode; "Apply" sets it and the next PATCH sends `suggestionAccepted: true`.
- [ ] View-full-journal modal renders monospace text and Share works.
- [ ] Manual entry, PFR entry, QR scan all create receipts with the correct status.
- [ ] Status badge colors match the table above.
- [ ] Empty state on a fresh account links to the scanner.
