# Frontend Tech Debt

A standing register of known frontend tech debt and its remediation plans. Each item has a
stable ID (`TD-N`), a current/target state, and a concrete migration plan. Add new items at
the bottom; don't renumber existing ones.

**Last updated:** 2026-06-04

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| TD-1 | Standardize all forms on React Hook Form + Zod | High | Not started |

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
