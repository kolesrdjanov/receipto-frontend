# 15 — Build order & sprint plan

The order in which to build code features, the dependencies between them, and a milestone-based roadmap. Use this as the master timeline; pair it with `14-kickoff-prompts.md` for the actual prompts that drive each step.

**Coordination with design**: each code milestone depends on the matching design output. The design milestones are scheduled in [`../design-handoff/14-build-order.md`](../design-handoff/14-build-order.md). The intended cadence is **design 1 milestone ahead of code** — design DM1 lands while code is on M0; design DM2 lands while code is on M1; etc. If design slips, code can start a milestone against this handoff's behavior spec but expect rework when design lands.

---

## Guiding principles

1. **Design lands ahead of code.** Every code milestone reads its matching `../design-output/*` folder. If the design isn't there yet, raise the flag — don't invent visual decisions.
2. **Skeleton before depth.** Get *all* screens reachable and navigable with placeholder content before any single screen is "complete." Catches navigation bugs early and gives stakeholders something to demo.
3. **Auth + Settings before everything else.** Without auth there's no data; without settings the theme system isn't real.
4. **Receipts list before scan.** The list is the proving ground for the receipt domain. Scan is the most complex feature; tackle it once everything around it is stable.
5. **Polish at the end, not throughout.** Don't iterate visual details on screen #1 while screens #2–8 are unbuilt. Polish pass is its own milestone.

---

## Dependency graph

```
                      ┌────────────────┐
                      │ M0  Foundation │
                      │  - bootstrap   │
                      │  - theme       │
                      │  - api / store │
                      │  - nav skeleton│
                      └───────┬────────┘
                              │
                      ┌───────▼────────┐
                      │ M1  Auth       │
                      └───────┬────────┘
                              │
                      ┌───────▼────────┐
                      │ M2  Settings   │
                      │  (skeleton +   │
                      │   theme test)  │
                      └───────┬────────┘
                              │
                      ┌───────▼────────┐
                      │ M3  Dashboard  │
                      │  (depends on   │
                      │   /currencies, │
                      │   /recurring   │
                      │   /upcoming —  │
                      │   but mock if  │
                      │   needed)      │
                      └───────┬────────┘
                              │
                      ┌───────▼────────┐
                      │ M4  Receipts   │
                      │  list+detail+  │
                      │  manual+pfr    │
                      └───────┬────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐   ┌────────▼────────┐
│ M5  Scan flow │    │ M6  Recurring   │   │ M7  Categories  │
└───────────────┘    └─────────────────┘   └─────────────────┘
                              │
                      ┌───────▼────────┐
                      │ M8 Loyalty cards│
                      └───────┬────────┘
                              │
                      ┌───────▼────────┐
                      │ M9  Polish &   │
                      │     release    │
                      └────────────────┘
```

M5 / M6 / M7 / M8 are loosely coupled once M4 is done — they can run in parallel if you have multiple agent sessions and review bandwidth.

---

## Milestones in detail

Each milestone lists: **scope, agents needed, prerequisites, definition of done**.

### M0 — Foundation

**Scope**:

- Expo project bootstrapped (`09-tech-stack.md`).
- Directory structure created.
- Theme system working end-to-end: a probe screen showing every token in light/dark × all 6 accents proves it.
- Auth, settings, dashboard Zustand stores ported. They rehydrate on cold start.
- `src/lib/api.ts` ported (single-flight refresh works under concurrent 401s — verify with an interceptor unit test).
- i18n initialized; `en.json` and `sr.json` copied; device-language detection working.
- `RootNavigator` decides between AuthStack and AppTabs based on `isAuthenticated`.
- 5 placeholder tab screens reachable.
- Deep link prefixes registered; opening `receipto://verify-email?token=x` lands on a placeholder VerifyEmail screen.

**Agents**:

- Claude Design: D0 (orientation), no screens yet.
- Claude Code: C0 (bootstrap).

**DoD**:

- App runs on iOS sim + Android emulator.
- Toggling theme/accent in a debug menu changes the probe screen.
- Cold start with a fake user already in AsyncStorage lands on AppTabs.
- `useAuthStore.getState().logout()` from a debug button routes to AuthStack.

---

### M1 — Auth

**Scope**: All 6 auth screens working against the real backend.

**Agents**: D1, then C0 (continued — bootstrap already includes minimal sign-in/up; this milestone finishes the rest).

**Prerequisites**: M0 complete.

**DoD**: All checklist items in `01-auth.md` pass. Especially: deep-link reset and verify flows work end-to-end with a real email.

---

### M2 — Settings (skeleton)

**Scope**:

- SettingsIndex → AppSettings / Profile / Account.
- Theme + accent + language + currency pickers work and persist.
- Profile fields editable; avatar upload works.
- Change password works.
- Delete account works (gated by typed "DELETE").
- Sign out works.

**Agents**: D5 (settings portion), then C1.

**Prerequisites**: M1 complete (need a logged-in user to test).

**DoD**: All checklist items in `08-settings.md` pass. Theme/accent persistence verified across cold start.

**Why this comes early**: This is where the theme system is *actually exercised*. If theme switching has bugs, you want to find them now — not after building 7 more screens.

---

### M3 — Dashboard

**Scope**: Full dashboard with 9 widgets per `02-dashboard.md`. Charts working. Currency conversion working. Edit mode persists.

**Agents**: D2, then C2.

**Prerequisites**: M2 complete.

**Backend dependencies**:

- `/dashboard/aggregated/*` endpoints
- `/currencies` (+ rates if exposed)
- `/recurring-expenses/upcoming` and `/recurring-expenses/summary` — note these belong to a feature we haven't built yet on the client. The endpoints exist on the backend; the *widget* works without the client recurring feature being built.

**DoD**: All checklist items in `02-dashboard.md` pass. The "Upcoming recurring" widget renders correctly even though the client recurring feature isn't built yet — tapping "Pay" can route to a "Coming soon" placeholder for now (it'll be wired in M6).

---

### M4 — Receipts (list + detail + manual + PFR)

**Scope**: Everything in `03-receipts.md` *except* the QR scanner. The Scan button can route to manual entry as a placeholder.

**Agents**: D3, then C3.

**Prerequisites**: M3 complete.

**DoD**: All non-scan checklist items in `03-receipts.md` pass. PFR entry creates a real receipt via the backend.

---

### M5 — Scan flow

**Scope**: Full scan flow per `06-scanning.md`. Camera, gallery, PFR all use the retry loop. PFR entry was built in M4 but is now wired to the retry-enabled mutation.

**Agents**: D4, then C5.

**Prerequisites**: M4 complete.

**DoD**: All checklist items in `06-scanning.md` pass, **including the four retry-loop unit tests**.

**Risk note**: This is the milestone where physical-device testing matters. The iOS sim doesn't have a working back camera; you'll need a real device for the camera path. Gallery + PFR can be tested on sim.

---

### M6 — Recurring expenses

**Scope**: Everything in `04-recurring.md`. The Dashboard's "Upcoming recurring" widget can now actually route to the Recurring list and the MarkPaid sheet.

**Agents**: D5 (recurring portion), then C4 (recurring portion).

**Prerequisites**: M4 complete (Dashboard's upcoming widget needs MarkPaid; M5 is independent of this).

**DoD**: All checklist items in `04-recurring.md` pass. Pay flow updates `nextDueDate` and refreshes the dashboard widget.

---

### M7 — Categories

**Scope**: Everything in `05-categories.md`, including the delete-with-reassignment flow.

**Agents**: D5 (categories portion), then C4 (categories portion).

**Prerequisites**: M4 complete (need receipts to test reassignment).

**DoD**: All checklist items in `05-categories.md` pass.

**Parallel-friendly**: M6 and M7 can run in parallel — independent code paths, both depend only on M4.

---

### M8 — Loyalty cards

**Scope**: Everything in `07-loyalty-cards.md`. Brightness boost on display modal verified on physical device.

**Agents**: D5 (loyalty portion), then C4 (loyalty portion).

**Prerequisites**: M4 complete (not technically — could be done after M2 — but the visual conventions are clearer once the receipt cards are built).

**DoD**: All checklist items in `07-loyalty-cards.md` pass. Camera scan of a real loyalty card (test with a supermarket card) successfully captures the format and value.

---

### M9 — Polish & release

**Scope**:

1. Visual sweep across all screens in light + dark × all 6 accents.
2. Accessibility audit (touch targets, labels, Dynamic Type).
3. Offline behavior (online manager wired, banner shown when offline).
4. Foreground refetch (focus manager wired).
5. List virtualization (FlashList where lists may exceed ~30 items).
6. Empty states everywhere.
7. App icon, splash, adaptive icon, store screenshots.
8. EAS preview build → internal TestFlight + Android internal.
9. Sentry sourcemaps uploading on every build.
10. Cold-start to first interactive frame timed and recorded as a baseline metric.

**Agents**: Claude Code C6.

**Prerequisites**: M1–M8 complete.

**DoD**:

- Every non-negotiable in `00-README.md` ticked off with evidence (a test or a manual verification note).
- TestFlight build live and at least one teammate has run the happy path on it.

---

## Sample sprint schedule

If running with one designer + one coder, half-time:

| Week | Design                  | Code                   |
| ---- | ----------------------- | ---------------------- |
| 1    | D0, D1                  | C0 (bootstrap)         |
| 2    | D2                      | C0 (cont) → M1 done    |
| 3    | D3                      | C1 (M2 settings)       |
| 4    | D4                      | C2 (M3 dashboard)      |
| 5    | D5 (recurring + categories) | C3 (M4 receipts)   |
| 6    | D5 (loyalty + settings polish) | C5 (M5 scan)    |
| 7    | (review pass on all)    | C4 (M6 + M7)           |
| 8    | (polish design tweaks)  | C4 (M8 loyalty)        |
| 9    | (release graphics)      | C6 (M9 polish)         |
| 10   | (App Store screenshots) | EAS submit             |

If running with multiple concurrent agent sessions and a reviewer who can keep up, M5/M6/M7/M8 collapse from 4 weeks to ~1.5.

---

## Risks to flag early

- **Backend endpoints not matching the contract** (`13-api-contract.md`). Catch this in M0/M1 by running real auth calls — if the auth shape is off, everything else is too.
- **Exchange-rate endpoint shape**. The contract lists it as "confirm with backend." If `/currencies/rates` doesn't exist, the Dashboard currency conversion needs a different strategy (server-side conversion at receipt creation, or client-side fixed rates). Resolve before M3.
- **Camera permissions on Android 12+**. Vision Camera has API differences across recent Android versions; test on a real device early in M5.
- **Push notifications strategy**. Out of v1 scope per `08-settings.md`, but if the product wants parity with web's email notifications, plan that work as a separate milestone after M9.
- **Loyalty card barcode rendering** for `data_matrix` / `aztec` / `pdf417`. RN library support is sparse. Fallback documented in `07-loyalty-cards.md`, but if real users have these formats it'll need addressing.
- **Fiscal portal scrape reliability**. The retry loop exists for a reason — the portal is flaky. Set expectations with the product side that ~5% of scans will hit `failed_terminal` even with retries.

---

## Stopping rules (do NOT do this even if tempted)

- **Don't refactor the web app to make porting easier.** The web app is shipped and stable. Port from it; don't change it.
- **Don't add features absent from the web app.** Tempting on mobile (offline-first, biometric unlock, share-to-app from another app, widgets) — all great, all v2. Ship the clone first.
- **Don't optimize before M9.** Premature perf work bloats early milestones. Measure first.
- **Don't bikeshed the design system tokens.** They're set in `10-design-system.md`. If they're wrong, fix them once in that doc and ripple — don't litigate per-screen.
