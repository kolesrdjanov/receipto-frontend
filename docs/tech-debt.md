# Frontend Tech Debt

A standing register of known frontend tech debt and its remediation plans. Each item has a
stable ID (`TD-N`), a current/target state, and a concrete migration plan. Add new items at
the bottom; don't renumber existing ones.

**Last updated:** 2026-06-04

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| TD-1 | Standardize all forms on React Hook Form + Zod | High | Not started |
| TD-2 | Migrate remaining empty states to the Glass design system | Medium | Not started |
| TD-3 | Avatar fallback should be the brand gradient, not solid `bg-primary` | Medium | Not started |

---

## TD-1 · Standardize all forms on React Hook Form + Zod

**Priority:** High · **Status:** Not started

### The standard (target state)
**Every form uses React Hook Form for state + a Zod schema as the single source of truth for
both the form contract (its shape/types) and validation.** Concretely:

- One Zod schema per form, colocated with the form (or in a sibling `*.schema.ts` for larger
  forms). The schema **is** the contract: the form's TypeScript type is `z.infer<typeof
  schema>` — never a hand-written parallel interface.
- The schema is wired into RHF through the official resolver:
  `useForm({ resolver: zodResolver(schema), defaultValues })` from `@hookform/resolvers/zod`.
- Localized messages: schemas that need i18n are built by a factory that takes `t`
  (`createXSchema(t)`), mirroring the existing `createSignUpSchema(t)` in
  `hooks/auth/use-sign-up.ts`. Pure/static schemas can be module-level constants.
- Errors render from `formState.errors` (the glass `Field` `error` prop already supports
  this). `Controller` + `rules` is replaced by the schema; custom controls (DatePicker,
  selects) bind through `Controller` but validate via the schema.
- Submit handlers receive the parsed, typed data — no `as` casts to the API DTO.

### Why this is debt (current state)
Form validation is **inconsistent across the app**, with three different patterns:

1. **10 forms use RHF with ad-hoc inline `register('x', { required: t('...') })` rules** and no
   schema — validation logic is scattered across JSX, and the form type is a hand-written
   interface (e.g. `CreateWarrantyData`) that can silently drift from what the form actually
   collects:
   - `components/admin/announcement-modal.tsx`
   - `components/admin/create-user-modal.tsx`
   - `components/categories/category-modal.tsx`
   - `components/groups/group-modal.tsx`
   - `components/receipts/receipt-modal.tsx`
   - `components/recurring-expenses/mark-paid-modal.tsx`
   - `components/recurring-expenses/recurring-expense-modal.tsx`
   - `components/support/contact-support-modal.tsx`
   - `components/templates/template-modal.tsx`
   - `components/warranties/warranty-modal.tsx`
2. **2 auth forms use Zod (`schema.safeParse`) but on plain `useState`, not RHF** — the schema
   exists but RHF doesn't, so error wiring is manual:
   - `hooks/auth/use-sign-up.ts` (`createSignUpSchema`)
   - `hooks/auth/use-reset-password.ts`
3. **`@hookform/resolvers` is not installed**, so even the RHF forms can't consume a Zod
   schema without a hand-rolled adapter.

The result: no shared form-contract layer, validation rules duplicated/inconsistent between
client and the API DTOs, and types that can drift from the actual form. A warranty-form
attempt to adopt Zod alone was reverted (`9fcc84b`) precisely because doing it on **one** form
created inconsistency — the fix is to do it **everywhere**, which is this item.

### Approach / decisions
- **Install `@hookform/resolvers`** (peer of the already-present `react-hook-form` + `zod`).
  Use the official `zodResolver` — do not hand-roll a resolver.
- **Colocation:** small forms keep the schema at the top of the component file; forms with
  non-trivial schemas (receipt, recurring-expense, group) get a sibling `*.schema.ts` so the
  contract is importable/testable independently.
- **i18n:** use the `createXSchema(t)` factory pattern for any schema with user-facing
  messages; memoize per-render where it matters (`useMemo`).
- **Types:** export `type XForm = z.infer<ReturnType<typeof createXSchema>>` (or
  `z.infer<typeof xSchema>`) and delete the hand-written form interface; map to the API DTO at
  the submit boundary only.
- **Auth forms:** migrate the `useState` + `safeParse` auth flows onto RHF + `zodResolver`,
  reusing their existing schemas (they already have the hardest part).

### Migration plan (phased — each phase ships independently)
- [ ] **Phase 0 — Foundation.** Add `@hookform/resolvers`. Write a short convention section in
  `docs/conventions.md` ("Forms: RHF + Zod") and a tiny reference example. Optional: a
  `lib/forms/` helper for the common `createSchema(t)` + `useMemo` wiring.
- [ ] **Phase 1 — RHF forms (the 10 above).** One PR per form (or small batches by feature):
  add a Zod schema, swap inline `required` rules for `resolver: zodResolver(schema)`, replace
  the hand-written form interface with `z.infer`, drop `as` casts at submit. Start with the
  simplest (support, template, category) to lock the pattern, then the complex ones (receipt,
  recurring-expense, group).
- [ ] **Phase 2 — Auth forms (the 2 above + any remaining auth screens).** Move
  `use-sign-up.ts` / `use-reset-password.ts` from `useState` + `safeParse` onto RHF +
  `zodResolver`, reusing the existing schemas; audit sign-in / forgot-password and bring them
  to the same standard.
- [ ] **Phase 3 — Guardrail.** Add an ESLint rule or a CI grep that fails when a `useForm` call
  has no `resolver`, so new forms can't regress to ad-hoc validation.

### Acceptance criteria
- Every `useForm` in `src/` passes a `resolver: zodResolver(...)`.
- No form defines validation via inline `register(..., { required })` / `Controller rules`.
- Every form's type is derived via `z.infer` from its schema (no parallel hand-written
  interface for form shape).
- `@hookform/resolvers` is a dependency; the guardrail (Phase 3) is in place.

### Out of scope
- Backend DTO/validation changes (NestJS `class-validator`) — separate concern; this item is
  frontend form contracts only. Sharing schemas across the FE/BE boundary is a possible future
  item, not part of TD-1.

---

## TD-2 · Migrate remaining empty states to the Glass design system

**Priority:** Medium · **Status:** Not started

### The standard (target state)
Every "no data yet" placeholder uses the **Glass empty-state vocabulary** that the redesigned
list pages already share — no legacy/ad-hoc variants:

- A **card surface** built from tokens: `border border-border bg-card` (or dashed
  `border-dashed bg-bg-subtle`) with a glass radius (`rounded-[18px]`/`rounded-3xl`). No bare
  centered text, no plain `<Card><CardTitle className="text-muted-foreground">` headers.
- An **icon tile**, not a bare icon: either the elevated `size-[72px] rounded-[22px] bg-card
  shadow-glass-2` tile (as in `receipts`) or the recessed `bg-bg-subtle rounded-[22px]` tile
  (as in `categories`/`warranties`), holding a lucide glyph — **or** the shared `IconTile`
  from `components/glass/glass.tsx`.
- **Typography tokens** `t-h3` (title) + `t-sm` (subtitle). No `text-lg font-semibold` /
  `font-medium text-sm` ad-hoc sizing, no `text-gray-*`/hardcoded colors.
- A **brand CTA** where an action makes sense: the `btn-brand` gradient (Scan/Add) or the
  per-page `AddButton`. Copy stays in i18n (`t('…')`, EN + SR).
- **Sub-decision to settle once:** the already-migrated pages diverge slightly — `receipts`
  uses a **dashed** card + **elevated** tile; `categories`/`warranties`/`recurring`/`loyalty`
  use a **solid** card + **recessed** tile. Pick one canonical pairing and converge (or
  extract a shared `<EmptyState>` primitive — see Approach).

### Why this is debt (current state)
The Glass migration redesigned the main-list empty states but left many surfaces on the old
patterns, so the app shows **two visual languages** depending on the page. Inventory (verified
2026-06-04, on `feature/redesign-main-branch`):

**Already Glass (no action):**
- `pages/receipts/index.tsx` (`receipts.noReceipts` / `noReceiptsText` / `scanReceipt`)
- `pages/categories/index.tsx` (`categories.empty.*`)
- `pages/warranties/index.tsx` main (`warranties.noWarranties*`)
- `pages/recurring-expenses/index.tsx` (`recurring.empty.*`)
- `pages/loyalty-cards/index.tsx` (`loyaltyCards.noCards*`)

**Needs migration — main list pages (HIGH, user-visible):**
- `pages/groups/index.tsx` — LEGACY: plain `<Card>` + centered muted `CardTitle`
  (`groups.noGroups` / `noGroupsText`).
- `components/templates/templates-table.tsx` — LEGACY: same muted-`CardTitle` pattern
  (`templates.noTemplates` / `noTemplatesText`). (Templates live under the receipts area.)
- `pages/items/index.tsx` (Price Tracker) — AD-HOC: `border-dashed` Card + a `rounded-full
  bg-primary/10` circle (not the elevated tile) + a 3-step onboarding grid + primary CTA
  (`items.empty.*`). Functional but off-system (uses `font-medium text-sm`, `primary/10`).
- `pages/dashboard/index.tsx` dashboard hero empty — AD-HOC: closest to Glass (uses
  `WidgetCard` + `icon-tile-primary` + `btn-brand`, `dashboard.empty.*`) but not the canonical
  pattern. *(Dashboard is under active redesign by a parallel effort — coordinate; lines drift.)*

**Needs migration — secondary/detail surfaces (MEDIUM):**
- Group detail tabs — all LEGACY (muted text / faint icon): `components/groups/group-receipts-table.tsx`
  (`groups.detail.noReceipts*`), `components/groups/group-balances-tab.tsx`
  (`groups.balances.noExpenses`), `components/groups/activity-feed.tsx`
  (`groups.activities.noActivities`), `components/groups/settlement-history.tsx`.
- `pages/warranties/index.tsx` **filtered-tab** empty (the "no active/expired warranties for
  this filter" branch) is still LEGACY text even though the page's primary empty is Glass.
- Price-tracker sub-empties: `pages/items/index.tsx` frequent-items branch + `components/items/{savings-card,shopping-insights,store-comparison}.tsx` — LEGACY/minimal.

**Reusable component (high leverage):**
- `components/dashboard/primitives.tsx` → `WidgetEmpty` — the `WidgetCard` shell is already
  glassy (`shadow-glass-1`), but the empty **content** is a plain icon + text. It's consumed by
  `upcoming-recurring`, `category-budget-progress`, `monthly-forecast`, and inline by the
  dashboard pie/daily/monthly/recent-activity widgets — **upgrading `WidgetEmpty` once fixes
  all of them.**

**Admin (LOWEST — internal only):** `components/admin/{announcements-table,ratings-table,
users-table}.tsx`, `pages/admin/user-details.tsx` — legacy, but admin-only; defer.

**Dead code to remove (do as part of this):** the legacy `.empty-state` / `.empty-state-icon`
rules in `src/index.css` (~L336/L347) are now **unreferenced** (receipts was the last consumer
and was migrated) — delete them.

### Approach / decisions
- **Strongly consider extracting a shared `<EmptyState>` primitive** (e.g.
  `components/glass/empty-state.tsx` taking `icon`, `title`, `description`, optional
  `action`) so the canonical pattern is defined once and the remaining surfaces compose it —
  this also resolves the dashed-vs-solid divergence by construction. Reuse `IconTile` for the
  glyph.
- Keep all copy in i18n (EN + SR); reuse existing keys, only add where a surface has none.
- Don't touch the data/query layer — presentation only (same as the list redesigns).

### Migration plan (phased)
- [ ] **Phase 0.** Extract `<EmptyState>` glass primitive; settle the dashed-vs-solid + tile
  variant; retrofit the 5 already-Glass pages onto it (pure refactor, no visual change intended)
  to lock the contract. Remove the dead `.empty-state` CSS.
- [ ] **Phase 1 — main list pages.** `groups`, `templates`, `items` (Price Tracker main).
  Coordinate the dashboard hero with the active dashboard redesign rather than double-doing it.
- [ ] **Phase 2 — reusable `WidgetEmpty`** (upgrades all dashboard widget empties at once).
- [ ] **Phase 3 — secondary surfaces.** Group detail tabs, warranties filtered-tab branch,
  price-tracker sub-empties.
- [ ] **Phase 4 — admin tables** (lowest priority).

### Acceptance criteria
- No `.tsx` renders an empty state via a bare centered `text-lg`/`font-medium` block, a muted
  `CardTitle`-as-empty, or `text-gray-*`/`primary/10` ad-hoc tints — all compose the shared
  Glass `<EmptyState>` (or the documented token pattern).
- The legacy `.empty-state` / `.empty-state-icon` CSS is deleted.
- Empty-state copy is in EN + SR i18n.

### Out of scope
- Loading skeletons and error states (separate surfaces; this item is the "no data" empty
  state only). The list pages' skeletons were already reglassed during their redesign cycles.

---

## TD-3 · Avatar fallback should be the brand gradient, not solid `bg-primary`

**Priority:** Medium · **Status:** Not started

### The standard (target state)
When a user has **no profile image**, the initials fallback renders as a **brand-gradient
bubble** (white, bold initials), per the Glass design:

- Gradient: `linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))` — the variant
  used by every real instance in the handoffs (sidebar, mobile header, profile popover, and the
  large profile avatar `.set-avatar`, which also adds `box-shadow: var(--sh-2)` =
  `shadow-glass-2` at large sizes). *(The base `.avatar` class defaults to
  `emerald→violet`, but it's overridden to `cyan→violet` everywhere it's actually rendered —
  use `cyan→violet` as canonical.)*
- White, bold initials (`getInitials` logic is already correct and stays).
- The gradient is a **fixed brand element** — it deliberately does **not** follow the user's
  accent color.

> **Note — this is a sanctioned exception to "gradient only on logo + Scan CTA + FAB."** The
> design explicitly uses the brand gradient for the identity avatar; don't "correct" it back to
> a flat color. (Tokens `--brand-cyan` / `--brand-violet` / `--brand-emerald` already exist in
> `src/index.css` and back the `BrandWash` + `btn-brand`.)

### Why this is debt (current state)
`src/components/ui/avatar.tsx` renders the no-image fallback as a **solid `bg-primary`** circle
with `text-primary-foreground` initials (avatar.tsx:55-65). Because `bg-primary` is
**accent-aware**, the bubble currently changes color with the user's accent (zinc/blue/green/…)
instead of showing the fixed brand gradient the design calls for. The image path
(avatar.tsx:41-52) is correct and stays as-is.

This is **one shared component used in 9 places**, so the gap is visible app-wide — most
notably the **sidebar** (`components/layout/app-sidebar.tsx:304,360`) and the **mobile header**
(`components/layout/app-layout.tsx:66`) on every page, plus `pages/settings/profile.tsx`,
group member lists (`groups/group-detail-modal.tsx`, `group-balances-tab.tsx`,
`pages/groups/[id].tsx`), and admin (`admin/ratings-table.tsx`, `admin/user-details*`). The
nav-shell redesign restyled the sidebar but left this old `Avatar` untouched.

### Approach / decisions
- **Single-component change, app-wide effect:** update only the fallback branch of
  `components/ui/avatar.tsx` to the gradient (inline `style={{ backgroundImage:
  'linear-gradient(135deg, var(--brand-cyan), var(--brand-violet))' }}` or a small
  `bg-brand-gradient` utility), keeping `getInitials`, sizes, and the image path unchanged.
  No call-site changes needed.
- Consider adding `shadow-glass-2` at the `xl`/`2xl` sizes (the large profile avatar carries a
  shadow in the design).
- **Coordinate with the active Settings/Profile redesign** — `pages/settings/profile.tsx`
  (large avatar) is in that effort's scope; the shared-component fix here covers the profile
  avatar too, so align rather than double-do.

### Acceptance criteria
- `Avatar`'s no-image fallback renders the fixed `cyan→violet` brand gradient with white
  initials, independent of the accent color.
- No call sites needed changes; sidebar + mobile-header avatars show the gradient on every page.

### Out of scope
- The image-backed avatar path (already correct). Group/category color bubbles and other
  non-user-identity circles (those intentionally use entity colors, not the brand gradient).
