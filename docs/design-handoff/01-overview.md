# 01 — Overview

A condensed map of the product before you dive into individual features.

---

## What Receipto is

Receipto is a personal-finance app for **fiscal-receipt-driven spending tracking**, primarily targeting Serbian consumers. The defining feature: scan the QR code on a fiscal receipt → the app extracts every line item, tax, store, and total via a backend portal → the user gets categorized spending data without manual entry.

The app then layers on:

- A **dashboard** with spending KPIs and charts.
- **Receipts** as the core domain — searchable, filterable, editable.
- **Categories** with optional monthly budgets, fueling the dashboard's budget tracker.
- **Recurring expenses** for subscriptions / rent / utilities.
- **Loyalty cards** so users can leave their physical cards at home.
- **Settings** for theme, currency, language, profile, account security.

The mobile clone is a feature-parity port of the web app's primary surface, minus a few enterprise-y features (Groups, Savings, Price Compare, Warranties).

---

## User journey

Typical first session:

1. Sign up → verify email via deep link → sign in.
2. Land on an empty Dashboard with a prominent FAB to scan a receipt.
3. Scan their first receipt → see it appear in Receipts list with auto-suggested category.
4. Optionally accept the category suggestion, confirm details, save.
5. Repeat. After 3–5 receipts the Dashboard starts showing meaningful charts.

Recurring use:

- Open app → glance at Dashboard for spending pace this month.
- Notice "Upcoming recurring" widget; tap "Pay" on a subscription that's due.
- Add a new loyalty card before going shopping.
- At checkout: open loyalty card, screen brightens automatically, scanner reads it.
- After checkout: scan the fiscal receipt → done.

---

## Screen inventory

The complete list of screens to design, grouped by feature. Counts are approximate — each "screen" includes its loading / empty / error / success variants where applicable.

| Feature       | Screens                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Auth          | SignIn, SignUp, CheckEmail, ForgotPassword, ResetPassword (deep link), VerifyEmail (deep link)                          |
| Dashboard     | Dashboard (with 9 widgets, edit mode, month switcher, currency switcher, FAB action sheet)                              |
| Receipts      | ReceiptsList (+ filter sheet, sort sheet, selection mode), ReceiptDetail (read + edit), ManualEntry, PfrEntry, ReceiptViewer (journal modal) |
| Scanning      | Scanner (camera, with 6 distinct states), GalleryProcessing, PermissionDenied                                           |
| Recurring     | RecurringList, RecurringForm (create/edit), MarkPaid sheet, PaymentHistory                                              |
| Categories    | CategoriesList, CategoryForm, CategoryDeleteWithReassignment                                                            |
| Loyalty cards | LoyaltyList (grid), LoyaltyDisplay (full-screen, brightness-boosted), LoyaltyForm, LoyaltyScanner                       |
| Settings      | SettingsIndex, AppSettings, Profile, Account (with destructive delete flow)                                             |

Plus a handful of **shared chrome** elements: the bottom tab bar, the center FAB, top headers, modal-presentation sheets, action sheets, toasts.

Total: ~35 distinct screens × 2 themes × multiple states = a lot of mockups. Pace yourself with the build order in `14-build-order.md`.

---

## Visual personality

A few words to anchor mood:

- **Clean, not minimalist.** White / soft-gray surfaces with confident accent color. Generous spacing. No hairline 1px-everywhere overload.
- **Calm, not exciting.** This is a money app — users come here to feel in control. Motion should be functional, not flashy.
- **Tabular discipline.** Money appears constantly. Use tabular numerals. Right-align amounts. Consistent decimal places.
- **Native, not Instagram.** Behaviors should feel like iOS / Android — bottom sheets, swipe-back on iOS, native pickers when sensible. Not custom-rolled glass-effect UI.
- **Borders over shadows.** Cards are delineated by 1pt borders, not drop shadows. Shadows reserved for elevated modals + FABs.

---

## Constraints to keep in mind

- **Long Serbian text.** Test your layouts with the longest reasonable Serbian translations. Buttons should wrap or truncate gracefully, not push other UI off-screen.
- **Tabular numerals.** Use a font variant that supports `tabular-nums`. Plus Jakarta Sans (the chosen font) does.
- **Theme + accent permutations = 12 visual variants.** Don't lock visual decisions to specific colors. Always think "what does this look like when accent = rose, theme = dark?"
- **No reliance on hover.** Mobile has no hover state. Designs must work entirely with tap, swipe, long-press.
- **Safe areas.** iPhones have notches / Dynamic Islands; modern Androids have gesture nav bars. Top + bottom safe area insets must be respected on every screen.

---

## What "done" looks like for design

A feature is "done" from the design side when:

1. Every screen + state is mocked in light AND dark.
2. Interactions are documented (which taps go where, what animates, what haptic fires).
3. Edge cases the spec calls out are addressed (e.g. password visibility toggle, retry countdown, brightness boost).
4. New / unique components introduced are extracted into the design system file.
5. A handoff package is exported per `13-deliverables.md`.

Then Claude Code receives it and implements.
