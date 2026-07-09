# CLAUDE.md — Receipto Frontend

React SPA for Receipto (receipt, warranty, budget, and group-expense tracking for the
Serbian/Balkan market). Deployed as a Render static site → https://app.receipto.io.
Talks to the NestJS backend (`../receipto-backend` — see its own CLAUDE.md):
`http://localhost:3000` in dev, `https://api.receipto.io` in prod, **no `/api` prefix**.

---

## Stack

React 19 · Vite 7 · TypeScript 5.9 (strict) · React Router DOM 7 · Zustand 5 +
TanStack Query 5 · Tailwind 4 + Radix/shadcn · React Hook Form + Zod 4 (`zodResolver`)
· i18next (EN/SR) · Recharts 3 · Framer Motion · `@react-oauth/google` · `@dnd-kit` ·
Sentry (`@sentry/react`) · Sonner (toasts) · Lucide icons

## Commands

```bash
npm run dev        # Vite dev server on 0.0.0.0:5173
npm run build      # tsc + vite build — also run by the husky pre-push hook
npm run lint       # NOTE: repo baseline is dirty; the gate is 0 NEW errors in files you touch
```

## Structure

```
src/
├── main.tsx              # Entry (Sentry, runtime guards, React root)
├── App.tsx               # Providers (QueryClient, Router, i18n, Google OAuth)
├── routes.tsx            # Routes behind ProtectedRoute / AdminRoute / FeatureRoute guards
├── pages/                # auth/, dashboard/, receipts/, templates/, categories/,
│                         # warranties/, groups/, items/, recurring-expenses/,
│                         # loyalty-cards/, settings/, admin/
├── components/
│   ├── layout/           # app-layout (sidebar + mobile nav), fab-action-sheet,
│   │                     # theme-segmented, language-switcher, auth-layout
│   ├── ui/               # shadcn components + currency-select, emoji-picker, …
│   ├── glass/            # Glass primitives — incl. the AUTH-ONLY Field (see rule 2)
│   ├── dashboard/focus/  # fixed two-column "Focus" dashboard modules
│   └── <feature>/        # per-feature components, usually with a primitives.tsx
├── hooks/                # TanStack Query hooks per resource
├── store/                # Zustand: auth.ts, settings.ts, fab.ts (global FAB takeover)
├── lib/                  # api.ts (axios + interceptors), query-keys.ts, utils.ts,
│                         # rank.ts, groups.ts (shared group-balance model)
└── i18n/                 # en.json + sr.json
```

## Read before writing code

1. `docs/conventions.md` — patterns, naming, structure rules
2. `docs/design-system.md` — the design system (tokens, type scale, primitives); now **"Luma"**
   (monochrome/Geist) — see `docs/luma-redesign-progress.md` for the Glass→Luma migration
3. `docs/tech-debt.md` — tracked debt (e.g. TD-1 RHF+Zod rollout, TD-9 GlassDialog
   `actions` migration); don't re-introduce solved problems

## Hard rules (hook/ESLint-enforced — violations get blocked)

1. **Buttons:** always the shared `<Button>` (`components/ui/button.tsx`); never a
   hand-rolled `<button>` with button styling or a parallel button component. Add a
   variant (`brand`/`glass`/`destructive-soft`/…) instead. The radius default is
   `rounded-xl` — never add `className="rounded-xl"` to a Button. (PostToolUse hook +
   ESLint rule.)
2. **Form inputs:** app forms use the 40px shadcn `<Input>`/`<Textarea>` from
   `@/components/ui` with the `fieldLabel` label class. The glass `<Field>`/
   `<PasswordField>` (`@/components/glass/glass`) are the 50px **AUTH-only** inputs
   (`src/pages/auth` + `src/components/auth`); never use them in feature code.
   (ESLint `no-restricted-imports` + `.claude/hooks/no-glass-field.sh`.) Canonical
   form modal: `components/receipts/receipt-modal.tsx`.
3. **Currency dropdowns:** always the shared `<CurrencySelect>` — emoji flag via
   `getCurrencyFlag(currency.icon)` (not `.code`), `variant` compact/full,
   `triggerClassName` to size. Never a hand-rolled `<Select>` over `useCurrencies()`.
4. **Overlays:** `GlassDialog` (desktop modal / mobile sheet; prefer its `actions`
   footer API) for every dialog or sheet; `ConfirmDialog` for destructive confirms.
5. **Forms:** React Hook Form + Zod via `zodResolver` is the standard. Gotcha:
   `z.coerce`/`z.preprocess` schemas need `useForm<z.input<S>, unknown, z.output<S>>`.
6. **i18n:** every user-facing string is keyed in BOTH `en.json` and `sr.json` —
   never skip Serbian.
7. There is **no Checkbox component** — use toggleable button chips for multi-select.

## Design system — "Luma" (the whole app is on it)

- **Monochrome, near-black primary — no accent color.** The app migrated from the old
  emerald **"Glass"** system to flat, monochrome **"Luma"** (Geist type, 1px hairlines,
  minimal shadow). Base `--primary`/`--ring` are neutral near-black (light) / near-white
  (dark); `--success`/`--warning`/`--info` and the `--brand-*` stops are neutralized. **Red
  (`--destructive`) is the only chromatic accent, reserved for destructive/expired/you-owe
  states.** Don't resurrect per-user accents or emerald. Category **and** loyalty-card colors
  are the retained per-item color exception (data-driven hex, independent of tokens). Charts
  are monochrome (grey + near-black peak), not emerald.
- OKLCH tokens via CSS variables; all Tailwind v4 config lives in `index.css`.
  **Geist** display/body + **Geist Mono** (`--font-mono`, `.t-num`); radius base 0.625rem;
  two-tier shadow (`--shadow-1`/`--shadow-2`). See `docs/luma-redesign-progress.md` for the
  full migration record.
- Dashboard is the fixed two-column **"Focus"** layout
  (`components/dashboard/focus/`) — the customizable widget grid was retired; don't
  re-add widget plumbing.
- Mobile: PWA safe areas, no top bar (the language switcher lives in the More-drawer
  footer), global FAB takeover via `store/fab.ts`, row-tap = smart-open.
- Theme: light/dark/system via the shared `ThemeSegmented` → settings store,
  persisted under the `receipto-settings` localStorage key.

## Data & auth

- Auth is **passwordless email OTP** (request-code → verify-code; sign up = log in)
  plus Google sign-in. `lib/api.ts` axios interceptors attach the Bearer token and
  auto-refresh on 401 (singleton refresh promise). Auth state persists under the
  `auth-storage` Zustand key.
- Server state lives in TanStack Query hooks (`hooks/`, keys in `lib/query-keys.ts`);
  client state in the three Zustand stores. The dashboard always uses the
  `/dashboard/aggregated/*` endpoints and converts to the display currency
  client-side (`convertedAmount = amount / rates[originalCurrency]`, rates fetched
  with base = display currency).
- Feature flags: `useFeatureFlags()` (5-min stale) + `FeatureRoute` guard — defaults
  to enabled while loading. A new feature-gated module needs a backend flag in
  `app_settings` too.

## Env (`.env`)

```bash
VITE_APP_API_URL=http://localhost:3000   # prod: https://api.receipto.io
VITE_GOOGLE_CLIENT_ID=xxx                # optional — Google button hidden if unset
VITE_SENTRY_DSN=xxx                      # optional
```

## Verifying changes in a browser preview

- Backend CORS allows **only :5173** in dev — a preview served on another port can't
  reach the API. Inject a fake/minted `auth-storage` token to render protected pages.
- `preview_resize` with a named preset can collapse the viewport (`innerW: 1`) —
  always pass explicit width/height.
- Framer Motion sheets can rAF-freeze mid-animation in headless previews — force
  `transform: none` to inspect the rest state.

## Design context (condensed)

Everyday people in Serbia/the Balkans tracking household expenses — often on mobile,
often in a hurry. Brand: friendly, smart, reliable; calm fintech polish (Apple-level
restraint, Revolut/Monzo data clarity), never flashy. Principles: clarity over
cleverness · quiet confidence · data speaks first · consistent & predictable ·
mobile-native one-handed use. Accessibility target: WCAG AA.
