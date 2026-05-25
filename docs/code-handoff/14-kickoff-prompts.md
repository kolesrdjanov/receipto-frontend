# 14 — Kickoff prompts (Claude Code)

Paste-ready prompts to spin up Claude Code sessions for the Receipto React Native clone. Each prompt is **self-contained** — assume the receiving agent has read no prior context from this conversation.

Design prompts (for Claude Design) live in [`../design-handoff/15-kickoff-prompts.md`](../design-handoff/15-kickoff-prompts.md). Run those first; their outputs land in `../design-output/`, which these code prompts reference.

Each prompt expects:

- `docs/code-handoff/` (this folder) accessible to the agent
- `docs/design-output/` (the design agent's output) accessible to the agent
- `docs/design-handoff/` accessible too — Claude Code may need to look at the original spec a design output was working from

If the agent works in a separate RN repo, copy all three folders into that repo's `docs/` first.

---

## Conventions

- Each prompt names the **handoff doc(s)** the agent must read first AND the **design-output file(s)** for visual reference. Insist on this — it's the difference between coherent work and reinvented patterns.
- One prompt = one session. Pause to review between sessions.

---

## C0 — Project bootstrap

```
You are implementing the React Native clone of Receipto. Today's job is to
bootstrap the project and produce a runnable shell.

Read these docs first:
- docs/code-handoff/00-README.md
- docs/code-handoff/09-tech-stack.md
- docs/code-handoff/16-code-skeletons.md  (paste-ready skeletons for App.tsx,
  navigators, theme, stores, api)
- docs/code-handoff/12-state-and-i18n.md

And these design outputs:
- docs/design-output/design-tokens.md  (the finalized tokens)
- docs/design-output/shared-components.md  (visual spec for every primitive)
- docs/design-output/navigation/tab-bar.md
- docs/design-output/navigation/fab.md
- docs/design-output/navigation/headers.md

Do, in this order:

1. Initialize a new Expo project (managed, latest stable SDK, TypeScript
   template).
2. Install dependencies per 09-tech-stack.md "Recommended additional libraries"
   plus the substitution table. Don't install vision-camera / barcode libs yet —
   those come with the scan feature.
3. Set up the directory structure per 09-tech-stack.md.
4. Port verbatim into src/store/:
     - auth.ts (use AsyncStorage)
     - settings.ts (drop sidebarCollapsed; the system-scheme listener moves
       to ThemeProvider)
     - dashboard.ts (keep visibility + editMode only)
   Port the rehydration self-healing logic exactly.
5. Port src/lib/api.ts verbatim — same single-flight refresh, same ApiError.
   Use process.env.EXPO_PUBLIC_API_URL.
6. Port src/i18n/{en.json,sr.json,index.ts} from the web repo. Init i18next
   with expo-localization for device default.
7. Build the ThemeProvider per 10-design-system.md and 16-code-skeletons.md —
   it reads theme + accent from the store and provides a flat theme object.
   Also wire up NativeWind v4 if you choose that path (recommended).
8. Build RootNavigator + AuthStack + AppTabs (per 11-navigation.md +
   16-code-skeletons.md + the design output's navigation specs). The center
   tab is a fake tab that opens the Scanner modal — leave the Scanner screen
   as a "Scanner placeholder" for now.
9. Build placeholder screens for all 5 tabs (Dashboard, Receipts, Recurring,
   More) — just titles + "coming soon", but the routing must work.
10. Sign-in and sign-up screens working enough to authenticate against the
    real backend (read 01-auth.md AND design-output/auth/sign-in.md and
    sign-up.md). Tokens persist; on relaunch the user lands on AppTabs.
11. Configure deep links per 09-tech-stack.md + 11-navigation.md. Test that
    `receipto://verify-email?token=foo` lands on the (still-placeholder)
    VerifyEmail screen.
12. Build the shared UI primitives in src/components/ui/ per
    design-output/shared-components.md (Button, Card, Input, Badge, etc.).
    These will be used by every later milestone.

Stop after step 12. Do NOT start any other feature. End your turn by reporting:
- the Expo SDK version you picked
- whether you used NativeWind or pure themed components
- any docs/design behavior you couldn't reconcile (list as questions)
- npm run / pnpm run commands to launch on iOS sim and Android emulator

Acceptance: I should be able to clone, install, run the app, sign up, verify
email manually via the backend, sign in, and see the 5 placeholder tabs +
the center FAB opening a placeholder modal.
```

---

## C1 — Settings

```
Build the Settings feature.

Read first:
- docs/code-handoff/08-settings.md  (data, API, behavior)
- docs/design-output/settings/  (more-tab, app-settings, profile, account)
- docs/design-output/shared-components.md (reuse the primitives built in C0)

Build, in order:
1. SettingsIndex (= "More" tab landing) with grouped rows.
2. AppSettings: theme (segmented), accent (6 swatches), language picker,
   currency picker, notification switches. Wire to useSettingsStore + 
   useUpdateMe.
3. Profile: avatar upload/remove, name, address, rank card (read-only). Drop
   the income section — savings is out of scope.
4. Account: change password form, sign out, delete-account gated by typed
   "DELETE".

Use react-hook-form + zod for the password form. Use @gorhom/bottom-sheet
for the currency / language pickers.

Acceptance per 08-settings.md checklist. Do NOT yet implement push
notification preferences — defer.

End your turn by listing any new UI primitives you had to add to
src/components/ui/. If a design-output spec referenced a component that
doesn't exist yet, you've found a gap — add it to shared-components.md and
build it.
```

---

## C2 — Dashboard

```
Build the Dashboard.

Read first:
- docs/code-handoff/02-dashboard.md  (formulas, mobile simplifications, API)
- docs/code-handoff/13-api-contract.md  (the /dashboard endpoints +
  /recurring-expenses/upcoming)
- docs/design-output/dashboard/  (every widget spec + edit-mode + the header)

Build, in order:
1. Port src/hooks/dashboard/use-dashboard.ts and src/hooks/currencies/ from
   the web repo. Keep React Query keys identical.
2. Sticky header per design-output/dashboard/dashboard.md (greeting + month +
   currency + privacy + edit mode).
3. Each widget as its own component in src/components/dashboard/. Match the
   design-output spec for each. Loading / empty / populated states.
4. Drop these widgets entirely: coach-card, category-insights, frequent-items,
   savings-opportunities (out of scope).
5. Connect the upcoming recurring widget to the MarkPaid bottom sheet (build a
   placeholder MarkPaid modal — C4 builds it properly).
6. FAB long-press action sheet (Scan / Gallery / Manual PFR) — placeholder
   handlers until the scan feature is built.
7. Pull-to-refresh invalidates all dashboard queries.

Charts: use victory-native (or react-native-svg-charts — pick one based on
which library can deliver the chart visuals from design-output most cleanly).

Tabular numerals on every amount. Currency conversion uses exchange rates
from useCurrencies() — see 02-dashboard.md.

Acceptance per 02-dashboard.md checklist.
```

---

## C3 — Receipts

```
Build the Receipts list and detail/edit screens.

Read first:
- docs/code-handoff/03-receipts.md  (data model, API, hooks)
- docs/design-output/receipts/  (every screen + sheet)

Build, in order:
1. Port src/hooks/receipts/use-receipts.ts and use-suggest-category.ts.
2. ReceiptsList screen with infinite scroll, search, filter sheet, sort sheet,
   swipe-to-delete, long-press multi-select with bulk actions.
3. ReceiptDetail screen with read mode + edit mode toggle. Implements the
   "preserve time on date edit" rule.
4. ManualEntry screen.
5. PfrEntry screen (3-segment auto-advancing inputs).
6. ReceiptViewer modal (full journal, share via Share API).
7. Category suggestion card.
8. CategoryPickerSheet (reused later by Recurring form).

DO NOT yet build the QR scanner — that's C5. Add a placeholder "Scan QR"
button that for now opens the manual entry form.

Selection mode: long-press → checkbox row, multi-select, bulk delete via
/receipts/bulk, bulk category change via /receipts/bulk/category.

Acceptance per 03-receipts.md checklist.
```

---

## C4 — Recurring + Categories + Loyalty cards

```
Build three features in this order.

For each, read first:
- docs/code-handoff/04-recurring.md → then 05-categories.md → then 07-loyalty-cards.md
- docs/code-handoff/13-api-contract.md (matching endpoint sections)
- docs/design-output/recurring/ → categories/ → loyalty/

Per feature: port the hooks, build the list, create/edit form, and any
auxiliary screens. Acceptance checklists at the bottom of each code-handoff
feature doc.

Specific reminders:
- Recurring "Mark as paid" sheet honors isFixed (amount locked iff true).
- Recurring "Pause / Resume" toggles isPaused via PATCH; UI dims paused rows.
- Categories delete flow uses /receipts/bulk/category to reassign before
  DELETE /categories/:id.
- Loyalty card display modal MUST boost screen brightness (expo-brightness)
  on mount and restore on unmount AND on AppState change to background.
- Loyalty card scan supports both QR formats and 1D barcodes; use the
  vision-camera-code-scanner library or expo-camera.

The 10-swatch color picker and the emoji picker are shared primitives —
build once, reuse.

End your turn by reporting test coverage of each feature's happy path.
```

---

## C5 — Scan flow

```
Build the receipt scanning flow.

Read first AND CAREFULLY:
- docs/code-handoff/06-scanning.md  (state machine, retry loop, error
  classification — the entire doc)
- docs/design-output/scanning/  (every state's visual spec, especially
  retry-card.md)
- The web reference file: src/hooks/receipts/use-receipt-scanner.tsx

This is the most complex feature. Build, in order:

1. Install react-native-vision-camera + vision-camera-code-scanner. Configure
   permissions in app.config.ts.
2. The Scanner screen (full-screen modal, light status bar).
3. The state machine exactly per 06-scanning.md:
   - Type the ScanFlowState enum.
   - Implement waitWithCancelAndForceRetry with AbortController.
   - Implement createReceiptWithRetry with the exact delays
     [0, 5_000, 10_000, 15_000, 20_000, 30_000, 40_000].
   - Implement isTransientPortalError with the status + message rules.
   - Implement normalizeFiscalQrUrl validation.
4. UI overlays for every state, matching design-output/scanning/.
5. Gallery flow: pick image, decode via vision-camera or expo-camera's
   scanFromURLAsync, feed into the same retry loop.
6. PFR entry already exists from C3 — wire its submit to the same retry loop.
7. Sentry events per the spec; redact the QR vl= query param.
8. Haptics on detection / success / failure (per design-output annotations).
9. Wire the FAB action sheet to open Scanner / Gallery / Pfr.

Tests (Jest + RTL):
- createReceiptWithRetry succeeds on first try.
- createReceiptWithRetry retries on transient 404 and succeeds on attempt 3.
- createReceiptWithRetry fails terminally on a 403.
- createReceiptWithRetry stops on RETRY_CANCELLED.
- isTransientPortalError classifies each error code correctly.

Acceptance per 06-scanning.md checklist.
```

---

## C6 — Polish & release

```
Final pass before TestFlight / internal track.

Read:
- docs/code-handoff/00-README.md (re-check non-negotiables)
- docs/code-handoff/10-design-system.md (sweep for any visual divergence)
- All feature acceptance checklists
- docs/design-output/00-index.md (verify every screen the design covers has
  a built equivalent)

Do:
1. Walk every screen in light + dark mode, every accent color. Fix any
   contrast or alignment bugs.
2. Verify pull-to-refresh, swipe-back, status bar style on every screen.
3. App foreground refetches: focusManager wired (12-state-and-i18n.md).
4. Offline state: top banner appears, queries pause on no network
   (onlineManager wired).
5. Empty states everywhere (no receipts, no categories, no recurring, no
   cards, no payment history).
6. Accessibility audit: every touchable has accessibilityLabel; targets
   >= 44pt; Dynamic Type up to 130% doesn't break layout.
7. Performance: switch RN's FlatList to FlashList where lists exceed 30 items
   (receipts list, payment history if it grows).
8. Sentry sourcemaps uploading via EAS.
9. App icon + splash + adaptive icon (Android) from the design's asset list.
10. EAS build profile for preview + production. Submit a TestFlight build.

End your turn by listing every item from non-negotiables in 00-README.md and
ticking which are verified and how.
```

---

## How to use these prompts

- **Sequential by default.** C0 → C1 → … → C6. Most milestones depend on
  earlier ones (state stores, theme system, navigation skeleton).
- **Pause for review** between each prompt. Each milestone produces enough
  code that a 15-minute review is worth it before queuing the next.
- **Iterate the prompts themselves** if they produce drift. If C2 turns out
  shaky, fold the lessons back into this file before kicking off C3.
- **Design-output must exist** before running a feature prompt. If you're
  ahead of design, either:
  - Wait for the design to land, OR
  - Build against this folder's behavior spec and accept rework when design
    arrives.

If a prompt isn't producing useful output, the failure mode is almost always
"agent didn't read the docs first." The phrasing "Read these docs first" is
load-bearing — keep it.
