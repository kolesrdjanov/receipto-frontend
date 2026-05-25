# 04 — Recurring expenses

Track recurring spending (subscriptions, rent, utilities). Backend computes next-due dates and lets users log payments against them.

Web reference: `src/pages/recurring-expenses/index.tsx`, `src/components/recurring-expenses/*`, `src/hooks/recurring-expenses/use-recurring-expenses.ts`.

---

## Data model

```ts
type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

type RecurringExpense = {
  id: string
  name: string
  amount: number
  currency: string
  isFixed: boolean             // false = variable (amount can change per payment)
  frequency: Frequency
  dayOfMonth?: number          // 1..31, used for monthly / quarterly / yearly
  startDate: string            // ISO date
  endDate?: string             // ISO date, optional
  icon?: string                // emoji
  color?: string               // hex
  notes?: string
  isPaused: boolean
  categoryId?: string
  category?: { id; name; color?; icon? }
  nextDueDate?: string         // ISO date, computed by backend
  createdAt: string
  updatedAt: string
}

type RecurringExpensePayment = {
  id: string
  recurringExpenseId: string
  amount: number
  paidDate: string
  dueDate: string
  notes?: string
  createdAt: string
}

type UpcomingExpense = Pick<
  RecurringExpense,
  'id' | 'name' | 'amount' | 'currency' | 'isFixed' | 'icon' | 'category'
> & { dueDate: string }

type Summary = {
  monthlyEquivalent: number     // sum of (amount × frequency-to-monthly factor)
  annualProjection: number
  paidThisMonth: number
  pendingThisMonth: number
}
```

---

## API endpoints

| Endpoint                                            | Method | Body                                                                                                                  | Returns                                  |
| --------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `/recurring-expenses`                               | GET    | —                                                                                                                     | `RecurringExpense[]`                     |
| `/recurring-expenses/:id`                           | GET    | —                                                                                                                     | `RecurringExpense`                       |
| `/recurring-expenses`                               | POST   | `{ name, amount, currency, isFixed, frequency, dayOfMonth?, startDate, endDate?, icon?, color?, notes?, categoryId? }` | `RecurringExpense`                       |
| `/recurring-expenses/:id`                           | PATCH  | Subset of the above + `isPaused`                                                                                       | `RecurringExpense`                       |
| `/recurring-expenses/:id`                           | DELETE | —                                                                                                                     | —                                        |
| `/recurring-expenses/upcoming?days=30`              | GET    | —                                                                                                                     | `{ overdue: UpcomingExpense[]; dueSoon: UpcomingExpense[]; upcoming: UpcomingExpense[] }` |
| `/recurring-expenses/summary`                       | GET    | —                                                                                                                     | `Summary`                                |
| `/recurring-expenses/:id/pay`                       | POST   | `{ amount, paidDate, notes? }`                                                                                         | `RecurringExpensePayment` (also returns updated RecurringExpense with new `nextDueDate`) |
| `/recurring-expenses/:id/payments?limit=10`         | GET    | —                                                                                                                     | `RecurringExpensePayment[]`              |

`/upcoming` groups items as:

- **overdue** — `dueDate < today`
- **dueSoon** — `dueDate within next 7 days`
- **upcoming** — `dueDate within `days` parameter (default 30)

---

## Screens

### 1. Recurring expenses list (`/recurring`)

**Header**: Title "Recurring", "+ Add" button.

**Stats strip** (horizontal scroll under the header):

- `t('recurring.summary.monthlyCommitment')`: `useRecurringSummary().monthlyEquivalent` formatted in display currency.
- `t('recurring.summary.annualProjection')`: × 12.
- `t('recurring.summary.paidThisMonth')`: count.
- `t('recurring.summary.pendingThisMonth')`: count.

**Category breakdown** (collapsible card, see `src/components/recurring-expenses/category-breakdown.tsx`):

- Donut chart grouping `RecurringExpense[]` by `category.id`, summing `monthlyEquivalent` per category.
- Legend below: category name, monthly total, count chip.

**List**: each row is an expense — render as a card (taller than a typical list row, ~96pt):

- Left: icon (emoji from `icon` or category icon fallback), background tinted with `color` or `category.color` at 15% opacity.
- Top line: name (bold), badge: `frequency` label.
- Sub-line: category name + next due date ("Due Apr 15") + status pill ("Active" / "Paused" / "Ended").
- Right: amount + currency. If `!isFixed`, append a `~` (e.g. `~250.00 RSD`).
- Tap → opens expense detail (or expands inline — web does inline expansion; on RN a detail screen is cleaner).
- Trailing action buttons on the row:
  - **Pay** (CreditCard icon) — only if `!isPaused && nextDueDate` — opens `MarkPaidModal`.
  - **Pause / Resume** (Pause/Play icon) — toggles `isPaused` via PATCH.
  - **Edit** (Pencil) — opens `RecurringExpenseModal` in edit mode.
  - **Delete** (Trash) — confirmation → DELETE.

On a phone these don't all fit on the row — show **Pay** inline (the primary action), and put the others behind a `...` overflow menu, or surface them on swipe.

**Status pill labels**:

| Condition                          | Label   |
| ---------------------------------- | ------- |
| `isPaused`                         | Paused  |
| `endDate && endDate < today`       | Ended   |
| otherwise                          | Active  |

**Empty state**: "No recurring expenses yet" + "+ Add your first" primary button.

### 2. Add / Edit recurring expense

A bottom sheet or full-screen form (`RecurringExpenseModal`):

- **Name** (text, required)
- **Amount** (number, required, step 0.01)
- **Currency** (dropdown, defaults to `settings.currency`)
- **Is fixed** (switch) — "Same amount every time". Default true. When off, the Mark-paid flow will let users override the amount.
- **Frequency** (segmented control: Weekly / Monthly / Quarterly / Yearly)
- **Day of month** (number 1–31, only shown for monthly / quarterly / yearly)
- **Start date** (date picker, required)
- **End date** (date picker, optional, must be ≥ start date)
- **Category** (picker)
- **Icon** (emoji picker)
- **Color** (color picker — 10 preset swatches, see `src/components/loyalty-cards/loyalty-card-modal.tsx` for the same pattern)
- **Notes** (textarea, optional)

Submit:

- Create → `POST /recurring-expenses`. Invalidate `recurring-expenses`, `dashboard` queries.
- Edit → `PATCH /recurring-expenses/:id`. Same invalidations.

### 3. Mark as paid (modal)

Triggered from the row's "Pay" button or from the Dashboard's "Upcoming recurring" widget.

Fields:

- **Due date** (locked, read-only) — shows `nextDueDate`.
- **Amount** — locked at `expense.amount` if `isFixed`, otherwise editable (number input, defaults to `expense.amount`).
- **Paid date** (date picker, defaults to today).
- **Notes** (textarea, optional).

Submit → `POST /recurring-expenses/:id/pay { amount, paidDate, notes }`. On success:

- Invalidate `recurring-expenses` (list refetches with updated `nextDueDate`).
- Invalidate `dashboard` (upcoming widget refreshes).
- Show success toast.

### 4. Payment history

Reached by expanding a row (web) or opening the detail screen and tapping "Payment history".

A list of `RecurringExpensePayment` rows:

- Date paid · Amount (with currency)
- Caption: due date · notes (if any)

`usePaymentHistory(id)` fetches the last 10. For more, add a "Load more" button → call with `?limit=N`.

---

## Hooks

`src/hooks/recurring-expenses/use-recurring-expenses.ts` (212 lines) — port verbatim. The hooks are:

- `useRecurringExpenses()`
- `useRecurringExpense(id)`
- `useUpcomingExpenses(days?)`
- `useRecurringSummary()`
- `useCreateRecurringExpense()`
- `useUpdateRecurringExpense()`
- `useDeleteRecurringExpense()`
- `useMarkAsPaid()`
- `usePaymentHistory(id)`

---

## Visual spec

See `../design-output/recurring/` for the full visual spec (list row layout, paused-state opacity, Pay button placement, MarkPaid sheet structure, payment-history layout). This doc owns the data model, API endpoints, hook ports, and the `isFixed` behavior.

---

## Acceptance checklist

- [ ] List shows correct stats; switching display currency re-renders amounts.
- [ ] Add / edit form validates required fields; day-of-month appears only for monthly+.
- [ ] Pay flow respects `isFixed` (amount editable iff false) and refreshes the list.
- [ ] Pause / Resume toggles status correctly and disables Pay when paused.
- [ ] Payment history loads paginated; deleting an expense removes its payments visually.
- [ ] Dashboard "Upcoming" widget mirrors backend grouping (overdue / dueSoon / upcoming).
