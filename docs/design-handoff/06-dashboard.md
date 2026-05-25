# 06 — Dashboard

The home screen after sign-in. Aggregates spending across categories, time, and currencies; primary launch point for receipt scanning.

The web app's dashboard uses a 12-column drag-resize grid. **The mobile clone is a single-column vertical scroll, fixed order, with widgets the user can toggle on/off (no drag-reorder, no resize).**

---

## Sticky header

Always visible at the top of the dashboard while scrolling. Contains:

| Element                | Purpose                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Greeting               | "Good morning, {firstName}" — time of day adapts (morning / afternoon / evening)        |
| Month switcher         | `‹ Apr 2026 ›` — chevrons step ±1 month; tap the label opens a year/month picker sheet  |
| Currency switcher      | Small chip showing display currency (e.g. `RSD`). Tap → bottom sheet to pick a currency |
| Privacy eye toggle     | Toggles whether amounts render as `••••` (privacy mode)                                  |
| Edit mode toggle       | Pencil icon — enters edit mode for widget visibility                                     |

**Visual:**

- Header background: `background`
- 1pt bottom border: `border`
- Greeting on the left, controls right-aligned (or wrap to a second row if too tight)
- Height: ~72pt (greeting on top, controls below) OR ~56pt with everything in one row on tablets

When the user is on the current month, the month switcher's right chevron is disabled. A "Today" pill appears next to the label when viewing any non-current month to quickly jump back.

---

## Widgets (in order)

| #   | Widget                | Visible by default | What it shows                                                              |
| --- | --------------------- | ------------------ | -------------------------------------------------------------------------- |
| 1   | Stats cards           | ✅                 | 3 KPIs: this month spent, total spent, total receipts                       |
| 2   | Category pie chart    | ✅                 | Donut + legend, top 5 categories this month                                 |
| 3   | Daily bar chart       | ✅                 | One bar per day of selected month                                           |
| 4   | Budget tracker        | ✅                 | Per-category spent vs `monthlyBudget`                                       |
| 5   | Monthly trend         | ✅                 | 12-month line chart                                                         |
| 6   | Monthly forecast      | ✅ (current month only) | Projected end-of-month total + delta vs last month                     |
| 7   | Upcoming recurring    | ✅                 | Overdue / due soon / upcoming (next 30 days)                                |
| 8   | Rank card             | ✅                 | Status tier (A / B / C / None) with progress                                |
| 9   | Recent activity       | ✅                 | Last 5 receipts                                                             |

Spec each individually below. Each widget is its own visual component with at least three states: **populated**, **empty (no data this month)**, **loading (skeleton)**.

### 1. Stats cards

Three cards side-by-side on tablets, stacked or horizontally scrolling on phones. Each card:

- Label (caption, `muted-foreground`): "This month" / "Total spent" / "Total receipts"
- Value (display, `foreground`): the number
- Optional sub-caption (caption, `muted-foreground`): trend, comparison

Tap the "Total receipts" card → ReceiptsList.

### 2. Category pie chart

A donut with inner radius ~60% of outer radius. Legend below or to the side:

- Each legend item: small color square + category name + amount + %
- Show top 5 categories; if more exist, group as "Other"

Empty state: outline donut + "No spending this month" caption.

### 3. Daily bar chart

Vertical bars, one per day of the month (28–31 bars). Y axis is implicit (no labels needed — relative heights tell the story). Below the chart: a subtle X-axis label showing 1, 7, 14, 21, 28 days.

Tap a bar → navigates to ReceiptsList filtered to that day.

Empty state: flat grid with "No spending this month".

### 4. Budget tracker

A scrollable list of categories with `monthlyBudget` set. Each row:

- Icon circle (category icon + color at 15% alpha)
- Name + amount-spent on top line: "Groceries · 12,400 / 30,000 RSD"
- Progress bar below
- Tap row → ReceiptsList filtered by category + month

Progress bar thresholds:

- < 80%: `primary` fill
- 80–99%: `warning` fill
- ≥ 100%: `destructive` fill (slight overflow allowed — bar shows full + red text)

Empty state: "No category budgets set yet. Set a budget in Categories." with link to Categories.

### 5. Monthly trend

A line chart, X = months Jan–Dec of selected year, Y = total spend. Single line in `primary` color, 2pt stroke. Subtle dots at each month. No grid lines beyond a faint baseline.

Empty state: flat horizontal line + "No data for this year".

### 6. Monthly forecast

Only rendered when viewing the **current** month. Layout:

- Top row: large number (display) of projected end-of-month total in the display currency
- Comparison: "+12% vs last month" with up/down arrow icon, colored success / destructive
- Stat strip below: spent so far · daily average · days into month
- Visual: a subtle progress bar showing days-into-month / days-in-month

Skip rendering for past or future months.

### 7. Upcoming recurring

A card with three collapsible sections:

- **Overdue** (red icon) — items with due date < today
- **Due soon** (amber icon) — within next 7 days
- **Upcoming** (neutral) — within 30 days

Each section header: icon + label + count. Tap header collapses / expands. Default: all three expanded.

Each item row inside a section:

- Icon (recurring expense's own icon + color, or category icon as fallback)
- Name + due date on top line
- Amount on the right (with `~` prefix if `isFixed=false`)
- Trailing **Pay** button (primary, small)

Show up to 3 items per section; if more, a "+N more" chip → navigates to RecurringList.

Header of the widget shows the total upcoming amount (sum of all three sections in display currency).

Empty state (no upcoming): smiley face icon + "All caught up!".

### 8. Rank card

Shows the user's rank tier:

- **Status A** — Crown icon, primary/celebratory accent
- **Status B** — Sparkles icon
- **Status C** — Compass icon
- **No status** — outline icon (neutral)

Layout:

- Icon on the left (large, 48pt)
- Tier label + receipt count on top
- Description copy below ("You've scanned 23 receipts. 7 more to reach Status A.")
- Progress bar to next tier

### 9. Recent activity

A list of the last 5 receipts. Each row:

- Store name (or "Unknown Store") on top, bold
- Relative date below (caption, `muted-foreground`): "2 days ago"
- Amount right-aligned

"View all" button at the bottom → ReceiptsList.

---

## Floating action button (FAB)

The center of the bottom tab bar — but its action originates from the Dashboard context:

- Tap: opens Scanner modal
- Long-press: action sheet with three options:
  - "Scan QR code" (camera)
  - "Choose from gallery"
  - "Enter manually (PFR)"

The FAB is part of the tab bar chrome — design it once in `03-navigation.md` and reference it here.

---

## Edit mode

Triggered by the pencil icon in the header.

Behaviors:

- Each widget shows a small "eye" toggle in its top-right corner.
- Tapping the eye toggles `widgetVisibility[id]`.
- Hidden widgets stay rendered at 40% opacity in edit mode (so users can re-enable them); on exit, they disappear.
- A toolbar above the widgets shows "Reset to default" (outline button) and "Done" (primary button).
- "Done" exits edit mode.

Visual:

- Edit mode wrapper: subtle dashed border around each widget
- Eye toggle button: 32pt circle, top-right of each widget, slight elevation

---

## Currency handling

- Display currency is set in the header switcher.
- All amounts in widgets are converted from each receipt's stored currency to the display currency at render time.
- If an exchange rate is unavailable for a currency, show the amount in its original currency with a small caption "≈ EUR rate unavailable".

---

## Privacy mode

When the eye toggle is set to "hidden":

- All monetary amounts replaced with `•••` (three middle dots).
- Currency suffix is preserved: `••• RSD`.
- Charts still render shapes but the amounts in tooltips / legends are dotted.

Show this state in your mockups — useful for users glancing at the app in public.

---

## States

For each widget, design these states:

| State              | What it looks like                                                            |
| ------------------ | ----------------------------------------------------------------------------- |
| Populated          | Real-looking data                                                             |
| Empty (no data)    | Outlined / muted version with a "No data" caption                             |
| Loading            | Skeleton shimmer matching the widget's layout                                 |
| Edit mode (off)    | Widget at 40% opacity with eye toggle visible                                 |
| Edit mode (on)     | Widget at full opacity with eye toggle visible                                |

Plus the overall dashboard:

- First-time user (empty everywhere) → emphasizes the FAB and shows a welcoming subtitle
- Offline → top banner: "You're offline — showing cached data"
- Refreshing (pull-to-refresh in progress) → native pull spinner

---

## Acceptance checklist

- [ ] Sticky header designed in light + dark with the month switcher in two states (current month / past month).
- [ ] All 9 widgets designed with populated + empty + loading states in light + dark.
- [ ] Edit mode mocked with at least 2 widgets visible and 2 widgets hidden (showing the 40% opacity treatment).
- [ ] Privacy mode mocked across the Stats cards and the Category pie's legend.
- [ ] Month switcher's year/month picker sheet designed.
- [ ] Currency switcher's bottom sheet designed.
- [ ] FAB action sheet (long-press) designed.
- [ ] First-time empty dashboard designed.
- [ ] Pull-to-refresh state shown.
- [ ] Tabular numerals confirmed on every amount.
