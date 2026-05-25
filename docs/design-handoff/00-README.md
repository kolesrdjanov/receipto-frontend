# Receipto Mobile — Design Handoff

This folder is the **single source of truth for designing the React Native clone of Receipto**. It is written for **Claude Design** (or any designer / design-focused agent).

The output of design work in this folder will later be handed to **Claude Code** along with a sibling code-implementation handoff (`../code-handoff/`). Your job is to produce the visual + interaction spec — Claude Code will translate it into running code.

---

## What you'll produce

For every feature in scope:

1. **Screen mockups** — every state of every screen (default / loading / empty / error / success), in **both light and dark mode**.
2. **Interaction notes** — what taps / swipes / long-presses do; what animations or haptics accompany them; how the keyboard behaves.
3. **State matrices** — a quick reference of what each screen looks like in each state.
4. **Component specs** — anything reusable (the receipt status badge, the category icon circle, the loyalty card thumbnail, etc.) documented once so it can be referenced across screens.
5. **Asset list** — fonts, icons, illustrations, app icon, splash screen requirements, store screenshots.

See [`13-deliverables.md`](./13-deliverables.md) for the exact output format and naming conventions.

---

## Scope

The clone covers **only** these features:

- **Auth** — sign-in / sign-up / forgot / reset / verify email
- **Dashboard** — KPIs, charts, recent receipts, upcoming recurring
- **Receipts** — list, detail, edit, manual entry, PFR entry
- **Scanning** — camera QR scan, gallery picker, retry flow
- **Recurring expenses**
- **Categories**
- **Loyalty cards**
- **Settings** — app, profile, account

**Out of scope** (do not design):

- Price Compare (Items) feature
- Savings module
- Groups
- Warranties
- Templates
- Admin
- Coach / AI insights beyond what's in the receipt suggestion card
- Announcements, ratings, in-app support form

---

## How to use this handoff

Read in this order:

1. [`01-overview.md`](./01-overview.md) — scope, glossary, key terms (PFR, fiscal portal, etc.)
2. [`02-design-system.md`](./02-design-system.md) — tokens, typography, spacing, common primitives. **This is your foundation; reference it constantly.**
3. [`03-navigation.md`](./03-navigation.md) — the 5-tab structure with center FAB, modal vs full-screen rules.
4. [`04-mobile-ux.md`](./04-mobile-ux.md) — gestures, haptics, sheets, keyboard handling, list interactions. **Read before designing any single screen.**

Then design feature by feature in this order (matches dependency chain):

5. [`05-auth.md`](./05-auth.md)
6. [`12-settings.md`](./12-settings.md) — design early to test theme system
7. [`06-dashboard.md`](./06-dashboard.md)
8. [`07-receipts.md`](./07-receipts.md)
9. [`08-scanning.md`](./08-scanning.md) — most complex flow, do after Receipts
10. [`09-recurring.md`](./09-recurring.md)
11. [`10-categories.md`](./10-categories.md)
12. [`11-loyalty.md`](./11-loyalty.md)

Operational docs:

- [`13-deliverables.md`](./13-deliverables.md) — what you produce, where it lives
- [`14-build-order.md`](./14-build-order.md) — the milestone schedule
- [`15-kickoff-prompts.md`](./15-kickoff-prompts.md) — paste-ready prompts for spinning up design sessions per feature

---

## Non-negotiables

These constraints come from the existing web product and must be honored:

- **Two themes × six accents.** Every screen must render in `light` and `dark` mode, and the user can pick one of six accent colors (`zinc`, `blue`, `green`, `purple`, `orange`, `rose`). Use the `primary` token everywhere — never hardcode color choices that would break under accent swap.
- **Two languages.** Copy will appear in English (`en`) or Serbian (`sr`). Serbian copy can run **30–40% longer** than English on some screens; design with this slack in mind.
- **Currency is a runtime string.** Don't hardcode currency symbols ("$" / "€") — money is rendered as `1,234.56 RSD`, `89.99 EUR`, etc.
- **Mobile-first.** Phones are the primary target (iOS + Android). Tablets are a bonus, not a constraint.
- **Bottom-tab navigation, not sidebar.** The web app uses a desktop sidebar — mobile uses a 5-slot bottom tab bar with a center FAB. See `03-navigation.md`.
- **Accessibility from the start.** Tap targets ≥ 44pt; contrast ≥ WCAG AA; works at 130% Dynamic Type.

---

## What you do NOT need to worry about

These belong to Claude Code:

- API endpoints, payload shapes, HTTP methods
- Hook names, Zustand stores, React Query setup
- TypeScript types and validation schemas (you do need the *rules* — e.g. "password must be 8+ characters" — but not the Zod code)
- The retry algorithm for the fiscal portal scrape (you do need the *states* it produces: scanning, retrying, failed — but not the JavaScript)
- Tech stack and library choices
- Build / release / TestFlight

If you find yourself wanting to specify those, you've drifted off course — refocus on the user-visible behavior.

---

## Glossary

- **PFR** — Poreska Fiskalna Računa: Serbian fiscal receipt identifier (a 3-part code: 8+8+6 chars).
- **Fiscal portal / SUF** — `suf.purs.gov.rs`, the Serbian tax authority's receipt registry. Receipt QRs link there; the backend scrapes for structured data.
- **Scraped data** — Structured receipt fields (line items, taxes, store address, journal text) extracted by the backend after a scan.
- **Journal** — Plain-text printout of a fiscal receipt, monospaced; preserved as a "view full receipt" affordance.
- **Receipt status** — One of: `pending`, `scraped`, `failed`, `manual`, `completed`, `recurring`. Each has a distinct badge color (see `07-receipts.md`).
