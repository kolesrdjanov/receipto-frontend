# 10 — Categories

User-owned categories for tagging receipts. Flat (no hierarchy). Carry an optional monthly budget that feeds the Dashboard's budget tracker.

---

## Screens

| Screen                          | Purpose                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| CategoriesList                  | Manage all categories                                              |
| CategoryForm                    | Create / edit a category (full-screen modal)                       |
| CategoryDeleteWithReassignment  | Delete a category that has linked receipts — choose new tag first  |

---

## Data fields

- `name` (required, string)
- `color` (hex from the 10-swatch palette)
- `icon` (single emoji)
- `description` (optional, string)
- `monthlyBudget` (optional, number)
- `budgetCurrency` (optional, currency code — locked once set)

There are **no system / preset categories** — every category is user-created.

---

## CategoriesList

### Header

- Title: "Categories"
- Right: "+ Add" primary button

### Row layout

Each row is 80pt tall:

- Left: 48pt icon circle (category `color` at 15% alpha background, `icon` emoji centered)
- Center, top line: category name (body-strong)
- Center, sub-line: description (caption, muted, italic if empty: "No description")
- Center, optional third line: budget — "Budget: 30,000 RSD / month" (caption)
- Right: chevron (tap → CategoryForm in edit mode)
- Swipe-left → reveal Delete

### Empty state

- Tag icon (48pt, muted)
- "No categories yet"
- "Create categories to organize your receipts."
- "+ Add your first" primary CTA

### Loading

Skeleton: 4 placeholder rows.

---

## CategoryForm

Full-screen modal (or large bottom sheet).

### Layout

- Header: title "New category" / "Edit category"; Cancel left, Save right
- **Preview pill** at the top of the form: shows the current icon circle + name as the user types. Updates live.
- Form fields below:

| Field             | Type                              | Notes                                                                 |
| ----------------- | --------------------------------- | --------------------------------------------------------------------- |
| Name              | text, required                    | min 1 char. Auto-capitalize "words".                                  |
| Color             | swatch picker, inline             | 10 swatches in a 5×2 grid (40pt circles, selected has checkmark)      |
| Icon              | emoji picker row                  | Tap → opens emoji picker. Current emoji displayed in the row.        |
| Description       | textarea, optional                | ~80pt tall.                                                            |
| Monthly budget    | number input, optional, decimal   | Currency shown next to the input (read-only if in edit mode).         |
| Budget currency   | currency picker                   | Auto-fills with `settings.currency` on create; **locked on edit** so existing budgets don't silently change scale. |

### Delete button (edit mode only)

Destructive outline button at the bottom of the form. On tap → opens the **CategoryDeleteWithReassignment** flow if the category has linked receipts; otherwise, a simple Alert confirmation.

### Emoji picker

A full-screen modal (slide up). Contents:

- Search bar at top
- Recents row
- Category sections (Smileys, Food, Animals, Travel, etc.) — standard emoji keyboard layout
- Tapping an emoji selects it and dismisses the picker

Use a library — don't hand-roll the emoji grid.

---

## CategoryDeleteWithReassignment

A bottom sheet that appears when the user deletes a category that has linked receipts.

### Anatomy

- Drag handle + title: "Delete {category.name}?"
- Subcopy: "**N receipts** are tagged with this category. Reassign them before deleting:"
- Bulk action row: "Set all to ▼ [Uncategorized]" — opens a CategoryPickerSheet → applies the selection to all receipts below
- List of affected receipts, each row:
  - Store name + amount (compact)
  - Per-receipt dropdown picker on the right (defaults to "Uncategorized")
- Bottom buttons:
  - Cancel (outline)
  - "Reassign & delete" (destructive primary)

The user can either:

- Tap "Set all to X" to apply X to every row in one tap, OR
- Pick individually per row.

### After confirmation

- Button shows spinner; the sheet doesn't dismiss
- All receipt category updates issued in parallel
- Then the category delete
- On success: sheet closes, success toast "Category deleted", list refreshes
- On error: sheet stays open, banner above buttons with error message

### Variant: no linked receipts

If the category has zero linked receipts, **skip this sheet** and just show a standard Alert:

> Delete "Groceries"?
> This action can't be undone.
> [Cancel] [Delete]

---

## Visual conventions

- The **color circle** is the visual anchor of every category card. Make it crisp:
  - 48pt diameter on rows, 32pt in compact contexts
  - Background = color at exactly 15% alpha
  - Foreground = the emoji icon, centered, at its natural size
- The **10-swatch palette** is shared across Categories, Recurring expenses, and Loyalty cards. See `02-design-system.md`.
- The **budget line** only renders when a budget is set. Don't show "No budget set" — silence is cleaner.

---

## Acceptance checklist

- [ ] CategoriesList designed in light + dark, with empty, loading, and populated states.
- [ ] Swipe-left delete reveal shown.
- [ ] At least one row with a budget shown and one without.
- [ ] CategoryForm designed for both create (currency unlocked) and edit (currency locked) modes.
- [ ] Live preview pill mocked at the top of the form.
- [ ] Emoji picker modal designed (you can use the system / library default — annotate the choice).
- [ ] Color swatch picker designed in unselected and selected states.
- [ ] CategoryDeleteWithReassignment sheet designed with at least 3 affected receipts shown.
- [ ] Simple delete Alert (no linked receipts) designed.
- [ ] Per-row dropdown picker behavior annotated.
