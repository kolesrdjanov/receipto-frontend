# 03 — Navigation

The web app uses a desktop sidebar. **Mobile uses a 5-slot bottom tab bar with a center FAB**. This is the most important navigation decision to internalize before designing any screen.

---

## Navigation tree

```
RootNavigator (decides based on auth state)
├─ AuthStack (unauthenticated; supports deep links from email)
│  ├─ SignIn
│  ├─ SignUp
│  ├─ CheckEmail
│  ├─ ForgotPassword
│  ├─ ResetPassword            (deep link: receipto://reset-password?token=…)
│  └─ VerifyEmail              (deep link: receipto://verify-email?token=…)
│
└─ AppTabs (authenticated)
   ├─ Tab 1: Home (Dashboard)
   ├─ Tab 2: Receipts
   ├─ Tab 3: FAB → Scanner (not a real tab)
   ├─ Tab 4: Recurring
   └─ Tab 5: More
      ├─ Categories
      ├─ Loyalty cards
      ├─ Settings
      ├─ Profile
      ├─ Account
      ├─ Support us (external link)
      └─ Sign out (destructive)
```

---

## Bottom tab bar

A 5-slot bar fixed to the bottom of the screen, respecting the bottom safe area.

| Slot | Icon              | Label       | Behavior                                |
| ---- | ----------------- | ----------- | --------------------------------------- |
| 1    | LayoutDashboard   | Home        | Opens DashboardStack                    |
| 2    | Receipt           | Receipts    | Opens ReceiptsStack                     |
| 3    | ScanLine (in FAB) | (none)      | Opens Scanner modal (full-screen)       |
| 4    | Repeat            | Recurring   | Opens RecurringStack                    |
| 5    | Menu              | More        | Opens MoreStack                         |

**Tab styling:**

- Tab bar height: 56 + bottom safe-area inset
- Background: `background`
- Top border: 1pt `border`
- Active tint: `primary`
- Inactive tint: `muted-foreground`
- Label font: 11pt, weight 600
- Icon size: 24

**Center FAB (slot 3):**

- Circle, 56pt diameter
- Lifts 16pt above the bar (negative top offset)
- Background: `primary`
- Icon: ScanLine, 24pt, color `primary-foreground`
- Shadow: level 2
- Tap: opens Scanner modal (full-screen, slides up from bottom)
- Long-press: action sheet with three options — "Scan QR code", "Choose from gallery", "Enter manually (PFR)"

**Tab interactions:**

- Tap an inactive tab: switch to that tab, preserve its stack state.
- Tap the active tab: pop that stack to its root (e.g. from ReceiptDetail back to ReceiptsList).
- The FAB never goes "active" — it's a launcher, not a tab.

---

## More tab

The "More" tab is a `SettingsIndex`-style screen — a list of grouped rows. This gives the secondary features (Categories, Loyalty, Settings, Profile, Account) a clean home without overloading the tab bar.

Suggested layout:

```
[ Categories       › ]
[ Loyalty cards    › ]
──────────────────────
[ Settings         › ]
[ Profile          › ]
[ Account          › ]
──────────────────────
[ Support us       ↗ ]   (external link, "↗" indicates external)
[ Sign out             ]   (destructive)
```

Grouped-list style with rounded card groupings and subtle separators.

---

## Modal vs full-screen vs push

A decision rule for each kind of screen:

| Pattern               | When to use                                                          | Examples                                                    |
| --------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Push (stack)**      | Drilling into details that belong to the current tab                 | ReceiptsList → ReceiptDetail; CategoriesList → CategoryEdit |
| **Full-screen modal** | Mode-switch / blocking flow; user must finish or cancel              | Scanner; LoyaltyDisplay; PfrEntry; ManualEntry              |
| **Bottom sheet**      | Quick form, picker, action confirmation; stays on the current screen | MarkPaid; CurrencyPicker; FilterSheet; CategoryDeleteWithReassignment |
| **Action sheet**      | Choose one of N actions; short list                                  | FAB long-press; row long-press; receipt detail "..." menu   |
| **Alert dialog**      | Binary confirm/cancel for destructive or irreversible action         | "Delete this receipt?"                                      |

Default to **bottom sheet** for any form that fits in ~70% of screen height. Use full-screen modals only when the form needs the entire screen (scanner, manual entry with many fields).

---

## Header conventions

Use **native stack headers** by default. Custom headers only when there's a reason (e.g. scanner has no header; dashboard has a custom sticky header).

| Element            | Default                                                       |
| ------------------ | ------------------------------------------------------------- |
| Title              | Heading-3 (17pt, 600), centered on iOS / left-aligned Android |
| Back button        | Native chevron, "Back" label on iOS                           |
| Large title (iOS)  | Use on the root screen of each tab (Dashboard, Receipts, etc.) — collapses on scroll |
| Header right       | Action icons (add, filter, etc.) — max 2 icons                |
| Background         | `background`                                                  |
| Border             | 1pt `border` at the bottom, no shadow                         |

On the **Dashboard**, replace the standard header with a custom sticky header per `06-dashboard.md` (greeting + month + currency + privacy + edit mode).

---

## Modal headers

For full-screen modals (Scanner is special — no header at all):

- Title centered
- "Cancel" or X button on the left → dismiss
- Optional "Save" / "Done" button on the right
- Border at the bottom

For bottom sheets:

- Small drag handle (4pt × 32pt, `muted-foreground`, centered) at the top
- Title heading-2, centered or left-aligned
- Close X on the right
- 16pt padding inside

---

## Deep links

These deep links land directly on specific screens, even from a cold app start:

| Deep link                                      | Destination                          |
| ---------------------------------------------- | ------------------------------------ |
| `receipto://verify-email?token=…`              | AuthStack → VerifyEmail              |
| `receipto://reset-password?token=…`            | AuthStack → ResetPassword            |
| `receipto://receipts/:id`                      | AppTabs → ReceiptsTab → ReceiptDetail (only if authenticated) |

Email links also work as universal links (`https://app.receipto.rs/verify-email?token=…`) opening the app directly from iOS Mail / Android Gmail.

Design implication: VerifyEmail and ResetPassword are entered from a deep link, **not** from a navigation push. They should feel self-contained — clear "what happened / what to do next" copy, prominent CTA back to sign-in on completion.

---

## Status bar

- Most screens: `dark-content` (dark text on light status bar)
- Scanner modal: `light-content` (white text on dark/transparent status bar — the camera occupies the area)
- Loyalty display modal: `dark-content` (white background under the status bar)
- Dark mode: status bar style follows the same logic but inverted as needed

---

## Back behavior

- iOS: swipe-back gesture enabled on all stack screens. Design for it (e.g. don't put critical content near the left edge).
- Android: hardware back closes the current modal / pops the current stack. Design copy accordingly ("Tap back to return" makes sense; "Tap < at the top" does not on Android).
- Modal dismissal: tappable backdrop on bottom sheets; swipe-down to dismiss (gesture indicator helps signal this).

---

## Acceptance for design

When you're done with navigation design, you should have:

- A mockup of the bottom tab bar in light + dark, default + each accent.
- The center FAB rendered in light + dark.
- The FAB action sheet (long-press) mocked.
- A modal-header spec (with safe-area top inset shown).
- A bottom-sheet spec (with drag handle and dismiss interaction).
- The "More" tab landing screen.
- Light annotations on at least one feature flow showing **how** transitions feel (slide / fade / present-modal / present-sheet).
