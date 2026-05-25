# 09 — Recurring expenses

Track subscriptions, rent, utilities. Users see what's due, mark items paid, pause/resume expenses, view payment history.

---

## Screens

| Screen          | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| RecurringList   | List of all recurring expenses with stats and category breakdown           |
| RecurringForm   | Create or edit a recurring expense (full-screen modal or bottom sheet)     |
| MarkPaid sheet  | Log a payment for a due expense                                            |
| PaymentHistory  | List of past payments for a single expense                                 |

The Dashboard's "Upcoming recurring" widget routes here.

---

## Data fields users interact with

When designing forms / cards, these are the fields:

- `name` (string, required)
- `amount` + `currency` (required)
- `isFixed` (boolean) — if true, every payment is the same amount; if false, the user can adjust the amount each time they mark it paid
- `frequency` — weekly / monthly / quarterly / yearly
- `dayOfMonth` (1–31, only for monthly+)
- `startDate`, optional `endDate`
- `icon` (emoji), `color` (hex from the standard palette)
- `notes` (multiline)
- `categoryId` (optional)
- `isPaused` (boolean — toggled in the list, not in the form)
- `nextDueDate` (computed by backend, displayed read-only)

---

## RecurringList

### Header

- Title: "Recurring" (heading-1)
- Right: "+ Add" primary button (or just a `+` icon button in a tighter header)

### Stats strip (under the header)

Four cards, horizontally scrolling on phones, fitting in a row on tablets:

- **Monthly commitment** — display: monthlyEquivalent in display currency
- **Annual projection** — display: × 12 of the above
- **Paid this month** — count of payments logged
- **Pending this month** — count of items still due

Cards are 96pt tall, padded, with a small caption label at the top and a heading-3 value below.

### Category breakdown (collapsible card)

A card containing:

- Section header with chevron (collapsed/expanded)
- A small donut chart grouping recurring expenses by category
- Legend below: category icon + name + monthlyEquivalent + count chip

Default state: collapsed on phones, expanded on tablets.

### List of expenses

Each item is taller than a typical list row (~96pt) — it's a card:

- Left: 48pt icon circle (expense's `icon` + `color` at 15% alpha)
- Top line: name (body-strong) + small badge with `frequency` ("monthly" / "weekly" / etc.)
- Sub-line: category name + due date ("Due Apr 15") + status pill
- Right side: amount + currency (body-strong, tabular). If `!isFixed`, prefix with `~` (e.g. `~250.00 RSD`)
- Trailing primary action: **Pay** button (only if `!isPaused && nextDueDate`)
- Overflow `...` menu on the right with: Edit, Pause/Resume, Delete

Status pills:

- **Active** — success @ 12% bg, success text
- **Paused** — `muted` bg, `muted-foreground` text
- **Ended** — `secondary` bg, foreground text (when `endDate` has passed)

### Paused state

When `isPaused = true`:

- Whole card at 60% opacity
- "Pay" button hidden
- Status pill: "Paused"
- The Pause icon in the overflow menu becomes a Play icon ("Resume")

### Swipe-left action

Reveals Delete on each row.

### Empty state

- Repeat icon (48pt, muted)
- "No recurring expenses yet"
- "Track subscriptions, rent, utilities. They'll show up on your dashboard."
- "+ Add your first" primary CTA

---

## RecurringForm

Used for both Create and Edit. Full-screen modal (or large bottom sheet — your call, but full-screen is easier for this many fields).

### Layout (top-to-bottom)

- Modal header: title "New recurring expense" or "Edit recurring expense"; Cancel left, Save right (disabled until valid)
- Scrollable form

Fields:

- **Name** (text, required) — large input at the top
- **Amount** + **Currency**: side-by-side. Amount uses decimal-pad. Currency is a small dropdown.
- **Is fixed amount** (switch with caption: "Same amount every time"). Default ON. Tooltip / helper text: "If off, you can adjust the amount each time you mark this paid."
- **Frequency** — segmented control (4 options: Weekly / Monthly / Quarterly / Yearly)
- **Day of month** (1–31, only shown for monthly / quarterly / yearly) — number picker or wheel
- **Start date** (date picker, required) — defaults to today
- **End date** (date picker, optional) — caption "Optional"
- **Category** (picker row with chevron → opens CategoryPickerSheet)
- **Icon** (emoji picker row — shows current emoji + chevron → opens emoji picker)
- **Color** (color picker row — 10-swatch palette inline, selected one has a checkmark)
- **Notes** (textarea, optional, ~120pt tall)

### Sticky save bar

If using a bottom sheet, pin the save action at the bottom. If using a full-screen modal with native header, the Save lives in the header.

### Delete (edit mode only)

A destructive "Delete" outline button at the bottom of the form, separated by space. Confirms via Alert.

---

## MarkPaid sheet

Bottom sheet opened from a "Pay" button (on RecurringList or the Dashboard's upcoming widget).

### Fields

- **Due date** (read-only, displayed at top): "Due Apr 15"
- **Amount**:
  - If `isFixed = true`: read-only display of the expected amount
  - If `isFixed = false`: editable number input pre-filled with `expense.amount`
- **Paid date** (date picker, defaults to today)
- **Notes** (optional, multiline, short — ~80pt)

### Buttons

- Cancel (outline, left)
- "Mark paid" (primary, right)

### Success

On tap: button shows spinner → success toast → sheet closes → underlying list refreshes with the new `nextDueDate`.

---

## PaymentHistory

Reached by tapping a row's expense detail OR via "View history" in the row's overflow menu.

Layout:

- Header: title "Payment history — {expense.name}", back button
- Stats at the top: total paid (sum of amounts) · count of payments · last paid date
- List of payments, each row:
  - Top line: paid date (body-strong)
  - Sub-line: due date · notes (truncated)
  - Right: amount (body-strong)
- Empty state: "No payments logged yet"
- "Load more" button at the bottom if there are more than the initial 10

---

## Acceptance checklist

- [ ] RecurringList designed in light + dark, with empty and populated states.
- [ ] Active, Paused, and Ended status pills shown.
- [ ] At least one paused row mocked (60% opacity).
- [ ] Variable-amount row mocked (showing the `~` prefix).
- [ ] Swipe-left delete reveal mocked.
- [ ] Stats strip designed for both phone (scroll) and tablet (row).
- [ ] Category breakdown card in both collapsed and expanded states.
- [ ] RecurringForm designed with all fields, including the `dayOfMonth` showing for monthly+ frequency.
- [ ] RecurringForm designed in edit mode showing the destructive Delete button.
- [ ] MarkPaid sheet designed with both `isFixed=true` (locked amount) and `isFixed=false` (editable amount) variants.
- [ ] PaymentHistory screen designed with populated and empty states.
- [ ] Tabular numerals confirmed.
