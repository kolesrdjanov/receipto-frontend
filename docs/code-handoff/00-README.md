# Receipto Mobile — Code Handoff

This folder is the **single source of truth for implementing the React Native clone** of Receipto. It is written for **Claude Code** (or any implementation-focused agent / developer).

This is the **code half** of a two-part handoff. The **design half** lives in `../design-handoff/` and produces visual specs that land in `../design-output/`. Claude Code consumes both:

- **`../design-output/`** — visual source of truth (screen specs, component visuals, interaction details). Read this for "what does it look like and how does it feel?"
- **`../code-handoff/` (this folder)** — behavior, data, API, state, build order. Read this for "what does it do and how does it integrate?"

If the two ever disagree on a visual detail, **the design output wins**. If they disagree on behavior, this folder wins. If they disagree on both, the design output likely drifted from the spec — flag it.

---

## Web reference

The web app lives at `/Users/kole/workspace/receipto-frontend/`. Treat it as a **functional specification, not a code template**.

**Reuse from the web:**

- The REST API contract (endpoints, payloads, status enums)
- The domain model (Receipt, Category, Recurring Expense, Loyalty Card, User)
- The Zustand stores (verbatim — they're platform agnostic)
- The i18n JSON files (`src/i18n/en.json`, `src/i18n/sr.json`)
- The validation rules (Zod schemas — runs unchanged on RN)
- The retry loop algorithm (`src/hooks/receipts/use-receipt-scanner.tsx`)
- The axios setup including single-flight token refresh (`src/lib/api.ts`)

**Don't reuse:**

- Tailwind / shadcn / Radix / framer-motion / Vite — replace with RN equivalents
- `localStorage` → `AsyncStorage` (or `MMKV` for perf)
- React Router → React Navigation
- `react-barcode`, `qrcode.react`, `html5-qrcode`, `@yudiel/react-qr-scanner` → RN native equivalents (see `06-scanning.md`)

---

## Scope

The clone covers **only** these features. Everything else (Price Compare / Items, Savings, Warranties, Groups, Admin, Templates) is **out of scope** for v1.

| Feature           | Doc                                          | Visual spec in design-output                       |
| ----------------- | -------------------------------------------- | -------------------------------------------------- |
| Auth              | [`01-auth.md`](./01-auth.md)                 | `../design-output/auth/`                           |
| Dashboard         | [`02-dashboard.md`](./02-dashboard.md)       | `../design-output/dashboard/`                      |
| Receipts          | [`03-receipts.md`](./03-receipts.md)         | `../design-output/receipts/`                       |
| Scanning Receipts | [`06-scanning.md`](./06-scanning.md)         | `../design-output/scanning/`                       |
| Recurring         | [`04-recurring.md`](./04-recurring.md)       | `../design-output/recurring/`                      |
| Categories        | [`05-categories.md`](./05-categories.md)     | `../design-output/categories/`                     |
| Loyalty Cards     | [`07-loyalty-cards.md`](./07-loyalty-cards.md) | `../design-output/loyalty/`                      |
| Settings          | [`08-settings.md`](./08-settings.md)         | `../design-output/settings/`                       |

Cross-cutting:

| Topic                       | Doc                                       |
| --------------------------- | ----------------------------------------- |
| Tech stack & project setup  | [`09-tech-stack.md`](./09-tech-stack.md)   |
| Design system tokens (for implementation) | [`10-design-system.md`](./10-design-system.md) |
| Navigation                  | [`11-navigation.md`](./11-navigation.md)   |
| State, persistence, i18n    | [`12-state-and-i18n.md`](./12-state-and-i18n.md) |
| API contract                | [`13-api-contract.md`](./13-api-contract.md) |

Operations:

| Topic                       | Doc                                       |
| --------------------------- | ----------------------------------------- |
| Kickoff prompts (paste-ready) | [`14-kickoff-prompts.md`](./14-kickoff-prompts.md) |
| Build order & sprint plan   | [`15-build-order.md`](./15-build-order.md) |
| Code skeletons (App, navigators, theme, stores) | [`16-code-skeletons.md`](./16-code-skeletons.md) |

---

## How to use this handoff

**Fast path**:

1. Read `15-build-order.md` for the milestone sequence.
2. For each milestone, run the matching prompt from `14-kickoff-prompts.md`.
3. `16-code-skeletons.md` provides paste-ready starting code for the bootstrap milestone.

**Per-milestone routine**:

1. Read the relevant feature doc in this folder (e.g. `03-receipts.md`).
2. Read the matching visual spec in `../design-output/receipts/`.
3. Build to satisfy both. Match the design's visuals; respect this folder's behavior contracts.
4. Verify against the feature doc's acceptance checklist.

**Don't redesign**: the visual decisions are made in design-output. If a design feels wrong, flag it — don't silently rewrite.

**Don't reinvent the API**: the API contract is fixed by the backend (which serves the live web app). Match it exactly.

---

## Web ports to do verbatim

Some files in the web repo should be ported essentially unchanged. `16-code-skeletons.md` has full skeletons. Quick reference:

| Web file                              | Mobile location          | Changes needed              |
| ------------------------------------- | ------------------------ | --------------------------- |
| `src/store/auth.ts`                   | `src/store/auth.ts`      | Swap localStorage → AsyncStorage |
| `src/store/settings.ts`               | `src/store/settings.ts`  | Drop sidebarCollapsed; remove DOM class manipulation (ThemeProvider handles it) |
| `src/store/dashboard.ts`              | `src/store/dashboard.ts` | Drop widgetSizes; keep visibility + editMode |
| `src/lib/api.ts`                      | `src/lib/api.ts`         | Replace `import.meta.env.VITE_APP_API_URL` with `process.env.EXPO_PUBLIC_API_URL` |
| `src/lib/query-keys.ts`               | `src/lib/query-keys.ts`  | None — port verbatim       |
| `src/hooks/**`                        | `src/hooks/**`           | None — port verbatim       |
| `src/i18n/en.json`, `src/i18n/sr.json` | `src/i18n/`             | None — copy as data        |

---

## Non-negotiables

- **Status enum for receipts** is `'pending' | 'scraped' | 'failed' | 'manual' | 'completed' | 'recurring'` and must be preserved exactly.
- **The retry loop** for fiscal-portal scraping (7 attempts, delays `[0, 5s, 10s, 15s, 20s, 30s, 40s]`) must be implemented on the mobile client (the backend does not retry on its own). See `06-scanning.md`.
- **Token refresh** is single-flight and serialized — concurrent 401s must share one refresh promise. See `13-api-contract.md`.
- **Currency is a runtime string**, not an enum. Defaults are RSD/EUR/USD/BAM but the user picks from a server-provided list.
- **Two languages**: `en` and `sr`. Active language must be sent as `Accept-Language` on every request.
- **Theme system** has 3 modes (`light` / `dark` / `system`) **and** 6 accent colors (`zinc` / `blue` / `green` / `purple` / `orange` / `rose`). Both axes are independently configurable; persist both.

---

## Where each doc's section now lives

A note on the rebalancing: each feature doc previously had a "Visual / UX notes" section. Those design-spec details now live in `../design-output/` (produced by Claude Design). This folder's feature docs focus on:

- Data model
- API endpoints
- Hooks to port from the web
- State management
- Validation rules (the algorithm — the design spec covers the user-facing presentation)
- Edge cases
- Acceptance checklists

If you find a visual detail missing from a design-output file but you need it to implement, look at the corresponding `../design-handoff/*.md` (the spec the designer worked from). And if you find a critical behavior missing here, check the web reference files cited throughout.

---

## Glossary

- **PFR** — Poreska Fiskalna Računa: Serbian fiscal receipt identifier (3-part code: 8+8+6 chars).
- **Fiscal portal / SUF** — `suf.purs.gov.rs`, the Serbian tax authority's receipt registry. Receipt QR codes are HTTPS links into this portal which the backend scrapes to populate receipt data.
- **Scraped data** — The structured receipt fields extracted from the fiscal portal: line items, taxes, payment method, store address, full text journal, etc.
- **Journal** — The plaintext, monospaced printout of a fiscal receipt (preserved on the receipt detail screen as a "view full receipt" affordance).
