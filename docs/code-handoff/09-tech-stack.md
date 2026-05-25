# 09 — Tech stack & project setup

Recommended React Native stack for the Receipto clone, with the rationale for each pick and explicit web → mobile substitutions.

---

## Foundation

| Concern         | Pick                                            | Why                                                          |
| --------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Framework       | **Expo SDK (managed, latest stable)**          | Faster boot, OTA updates, good native module ecosystem.       |
| Language        | TypeScript (strict)                             | Same as web. Keep the type model in sync.                    |
| RN version      | Whatever the chosen Expo SDK pins              | Don't fight the SDK.                                          |
| Package manager | pnpm or npm                                     | Match the web's `package-lock.json` style.                   |

If the team has hard requirements that conflict with Expo (e.g. specific native modules outside Expo's ecosystem), use bare React Native, but **prefer Expo by default** for this project — most native deps below have first-class Expo support.

---

## Direct web → RN substitutions

| Web                                            | RN                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `vite` build tooling                           | Expo / Metro                                                                       |
| `react-router-dom`                             | `@react-navigation/native` + native-stack + bottom-tabs                            |
| Tailwind + shadcn (CSS)                        | **NativeWind v4** (Tailwind for RN) + custom themed components                     |
| `localStorage` + `zustand/persist`             | `@react-native-async-storage/async-storage` (or `react-native-mmkv`) via `createJSONStorage` |
| `@radix-ui/*`                                  | RN core components + `@gorhom/bottom-sheet` for sheets, `react-native-modal` for modals |
| `framer-motion`                                | `react-native-reanimated` v3                                                       |
| `recharts`                                     | `victory-native` v37+ (or `react-native-svg-charts`)                               |
| `lucide-react`                                 | `lucide-react-native` (same icon set)                                              |
| `sonner` (toasts)                              | `react-native-toast-message` or `burnt`                                            |
| `react-day-picker`                             | `react-native-date-picker` (iOS-style wheel) or `@react-native-community/datetimepicker` |
| `react-hook-form`                              | `react-hook-form` (works on RN as-is)                                              |
| `@tanstack/react-query`                        | `@tanstack/react-query` (same package, works on RN)                                |
| `zod`                                          | `zod` (same package, works on RN)                                                  |
| `axios`                                        | `axios` (same package, works on RN)                                                |
| `i18next` + `react-i18next`                    | `i18next` + `react-i18next` (works on RN, use `expo-localization` for device locale) |
| `date-fns`                                     | `date-fns` (same package, works on RN)                                             |
| `@react-oauth/google`                          | `@react-native-google-signin/google-signin` (or `expo-auth-session`)               |
| `@yudiel/react-qr-scanner`, `html5-qrcode`     | `react-native-vision-camera` + `vision-camera-code-scanner` (preferred) OR `expo-camera` |
| `react-barcode`                                | `@kichiyaki/react-native-barcode-generator` (1D), `react-native-qrcode-svg` (QR)   |
| `qrcode.react`                                 | `react-native-qrcode-svg`                                                          |
| `heic2any`                                     | not needed — image pickers return JPEG on iOS                                      |
| `@sentry/react`                                | `@sentry/react-native`                                                             |
| `@dnd-kit/*`                                   | drop — no drag-reorder on mobile dashboard                                         |

---

## Recommended additional libraries

- `react-native-safe-area-context` — for safe-area insets (notch / pill / nav bar). Wrap the root in `SafeAreaProvider`.
- `react-native-screens` — native screen primitives for React Navigation.
- `react-native-gesture-handler` — for sheet gestures, swipe-to-delete.
- `react-native-reanimated` — for animations beyond simple opacity / position.
- `react-native-svg` — required by `victory-native`, `react-native-qrcode-svg`, etc.
- `expo-image` — fast image component with built-in caching, supports HEIC.
- `expo-image-picker` — gallery + camera image picker.
- `expo-clipboard` — copy code values.
- `expo-haptics` — feedback on scans and key actions.
- `expo-brightness` — boost screen brightness on loyalty-card display.
- `@gorhom/bottom-sheet` — high-quality bottom sheets for filters, pickers, modals.
- `expo-secure-store` — optionally for storing refresh tokens (more secure than AsyncStorage); access token in memory only.

---

## Project layout

Mirror the web's structure where it makes sense:

```
receipto-mobile/
├─ app.json / app.config.ts          # Expo config (scheme: 'receipto', etc.)
├─ tsconfig.json
├─ App.tsx                            # root component (providers, navigation, theme)
├─ src/
│  ├─ navigation/
│  │  ├─ RootNavigator.tsx           # Auth vs App switch
│  │  ├─ AuthStack.tsx               # sign-in, sign-up, etc.
│  │  ├─ AppTabs.tsx                 # bottom tabs
│  │  └─ stacks/
│  │     ├─ DashboardStack.tsx
│  │     ├─ ReceiptsStack.tsx
│  │     ├─ RecurringStack.tsx
│  │     ├─ LoyaltyStack.tsx
│  │     └─ SettingsStack.tsx
│  ├─ screens/
│  │  ├─ auth/{SignIn,SignUp,ForgotPassword,ResetPassword,CheckEmail,VerifyEmail}.tsx
│  │  ├─ dashboard/Dashboard.tsx
│  │  ├─ receipts/{ReceiptsList,ReceiptDetail,ReceiptManualEntry,ReceiptPfrEntry}.tsx
│  │  ├─ recurring/{RecurringList,RecurringForm,PaymentHistory}.tsx
│  │  ├─ categories/{CategoriesList,CategoryForm,CategoryDelete}.tsx
│  │  ├─ loyalty/{LoyaltyList,LoyaltyDisplay,LoyaltyForm}.tsx
│  │  ├─ scan/{Scanner,GalleryProcessing,RetryCard}.tsx
│  │  └─ settings/{SettingsIndex,AppSettings,Profile,Account}.tsx
│  ├─ components/
│  │  ├─ ui/                          # Button, Card, Input, Sheet, Switch, etc.
│  │  ├─ dashboard/                   # widget components
│  │  ├─ receipts/
│  │  ├─ recurring/
│  │  ├─ categories/
│  │  ├─ loyalty/
│  │  └─ shared/                      # CurrencyAmount, CategoryPill, StatusBadge, etc.
│  ├─ hooks/                          # mirrors web /src/hooks/*
│  ├─ store/                          # auth, settings, dashboard (Zustand)
│  ├─ lib/                            # api.ts, query-keys.ts, date-utils.ts
│  ├─ theme/                          # tokens, ThemeProvider
│  └─ i18n/                           # en.json, sr.json, index.ts
└─ assets/
   ├─ icons/
   └─ fonts/Plus_Jakarta_Sans/        # see design-system doc
```

---

## App config (Expo)

`app.config.ts` minimums:

```ts
export default {
  name: 'Receipto',
  slug: 'receipto-mobile',
  scheme: 'receipto',                        // for deep links: receipto://...
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#ffffff' },
  ios: {
    bundleIdentifier: 'rs.receipto.mobile',
    infoPlist: {
      NSCameraUsageDescription: 'Receipto uses the camera to scan receipt QR codes and loyalty cards.',
      NSPhotoLibraryUsageDescription: 'Receipto reads receipt and loyalty card images from your photo library.',
    },
    associatedDomains: ['applinks:app.receipto.rs'],  // for universal links
  },
  android: {
    package: 'rs.receipto.mobile',
    permissions: ['CAMERA'],
    intentFilters: [{ /* universal link config */ }],
  },
  plugins: [
    'expo-image-picker',
    'expo-brightness',
    'expo-notifications',
    ['react-native-vision-camera', { cameraPermissionText: 'Receipto needs camera access to scan QR codes.' }],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  },
}
```

Env vars:

- `EXPO_PUBLIC_API_URL` — backend URL (e.g. `https://api.receipto.rs`)
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` — Google OAuth (separate iOS/Android client IDs)
- `EXPO_PUBLIC_SENTRY_DSN`

---

## Universal links / deep links

The auth flow uses two deep links:

- `receipto://verify-email?token=<JWT>`
- `receipto://reset-password?token=<JWT>`

Also configure **universal links** (`https://app.receipto.rs/verify-email?token=…`) so emails opened in iOS Mail / Android Gmail open the app directly. Requires:

- iOS: `apple-app-site-association` file on the backend domain.
- Android: `assetlinks.json` on the backend domain + `android:autoVerify="true"` in the intent filter.

React Navigation's linking config:

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
    },
  },
}
```

---

## TypeScript / lint / formatting

- Same `tsconfig` flags as web (`strict: true`, paths alias for `@/`).
- ESLint config based on `@react-native-community/eslint-config` (or the Expo template).
- Husky + lint-staged on commit — same setup as web.

---

## Testing

- Unit: **Jest** + **React Native Testing Library** for components & hooks.
- E2E: **Maestro** (recommended for RN) or Detox. Cover the auth flow, the scan retry loop, and a happy-path receipt creation.

---

## Build / release

- iOS: EAS Build → TestFlight → App Store.
- Android: EAS Build → internal track → production.
- OTA updates: EAS Update for JS-only changes.

CI/CD: GitHub Actions with `eas build --auto-submit` on tagged releases.
