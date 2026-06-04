# Frontend Tech Debt

A standing register of known frontend tech debt and its remediation plans. Each item has a
stable ID (`TD-N`), a current/target state, and a concrete migration plan. Add new items at
the bottom; don't renumber existing ones.

**Last updated:** 2026-06-04

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| TD-1 | Standardize all forms on React Hook Form + Zod | High | 🟡 In progress (Phase 1+2 done) |
| TD-2 | Migrate remaining empty states to the Glass design system | Medium | ✅ Done |
| TD-3 | Avatar fallback should be the brand gradient, not solid `bg-primary` | Medium | ✅ Done |
| TD-4 | Finish the Glass migration for the orphaned screens (groups, price-tracker, templates, admin) | Medium | 🟡 In progress (de-violation sweep done) |
| TD-5 | Centralize money & date formatting (+ fix the Serbian-date i18n bug) | High | ✅ Done |
| TD-6 | Unify icon, loading, and confirmation vocabulary | Medium | 🟡 In progress (icons + confirm done) |
| TD-7 | Extract shared list/empty/action primitives into `components/glass/` | Medium | 🟡 In progress (EmptyState + AddButton done) |
| TD-8 | Close API hook-layer gaps (net-new endpoints that skipped the hooks layer) | Low | ✅ Done |
| TD-9 | Standardize modal footers on the `GlassDialog` `actions` API | Medium | 🟡 In progress (recurring modal = reference) |

## Progress log — 2026-06-05 execution pass

A focused pass landed a large batch of the register. Every change below was gated on `npm run build`
(exit 0) and `tsc -b` clean. Visual-only regressions are NOT covered (no app/runtime QA was possible) —
the forms and any restyled screens need a manual QA pass before merge.

- **TD-5 ✅ Done** — `formatMoney` util + ~24 money sites swept; dates localized to Serbian **Latin**
  (`sr-Latn-RS` + date-fns `srLatn`); the `en-US` date bug fixed. (See TD-5 below.)
- **TD-8 ✅ Done** — added `useVerifyEmail`/`useResendVerification`/`useJoinGroup`/`useCategorizationAccuracy`
  hooks; registered the 2 stray query keys; repointed the 4 inline call sites.
- **TD-3 ✅ Done** — `ui/avatar.tsx:55` fallback now renders the `cyan→violet` brand gradient (white
  initials, `shadow-glass-2` at xl/2xl), independent of accent.
- **TD-6 🟡 icons + confirm done** — unified success (`CheckCircle2`), error (`CircleAlert`), overflow
  (`MoreVertical`), filter (`SlidersHorizontal`); converted the 2 raw `AlertDialog` deletes
  (`group-modal`, `items/[id]`) to `ConfirmDialog`. **Remaining:** the 3-way loading mechanism
  (Skeleton vs `animate-pulse` vs `Loader2`) + ad-hoc palette `<button>`s — fold into TD-4 screen work.
- **TD-2 ✅ Done** — extracted the shared `components/glass/empty-state.tsx` (`EmptyState` + `AddButton`);
  routed all page + secondary empties through it (or the upgraded `WidgetEmpty`); collapsed the 4
  duplicate `AddButton` defs to one; converged the receipts dashed-vs-solid divergence; deleted the dead
  `.empty-state` CSS.
- **TD-7 🟡 EmptyState + AddButton done** — those two are extracted/shared (above). **Remaining:**
  `StatusPill` (collapse the 3 status badges), `ActionList`/`ActionSheet` (4 kebab clones), promoting
  `Amount`/`CatTile`/`CatName` into `glass/` (kills the receipts↔recurring cross-import), `GlassList`/
  `ListRow`, shared `ColorSwatches`.
- **TD-4 🟡 de-violation sweep done** — token/typography hygiene across groups, items, admin, templates:
  ad-hoc headings → `.t-*`, `bg-primary/5|10` → `*-soft`/`bg-bg-subtle`, literal palettes (`bg-emerald-100`,
  `text-green-600`, …) → semantic tokens. **Remaining (a real per-screen design cycle, needs preview+QA —
  NOT done blind):** the full visual restyle of groups + price-tracker, and the raw `Dialog`/`Drawer` →
  `GlassDialog` conversions (group/template/admin modals + `receipt-viewer-modal`).
- **TD-1 🟡 Phase 0–2 done** — installed `@hookform/resolvers@5`; documented the standard in
  `docs/conventions.md`; converted **14 forms** to RHF + `zodResolver` (the 10 ad-hoc modals: support,
  template, category, announcement, create-user, warranty, recurring-expense, mark-paid, group, loyalty;
  the most-used **receipt-modal**, which had ~zero validation; and all 4 **auth** flows: sign-up,
  reset-password, sign-in, forgot-password — sign-in/forgot gained real validation). Established the
  3-generic `useForm<z.input, unknown, z.output>` pattern for `z.coerce`/`z.preprocess` schemas. Verified:
  15/15 `useForm` files pass a `zodResolver`; no `safeParse` remains. **Remaining (Phase 2 tail + 3):**
  (a) ~8 validation messages are hardcoded English where no i18n key existed — `contact-support-modal`
  (2), `receipt-modal` (2 amount msgs), `mark-paid-modal` (paidDate), `loyalty-card-modal` (2),
  `use-sign-in` (password), `recurring-expense-modal` (`dayOfMonth` "1-31"), `announcement-modal`
  (`linkText` max) — key these in EN+SR; (b) the remaining non-modal **plain-`useState`** forms not yet on
  RHF: `settings/profile`, `groups/settlement-modal`, `groups/group-detail-modal` (invite email),
  `rating/rate-app-modal`, `receipts/pfr-entry-modal`, `verify-email` resend; (c) the Phase-3 ESLint/CI
  guardrail. **Auth especially needs a manual login/submit QA pass (EN + SR) before merge.**

> **Audit pass 2026-06-04** added TD-4–TD-8 and appended "Audit update" corrections to TD-1/TD-2/TD-3
> from a full consistency review of the post-redesign frontend (component reuse, design-system adherence,
> empty states, icon/UI consistency, forms, and API calling).

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

### Audit update (2026-06-04) — inventory corrections

A full form sweep found the original write-up **undercounts the scope**. Fold these into the plan:

- **It's four patterns, not three, across ~22 forms (not 12).** The two omitted patterns are both
  plain `useState`:
  - **Plain `useState` + silent guard** (blocks submit, shows no message):
    `components/groups/settlement-modal.tsx:80`, `components/groups/group-detail-modal.tsx:70`
    (invite email, no format check), `components/loyalty-cards/loyalty-card-modal.tsx:131`.
  - **Plain `useState` + NO validation at all:** `hooks/auth/use-sign-in.ts` + `pages/auth/sign-in.tsx`
    (form is `noValidate`), `hooks/auth/use-forgot-password.ts` + `pages/auth/forgot-password.tsx`,
    `pages/auth/verify-email.tsx` (resend; `!email` gate only), `pages/settings/profile.tsx`,
    `components/rating/rate-app-modal.tsx`. `components/receipts/pfr-entry-modal.tsx:44` is the
    best of this group (manual but localized messages).
- **Some of the "10 RHF" forms barely validate** — don't assume "inline `required`" means real
  coverage:
  - `components/receipts/receipt-modal.tsx` (the most-used data-entry form): `storeName` register has
    **no `required`** (only an `onBlur`, `:341`), `totalAmount` has **no rule** (`:364`), and the form
    **never reads `formState.errors`** — RHF is state plumbing only, effectively unvalidated.
  - `components/recurring-expenses/mark-paid-modal.tsx:153` has only `{ min: 0.01 }`, no `required`.
  - Message handling is itself inconsistent across the 10: localized `required: t(...)` (template,
    warranty, recurring, category, create-user) vs bare `required: true` with no message (announcement,
    group) vs **hardcoded English** strings (`components/support/contact-support-modal.tsx:84,101`).
- **The password policy is duplicated in FOUR places**, not one (any policy change must touch all):
  `hooks/auth/use-sign-up.ts:13`, `hooks/auth/use-reset-password.ts:10`,
  `components/glass/glass.tsx:115` (`scorePassword`), and a hand-rolled regex copy at
  `pages/settings/account.tsx:43`. Phase 0 should extract a single shared password rule/constant.
- **Plan impact:** Phase 1's 10-form inventory is the floor, not the ceiling — also schedule the ~8
  missed plain-`useState` forms (notably the auth set in Phase 2) and the password-rule consolidation.

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

### Audit update (2026-06-04) — verified + additions

The 2026-06-04 inventory above **verified accurate at every cited file**. The audit added:

- **Divergence among the "already Glass" pages is real and measurable:** receipts uses a **dashed**
  card + **elevated 72px** tile (`pages/receipts/index.tsx:437`, tile `bg-card shadow-glass-2`,
  `size-[72px]`, `rounded-[18px]`), while categories/warranties/recurring/loyalty use a **solid** card
  + **recessed 76px** tile (`pages/categories/index.tsx:167-168`, `bg-bg-subtle`, `size-[76px]`,
  `rounded-3xl`). Settling this dashed-vs-solid + 72-vs-76 split is part of Phase 0.
- **"Upgrade `WidgetEmpty` once fixes all dashboard widgets" is overstated** — two widgets build their
  own `<Card>` empty and bypass `WidgetEmpty` entirely, so they need separate migration:
  `components/dashboard/savings-opportunities.tsx:40-56`, `components/dashboard/frequent-items.tsx:64-70`.
- **Two price-tracker sub-cards `return null` when empty** (no empty state at all — a net-new add, not a
  restyle): `components/items/savings-card.tsx:22`, `components/items/shopping-insights.tsx:46`.
- **Two more legacy empties not previously listed:** `components/announcements/announcement-list.tsx:47-51`
  (drawer) and `components/coach/coach-card.tsx:298` (no-insights branch, bare text inside a glass card).
- **Net:** the app currently ships **four distinct empty-state vocabularies**. The `<EmptyState>` primitive
  proposed in "Approach" is the right fix and is shared with **TD-7** (primitive extraction) — coordinate
  the two so it's defined once.

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

### Audit update (2026-06-04)
- **Confirmed still open.** `components/ui/avatar.tsx:58` renders the no-image fallback as
  `rounded-full bg-primary text-primary-foreground`. Because accent is now emerald-locked app-wide,
  every avatar (sidebar, mobile header, profile, group lists, admin) shows a solid **emerald** bubble
  instead of the sanctioned `cyan→violet` gradient. The cited line range (55-65) and claim hold.

---

## TD-4 · Finish the Glass migration for the orphaned screens (groups, price-tracker, templates, admin)

**Priority:** Medium · **Status:** Not started

### The standard (target state)
Every user-facing screen composes from the Glass foundation (`components/glass/`, the feature
`*/primitives.tsx`, `GlassDialog`, the `.t-*` type scale, design tokens) exactly like the migrated
cycles (auth, receipts, categories, warranties, recurring, loyalty, dashboard, settings, nav shell).
No screen renders raw shadcn `Card`/`CardTitle` chrome, raw `Dialog`/`Drawer` overlays, ad-hoc
`text-2xl/3xl font-bold` headings, or off-token `bg-primary/5|10` / `text-gray-*` tints.

### Why this is debt (current state)
The screen-by-screen rollout never reached four feature areas; they're orphaned on the pre-Glass
shadcn look (verified 2026-06-04):

- **Groups (HIGH — most user-visible gap):** `pages/groups/index.tsx` (`text-2xl font-bold` `:76`,
  `bg-primary/5 border-primary/20` `:99`, legacy `Card`), `pages/groups/[id].tsx`, and the overlays
  `components/groups/group-modal.tsx` (raw `Dialog` + hand-rolled `useIsMobile`/`AlertDialog`),
  `group-detail-modal.tsx:154`, `settlement-modal.tsx:121` (all raw `Dialog`). Detail tabs are all
  legacy. `pages/groups/join.tsx` is a standalone non-glass page (`text-lg font-semibold` `:50`).
- **Items / Price Tracker (HIGH):** `pages/items/index.tsx` (shadcn `Card` stat grids `:244-280`,
  `text-2xl font-bold` `:126,210`, `bg-primary/10` circles `:136,149`, `Loader2` spinner `:238`),
  `pages/items/[id].tsx` (raw `AlertDialog` delete `:8-15`), `components/items/*`.
- **Templates:** `components/templates/template-modal.tsx:4-11` (raw `Dialog`), legacy
  `templates-table.tsx`, `pages/templates/index.tsx:58` (`text-2xl font-bold`).
- **Admin (LOW — internal only, defer):** all `pages/admin/*` + `components/admin/*` (legacy headers,
  raw `Dialog` in `announcement-modal`/`create-user-modal`, the only raw `Drawer` consumer
  `user-details-drawer.tsx:4`, literal palette colors `bg-emerald-100`/`bg-amber-100` in
  `ratings-table.tsx`).

**Cross-cutting (not screen-bound):**
- Secondary **dashboard widgets** still carry off-token literals despite the dashboard cycle:
  `components/dashboard/category-insights.tsx:81,114,179`, `savings-opportunities.tsx:70,86,98,101`
  (`text-green-*`, `bg-purple-900`), `frequent-items.tsx:33`.
- `components/receipts/receipt-viewer-modal.tsx` is documented as migrated but still imports raw
  `ui/dialog` (`:3-10`).

### Migration plan (phased)
- [ ] **Phase 1 — Groups** (page + `[id]` + the 3 modals + detail tabs + `join`). Highest visibility.
- [ ] **Phase 2 — Price Tracker** (`items/index`, `items/[id]`, `components/items/*`).
- [ ] **Phase 3 — Templates** (modal + table).
- [ ] **Phase 4 — Cross-cutting** dashboard widget tints + `receipt-viewer-modal`.
- [ ] **Phase 5 — Admin** (lowest priority).

Reuse the existing feature `primitives.tsx` patterns and `GlassDialog`; coordinate empty states with
TD-2 and shared primitives with TD-7.

### Acceptance criteria
- No feature page imports `ui/dialog`/`ui/drawer` directly (overlays use `GlassDialog`/`ConfirmDialog`).
- No `text-2xl/3xl font-bold` headings in feature pages (use `.t-*`); no `bg-primary/5|10` /
  `text-gray-*` / literal palette tints.
- The four areas visually match the migrated cycles.

### Out of scope
- Form-validation rework on these screens (that's TD-1); money/date utils (TD-5); icon unification (TD-6).

---

## TD-5 · Centralize money & date formatting (+ fix the Serbian-date i18n bug)

**Priority:** High · **Status:** Not started

### The standard (target state)
**One** money formatter and **one** date formatter, both locale-aware (EN/SR), imported everywhere.
No component declares its own `const formatAmount`/`formatDate`. Currency conversion flows through the
single money helper.

### Why this is debt (current state)
- **Money — no single formatter; ~20+ reimplementations in two inconsistent formats.** `lib/utils.ts:8`
  exports a `formatAmount(amount, decimals)` that is **dead code (zero imports)**. The real currency
  display splits into two visually different camps:
  1. `Intl.NumberFormat('sr-RS', { style:'currency', currency, …0 digits })` — copied in ~20 places
     (`hooks/currencies/use-currency-converter.ts:89` — the only one that also *converts* —
     `components/coach/coach-card.tsx:20`, the dashboard widgets, all `components/groups/*`,
     `components/items/*`, and pages `dashboard/index.tsx`, `recurring-expenses/index.tsx:160`, etc.).
  2. `Math.round(...).toLocaleString('sr-RS') + ' ' + currency` (no `style:currency`) —
     `components/receipts/primitives.tsx:9` (`Amount`), `components/categories/primitives.tsx:17`
     (`fmtBudget`), `category-modal.tsx:46`, `category-delete-modal.tsx:131`, `pages/categories/index.tsx:112`.

  → categories/receipts and groups/dashboard render money differently side-by-side.
- **Date — a real i18n correctness BUG.** `lib/date-utils.ts:9,26` hardcode `toLocaleString('en-US', …)`,
  so **Serbian users see English month names** ("Dec", not "дец") even though the app is EN/SR. Plus
  three local `formatDate` redefinitions (`components/groups/activity-feed.tsx:36`,
  `settlement-history.tsx:33`, `pages/dashboard/index.tsx:180`) and ad-hoc `toLocaleDateString` calls
  (`category-delete-modal.tsx:134`, `upcoming-recurring.tsx:62`) bypass the util.

### Migration plan (phased) — ✅ ALL PHASES DONE (2026-06-04)
- [x] **Phase 0 — Date bug fixed.** `lib/date-utils.ts` derives the locale from `i18n.language` via a
  `dateLocale()` helper instead of hardcoding `en-US`; signatures unchanged so all ~12 call sites are
  untouched. **Script decision resolved → Latin:** `dateLocale()` returns `sr-Latn-RS` (renders "dec",
  not Cyrillic "дец") to match the app's Latin Serbian UI, and the date-fns consumers were swept to the
  Latin locale too — `expense-feed.tsx` and `ui/date-picker.tsx` now import `srLatn` (not `sr`), and the
  groups relative-time helpers (`activity-feed.tsx`, `settlement-history.tsx`) use `srLatn`.
- [x] **Phase 1 — `formatMoney(amount, currency)` added to `lib/utils.ts`.** Canonical format =
  `Intl.NumberFormat('sr-RS', { style:'currency', currency, 0 digits })` + `Math.round` (the dominant
  existing shape; `sr-RS`/`sr-Latn-RS` are identical for money). Param type widened to
  `number | string | null | undefined` since API amounts arrive as strings. The dead
  `formatAmount(amount, decimals)` was replaced by it. `use-currency-converter`'s `formatConverted`
  now delegates to `formatMoney`.
- [x] **Phase 2 — ~24 money sites swept** to `formatMoney` across groups, dashboard, coach, items,
  admin, categories, receipts, recurring (done via a partitioned 4-way agent sweep). Local
  `Intl.NumberFormat` closures removed or reduced to thin currency-default wrappers. **Two presentational
  primitives left intentionally:** `receipts/primitives.tsx` `Amount` (styled `{n} {currency}` span,
  cross-feature, emits the raw code) keeps its `toLocaleString('sr-RS')` grouping — it is NOT collapsed.
- [x] **Phase 3 — date scatter cleaned.** Local `formatDate` redefinitions (`dashboard/index.tsx`,
  groups) and ad-hoc `toLocaleDateString` (`upcoming-recurring.tsx`, `category-delete-modal.tsx`) now use
  `@/lib/date-utils` where month-day-year equivalent, or were flipped to `sr-Latn-RS` where a different
  shape was needed.

**Verified:** `tsc -b` clean + `npm run build` exit 0.

**Behavior consequence (noted):** `formatMoney` rounds to **whole units (0 decimals)**, the app's
dominant convention. A few sites that previously showed 2 decimals — group **settlements/balances**,
**activity feed**, and **admin** spending — now render rounded. Display only; settlement/conversion MATH
is untouched. If cents matter for EUR/USD settlements, give `formatMoney` an optional `digits` arg and
pass `2` at those sites (a follow-up, not done here).

### Acceptance criteria — met
- A single money util (`formatMoney`) used app-wide; remaining closures are thin delegators; one
  consistent money format (the lone exception is the deliberately-styled `Amount` primitive).
- `date-utils` is locale-aware and **Latin**; SR users see Serbian Latin months; no stray local
  `formatDate` redefinitions; all date-fns consumers use `srLatn`.

### Out of scope
- `date-fns` `format()` for `HH:mm` / English chart axes (reasonable as-is); backend amount/currency
  storage. Optional `digits` arg on `formatMoney` for 2-decimal settlement display (follow-up).

---

## TD-6 · Unify icon, loading, and confirmation vocabulary

**Priority:** Medium · **Status:** Not started

### The standard (target state)
One lucide icon per action (documented in `design-system.md`), one loading mechanism (shared
`Skeleton`/`Shimmer`), and all destructive confirmations via the shared `ConfirmDialog`.

### Why this is debt (current state)
The high-traffic CRUD verbs are already consistent (Add `Plus`, Edit `Pencil`, Delete `Trash2`,
Close `X`, Warning `AlertTriangle`; toasts all `sonner`; `ConfirmDialog` widely adopted; no
`window.confirm`). The gaps (verified 2026-06-04):

- **Same action, different icon:**
  - Success/check — `CheckCircle2` (dashboard) vs `CircleCheck` (auth) vs **deprecated** `CheckCircle`
    (`group-balances-tab.tsx:227`, `category-budget-progress.tsx:117`).
  - Error — canonical `CircleAlert` vs `AlertCircle` (`groups/join.tsx:48`, `recurring/primitives.tsx:33`).
  - "More" menu — `MoreVertical` (kebab standard) vs `MoreHorizontal` (`expenses-mobile-header.tsx:100`,
    `mobile-tab-bar.tsx:84`) vs `EllipsisVertical` (`app-sidebar.tsx:373`).
  - Filter — `SlidersHorizontal` (app) vs `Filter` (`admin/users-table.tsx:210`).
  - Currency — `Coins` vs `DollarSign` vs `CircleDollarSign`; Import — `Upload` vs `UploadCloud`.
- **Loading is three mechanisms:** shared `Skeleton`/`Shimmer` (redesigned screens) vs hand-rolled
  `animate-pulse bg-bg-subtle` blocks (`categories/index.tsx:143`, `recurring-expenses/index.tsx:242`,
  warranties' local `SkeletonCard`) vs `Loader2` page spinners (groups, items, admin).
- **Two raw `AlertDialog` delete confirmations** bypass `ConfirmDialog`: `components/groups/group-modal.tsx`,
  `pages/items/[id].tsx`.
- **Ad-hoc action `<button>`s with literal palette colors** that should be the shared `Button` + tokens:
  `components/admin/ratings-table.tsx:146-219`, `components/coach/coach-card.tsx:78,122`.
- **Icon sizing conventions vary** by migration era (`size-4` vs `h-4 w-4` vs `size-[18px]`) — polish only.

### Migration plan (phased)
- [ ] **Phase 0** — pick the canonical icon per action and add an "Action → icon" table to
  `docs/design-system.md`.
- [ ] **Phase 1** — sweep the deprecated/odd icons (`CheckCircle`→`CheckCircle2`/`CircleCheck`,
  `AlertCircle`→`CircleAlert`, unify "more" + filter).
- [ ] **Phase 2** — replace hand-rolled `animate-pulse` skeletons + page `Loader2` with shared
  `Skeleton`/`Shimmer`; route the two `AlertDialog`s through `ConfirmDialog`.
- [ ] **Phase 3** — convert the ad-hoc action `<button>`s to `Button` + tokens (overlaps TD-4 admin).

### Acceptance criteria
- One icon per action, documented; no deprecated `CheckCircle`/`AlertCircle`; single "more" + filter icon.
- All destructive confirms use `ConfirmDialog`; loading uses the shared skeleton.

### Out of scope
- Legitimate semantic variants (`UserPlus` for invite, `CalendarClock` for recurring, pagination chevrons).

---

## TD-7 · Extract shared list/empty/action primitives into `components/glass/`

**Priority:** Medium · **Status:** Not started

### The standard (target state)
The handful of patterns repeated across every list feature live **once** in `components/glass/`; feature
folders keep only domain logic (status→tone maps, color palettes, emoji derivation). No feature imports
another feature's `primitives.tsx`.

### Why this is debt (current state)
The cross-cutting shells are genuinely shared (`GlassDialog`, `PageToolbar`, `ThemeSegmented`,
`fab-action-sheet`, `dashboard/primitives.tsx`). But each redesign cycle was built by copying the
previous feature's `primitives.tsx`, so the same five patterns exist in 3–4 near-identical copies
(verified 2026-06-04):

- **Status/urgency pill** — 3 implementations of identical chrome: `receipts/primitives.tsx:85`
  (`StatusBadge`), `recurring-expenses/primitives.tsx:42` (`DueBadge`), `warranties/primitives.tsx:72`
  (`StatusBadge`).
- **`RowActionList` kebab menu** — 4 near-clones: `recurring/primitives.tsx:78`, `categories:121`,
  `loyalty:71`, `warranties:235` (`CardActionList`) — plus the per-page `GlassDialog`-wraps-action-list
  mobile sheets (categories/recurring/warranties/loyalty index pages).
- **Full-page empty-state markup** — reproduced in `categories/index.tsx:167`, `recurring:259`,
  `warranties:296` (+ receipts/items variants). **No shared `<EmptyState>` exists** (shared with TD-2).
- **`AddButton`** — defined 4 separate times, never shared (`categories/index.tsx:19`,
  `loyalty:28`, `recurring:33`, `warranties:50`).
- **`ColorSwatches` picker** — `categories/primitives.tsx:79` ≈ `loyalty/primitives.tsx:33`.
- **List container/row** — byte-identical `RecurringList`/`CategoryList` shells + `ExpenseRow`/
  `RecurringRow`/`CategoryRow` skeletons.

**Cross-feature import smell:** `components/recurring-expenses/primitives.tsx:19` imports
`Amount`/`CatTile`/`CatName` from `components/receipts/primitives` (also `mark-paid-modal.tsx:12`,
`payment-history.tsx:5`) — these were recognized as shared but parked in a feature folder.

### Approach / migration plan (ranked by leverage)
- [ ] **Promote `Amount`, `CatTile`, `CatName`, `SelectCheck`, `StatusBadge` → `components/glass/`** and
  repoint receipts + recurring (kills the cross-feature import).
- [ ] **`StatusPill` (tone + icon + label)** in glass — collapses the 3 badge implementations; features
  keep only their status→tone map.
- [ ] **`ActionList` + `ActionItem` + `ActionSheet`** — one menu primitive replaces the 4 `RowActionList`
  clones and the 4 mobile-sheet wraps.
- [ ] **`EmptyState`** (icon tile + title + desc + optional CTA) + a shared **`AddButton`** (shared with TD-2).
- [ ] **`GlassList` container + `ListRow` shell**; **`ColorSwatches`** with palette-as-prop.

### Acceptance criteria
- No feature imports another feature's `primitives.tsx`.
- Status pill, action menu, list container/row, empty state, AddButton, and swatch picker each defined once.

### Out of scope
- Legitimate domain variants (`CategoryCircle`, warranties `KindTile`, loyalty `CodeGlyph`) — they may
  share a `Tile` base but keep distinct wrappers; low priority.

---

## TD-8 · Close API hook-layer gaps (net-new endpoints that skipped the hooks layer)

**Priority:** Low · **Status:** Not started

### The standard (target state)
Every backend call goes through a `hooks/<resource>` hook using `api.*` + TanStack Query with keys from
the centralized `lib/query-keys.ts` factory. (Context: the API layer is otherwise the **cleanest part
of the app** — one axios chokepoint, ~99% centralized keys, uniform invalidation. This is a tidy-up, not
a remediation.)

### Why this is debt (current state)
A small, countable set of net-new endpoints skipped the hook layer (verified 2026-06-04):

- **Inline `api.post` in components** (no hook): `pages/auth/verify-email.tsx:33,52`,
  `pages/auth/check-email.tsx:40` (`/auth/verify-email`, `/auth/resend-verification`),
  `pages/groups/join.tsx:26` (`/groups/join/:code`).
- **Inline `useQuery` + literal key in a component:** `components/dashboard/category-insights.tsx:26`
  (`['categorization-accuracy']` + inline `api.get`).
- **Two unregistered query keys** (in a hook, but not in the factory): `['categorization-accuracy']`
  and `['exchange-rates', base]` (`hooks/currencies/use-currency-converter.ts:55`).

(Not debt: `use-currency-converter.ts:19` calls the external `open.er-api.com` directly — correct, it's
not the Receipto backend.)

### Migration plan
- [ ] Add `useVerifyEmail` / `useResendVerification` / `useJoinGroup` mutation hooks and a
  `useCategorizationAccuracy` query hook under `hooks/`.
- [ ] Register the two stray keys in `lib/query-keys.ts`.

### Acceptance criteria
- No `api.*` / `useQuery` / `useMutation` calls live inside `pages/` or `components/` (all via `hooks/`).
- Every query key resolves through the `queryKeys` factory.

### Out of scope
- The external exchange-rate `fetch`; any change to the (already-clean) `lib/api.ts` interceptor design.

---

## TD-9 · Standardize modal footers on the `GlassDialog` `actions` API

**Priority:** Medium · **Status:** 🟡 In progress (recurring modal = reference)

### The standard (target state)
Every `GlassDialog` modal passes its footer buttons through the **`actions` prop**
(`{ primary, secondary, destructive }`), not the raw `footer` prop. `GlassDialog` then lays
them out consistently per breakpoint:
- **Desktop:** right-aligned, `destructive` pushed to the far left (`mr-auto`).
- **Mobile:** full-width **stacked** big buttons (`h-12 rounded-xl`), order primary → secondary
  → destructive.

This fixes two recurring inconsistencies app-wide in one move: footers that drifted
**left-aligned** on desktop, and footers whose buttons stayed **small inline** on mobile
instead of full-width blocks.

### Why this is debt (current state)
Each modal hand-rolls its footer `<div className="flex …">`, so alignment and mobile sizing
are per-modal and inconsistent. `recurring-expense-modal.tsx` is migrated and is the
**reference**; the raw-`footer` modals still to migrate:

- `components/receipts/{assign-category-dialog,qr-scanner,import-guide-dialog,template-selector-modal,receipt-modal}.tsx`
- `components/ui/confirm-dialog.tsx` (shared — migrate carefully; it's used everywhere)
- `components/categories/{category-modal,category-delete-modal}.tsx`
- `components/warranties/{warranty-modal,warranty-import-dialog}.tsx`
- `components/recurring-expenses/{mark-paid-modal,payment-history}.tsx`
- `components/loyalty-cards/loyalty-card-modal.tsx`
- `components/rating/rate-app-modal.tsx`
- `pages/settings/account.tsx` (danger-zone sheet)

### Migration plan
- [ ] Per modal: replace `footer={<div className="flex …">…</div>}` with
  `actions={{ primary, secondary, destructive }}`, passing plain `<Button>`s (keep
  `form=`/`disabled`/`loading`/icon props on the buttons; drop the manual layout div + per-button
  `mr-auto`/`ml-auto`).
- [ ] `confirm-dialog.tsx` last (highest blast radius) — verify every confirm across the app
  after.

### Acceptance criteria
- No `GlassDialog` passes a raw `footer` of action buttons (the `footer` prop remains only for
  genuinely non-button footers, if any).
- Desktop footers are right-aligned; mobile footers are full-width stacked — verified on a
  representative modal in each area.

### Out of scope
- Any change to the `actions` layout contract itself; non-`GlassDialog` overlays.
