# 12 — Settings

Three settings sub-screens: **App** (preferences), **Profile** (user data), **Account** (security). Reached via the "More" tab.

---

## Screens

| Screen          | Purpose                                                         |
| --------------- | --------------------------------------------------------------- |
| SettingsIndex   | Lists the three sub-screens; reached as the More tab landing    |
| AppSettings     | Theme, accent, language, currency, notifications                |
| Profile         | Avatar, name, address, rank                                     |
| Account         | Change password, sign out, delete account                       |

The Settings index is **shared with the "More" tab** — Settings, Profile, Account are rows within the More list. There's no separate SettingsIndex screen; the More tab landing is the index.

---

## More tab (= Settings landing)

Already specified in `03-navigation.md`. Brief recap:

- Grouped list style
- Row 1 group: Categories, Loyalty cards (these are full features, not settings — see those docs)
- Row 2 group: Settings, Profile, Account
- Row 3 group: Support us (external link), Sign out (destructive)

The "Settings" row navigates to **AppSettings** (the app-preferences screen).

---

## AppSettings

Grouped-list style (iOS UITableViewStyleGrouped feel). Each section is a card with rounded corners; rows separated by 1pt `border` lines.

### Section: Appearance

- **Theme** row: label "Theme" + segmented control on the right (or a row drill-down). Options: Light / Dark / System.
- **Accent color** row: label "Accent" + 6 small swatches in a horizontal strip on the right. Selected swatch has a checkmark or `primary`-colored border. Tapping a swatch applies immediately (haptic optional).

### Section: Language & currency

- **App language** row: label + value + chevron → opens LanguagePicker bottom sheet
  - LanguagePicker: list of supported languages (English, Srpski), radio-select style. Selecting one applies immediately AND patches the user's preferred-language on the backend.
- **Currency** row: label + value + chevron → opens CurrencyPicker bottom sheet
  - CurrencyPicker: searchable list of currencies (code + name), radio-select.

### Section: Notifications

Three switch rows:

- **Receipt milestone emails** — when the user hits round numbers (10, 50, 100 receipts)
- **Warranty reminders** — when a warranty is about to expire. (If warranties feature is excluded from this build, hide this row.)
- **Budget alerts** — when category spending crosses budget thresholds

Each row: title (body-strong) + 1-line description (caption, muted) + native `Switch` on the right.

### Section: Push notifications (optional v1.1)

If included in v1, add a "Push notifications" master switch that prompts for permission on first enable. If excluded, leave space and revisit later.

---

## Profile

Single scrollable form.

### Avatar section (top)

- Centered circle, 96pt
- If no avatar: initials in `secondary` background
- Tap → action sheet: "Take photo" / "Choose from library" / "Remove photo" (destructive, only if avatar exists)
- While uploading: 50% opacity overlay with a spinner inside the circle

Validations: ≤ 5MB; image/jpeg, png, webp, heic.

### Basic info section

- First name (text, required)
- Last name (text, required)
- Email (read-only with a small "✓ Verified" badge — email changes aren't supported in v1)

### Address section

- Street (text, optional, `autoComplete="street-address"`)
- ZIP code (text, optional, `postalCode`)
- City (text, optional, `address-level2`)

### Rank card (bottom)

Read-only display of the user's rank. Same visual treatment as the Dashboard rank widget:

- Icon (Crown / Sparkles / Compass / outline) — large
- Tier label (Status A / B / C / No Status)
- Receipt count and copy from `t('settings.profile.rank.descriptions.*')`
- Progress bar to next tier

### Save behavior

A sticky save button at the bottom of the form. Patches only the changed fields. Loading + success toast on submit.

---

## Account

Single scrollable screen with three sections.

### Section: Change password

- **Current password** (secure input with eye toggle)
- **New password** (secure input with eye toggle)
- **Confirm new password** (secure input with eye toggle)
- "Change password" primary button (full width)

Validation: same rules as sign-up (`min 8`, `[a-z][A-Z][0-9]`, must match confirm). Field-level errors below each input.

On success: clear all fields, show success toast "Password updated".

### Section: Sign out

A single destructive outline button: "Sign out". Tap → Alert confirmation → if confirmed, calls logout, clears tokens, navigates to AuthStack.

### Section: Delete account

Visually distinct — a card with destructive styling:

- Heading: "Delete account" (heading-3, `destructive`)
- Subcopy / warning list:
  - All your receipts will be deleted
  - All your recurring expenses will be deleted
  - All your categories will be deleted
  - All your loyalty cards will be deleted
  - Your profile data will be permanently removed
- "Type DELETE to confirm" input field
- "Delete account" destructive primary button (full width)
  - **Disabled** until the input value exactly equals `DELETE` (case-sensitive)
  - On tap: shows spinner → calls delete endpoint → logout → navigate to AuthStack
  - On error: error toast, button re-enabled

---

## Visual conventions

- **Grouped-list style**: light gray screen background (`muted` or slightly tinted background), white grouped cards with rounded corners (xl radius), 1pt separators between rows within a card.
- **Section headers above each grouped card**: overline (11pt, 600, uppercase, +5% tracking), `muted-foreground`, with 16pt above and 8pt below.
- **Row trailing chevron**: small ChevronRight icon in `muted-foreground`.
- **Switch color**: native on/off — "on" state colored with `primary`.
- **Destructive section** (Delete account): visually separated with extra spacing and a destructive top-border or different background tint.

---

## Acceptance checklist

- [ ] More tab landing designed (Settings index).
- [ ] AppSettings in light + dark, with the Appearance section showing both an active theme variant and an active accent swatch.
- [ ] LanguagePicker and CurrencyPicker bottom sheets designed.
- [ ] All notification switches in on and off states.
- [ ] Profile designed with and without an avatar; uploading state mocked.
- [ ] Profile rank card matches the Dashboard rank widget.
- [ ] Account → Change password form with field-level error states.
- [ ] Account → Delete account section designed in both states: button disabled (input empty), button enabled (input == "DELETE").
- [ ] Sign out Alert confirmation designed.
- [ ] Grouped-list pattern consistent across all screens.
