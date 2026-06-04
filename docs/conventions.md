# Receipto Frontend — Coding Conventions

**Read this before writing any frontend code.** These are the patterns to always follow for
consistency. (Backend/NestJS conventions live with the backend project; this doc is frontend-only.)

---

## File Organization
- Pages in `src/pages/<feature>/` (one file per route)
- Components in `src/components/<feature>/` (reusable pieces)
- Hooks in `src/hooks/<feature>/` (one file per resource, TanStack Query)
- New pages: add a lazy route in `routes.tsx`
- Shared design-system primitives in `src/components/glass/`; shadcn primitives in `src/components/ui/`

## State Management
- **Server state:** TanStack Query (all API data)
- **Global client state:** Zustand (`auth.ts` for auth, `settings.ts` for preferences, `fab.ts` for the FAB)
- **Local state:** React `useState`/`useReducer`
- Never mix: don't put API data in Zustand

## API Hooks Pattern
All network calls go through the single axios instance in `src/lib/api.ts` (`api.get/post/put/patch/delete`),
which handles auth-token attach, 401 refresh, and `Accept-Language`. Hooks are a **pure data layer** —
no toasts inside hooks; success/error UX lives at the call site.

```typescript
// src/hooks/<feature>/use-<feature>.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export function useFeatures() {
  return useQuery({
    queryKey: queryKeys.features.list(),
    queryFn: () => api.get<Feature[]>('/features'), // api.* returns parsed data, throws ApiError
  })
}

export function useCreateFeature() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFeatureInput) => api.post('/features', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.features.lists() }),
  })
}
```

- Don't call `api.*` / `useQuery` / `useMutation` directly inside a page/component — wrap it in a hook.
- Don't use raw `axios`/`fetch` outside `src/lib/api.ts` (the one exception: genuinely third-party APIs
  like the exchange-rate service).

## Query Keys
- Define in `src/lib/query-keys.ts` — structured as nested objects; never inline literal `['x', id]` arrays.
- Always invalidate related keys on mutations.

## Forms
**Standard: React Hook Form + Zod via `zodResolver` for every form** (`@hookform/resolvers/zod`).
The Zod schema is the single source of truth for both the form's shape and its validation —
never a hand-written parallel interface.

- One schema per form, colocated at the top of the component (or a sibling `*.schema.ts` for big
  forms). Derive the type: `type XForm = z.infer<ReturnType<typeof createXSchema>>` — don't hand-write it.
- i18n messages → build the schema with a `createXSchema(t)` factory, memoized: `useMemo(() => createXSchema(t), [t])`.
- Wire it: `useForm({ resolver: zodResolver(schema), defaultValues })`. Errors render from
  `formState.errors` (the glass `Field` has an `error` prop).
- **Gotcha — `z.coerce.number()` / `z.preprocess`:** the schema's input type ≠ output type, so a
  single-generic `useForm<z.infer<…>>` fails to typecheck. Use the 3-generic form:
  `useForm<z.input<S>, unknown, z.output<S>>` (and `onSubmit` receives `z.output<S>`).
- Custom controls (DatePicker, Select, CurrencySelect) bind via `<Controller>` (drop any `rules` —
  the schema validates). Plain shadcn inputs that forward refs take `{...register('x')}` directly.
- Map form → API DTO at the submit boundary only — no `as` casts.
- **Never** validate via inline `register(..., { required })` / `Controller rules`, and never reach
  for a hand-rolled `safeParse` on `useState`. Doing forms inconsistently is what created tech-debt
  TD-1 (see `docs/tech-debt.md`); the standard above is the resolution.

## UI Components & Design System
- Compose from the **Glass** design system (`src/components/glass/`, tokens in `src/index.css`) — see
  `docs/design-system.md`. Don't re-derive surfaces/overlays per screen.
- Overlays use `GlassDialog` (or the shared `ConfirmDialog`), not raw Radix `Dialog`/`Drawer`.
- Empty states use the shared `EmptyState` / `AddButton` (`components/glass/empty-state.tsx`).
- Headings/labels use the `.t-*` type scale, not ad-hoc `text-2xl font-bold`.
- Colors via tokens (`bg-primary-soft`, `bg-bg-subtle`, `--success/--warning/--info/--destructive-soft`,
  etc.) — never literal palettes (`bg-emerald-100`) or `bg-primary/10` tints. Accent is emerald-locked app-wide.
- shadcn/ui primitives in `src/components/ui/`; Tailwind via the `cn()` helper for conditional classes.
- Icons from `lucide-react` — one icon per action (Add `Plus`, Edit `Pencil`, Delete `Trash2`,
  Close `X`, success `CheckCircle2`, error `CircleAlert`, overflow `MoreVertical`, filter `SlidersHorizontal`).
- Money formatting via `formatMoney(amount, currency)` (`src/lib/utils.ts`); dates via
  `src/lib/date-utils.ts` (locale-aware). Don't re-derive `Intl.NumberFormat`/`toLocaleString` per file.
- Notifications via `sonner` (`toast.success()` / `toast.error()`).

## Internationalization
- Always use `t()` from `useTranslation()` for user-facing text.
- Add keys to BOTH `src/i18n/en.json` and `src/i18n/sr.json` — never skip Serbian. Serbian is **Latin** script.
- Nested key structure: `"feature.actionDescription"`.

## Protected Routes
- Wrap with `<ProtectedRoute>` for auth-required pages, `<AdminRoute>` for admin pages,
  `<FeatureRoute>` for flag-gated modules.

## Navigation
- Nav items are data-driven (`MONEY` / `WALLET` arrays) in `src/components/layout/app-sidebar.tsx`.
- Use Lucide icons for nav items.

---

## General Conventions

### Naming
- **Files:** kebab-case (`receipt-modal.tsx`)
- **Components:** PascalCase (`ReceiptModal`, `CoachCard`)
- **Hooks:** camelCase with `use` prefix (`useReceipts`, `useCreateReceipt`)
- **API routes (consumed):** kebab-case plural (`/receipts`, `/admin/settings`)

### TypeScript
- Frontend is ESM (Vite), strict mode. Use `z.infer` for form/contract types; interfaces for API
  response/DTO types.

### Git
- Conventional commit messages (`feat:`, `fix:`, `chore:`).
- The pre-push hook runs `npm run build` — keep the build green.

### After Making Changes
- Update the relevant `docs/` file if a pattern/architectural decision changed.
- Add translation keys (EN + SR) for any new user-facing text.
- Log new/changed tech debt in `docs/tech-debt.md`.
