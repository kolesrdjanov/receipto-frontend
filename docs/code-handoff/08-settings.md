# 08 — Settings

Three settings sub-screens: **App** (preferences), **Profile** (user data), **Account** (security).

Web reference: `src/pages/settings/{app,profile,account}.tsx`, `src/hooks/users/*`, `src/store/settings.ts`.

The web has `/settings` as a redirect to `/settings/app`. On RN, present these as **tabs** within the Settings screen (top tab bar or segmented control), or as **three rows in a Settings index** that drill into individual screens — pick one and be consistent. The drill-down pattern is more native-feeling.

---

## Data model

### Settings (client-side, persisted via Zustand)

```ts
type Settings = {
  currency: string             // 'RSD' | 'EUR' | 'USD' | 'BAM' | ...
  theme: 'light' | 'dark' | 'system'
  accentColor: 'zinc' | 'blue' | 'green' | 'purple' | 'orange' | 'rose'
  language: 'en' | 'sr'
  sidebarCollapsed: boolean    // not used on RN (drop)
  amountsVisible: boolean      // privacy toggle, used by Dashboard
}
```

Persisted to `AsyncStorage` under key `receipto-settings`. Drop `sidebarCollapsed` on RN.

### User (from API)

```ts
type Me = User & {
  street?: string
  zipCode?: string
  city?: string
  monthlyIncome?: number          // out of scope (skip — needed only for Savings)
  incomeCurrency?: string         // out of scope
  preferredLanguage?: 'en' | 'sr'
  rank?: { tier: 'A' | 'B' | 'C' | 'none'; count: number; nextThreshold: number }
}
```

---

## API endpoints

| Endpoint              | Method | Body                                          | Returns | Used by         |
| --------------------- | ------ | --------------------------------------------- | ------- | --------------- |
| `/users/me`           | GET    | —                                             | `Me`    | All settings    |
| `/users/me`           | PATCH  | Subset of `Me` (name, address, prefs, etc.)    | `Me`    | Profile, App    |
| `/users/me/password`  | POST   | `{ currentPassword, newPassword }`            | `{}`    | Account         |
| `/users/me`           | DELETE | —                                             | `{}`    | Account         |
| `/users/me/avatar`    | POST   | `FormData { file }`                           | `{ profileImageUrl }` | Profile  |
| `/users/me/avatar`    | DELETE | —                                             | `{}`    | Profile         |
| `/currencies`         | GET    | —                                             | `{ code; name; symbol }[]` | Pickers |

Hooks (`src/hooks/users/`, `src/hooks/settings/`, `src/hooks/currencies/`):

- `useMe()` — `{ data: Me }`
- `useUpdateMe()`
- `useChangePassword()`
- `useDeleteMyAccount()`
- `useUploadProfileImage()`
- `useDeleteProfileImage()`
- `useCurrencies()`

Port all of them verbatim.

---

## Screens

### 1. App settings

Sections (use cards or grouped lists like iOS's UITableViewStyleGrouped):

#### Appearance

- **Theme** — segmented control: `Light · Dark · System` (the System option follows OS preference; on RN, listen to `Appearance.addChangeListener`).
- **Accent color** — 6 round swatches (zinc, blue, green, purple, orange, rose). Tapping applies immediately. Selected swatch gets a checkmark.

#### Language

- **App language** — picker with options `English`, `Srpski`.
- Side effect: call `i18n.changeLanguage(value)` immediately AND persist server-side: `PATCH /users/me { preferredLanguage: value }` so emails / push from the backend respect the choice.

#### Currency

- **Display currency** — currency picker (autocomplete from `useCurrencies()`).
- Applies to dashboard widgets, recurring summaries, etc. The original receipt currency is preserved on each receipt.

#### Notifications

Three switches (`useUpdateMe` patches them):

- **Receipt milestone emails** (`receiptMilestoneEmailsEnabled`)
- **Warranty reminders** (`warrantyReminderEnabled`) — _optional, warranties are out of scope; can hide if the feature isn't built_
- **Budget alerts** (`budgetAlertEnabled`)

Visual: title + 1-line description below + Switch.

#### Push notifications (RN-only, new)

Not in the web app, but you'll likely want it on mobile. Defer to later; if including in v1:

- **Enable push notifications** — toggle that prompts for permission via `expo-notifications` / `react-native-permissions`.
- Register the device's push token with the backend (`POST /users/me/devices` — confirm endpoint with backend).

### 2. Profile settings

A scrolling form:

#### Avatar

- Circle (96pt) at the top, centered.
- Tap → action sheet: "Take photo", "Choose from library", "Remove photo" (if one exists).
- Validation: max 5MB; allowed mime types `image/jpeg`, `image/png`, `image/webp`, `image/heic`.
- Upload → `POST /users/me/avatar` with FormData. Show a spinner inside the avatar circle while uploading. On success, update the user in the auth store (`updateUser({ profileImageUrl })`).
- Remove → `DELETE /users/me/avatar` → set `profileImageUrl: null`.

#### Basic info

- First name (text, required)
- Last name (text, required)
- Email (read-only, with a small "Verified" badge — email changes aren't supported in v1)

#### Address

- Street (text, optional, `autoComplete="street-address"`)
- ZIP code (text, optional, `autoComplete="postal-code"`)
- City (text, optional, `autoComplete="address-level2"`)

Save button at the bottom — patches `/users/me` with the diff.

#### Income

**Skip this section on RN** — it's only used by the Savings feature, which is out of scope.

#### Rank

A read-only card at the bottom showing the user's tier (A / B / C / none), icon (Crown / Sparkles / Compass), receipt count, and a progress bar to the next tier. Copy from `t('settings.profile.rank.descriptions.*', { remaining })`. Source: `me.rank`.

### 3. Account settings

#### Change password

- **Current password** (secure input, visibility toggle)
- **New password** (secure input, visibility toggle)
- **Confirm new password** (secure input, visibility toggle)

Validation rules: same as sign-up password (`min 8`, `[a-z][A-Z][0-9]`, must match confirm).

Submit → `POST /users/me/password { currentPassword, newPassword }`. On success: clear fields, show toast "Password updated".

#### Sign out

A standalone "Sign out" button (destructive color). Confirmation dialog → calls `logout()` → routes to AuthStack.

#### Delete account

In a destructive-styled card at the bottom:

- Warning copy listing what will be deleted (receipts, recurring expenses, categories, loyalty cards, profile data).
- Confirmation gate: user must type `DELETE` (literal) into a text input before the destructive button becomes enabled.
- Action → `DELETE /users/me`. On success: `logout()`, route to AuthStack, show toast "Account deleted".

---

## Settings store wiring

The `useSettingsStore` (`src/store/settings.ts`) needs two small RN adaptations:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createJSONStorage, persist } from 'zustand/middleware'

persist(
  (set) => ({ /* same state + actions */ }),
  {
    name: 'receipto-settings',
    storage: createJSONStorage(() => AsyncStorage),
    onRehydrateStorage: () => (state) => {
      if (state?.language) i18n.changeLanguage(state.language)
      // theme + accent applied through ThemeProvider's useEffect on store change
    },
  }
)
```

`setTheme` / `setAccentColor` should _not_ touch `document.documentElement` — that doesn't exist on RN. Instead, a `<ThemeProvider>` at the app root subscribes to the store and re-creates a theme object via `useColorScheme()` (for `'system'`) + the user's accent. See `10-design-system.md`.

---

## Visual spec

See `../design-output/settings/` for the full visual spec (grouped-list pattern, swatch picker, switch styling, destructive-section emphasis, avatar upload states). This doc owns the API integration, form validation, and behavior rules (like locking `budgetCurrency` and gating Delete Account behind "DELETE" typed literal).

---

## Acceptance checklist

- [ ] App settings persist across restart and re-launch.
- [ ] Theme/accent switches apply immediately, no visible flash.
- [ ] Language changes immediately AND syncs to backend.
- [ ] Currency change updates Dashboard amounts on next render.
- [ ] Notification toggles patch the backend correctly.
- [ ] Avatar upload validates size/mime and shows progress feedback.
- [ ] Profile save patches only the diff (don't send unchanged fields).
- [ ] Password change validates per Zod schema and shows server errors inline.
- [ ] Delete account requires "DELETE" typed literal; confirmation routes to AuthStack.
- [ ] Sign out clears tokens, query cache, and routes to AuthStack.
