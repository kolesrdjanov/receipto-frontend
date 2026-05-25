# 16 — Code skeletons

Copy-paste-ready TypeScript skeletons for the foundation pieces. These compile (in spirit — check imports against your installed versions) and demonstrate the patterns the rest of the codebase should follow.

> The skeletons assume **Expo SDK + NativeWind v4**. If you go pure RN or pure StyleSheet, the substitutions are obvious (replace `className` props with `style` from a `useTheme()` hook).

---

## `App.tsx`

Root component: providers, navigation, theme initialization, Sentry, query client.

```tsx
import 'react-native-gesture-handler' // must be the very first import
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { NavigationContainer } from '@react-navigation/native'
import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import * as Sentry from '@sentry/react-native'
import Toast from 'react-native-toast-message'
import { useFonts } from 'expo-font'

import { ThemeProvider } from '@/theme/ThemeProvider'
import { RootNavigator, linking } from '@/navigation/RootNavigator'
import './src/i18n' // initializes i18next as a side-effect

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableAutoSessionTracking: true,
  tracesSampleRate: 0.2,
  enabled: !__DEV__,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
})

// Refetch on app foreground
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active')
  })
  return () => subscription.remove()
})

// Pause queries when offline; resume on reconnect
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})

function App() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
  })

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <BottomSheetModalProvider>
              <NavigationContainer linking={linking}>
                <RootNavigator />
              </NavigationContainer>
              <StatusBar style="auto" />
              <Toast />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default Sentry.wrap(App)
```

---

## `src/theme/tokens.ts`

The precomputed token tables (from `10-design-system.md`). Generate this once.

```ts
export type Mode = 'light' | 'dark'
export type Accent = 'zinc' | 'blue' | 'green' | 'purple' | 'orange' | 'rose'

export type Theme = {
  mode: Mode
  accent: Accent
  colors: {
    background: string
    foreground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    muted: string
    mutedForeground: string
    accent: string
    accentForeground: string
    destructive: string
    destructiveForeground: string
    success: string
    warning: string
    border: string
    input: string
    ring: string
    chart: [string, string, string, string, string]
  }
  radii: { sm: 6; md: 8; lg: 10; xl: 14; '2xl': 18; '3xl': 22; full: 9999 }
  spacing: { 0: 0; 0.5: 2; 1: 4; 1.5: 6; 2: 8; 2.5: 10; 3: 12; 4: 16; 5: 20; 6: 24; 8: 32; 10: 40; 12: 48; 16: 64; 20: 80 }
  shadows: Record<'none' | 'sm' | 'md' | 'lg' | 'xl', object>
}

const base = {
  light: {
    background: '#FFFFFF',
    foreground: '#252525',
    card: '#FFFFFF',
    cardForeground: '#252525',
    popover: '#FFFFFF',
    popoverForeground: '#252525',
    secondary: '#F5F5F5',
    secondaryForeground: '#343434',
    muted: '#F5F5F5',
    mutedForeground: '#878787',
    accent: '#F5F5F5',
    accentForeground: '#343434',
    destructive: '#DC2626',
    destructiveForeground: '#FFFFFF',
    success: '#16A34A',
    warning: '#D97706',
    border: '#E5E5E5',
    input: '#E5E5E5',
    chart: ['#F97316', '#0891B2', '#1E40AF', '#FACC15', '#F59E0B'] as const,
  },
  dark: {
    background: '#252525',
    foreground: '#FBFBFB',
    card: '#343434',
    cardForeground: '#FBFBFB',
    popover: '#343434',
    popoverForeground: '#FBFBFB',
    secondary: '#454545',
    secondaryForeground: '#FBFBFB',
    muted: '#454545',
    mutedForeground: '#B5B5B5',
    accent: '#454545',
    accentForeground: '#FBFBFB',
    destructive: '#F87171',
    destructiveForeground: '#FFFFFF',
    success: '#22C55E',
    warning: '#F59E0B',
    border: 'rgba(255,255,255,0.10)',
    input: 'rgba(255,255,255,0.15)',
    chart: ['#6366F1', '#34D399', '#F59E0B', '#C084FC', '#F472B6'] as const,
  },
}

const accents = {
  zinc:   { light: { primary: '#3F3F46', primaryForeground: '#FBFBFB', ring: '#878787' },
            dark:  { primary: '#E4E4E7', primaryForeground: '#343434', ring: '#878787' } },
  blue:   { light: { primary: '#2563EB', primaryForeground: '#FFFFFF', ring: '#2563EB' },
            dark:  { primary: '#3B82F6', primaryForeground: '#252525', ring: '#3B82F6' } },
  green:  { light: { primary: '#16A34A', primaryForeground: '#FFFFFF', ring: '#16A34A' },
            dark:  { primary: '#22C55E', primaryForeground: '#252525', ring: '#22C55E' } },
  purple: { light: { primary: '#7C3AED', primaryForeground: '#FFFFFF', ring: '#7C3AED' },
            dark:  { primary: '#A78BFA', primaryForeground: '#252525', ring: '#A78BFA' } },
  orange: { light: { primary: '#EA580C', primaryForeground: '#252525', ring: '#EA580C' },
            dark:  { primary: '#F97316', primaryForeground: '#252525', ring: '#F97316' } },
  rose:   { light: { primary: '#E11D48', primaryForeground: '#FFFFFF', ring: '#E11D48' },
            dark:  { primary: '#FB7185', primaryForeground: '#252525', ring: '#FB7185' } },
}

const radii = { sm: 6, md: 8, lg: 10, xl: 14, '2xl': 18, '3xl': 22, full: 9999 } as const
const spacing = { 0: 0, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80 } as const

const shadows = {
  none: {},
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 32, elevation: 16 },
} as const

export function buildTheme(mode: Mode, accent: Accent): Theme {
  const accentColors = accents[accent][mode]
  return {
    mode,
    accent,
    colors: { ...base[mode], ...accentColors } as Theme['colors'],
    radii,
    spacing,
    shadows,
  }
}
```

---

## `src/theme/ThemeProvider.tsx`

```tsx
import { createContext, useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'
import { useSettingsStore } from '@/store/settings'
import { buildTheme, type Theme } from './tokens'

const ThemeContext = createContext<Theme | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themePref = useSettingsStore((s) => s.theme)
  const accent = useSettingsStore((s) => s.accentColor)
  const systemScheme = useColorScheme() ?? 'light'

  const mode = themePref === 'system' ? systemScheme : themePref

  const theme = useMemo(() => buildTheme(mode, accent), [mode, accent])

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext)
  if (!t) throw new Error('useTheme must be used within ThemeProvider')
  return t
}
```

If you use **NativeWind v4**, also apply CSS variables to the root via `vars()` so Tailwind classes like `bg-card` work — see NativeWind's "dark mode with class strategy" docs.

---

## `src/store/auth.ts`

Direct port of the web's auth store with `AsyncStorage` swapped in.

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  profileImageUrl?: string | null
  role: 'user' | 'admin'
  warrantyReminderEnabled?: boolean
  budgetAlertEnabled?: boolean
  receiptMilestoneEmailsEnabled?: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  login: (user: User, accessToken: string, refreshToken?: string) => void
  logout: () => void
  setAccessToken: (token: string) => void
  setRefreshToken: (token: string) => void
  updateUser: (patch: Partial<User>) => void
  setHasHydrated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken: refreshToken ?? null, isAuthenticated: true }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      updateUser: (patch) => {
        const current = get().user
        if (!current) return
        set({ user: { ...current, ...patch } })
      },
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)

export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin')
```

The `_hasHydrated` flag is mobile-specific. AsyncStorage is async; you need to wait for rehydration before deciding the initial navigator branch. The `RootNavigator` below uses this.

---

## `src/store/settings.ts`

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18n from '@/i18n'

export type Currency = string
export type Theme = 'light' | 'dark' | 'system'
export type AccentColor = 'zinc' | 'blue' | 'green' | 'purple' | 'orange' | 'rose'
export type Language = 'en' | 'sr'

interface SettingsState {
  currency: Currency
  theme: Theme
  accentColor: AccentColor
  language: Language
  amountsVisible: boolean
  setCurrency: (c: Currency) => void
  setTheme: (t: Theme) => void
  setAccentColor: (a: AccentColor) => void
  setLanguage: (l: Language) => void
  toggleAmountsVisible: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      currency: 'RSD',
      theme: 'system',
      accentColor: 'zinc',
      language: 'en',
      amountsVisible: true,
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setLanguage: (language) => {
        set({ language })
        i18n.changeLanguage(language)
      },
      toggleAmountsVisible: () => set((s) => ({ amountsVisible: !s.amountsVisible })),
    }),
    {
      name: 'receipto-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language) i18n.changeLanguage(state.language)
      },
    }
  )
)
```

Note: `setTheme`/`setAccentColor` no longer touch the DOM. The `ThemeProvider` re-derives the theme reactively from these store values.

---

## `src/lib/api.ts`

Direct port. Same logic, same single-flight refresh, same `ApiError`. The only RN-specific change is reading `EXPO_PUBLIC_API_URL` instead of `VITE_APP_API_URL`.

```ts
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'
import { useSettingsStore } from '@/store/settings'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? ''

interface ApiRequestOptions extends AxiosRequestConfig {
  requiresAuth?: boolean
}

export class ApiError extends Error {
  status?: number
  rawMessage?: string
  code?: string
  constructor(message: string, options?: { status?: number; rawMessage?: string; code?: string }) {
    super(message)
    this.name = 'ApiError'
    this.status = options?.status
    this.rawMessage = options?.rawMessage
    this.code = options?.code
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError

let refreshPromise: Promise<boolean> | null = null

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const requiresAuth = (config as any).requiresAuth !== false
  if (requiresAuth) {
    const token = useAuthStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['Accept-Language'] = useSettingsStore.getState().language || 'en'
  if (config.data instanceof FormData) delete config.headers['Content-Type']
  return config
})

axiosInstance.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const requiresAuth = (original as any).requiresAuth !== false

    if (error.response?.status === 401 && requiresAuth && !original._retry) {
      original._retry = true
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        const newToken = useAuthStore.getState().accessToken
        if (newToken) original.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(original)
      } else {
        useAuthStore.getState().logout()
        return Promise.reject(new ApiError('Session expired. Please sign in again.', { status: 401 }))
      }
    }

    return Promise.reject(error)
  }
)

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) return false

      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      )
      const store = useAuthStore.getState()
      store.setAccessToken(data.accessToken)
      if (data.refreshToken) store.setRefreshToken(data.refreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiRequest<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const { requiresAuth = true, ...rest } = options
  try {
    const { data } = await axiosInstance.request<T>({ url: endpoint, ...rest, requiresAuth } as any)
    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as { message?: string | string[]; code?: string } | undefined
      const raw = payload?.message
      const message = Array.isArray(raw) ? raw.join(', ') : raw || error.message || 'An error occurred'
      throw new ApiError(message, {
        status: error.response?.status,
        rawMessage: Array.isArray(raw) ? raw.join(', ') : raw,
        code: payload?.code,
      })
    }
    throw error
  }
}

export const api = {
  get:    <T>(e: string, o?: ApiRequestOptions)               => apiRequest<T>(e, { ...o, method: 'GET' }),
  post:   <T>(e: string, d?: unknown, o?: ApiRequestOptions)  => apiRequest<T>(e, { ...o, method: 'POST',  data: d }),
  put:    <T>(e: string, d?: unknown, o?: ApiRequestOptions)  => apiRequest<T>(e, { ...o, method: 'PUT',   data: d }),
  patch:  <T>(e: string, d?: unknown, o?: ApiRequestOptions)  => apiRequest<T>(e, { ...o, method: 'PATCH', data: d }),
  delete: <T>(e: string, o?: ApiRequestOptions)               => apiRequest<T>(e, { ...o, method: 'DELETE' }),
}
```

---

## `src/navigation/RootNavigator.tsx`

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuthStore } from '@/store/auth'
import { AuthStack } from './AuthStack'
import { AppTabs } from './AppTabs'

const RootStack = createNativeStackNavigator()

export const linking = {
  prefixes: ['receipto://', 'https://app.receipto.rs'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          VerifyEmail: 'verify-email',
          ResetPassword: 'reset-password',
        },
      },
      AppTabs: {
        screens: {
          ReceiptsTab: {
            screens: { ReceiptDetail: 'receipts/:id' },
          },
        },
      },
    },
  },
} as const

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s._hasHydrated)

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated
        ? <RootStack.Screen name="AppTabs" component={AppTabs} />
        : <RootStack.Screen name="AuthStack" component={AuthStack} />}
    </RootStack.Navigator>
  )
}
```

---

## `src/navigation/AuthStack.tsx`

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SignInScreen } from '@/screens/auth/SignInScreen'
import { SignUpScreen } from '@/screens/auth/SignUpScreen'
import { CheckEmailScreen } from '@/screens/auth/CheckEmailScreen'
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPasswordScreen'
import { ResetPasswordScreen } from '@/screens/auth/ResetPasswordScreen'
import { VerifyEmailScreen } from '@/screens/auth/VerifyEmailScreen'

const Stack = createNativeStackNavigator()

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="CheckEmail" component={CheckEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  )
}
```

---

## `src/navigation/AppTabs.tsx`

The 5-tab bar with the center FAB. The center "tab" is a fake — it doesn't navigate; it dispatches a navigation to the Scanner modal.

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import { Pressable, View } from 'react-native'
import { LayoutDashboard, Receipt, Repeat, Menu, ScanLine } from 'lucide-react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { DashboardStack } from './stacks/DashboardStack'
import { ReceiptsStack } from './stacks/ReceiptsStack'
import { RecurringStack } from './stacks/RecurringStack'
import { MoreStack } from './stacks/MoreStack'

const Tab = createBottomTabNavigator()

function CenterFabButton() {
  const navigation = useNavigation<any>()
  const theme = useTheme()
  return (
    <Pressable
      onPress={() => navigation.navigate('Scanner')}
      style={{
        top: -16,
        alignSelf: 'center',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.md,
      }}
      accessibilityLabel="Scan receipt"
      accessibilityRole="button"
    >
      <ScanLine size={24} color={theme.colors.primaryForeground} />
    </Pressable>
  )
}

export function AppTabs() {
  const theme = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen name="DashboardTab"  component={DashboardStack}  options={{ title: 'Home',      tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tab.Screen name="ReceiptsTab"   component={ReceiptsStack}   options={{ title: 'Receipts',  tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} /> }} />
      <Tab.Screen
        name="ScanFakeTab"
        component={EmptyScreen}
        options={{ tabBarButton: () => <CenterFabButton />, tabBarLabel: () => null }}
      />
      <Tab.Screen name="RecurringTab"  component={RecurringStack}  options={{ title: 'Recurring', tabBarIcon: ({ color, size }) => <Repeat color={color} size={size} /> }} />
      <Tab.Screen name="MoreTab"       component={MoreStack}       options={{ title: 'More',      tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }} />
    </Tab.Navigator>
  )
}

function EmptyScreen() { return <View /> } // never rendered; the FAB short-circuits navigation
```

The `Scanner` screen is registered at the root level (in `RootNavigator`) as a modal — not shown above for brevity. Add this once you build M5:

```tsx
<RootStack.Screen name="Scanner" component={ScannerScreen} options={{ presentation: 'fullScreenModal' }} />
```

---

## `src/components/ui/Button.tsx`

NativeWind variant. The pattern: a class-variance-authority-equivalent function `buttonClasses({ variant, size })` returning Tailwind class strings.

```tsx
import { forwardRef } from 'react'
import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native'
import { cn } from '@/lib/cn' // tiny utility: tailwind-merge + clsx

type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const baseContainer = 'flex-row items-center justify-center gap-2'

const variantContainer: Record<Variant, string> = {
  default:     'bg-primary',
  destructive: 'bg-destructive',
  outline:     'bg-transparent border border-border',
  secondary:   'bg-secondary',
  ghost:       'bg-transparent',
  link:        'bg-transparent',
}

const variantText: Record<Variant, string> = {
  default:     'text-primary-foreground',
  destructive: 'text-destructive-foreground',
  outline:     'text-foreground',
  secondary:   'text-secondary-foreground',
  ghost:       'text-foreground',
  link:        'text-primary underline',
}

const sizeContainer: Record<Size, string> = {
  sm:   'h-9 px-3 rounded-md',
  md:   'h-11 px-4 rounded-lg',
  lg:   'h-13 px-5 rounded-xl',
  icon: 'h-11 w-11 rounded-lg',
}

const sizeText: Record<Size, string> = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-base font-semibold',
  icon: 'text-base font-medium',
}

type Props = Omit<PressableProps, 'children'> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  children?: React.ReactNode
}

export const Button = forwardRef<View, Props>(function Button(
  { variant = 'default', size = 'md', loading, disabled, children, style, ...rest }, ref
) {
  return (
    <Pressable
      ref={ref as any}
      disabled={disabled || loading}
      className={cn(
        baseContainer,
        variantContainer[variant],
        sizeContainer[size],
        (disabled || loading) && 'opacity-50'
      )}
      style={style}
      {...rest}
    >
      {loading
        ? <ActivityIndicator />
        : typeof children === 'string'
          ? <Text className={cn(variantText[variant], sizeText[size])}>{children}</Text>
          : children}
    </Pressable>
  )
})
```

---

## `src/components/ui/Card.tsx`

```tsx
import { View, Text, type ViewProps, type TextProps } from 'react-native'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('bg-card rounded-2xl border border-border', className)} {...props} />
}

export function CardHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('p-5 pb-3', className)} {...props} />
}

export function CardTitle({ className, ...props }: TextProps & { className?: string }) {
  return <Text className={cn('text-lg font-semibold text-card-foreground', className)} {...props} />
}

export function CardDescription({ className, ...props }: TextProps & { className?: string }) {
  return <Text className={cn('text-sm text-muted-foreground mt-1', className)} {...props} />
}

export function CardContent({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('p-5 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('p-5 pt-0 flex-row items-center', className)} {...props} />
}
```

---

## `src/lib/cn.ts`

```ts
import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```

---

## Sample screen: `src/screens/auth/SignInScreen.tsx`

Shows the assembled pattern: theme + form + zod + react-hook-form + i18n + api + navigation.

```tsx
import { View, Text, TextInput, Alert } from 'react-native'
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api, isApiError } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/Button'
import { SafeAreaView } from 'react-native-safe-area-context'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: import('@/store/auth').User
}

export function SignInScreen() {
  const { t } = useTranslation()
  const navigation = useNavigation<any>()
  const login = useAuthStore((s) => s.login)
  const [serverError, setServerError] = useState<string | null>(null)
  const [emailNotVerified, setEmailNotVerified] = useState(false)

  const { control, handleSubmit, formState, getValues } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setServerError(null)
    setEmailNotVerified(false)
    try {
      const data = await api.post<LoginResponse>('/auth/login', values, { requiresAuth: false })
      login(data.user, data.accessToken, data.refreshToken)
    } catch (e) {
      if (isApiError(e)) {
        if (e.code === 'auth.emailNotVerified') setEmailNotVerified(true)
        setServerError(e.message)
      } else {
        setServerError(t('common.unknownError') ?? 'Something went wrong')
      }
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 pt-12 gap-4">
        <Text className="text-2xl font-bold text-foreground">{t('auth.signIn.title')}</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, onBlur } }) => (
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">{t('auth.email')}</Text>
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                className="h-12 px-3 rounded-lg border border-input bg-card text-foreground"
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value, onBlur } }) => (
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2">{t('auth.password')}</Text>
              <TextInput
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                className="h-12 px-3 rounded-lg border border-input bg-card text-foreground"
              />
            </View>
          )}
        />

        {serverError && (
          <View className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <Text className="text-destructive">{serverError}</Text>
            {emailNotVerified && (
              <Button
                variant="link"
                onPress={() => navigation.navigate('CheckEmail', { email: getValues('email') })}
              >
                {t('auth.resendVerification')}
              </Button>
            )}
          </View>
        )}

        <Button onPress={handleSubmit(onSubmit)} loading={formState.isSubmitting}>
          {t('auth.signIn.submit')}
        </Button>

        <Button variant="link" onPress={() => navigation.navigate('ForgotPassword')}>
          {t('auth.forgotPassword')}
        </Button>

        <Button variant="link" onPress={() => navigation.navigate('SignUp')}>
          {t('auth.noAccount')}
        </Button>
      </View>
    </SafeAreaView>
  )
}
```

---

## `src/i18n/index.ts`

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import en from './en.json'
import sr from './sr.json'

const fallback = 'en'
const supported = ['en', 'sr'] as const

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? fallback
const initial = supported.includes(deviceLanguage as any) ? (deviceLanguage as 'en' | 'sr') : fallback

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, sr: { translation: sr } },
  lng: initial,
  fallbackLng: fallback,
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
```

---

## What's intentionally not in this doc

- **Vision Camera setup** — covered in `06-scanning.md`, install when you reach M5.
- **The retry loop / state machine** — long-form in `06-scanning.md`. Copy the implementation patterns from `src/hooks/receipts/use-receipt-scanner.tsx` in the web repo.
- **NativeWind config files** (`tailwind.config.js`, `babel.config.js`, `global.css`) — follow the NativeWind v4 docs verbatim once you've decided on it; not worth duplicating the template here.
- **App icon / splash assets** — design deliverable, not code.

Everything above gets you from `expo init` to a running app that signs in, persists auth, themes dynamically, and routes between tabs and modals. The rest is feature work, milestone by milestone.
