# 11 — Navigation

Replace the web's sidebar with a **bottom tab bar** and per-tab native stacks. Use `@react-navigation/native` v6+ with `native-stack` and `bottom-tabs`.

---

## Navigation tree

```
RootNavigator (decides based on auth state)
├─ AuthStack (when !isAuthenticated, supports deep links)
│  ├─ SignIn
│  ├─ SignUp
│  ├─ CheckEmail
│  ├─ ForgotPassword
│  ├─ ResetPassword            (deep link: receipto://reset-password)
│  └─ VerifyEmail              (deep link: receipto://verify-email)
│
└─ AppTabs (when isAuthenticated)
   ├─ Tab 1: Dashboard
   │   └─ DashboardStack
   │      ├─ Dashboard         (default)
   │      └─ Scanner           (modal, presented on FAB)
   ├─ Tab 2: Receipts
   │   └─ ReceiptsStack
   │      ├─ ReceiptsList      (default)
   │      ├─ ReceiptDetail
   │      ├─ ReceiptManualEntry
   │      └─ ReceiptPfrEntry
   ├─ Tab 3: (center FAB — not a tab, see below)
   ├─ Tab 4: Recurring
   │   └─ RecurringStack
   │      ├─ RecurringList     (default)
   │      ├─ RecurringForm     (modal-presented)
   │      └─ PaymentHistory
   ├─ Tab 5: More
   │   └─ MoreStack            (catches Categories, Loyalty, Settings)
   │      ├─ MoreIndex         (default — list of entries)
   │      ├─ CategoriesList
   │      ├─ CategoryForm      (modal)
   │      ├─ LoyaltyList
   │      ├─ LoyaltyDisplay    (full-screen modal)
   │      ├─ LoyaltyForm       (modal)
   │      ├─ SettingsIndex
   │      ├─ AppSettings
   │      ├─ Profile
   │      └─ Account
```

---

## Bottom tab bar layout

A 5-slot bar:

| Slot | Tab        | Icon              | Label       |
| ---- | ---------- | ----------------- | ----------- |
| 1    | Dashboard  | LayoutDashboard   | Home        |
| 2    | Receipts   | Receipt           | Receipts    |
| 3    | **FAB**    | ScanLine          | (no label)  |
| 4    | Recurring  | Repeat            | Recurring   |
| 5    | More       | Menu / Grid       | More        |

The **center slot is a fake tab** that doesn't navigate — when pressed, it opens the Scanner modal. Style it as a larger circle that "lifts" above the bar (typical SF-style):

- Diameter: 56
- Color: primary
- Icon: ScanLine (white)
- Elevation: shadow level 2

To implement: pass a custom `tabBarButton` for the middle tab that ignores the navigation press and instead calls `navigation.navigate('Scanner')` (which is registered as a root-level modal screen in the stack).

Active tab tint: `primary`. Inactive tint: `muted-foreground`. Label font: 11pt, weight 600.

The tab bar respects safe-area-inset-bottom (uses `react-native-safe-area-context`'s `useSafeAreaInsets`).

---

## More tab

The "More" tab is a list screen that opens secondary features. Rows:

- 🏷 **Categories** → CategoriesList
- 💳 **Loyalty cards** → LoyaltyList
- ─────────────────
- ⚙ **Settings** → SettingsIndex (or directly to AppSettings if you prefer fewer levels)
- 👤 **Profile** → Profile
- 🔒 **Account** → Account
- ─────────────────
- ❤️ **Support us** (external PayPal link)
- 🚪 **Sign out** (destructive)

This pattern keeps the top-level tab bar uncluttered and groups the longer tail of features behind one tap.

---

## Modal presentations

Screens that should appear as **modals** (slide up, with a "close" affordance, not part of a stack):

- `Scanner` — full-screen modal, status bar light-on-dark.
- `RecurringForm` — bottom sheet or full-screen modal (the latter is easier with native-stack's `presentation: 'modal'`).
- `CategoryForm`, `LoyaltyForm`, `ReceiptManualEntry`, `ReceiptPfrEntry` — same.
- `LoyaltyDisplay` — full-screen modal, status bar visible.
- `MarkPaidModal` (recurring pay flow) — bottom sheet.
- Filter sheets, sort sheets, category picker, currency picker — use `@gorhom/bottom-sheet`, not React Navigation.

Register modals at the **stack root** with `presentation: 'modal'` (or `'fullScreenModal'` for the scanner) so they overlay the tab bar.

---

## Deep links

```ts
const linking = {
  prefixes: ['receipto://', 'https://app.receipto.rs'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          VerifyEmail: 'verify-email',
          ResetPassword: 'reset-password',
        },
      },
      // App-side deep links can come later (e.g. receipto://receipts/:id)
      AppTabs: {
        screens: {
          ReceiptsTab: {
            screens: {
              ReceiptDetail: 'receipts/:id',
            },
          },
        },
      },
    },
  },
}
```

Auth-side deep links must work both when **unauthenticated** (most common) and **authenticated** (rare — user already signed in on another device). If authenticated and `verify-email` is hit, still run the verification and route back to Dashboard.

---

## Back behavior

- Android **hardware back**: handled by `native-stack` for screens in a stack. For modals, ensure the modal's close handler unmounts it on back.
- Swipe-back on iOS: enabled by default on native-stack — keep it on.
- Tab switching should preserve each tab's stack state (default behavior).
- Tapping a tab while already on it: **pop to the root of the stack** (use `navigation.addListener('tabPress', ...)` to call `popToTop`).

---

## Status bar

- Light screens: `barStyle="dark-content"`, background matches screen.
- Scanner: `barStyle="light-content"`, transparent background.
- Loyalty display modal: white background, `barStyle="dark-content"`.

Use `react-native-safe-area-context`'s `SafeAreaView` (with `edges={['top']}`) for screens, or set `StatusBar.setBarStyle` in screen mount effects.

---

## Header conventions

- Native header on stacks (no custom JS header) — use `headerLargeTitle: true` on iOS for the top of each tab for a polished feel; Android falls back to a standard title.
- Header right action icons (filter, add, etc.) via `headerRight` callback on the screen options.
- Hide the header on modals that have their own custom chrome (Scanner, LoyaltyDisplay).

---

## Acceptance checklist

- [ ] Bottom tab bar shows 4 tabs + center FAB; FAB opens Scanner without changing the active tab.
- [ ] Tapping an active tab pops its stack to the root.
- [ ] Auth-only screens are unreachable from app stacks; app screens require auth.
- [ ] Deep links land on the right screen even from a cold start.
- [ ] iOS swipe-back works on every stack screen.
- [ ] Modals slide up, dismiss on swipe-down (when configured), and don't accidentally hide the tab bar permanently.
- [ ] Safe-area insets respected on every screen (top + bottom).
