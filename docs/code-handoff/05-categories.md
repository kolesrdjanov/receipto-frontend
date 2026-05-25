# 05 — Categories

User-owned categories. Flat (no hierarchy). Categories carry an optional **monthly budget** that feeds the dashboard's budget tracker.

Web reference: `src/pages/categories/index.tsx`, `src/components/categories/*`, `src/hooks/categories/use-categories.ts`.

---

## Data model

```ts
type Category = {
  id: string
  userId: string
  name: string
  color?: string             // hex
  icon?: string              // single emoji
  description?: string
  monthlyBudget?: number
  budgetCurrency?: string    // independent of the user's display currency
  createdAt: string
  updatedAt: string
}

type CreateCategoryInput = {
  name: string
  color?: string
  icon?: string
  description?: string
  monthlyBudget?: number
  budgetCurrency?: string
}
```

There is **no concept of system / predefined categories** in this codebase — every category is user-created.

---

## API endpoints

| Endpoint                      | Method | Body / Query        | Returns      |
| ----------------------------- | ------ | ------------------- | ------------ |
| `/categories`                 | GET    | —                   | `Category[]` |
| `/categories/:id`             | GET    | —                   | `Category`   |
| `/categories/:id/receipts`    | GET    | —                   | `Receipt[]` (used by delete flow to detect linked receipts) |
| `/categories`                 | POST   | `CreateCategoryInput` | `Category` |
| `/categories/:id`             | PATCH  | `Partial<CreateCategoryInput>` | `Category` |
| `/categories/:id`             | DELETE | —                   | —            |

---

## Screens

### 1. Categories list (`/categories`)

**Header**: Title "Categories", "+ Add" button.

**List**: each row is a category card:

- Left: **icon circle** — 48pt diameter, background `category.color` at 15% opacity, foreground emoji from `category.icon` (fallback: first letter of name).
- Top line: name (bold).
- Sub-line: description (truncated, italic muted if empty).
- Bottom line (only if `monthlyBudget`): `Budget: 30,000 RSD/month` (with `budgetCurrency`).
- Trailing: actions — Edit (pencil), Delete (trash).
- Swipe-left → Delete.
- Tap → edit (or detail screen if you want to add one later).

**Empty state**: tag icon, "No categories yet", "+ Add your first" button.

**Loading / error**: spinner / retry.

### 2. Add / Edit category (modal or full screen)

A form with the following fields (matches `CategoryModal`):

- **Name** (text, required) — `min 1 char`
- **Color** — color picker. The web uses an HTML color input plus a hex text field. On RN, present **a fixed swatch palette** (10 colors — match the loyalty-card palette in `src/components/loyalty-cards/loyalty-card-modal.tsx` lines 232–249) plus an optional "Custom" button that opens a color picker. Default: a neutral gray.
- **Icon** — emoji picker. The web uses the `frimousse` library; on RN use **`rn-emoji-keyboard`** or similar. Search enabled, recents.
- **Description** (textarea, optional)
- **Monthly budget** (number, optional, min 0, step 0.01). When the user enters a number, show the currency input alongside.
- **Budget currency** (currency picker, autofilled from `settings.currency` on create; **locked to the original `budgetCurrency`** on edit so existing budgets don't silently change scale).

Submit:

- Create → `POST /categories`.
- Edit → `PATCH /categories/:id`.

On success: invalidate `categories`, `dashboard.aggregated.category-stats` queries.

### 3. Delete category (special flow)

The web app's `CategoryDeleteModal` does this:

1. User taps delete.
2. App calls `useCategoryReceipts(id)` to check if any receipts are tagged with this category.
3. **If none** → confirmation dialog ("Delete `<name>`? This can't be undone.") → DELETE.
4. **If some** → "Reassign N receipts" sheet:
   - Each affected receipt is shown as a row with the receipt's store/date/amount and a per-receipt category picker.
   - A "Set all to uncategorized" button clears every picker.
   - A "Set all to…" button opens a category picker and applies it to all.
   - Confirm → for each affected receipt issue `PATCH /receipts/:id { categoryId: <new> | null }` in parallel, **then** `DELETE /categories/:id`. (The bulk endpoint `PATCH /receipts/bulk/category` is a more efficient alternative — use it.)
   - Refresh receipts + dashboard queries after success.

Don't cascade-delete the receipts.

---

## Hooks

`src/hooks/categories/use-categories.ts` — port verbatim:

- `useCategories()`
- `useCategory(id)`
- `useCategoryReceipts(id)` (only enabled when opening delete flow)
- `useCreateCategory()`
- `useUpdateCategory()`
- `useDeleteCategory()`

---

## Visual spec

See `../design-output/categories/` for the full visual spec (icon-circle composition, color-palette grid, emoji picker integration, delete-with-reassignment sheet). Implementation notes:

- Emojis are not consistent across platforms — accept that and don't try to render them as SVGs.
- The 10-swatch palette is shared with Recurring and Loyalty cards.
- `budgetCurrency` is locked on edit if it was set, to prevent silent value rescaling.

---

## Acceptance checklist

- [ ] Create / edit form validates name; budget input pairs with currency.
- [ ] Editing an existing category locks `budgetCurrency` if it was set.
- [ ] Delete with no linked receipts uses a simple confirmation.
- [ ] Delete with linked receipts opens reassignment flow; reassignments go through (bulk endpoint preferred); category then deletes.
- [ ] List rerenders after CRUD (queries invalidate correctly).
- [ ] Color palette is consistent with loyalty cards' palette.
- [ ] Categories show in the Receipts category picker after creation immediately.
