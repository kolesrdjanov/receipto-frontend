# 04 — Mobile UX patterns

A catalog of the interaction patterns Receipto Mobile uses. Internalize these before designing — they apply across every screen.

The single biggest mistake when porting a web app to mobile is keeping the web mental model: hovers, dropdowns, dialogs, sidebars. Mobile speaks a different language. This doc is that language.

---

## Gestures

### Tap

The default. Every interactive surface responds to tap.

- **Pressed state**: subtle 90% scale + slight opacity reduction. Triggered on press-in, released on press-out or cancel. Use `react-native-gesture-handler` or built-in `Pressable`.
- **Tap target**: ≥ 44 × 44pt even if the visible element is smaller (use invisible padding).

### Long-press

Reveals secondary actions. Used in two places:

- **FAB** (bottom tab bar center): long-press opens an action sheet with all three scan-entry points.
- **List rows** (Receipts list): long-press enters multi-select mode.

Visual feedback: short haptic + slight scale + the action sheet / mode change.

### Swipe-left (on a list row)

Reveals trailing actions, typically Delete.

- **Implementation**: `react-native-gesture-handler` + an animated row.
- **Visual**: row slides left under the user's finger; trailing action (red Delete) revealed underneath.
- **Threshold**: 80pt reveals the action; further swipe (full-width) triggers it directly without a second tap.
- **Confirmation**: destructive swipes still confirm via an Alert before executing.

Used on: Receipts list rows, Recurring list rows, Categories list rows, Loyalty card rows.

### Swipe-down (on a bottom sheet or modal)

Dismisses the sheet. The drag handle at the top hints at this affordance.

### Swipe-back (iOS only)

Pops the current stack screen. Native to iOS — design assumes it's there. Don't put critical content near the left edge that the user might accidentally swipe.

### Pull-to-refresh

On every list / scroll screen. Refreshes the current view's data.

- Visual: native iOS spinner at top / Material spinner on Android. No custom designs needed — use the OS default.
- Used on: Dashboard, ReceiptsList, RecurringList, CategoriesList, LoyaltyList.

### Pinch / zoom

Used in **one** place: the full journal viewer (the modal showing the raw fiscal receipt text). Plain text receipts can be small; let the user pinch to zoom.

---

## Haptics

Trigger haptics on **moments of state change**, not every tap. Overuse is worse than underuse.

| Moment                                            | Haptic style       | Used by `expo-haptics`           |
| ------------------------------------------------- | ------------------ | -------------------------------- |
| QR code successfully detected                     | Light impact       | `ImpactFeedbackStyle.Light`      |
| Receipt successfully created (success state)      | Notification success | `NotificationFeedbackType.Success` |
| Receipt creation terminal failure                 | Notification error | `NotificationFeedbackType.Error` |
| Mark recurring expense paid                       | Light impact       |                                  |
| Swipe-to-delete threshold reached                 | Selection          | `selectionAsync()`               |
| Switching tabs                                    | (none)             |                                  |
| Standard button presses                           | (none)             |                                  |
| Loyalty card display modal opens                  | Light impact       | Signals "you're showing your card" |

---

## Bottom sheets

Use `@gorhom/bottom-sheet`. Reasons to use:

- Quick form (e.g. MarkPaid for recurring expenses, ReceiptFilter sheet)
- Picker (currency, category, language)
- Menu (action sheet for "..." menus)

Anatomy:

- **Drag handle** at the top: 4 × 32pt, `muted-foreground`, centered, 8pt from the top edge.
- **Title** below the handle, heading-2, left-aligned.
- **Content** with 16pt padding.
- **Footer buttons** (optional): primary action right, cancel/back left, both 44pt high.
- **Backdrop**: 50% black behind the sheet — tappable to dismiss.

Snap points:

- A picker / menu sheet: one snap point at content height (auto-size).
- A form sheet: two snap points (half-screen, full-screen) — user can pull up if they need more room.

Dismissal:

- Tap the backdrop.
- Swipe down past the dismissal threshold.
- Tap the X (top-right) if provided.

---

## Keyboard handling

The single biggest cause of crap mobile UX is bad keyboard handling. Get it right.

Rules:

1. **Wrap every screen with a form in `KeyboardAvoidingView`** (iOS: `behavior="padding"`, Android: usually unnecessary but `behavior="height"` for some cases).
2. **The submit button must remain visible** when the keyboard is up. Either inside a scroll view that scrolls to the focused field, or pinned to the keyboard (recommended for sheets).
3. **Tap outside any input dismisses the keyboard.** Wrap the form in a `TouchableWithoutFeedback` that calls `Keyboard.dismiss()`.
4. **Auto-advance focus** on multi-segment inputs (e.g. PFR entry's 8+8+6 char segments).
5. **Return key behavior**:
   - Last text input in a form → `returnKeyType="done"`, submits.
   - Earlier inputs → `returnKeyType="next"`, focuses the next field.
   - Single-line inputs use `next`; the password field uses `done`.

### Input attributes

Use these so password managers and autofill work:

| Field            | textContentType (iOS)   | autoComplete (Android)   | keyboardType         |
| ---------------- | ----------------------- | ------------------------ | -------------------- |
| Email            | `emailAddress`          | `email`                  | `email-address`      |
| Password (login) | `password`              | `password`               | (default)            |
| New password     | `newPassword`           | `new-password`           | (default)            |
| One-time code    | `oneTimeCode`           | `sms-otp`                | `number-pad`         |
| First name       | `givenName`             | `given-name`             | (default)            |
| Last name        | `familyName`            | `family-name`            | (default)            |
| Street           | `fullStreetAddress`     | `street-address`         | (default)            |
| Postal code      | `postalCode`            | `postal-code`            | `number-pad`         |
| City             | `addressCity`           | `address-level2`         | (default)            |
| Amount           | (none)                  | (none)                   | `decimal-pad`        |
| Whole number     | (none)                  | (none)                   | `number-pad`         |

Mark these on your designs as small annotations next to each field — the dev needs to know which to apply.

---

## List interactions

Conventions across all list screens:

- **Tap row**: navigate to detail / edit.
- **Long-press row**: enter selection mode (where applicable).
- **Swipe-left**: reveal Delete (or other destructive action).
- **Pull-to-refresh**: refetch list.
- **Infinite scroll**: load next page when within 4 rows of the bottom.

Selection mode (Receipts list):

- Long-press starts selection mode with the pressed row selected.
- Tap rows to toggle inclusion.
- The header morphs into a selection header (slide-down animation): `← N selected` on the left, bulk action icons on the right.
- "Done" / X in the top-left exits selection mode.

---

## Empty states

For every list screen, design an empty state. Same structure:

- Vertical center
- Icon (48–56pt, `muted-foreground`)
- Headline (heading-2)
- Subcopy (body, `muted-foreground`, max width ~280pt)
- Primary CTA button (where useful, e.g. "Scan your first receipt", "+ Add your first category")

Empty states should be **inviting, not apologetic**. Don't say "Sorry, no data yet." Say "Scan your first receipt to get started."

---

## Loading states

- **Initial screen load**: skeleton placeholders that mimic the layout (rectangular `muted` rectangles, sometimes shimmering). Avoid full-screen spinners — they feel slow even when fast.
- **Tab switch / drill-down**: instant; data loads in the background and skeletons appear.
- **Pull-to-refresh**: native pull spinner; existing content stays visible.
- **Form submit**: button replaces its label with a centered spinner; button width remains fixed. Disable other inputs while submitting.
- **Mutation in-flight** (e.g. tapping "Pay" on a recurring item): row gets a subtle spinner overlay; row is disabled.

---

## Error states

Three flavors:

1. **Inline field error** — below the input, destructive color, caption size. Cleared on next keystroke.
2. **Form-level banner** — destructive surface at the top of the form, dismissable.
3. **Full-screen error** — only for unrecoverable states (e.g. "Failed to load Receipts. Pull to retry."). Use sparingly.

Always pair an error icon with the message — don't rely on color alone.

---

## Toasts

For ephemeral feedback that doesn't need a dismissal action.

- Position: top, below status bar safe area.
- Width: screen minus 32pt padding.
- Duration: 3s success, 5s error.
- Manual dismiss: X on the right.
- Animation: slide down from top, slide up to dismiss.

Use toasts for:

- "Card added"
- "Receipt updated"
- "Email sent"
- "Network error — please try again"

Don't use toasts for:

- Anything destructive (use Alert)
- Anything the user needs to act on (use a sheet or banner)
- Long messages (toasts are 1–2 lines max)

---

## Alerts (modal dialogs)

Use the platform-native Alert (`Alert.alert` on iOS / Android dialog).

Use for:

- Destructive confirmations ("Delete this receipt?")
- Critical errors that block the flow
- One-time announcements

Avoid for:

- Anything you'd use a toast for (less intrusive)
- Anything you'd use a sheet for (sheets give more space)

---

## Animations

Use **`react-native-reanimated`**. Functional, not decorative.

Standard durations:

- Quick (state change, button press): 150ms
- Standard (sheet present, screen push): 300ms
- Slow (large state transitions): 400ms

Standard easings:

- Default: cubic-bezier (0.4, 0.0, 0.2, 1) (Material standard)
- Coming in: cubic-bezier (0.0, 0.0, 0.2, 1)
- Going out: cubic-bezier (0.4, 0.0, 1, 1)

Specific patterns:

- **Sheet present**: slide up from bottom, opacity 0 → 1 on backdrop in 300ms.
- **Tab switch**: instant (no transition — feels native).
- **Stack push**: native (handled by `native-stack`).
- **Skeleton shimmer**: subtle horizontal gradient sweep, 1500ms loop.
- **Status badge change**: cross-fade old → new in 200ms.
- **FAB press**: scale 1 → 0.92 → 1, total 150ms (spring config).

### Reduce motion

When the OS "Reduce Motion" setting is enabled, gate animations:

- Skip the slide-up sheet animation; just appear.
- Skip skeleton shimmer; just show static muted blocks.
- Keep functional transitions (e.g. selection mode header swap) but make them instant.

---

## Safe areas

Modern phones have:

- **Top inset**: status bar + notch / Dynamic Island. 44–59pt typical.
- **Bottom inset**: home indicator (iPhone) / gesture nav bar (Android). 0–34pt typical.

Rules:

- Every screen wraps in `SafeAreaView` (from `react-native-safe-area-context`).
- Top inset: respected on screen content; the native header handles this for you on stack screens.
- Bottom inset: respected on the tab bar (the bar sits above it).
- **Scanner modal**: ignores top inset (camera fills the screen) — overlay UI like the close X and tip text must compensate manually.
- **Loyalty display modal**: ignores top inset, fills the screen with white — system status bar must be `dark-content`.

---

## Sound

Default: no sounds. Mobile users mute their phones; sound effects feel intrusive.

The one exception: optional success "ding" on receipt creation. Off by default; togglable in Settings → App → Sounds (skip if not in v1 scope).

---

## Brightness boost (one place only)

The Loyalty card display modal sets `expo-brightness` to maximum on mount and restores on unmount (and on AppState background). This is the single most important UX detail in that feature — cashier scanners struggle in dim conditions. Visualize this by drawing the loyalty display modal at noticeably higher brightness in your mockups (annotate it; users can't actually see the brightness change in a screenshot).

---

## Accessibility behaviors

- **Screen reader (VoiceOver / TalkBack)**: every touchable has an `accessibilityLabel`. Group related content with `accessibilityRole="header"` for headings, `"button"` for tappable elements, `"image"` for decorative graphics (with `accessibilityElementsHidden` if purely decorative).
- **Dynamic Type / font scaling**: support up to 130%. Don't lock font sizes; use the typography scale and let the OS scale it.
- **Reduce motion**: see "Animations" above.
- **Increase contrast** (iOS) / **High contrast** (Android): the system handles most of this via stronger system tints; ensure your designs don't depend on hairline 1pt borders that disappear when the OS bumps contrast.

---

## When in doubt

Mobile defaults to **less chrome, more content**. Strip away unnecessary borders, labels, and instructions. Trust users to understand standard patterns: a pencil icon means edit, a trash icon means delete, swiping left reveals actions, tapping a list row drills in.

If you find yourself adding a label like "tap to view details" — delete it. The interaction is the label.
