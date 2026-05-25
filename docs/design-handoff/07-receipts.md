# 07 — Receipts

The core domain. Users land here to browse, search, filter, edit, and delete their receipts.

---

## Screens

| Screen               | Purpose                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| ReceiptsList         | Scrollable, filterable, sortable list of all receipts                    |
| ReceiptDetail        | Read mode + edit mode of a single receipt                                |
| ManualEntry          | Full-screen form to create a receipt by hand                             |
| PfrEntry             | Manual fiscal-receipt entry (3-segment PFR + counter + date + amount)    |
| ReceiptViewer        | Full-screen modal showing the raw receipt journal (plain text)           |

Plus sheets: FilterSheet, SortSheet, CategoryPickerSheet (used in selection mode).

---

## Receipt data — fields shown

Every receipt may include (with many fields optional):

- `storeName` — fallback to "Unknown Store"
- `totalAmount` + `currency`
- `receiptDate` — when the purchase happened
- `receiptNumber` — fiscal receipt number
- `status` — one of `pending` / `scraped` / `failed` / `manual` / `completed` / `recurring`
- `category` — `{ name, color, icon }`
- `merchant` — `{ companyName, storeName }` (from scraped data)
- `autoSuggestedCategory` + `suggestionConfidence` — the AI-suggested category for unset receipts
- `scrapedData` — optional rich data block (line items, taxes, address, journal)
- `qrCodeUrl` — link to the fiscal portal entry

Design with awareness that **scraped** receipts have rich data, while **manual** receipts have only basics.

---

## ReceiptsList

A scrollable list with filtering, sorting, search, and bulk selection.

### Header

- Title: "Receipts" (heading-1 or large-title)
- Header right icons (in order): Search, Filter, Sort, More (overflow)
- Below the header, when filters are active: a horizontally-scrolling chip row showing active filters with × to remove each

### Row layout

Each row is 72pt tall, padded 16pt horizontal:

- Left: 40pt color circle — category color at 15% alpha, category icon centered. If no category, gray circle with `?`.
- Center, top line: store name (body-strong)
- Center, sub-line: relative date + status pill, separated by `·`
- Right: amount + currency (body-strong, tabular nums)

Separator: 1pt `border` between rows, indented 72pt from left (clears the icon).

### Status badge (in every row)

Small pill, 22pt tall, caption-strong font.

| Status     | Background        | Text            | Label                     |
| ---------- | ----------------- | --------------- | ------------------------- |
| pending    | `muted`           | `muted-foreground` | "Pending"                 |
| scraped    | success @ 12%     | success          | "Scraped"                 |
| failed     | destructive @ 12% | destructive      | "Failed"                  |
| manual     | `secondary`       | `foreground`     | "Manual"                  |
| completed  | success @ 12%     | success          | "Completed"               |
| recurring  | accent @ 12%      | `primary`        | "Recurring"               |

### Search bar

Activated by the search icon. Slides down from below the header. Auto-focus its text field. Standard rounded search input.

### Filter sheet

Bottom sheet with:

- **Category** — single-select picker (uses CategoryPickerSheet)
- **Date range** — start date + end date (two date pickers, side-by-side or stacked)
- **Amount range** — min and max numeric inputs
- **Currency** — optional, single-select

Footer: "Clear all" (outline, left) + "Apply" (primary, right).

### Sort sheet

Bottom sheet with radio-list:

- Date (newest first) — default
- Date (oldest first)
- Amount (highest first)
- Amount (lowest first)
- Created (newest first)

### Empty states

- **No receipts at all**: Receipt icon (48pt, muted), heading-2 "No receipts yet", subcopy "Scan a QR code to get started.", primary CTA "Scan now" → Scanner.
- **Filters return zero**: SearchX icon, heading-2 "No matching receipts", "Clear filters" outline button.

### Selection mode

Triggered by long-press on a row.

- Header morphs: left shows close X + "{N} selected"; right shows bulk action icons (Delete, Tag/Categorize).
- Each row gets a checkbox on the left (replacing the color circle's tap zone — but the circle still shows).
- Tapping a row toggles its checkbox.
- Selected rows have a subtle `primary` tint background.
- Long-press to enter → tap "Cancel" or X to exit.

### Loading

Skeleton: 6 placeholder rows with shimmer.

### Infinite scroll

When the user scrolls within 4 rows of the bottom, a small loading row appears: 32pt tall, spinner centered.

---

## ReceiptDetail (read + edit modes)

Pushed onto the ReceiptsStack when a row is tapped, OR opened as a bottom sheet immediately after a scan (so the user can review the just-created receipt without leaving Scanner).

### Read mode

**Header**:

- Status badge (top-left of content area)
- Created/updated timestamps (caption, muted) below the badge
- Right side: edit pencil icon + overflow "..." menu (with Delete, View on fiscal portal)

**Hero**:

- Large amount (display) in the receipt's original currency, with currency code
- Store name below (body-strong)
- Receipt date below (caption, muted): "Apr 12, 14:32"

**Category row**:

- Icon circle + category name + chevron (tap → opens CategoryPickerSheet directly in edit mode)
- If no category: "Add category" with `Plus` icon
- If `autoSuggestedCategory` exists and no `categoryId` set, show a **suggestion card** above the row

**Suggestion card**:

- Compact card with the suggested category icon + name
- Confidence label: "85% confidence"
- Optional reason text (e.g. "Detected from store name")
- Right side: "Apply" pill button + dismiss X

**Line items section** (only if `scrapedData.items` exists):

- Section header "Items"
- Each item: name + qty × unit price = total; tax label as a small chip
- On narrow phones: stacked rows; on wider: a 3-column mini-table
- Below: a small tax summary table (per `scrapedData.taxes`)

**Receipt details** (collapsible accordion, default collapsed):

- Tax ID (TIN)
- Company name
- Address, city, municipality
- Payment method
- Invoice type, transaction type
- Invoice counter, total counter
- Receipt number

**Footer actions**:

- "View full receipt" outline button → opens ReceiptViewer modal with the raw journal text
- "View on fiscal portal" (if `qrCodeUrl` present) → opens the URL in system browser

### Edit mode

Toggled by the pencil icon in the header. All visible fields become editable; new sticky save bar appears at the bottom.

**Editable fields**:

- Store name
- Total amount + currency (currency in a small dropdown next to the amount)
- Date — date picker. **Preserves the time portion** when only the date changes; annotate this in the design.
- Receipt number
- Category — opens picker sheet

**Bottom sticky bar** (visible only in edit mode):

- Cancel (outline, left)
- Save (primary, right)
- Show inline below the bar if any changes are unsaved

Tap save → shows loading state on the button → success toast → returns to read mode.

### Read-only blocks in edit mode

Line items and Receipt details remain read-only even in edit mode — they come from the fiscal portal and can't be changed by the user.

---

## ManualEntry

Full-screen form, presented as a modal. Reached from the FAB long-press → "Enter manually" or from ReceiptsList header "+".

Fields:

- Store name (required, body-strong label)
- Total amount (required, decimal-pad keyboard, step 0.01)
- Currency (defaults to user's settings.currency)
- Date (defaults to now)
- Category (optional; after store-name blur, shows suggestion card if API returns one)
- Notes (optional, multi-line textarea)

Bottom sticky button: "Save".

After save: navigates to ReceiptDetail of the newly-created receipt.

---

## PfrEntry

Full-screen form, presented as a modal. For Serbian receipts whose QR is damaged or missing.

Fields:

- **PFR ID** — three segments: `XXXXXXXX-XXXXXXXX-XXXXXX` (8+8+6 chars, uppercase letters/digits)
- **Counter** — two segments: `XXXXXX-XXXXXX` (6+6 digits)
- **Date / time** — datetime input
- **Amount** — decimal-pad

Each segment is its own input with a visible separator (a `-` or pipe) between. Auto-uppercase the PFR segments. Auto-advance focus when a segment reaches its length.

Bottom sticky button: "Verify" (because the backend tries to scrape the portal — same retry semantics as scanning).

While verifying: button shows spinner; rest of the screen is disabled (similar to scanning's `submitting` / `retrying_portal` states).

---

## ReceiptViewer modal

Full-screen modal that shows the raw journal text of a fiscal receipt.

Layout:

- Header: title "Receipt", close X (top-right), Share icon
- Content: monospaced text in a scrollable view, indented 16pt, line height 20pt
- Pinch-to-zoom enabled (the only place in the app where zoom is supported)
- Bottom safe area respected

Share button → system share sheet with the journal text as the payload.

---

## CategoryPickerSheet

A reusable bottom sheet for picking a category. Used from:

- ReceiptDetail edit mode
- ReceiptsList selection mode bulk action
- Recurring expense form
- Receipt manual entry

Contents:

- Drag handle + title "Category"
- "Uncategorized" row at the top (clear selection)
- List of categories — each as a row with icon circle + name + selected checkmark
- Search bar at the top (only if there are > 10 categories)
- Bottom: "+ Add new category" outline button (full width) → navigates to CategoryForm

---

## Acceptance checklist

- [ ] ReceiptsList in light + dark, with empty, loading, and populated states.
- [ ] All 6 status badge variants designed.
- [ ] Selection mode designed with at least 2 selected rows.
- [ ] FilterSheet and SortSheet designed.
- [ ] Search bar state shown.
- [ ] ReceiptDetail in read mode designed for a scraped receipt (with line items + taxes + details accordion expanded and collapsed) AND for a manual receipt (sparse).
- [ ] ReceiptDetail in edit mode designed with the sticky save bar.
- [ ] CategorySuggestionCard designed (compact card + dismissed state).
- [ ] ManualEntry full-screen form designed.
- [ ] PfrEntry designed with the auto-advance segments highlighted (e.g. focus state on the second segment after typing 8 chars in the first).
- [ ] PfrEntry verifying state designed (spinner + disabled form).
- [ ] ReceiptViewer modal designed with monospaced text and Share affordance.
- [ ] CategoryPickerSheet designed.
- [ ] Tabular numerals confirmed on every amount.
