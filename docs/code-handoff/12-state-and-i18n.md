# 12 — State, persistence, i18n

The web app's state architecture is intentionally simple — **Zustand for client state, React Query for server state, i18next for translations**. Port all three nearly verbatim to RN.

---

## Zustand stores

Three stores live at `src/store/*` on web:

### `useAuthStore` (`auth.ts`)

State: `user`, `accessToken`, `refreshToken`, `isAuthenticated`.

Actions: `login()`, `logout()`, `setAccessToken()`, `setRefreshToken()`, `updateUser()`.

Persisted under key `auth-storage`. **Port verbatim**, only swap storage:

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({ /* identical to web */ }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

**Security consideration**: AsyncStorage isn't encrypted on Android prior to API 23. For sensitive tokens, prefer:

- **Access token** in memory (the Zustand store is fine — it lives in RAM).
- **Refresh token** in `expo-secure-store` (Keychain on iOS, EncryptedSharedPreferences on Android).

If you go this route, split the store: keep the refresh token's serialization custom (read/write via SecureStore from within the actions) and let the rest persist via AsyncStorage. For v1, **AsyncStorage for both is acceptable** — the web stores them in `localStorage` already.

### `useSettingsStore` (`settings.ts`)

State: `currency`, `theme`, `accentColor`, `language`, `amountsVisible`. (Drop `sidebarCollapsed`.)

Actions: setters + `toggleAmountsVisible()`.

Persisted under key `receipto-settings`.

Web's `setTheme` and `setAccentColor` toggle `document.documentElement` classes — drop that. On RN the `ThemeProvider` (see `10-design-system.md`) subscribes to the store and re-derives the theme.

Web's `onRehydrateStorage` calls `i18n.changeLanguage(state.language)`. **Keep this** on RN — it's the same call.

Also keep the **system-color-scheme listener**: web uses `window.matchMedia('(prefers-color-scheme: dark)').addEventListener`. RN equivalent is `Appearance.addChangeListener` (which `useColorScheme` already handles internally if your ThemeProvider uses that hook).

### `useDashboardStore` (`dashboard.ts`)

State: `widgetOrder`, `widgetVisibility`, `widgetSizes`, `isEditMode`.

Persisted under key `receipto-dashboard-v2`.

For the RN clone we **drop `widgetSizes` and reordering** (single-column mobile layout), but keep `widgetVisibility` and `isEditMode`. The rehydration validator that compares stored IDs against the current widget registry should stay — it's self-healing.

```ts
type DashboardState = {
  widgetVisibility: Record<string, boolean>
  isEditMode: boolean
  setWidgetVisible: (id: string, visible: boolean) => void
  toggleEditMode: () => void
  resetToDefault: () => void
}
```

---

## React Query

Same setup as web (`src/App.tsx:10-19`):

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      gcTime: 1000 * 60 * 10,     // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false, // doesn't exist on RN anyway
    },
  },
})
```

RN-specific add-ons worth wiring up:

- **`focusManager.setEventListener`** with `AppState`: refetch on app foreground.
- **`onlineManager.setEventListener`** with `@react-native-community/netinfo`: pause queries when offline, resume when reconnected.
- **No `refetchOnReconnect: true`** — react-query's default `onlineManager` integration on RN needs explicit wiring. See the RN guide in TanStack Query docs.

Query keys live in `src/lib/query-keys.ts`. Port verbatim.

---

## Axios / API client

`src/lib/api.ts` ports nearly verbatim:

- Drop the `import.meta.env.VITE_APP_API_URL` reference — use Expo's `expo-constants` or `process.env.EXPO_PUBLIC_API_URL`.
- The request interceptor reads `accessToken` from the auth store and `Accept-Language` from settings — unchanged.
- The response interceptor's 401 → refresh logic — **unchanged, port verbatim**, including the single-flight `refreshPromise` pattern.
- `ApiError` class — unchanged.
- `axios` runs on RN out of the box.

The `requiresAuth: false` opt-out for unauthenticated requests is used by sign-in / sign-up / forgot-password / reset-password / verify-email — keep the pattern.

---

## i18n

### Setup

```ts
// src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import en from './en.json'
import sr from './sr.json'

const fallback = 'en'
const supported = ['en', 'sr'] as const

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? fallback
const initial = supported.includes(deviceLanguage as any) ? deviceLanguage : fallback

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, sr: { translation: sr } },
    lng: initial,
    fallbackLng: fallback,
    interpolation: { escapeValue: false },
    returnNull: false,
  })

export default i18n
```

The settings store's `onRehydrateStorage` later overrides the device-derived language with the user's saved choice.

### Translation files

Copy `src/i18n/en.json` (1,647 lines) and `src/i18n/sr.json` to the RN project verbatim.

You can **delete keys for out-of-scope features** if you want to keep the bundle small:

- `savings.*`
- `items.*` / `priceCompare.*`
- `groups.*`
- `warranties.*`
- `admin.*`
- `templates.*`
- `coach.*`
- `announcements.*` / `rating.*` (optional — these are app-meta features)

But there's no harm in keeping them — they're small JSON.

### Usage

```ts
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
t('nav.dashboard')
t('settings.profile.rank.descriptions.statusB', { remaining: 12 })
```

Same API as web. Plurals are handled by i18next's CLDR plural rules — already working in the existing JSON.

### Date / number / currency formatting

The web uses `date-fns` for dates and the browser's `Intl` API implicitly. On RN:

- `date-fns` works as-is.
- `Intl` is available but locale data may be limited on Hermes — use `Intl.NumberFormat` with explicit locales (e.g. `new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'RSD' })`). If you hit limitations, add `@formatjs/intl-numberformat/polyfill` and the relevant locale data.

A small helper `formatAmount(amount, currency, locale)` in `src/lib/format.ts` will simplify usage.

---

## Sentry

Web has `@sentry/react` configured. Port to `@sentry/react-native` in `App.tsx`:

```ts
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableAutoSessionTracking: true,
  tracesSampleRate: 0.2,
})
```

Wrap the root with `Sentry.wrap(App)`. Add scoped breadcrumbs in the scan flow (see `06-scanning.md`).

---

## Persistence summary

| Store / item                  | Storage                          | Encrypted? |
| ----------------------------- | -------------------------------- | ---------- |
| `auth-storage`                | AsyncStorage                     | No¹        |
| `receipto-settings`           | AsyncStorage                     | No         |
| `receipto-dashboard-v2`       | AsyncStorage                     | No         |
| React Query cache             | In-memory only                   | —          |
| Refresh token (recommended)   | expo-secure-store                | Yes        |

¹ See "Security consideration" above. If your threat model requires it, split out the refresh token to SecureStore.

No persistence of the React Query cache to disk in v1 — TanStack's persister can be added later for offline-first behavior, but it's a larger investment.

---

## Acceptance checklist

- [ ] Stores rehydrate before the first render (don't render the app until `_hasHydrated` is true for the auth store at least).
- [ ] Logout fully clears auth-storage (Zustand's persist handles this when `set({ … null })`).
- [ ] Settings persist across cold starts; theme + accent visible on first frame.
- [ ] React Query refetches on app foreground via `focusManager` wiring.
- [ ] React Query pauses on offline; resumes on reconnect (`onlineManager`).
- [ ] 401 → single-flight refresh → retry works under concurrent requests.
- [ ] i18n picks up device language by default, persists user choice, applies on rehydrate.
- [ ] Sentry initializes before first render and captures errors in production.
