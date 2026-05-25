# 02 — Dashboard

The Dashboard is the **home screen** after sign-in. It aggregates spending across categories, time, currencies, and recurring expenses, and is the primary entry point to the QR scan flow.

Web reference: `src/pages/dashboard/index.tsx` (700 lines), `src/components/dashboard/*`, `src/hooks/dashboard/use-dashboard.ts`, `src/store/dashboard.ts`.

The web app's dashboard is **draggable / resizable / reorderable** because it's a desktop-class 12-column grid. **On mobile we collapse this into a single-column vertical scroll with a fixed widget order** (see _"Mobile simplifications"_ at the bottom). Users can still **toggle widgets on/off** in an edit mode.

---

## Header (sticky)

A sticky top bar showing:

- **Greeting** — `t('dashboard.greeting.morning' | 'afternoon' | 'evening', { name: user.firstName })`. Time of day computed locally.
- **Month selector** — `‹ Apr 2026 ›` with `‹` / `›` buttons. Tapping the month label opens a year/month picker.
- **Currency selector** — small chip showing the current display currency (e.g. `RSD`). Tapping opens a sheet to switch. Default = `settings.currency`.
- **Eye toggle** (privacy) — toggles `amountsVisible` in the settings store. When false, all monetary amounts render as `••••`.
- **Edit mode toggle** — pencil icon. When enabled, each widget gets an eye / size-toggle in its corner.

Currency conversion: amounts are stored in their original receipt currency, then converted to the display currency at render time using exchange rates from `useCurrencies()`. If a rate is missing, fall back to displaying the original.

---

## Widgets

The web widget registry (`src/components/dashboard/widget-registry.ts`) defines these. On mobile we render them in a single scrolling column, in this default order:

| # | Widget                | Default visible | Notes                                                                              |
| - | --------------------- | --------------- | ---------------------------------------------------------------------------------- |
| 1 | Stats cards           | ✅              | 3 KPIs: this month spent, total spent, total receipts                              |
| 2 | Category pie chart    | ✅              | Donut + legend, top 5 categories this month                                        |
| 3 | Daily bar chart       | ✅              | Bars for each day of selected month; tap a bar → Receipts filtered by that date    |
| 4 | Budget tracker        | ✅              | Per-category progress vs `monthlyBudget`                                           |
| 5 | Monthly trend         | ✅              | 12-month line chart                                                                |
| 6 | Monthly forecast      | ✅              | Projected end-of-month total + delta vs last month                                 |
| 7 | Upcoming recurring    | ✅              | Overdue / due-soon / upcoming sections (next 30 days)                              |
| 8 | Rank card             | ✅              | Receipt count → status tier (A / B / C / None)                                     |
| 9 | Recent activity       | ✅              | Last 5 receipts                                                                    |

Note: the web app also has `coach-card`, `category-insights`, `savings-opportunities`, `frequent-items`. **Skip these** — they belong to features that are out of scope (savings, items / price-compare, the AI coach).

### 1. Stats cards

Three cards in a horizontal scroll (or a 3-column row on tablets):

- **This month** — total spend for selected month (in display currency)
- **Total spent** — lifetime total (in display currency)
- **Total receipts** — count, tapping navigates to `Receipts` list

Source: `useAggregatedStats()` → `GET /dashboard/aggregated/stats`. Response shape:

```ts
{
  totalReceipts: number
  totalCategories: number
  byCurrency: { currency: string; totalAmount: number; receiptCount: number }[]
  recentReceipts: Receipt[]
}
```

Aggregate `byCurrency` to the display currency client-side via exchange rates.

### 2. Category pie chart

Donut chart (e.g. `react-native-svg-charts` or `victory-native`):

- Inner radius ~60% so it reads as a donut.
- Legend below or to the side, top 5 categories with the percentage.
- Empty state: outline donut + "No spending this month" caption.

Source: `useAggregatedCategoryStats(year, month)` → `GET /dashboard/aggregated/category-stats?year=Y&month=M`.

Response includes `{ categoryId, name, icon, color, byCurrency: CurrencyBreakdown[] }[]`.

### 3. Daily bar chart

Vertical bars, one per day of the selected month. Tapping a bar navigates to `Receipts` filtered by that day (`?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`).

Source: `useAggregatedDailyStats(year, month)` → `GET /dashboard/aggregated/daily-stats?year=Y&month=M`.

### 4. Budget tracker

Scrollable list of categories that have `monthlyBudget` set. For each:

- Row: category icon + name on left; `120 / 300 RSD` on right.
- Progress bar below; thresholds:
  - **< 80%** → primary color
  - **80–99%** → amber
  - **≥ 100%** → destructive
- Tap row → Receipts filtered by `categoryId` and selected month.

Source: derived from `useAggregatedCategoryStats(year, month)` joined with `useCategories()` (only show categories where `monthlyBudget > 0`). Category budget currency may differ from display currency — convert.

### 5. Monthly trend

12-month line chart (Jan–Dec of selected year). Source: `useAggregatedMonthlyStats(year)` → `GET /dashboard/aggregated/monthly-stats?year=Y`.

### 6. Monthly forecast

Calculation (only shown for the **current** month):

```
daysIntoMonth = today.getDate()
daysInMonth   = lastDayOfMonth(today).getDate()
projected     = (spentSoFar / daysIntoMonth) * daysInMonth
deltaVsLast   = (projected - lastMonthTotal) / lastMonthTotal
```

Display: spent so far, daily average, days into month, projected total, and a "+12% vs last month" delta with up/down arrow.

### 7. Upcoming recurring

Three collapsible sections:

- **Overdue** (red icon)
- **Due soon** (amber icon, within next 7 days)
- **Upcoming** (neutral, within next 30 days)

Each item: icon + name + due date + amount, plus a "Pay" button on the right that opens the `MarkPaidModal` (see `04-recurring.md`).

Show up to 3 per section; if more, append "+N more" chip that opens the Recurring screen.

Source: `useUpcomingExpenses(30)` → `GET /recurring-expenses/upcoming?days=30` returns `{ overdue, dueSoon, upcoming }`.

Header total: sum of all three groups in display currency.

### 8. Rank card

Backend computes a user's "rank" from receipt count:

- **Status A** (Crown icon) — top tier
- **Status B** (Sparkles icon)
- **Status C** (Compass icon)
- **No Status** — outline

Card shows: rank label, icon, receipt count, progress bar to next tier, copy from `t('settings.profile.rank.descriptions.*')`.

The current rank comes from the user profile (`useMe()` — see `08-settings.md`); the descriptions reference `remaining` count to next tier.

### 9. Recent activity

List of last 5 receipts: store name (or "Unknown Store"), date (relative: "2 days ago"), amount. Tapping a row → Receipt detail screen. "View all" button at bottom → Receipts list.

Source: `useAggregatedStats().recentReceipts` (already returned by the stats endpoint — don't fetch separately).

---

## Floating action button (FAB)

A circular FAB anchored to the bottom-right (above the bottom tab bar). Tapping it opens the **QR Scanner** (see `06-scanning.md`).

- Icon: scan / QR symbol
- Size: 56pt
- Elevation / shadow: high
- Color: primary
- Long-press → action sheet: "Scan QR", "Pick from gallery", "Manual PFR entry" (matches the three entry points in `src/hooks/receipts/use-receipt-scanner.tsx`).

---

## Edit mode

When the pencil icon in the header is tapped:

- Each widget shows a **visibility eye** in its top-right; tapping toggles `widgetVisibility[id]`.
- A "Reset to default" button appears in a toolbar at the top.
- Hidden widgets stay rendered at 40% opacity (so users can re-enable them) while in edit mode; when exiting, they disappear.

State is persisted in `useDashboardStore` (key: `receipto-dashboard-v2`). Port the store verbatim from `src/store/dashboard.ts`. On rehydrate it self-heals: any unknown widget IDs are dropped, any new ones from the registry are added at the bottom.

(We're dropping per-widget **size** controls and **drag-reorder** on mobile — single column is fixed-order. Keep the visibility toggle.)

---

## API summary

| Endpoint                                                | Purpose                              |
| ------------------------------------------------------- | ------------------------------------ |
| `GET /dashboard/aggregated/stats`                       | KPIs + recent receipts               |
| `GET /dashboard/aggregated/category-stats?year=Y&month=M` | Category pie + budget tracker      |
| `GET /dashboard/aggregated/daily-stats?year=Y&month=M`  | Daily bar chart                      |
| `GET /dashboard/aggregated/monthly-stats?year=Y`        | 12-month trend                       |
| `GET /recurring-expenses/upcoming?days=30`              | Upcoming recurring widget            |
| `GET /currencies`, `GET /currencies/rates`              | Currency list + exchange rates       |

All queries cached via React Query — stale time 5 min, gc time 10 min (matches web defaults in `src/App.tsx:13`).

---

## Mobile simplifications vs web

These constraints are part of the contract (the design output reflects them — both docs agree):

- **No 12-column grid, no drag-reorder, no per-widget resize.** Single column, fixed order, only visibility toggle.
- **No sidebar** — navigate via bottom tabs (see `11-navigation.md`).
- **Pull-to-refresh** invalidates all dashboard queries.
- **FAB instead of inline "Scan" button** for QR capture.
- **Greeting bar** replaces the desktop "Welcome back, $name" copy that lived in the sidebar header.

---

## Visual spec

See `../design-output/dashboard/` for the full visual spec per widget (states, layouts, chart styling). This doc owns the data formulas (forecast calc, rate-fallback logic), the API contract, and the widget-visibility persistence rules.

---

## Acceptance checklist

- [ ] Header sticks on scroll; month selector navigates by ±1 month and jumps to today via a "Today" chip.
- [ ] Currency switcher updates all widget amounts immediately.
- [ ] Amounts hide / show via the eye toggle (privacy mode).
- [ ] Tapping a bar in the daily chart opens Receipts filtered to that day.
- [ ] Budget tracker shows green / amber / red thresholds; tap row drills into Receipts.
- [ ] Forecast widget only renders for the current month.
- [ ] Upcoming recurring "Pay" button opens MarkPaidModal and refreshes the widget on success.
- [ ] FAB opens scanner; long-press shows action sheet with all three entry points.
- [ ] Edit mode toggles visibility and persists across app restarts.
- [ ] Pull-to-refresh refetches all queries.
