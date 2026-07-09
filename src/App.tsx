import { Suspense, useEffect } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { routes, prefetchLazyRoutes } from './routes'
import { ScrollToTop } from '@/components/scroll-to-top'
import { useSettingsStore } from './store/settings'

// Luma toast styling — a flat card with a hairline border and floating shadow,
// plus a 22px status circle per kind (primary check for success, danger-soft ✕
// for error). Token-driven, so it adapts to dark mode. No dismiss button —
// toasts auto-dismiss.
const toasterIcons = {
  success: <Check className="size-3" strokeWidth={3} />,
  error: <X className="size-3" strokeWidth={3} />,
  warning: <TriangleAlert className="size-3" strokeWidth={2.5} />,
  info: <Info className="size-3" strokeWidth={2.5} />,
}

// Luma toast: flat card + hairline + shadow-2, 12px radius; leading 22px status circle
// (success = primary fill + check; error = danger-soft). Monochrome elsewhere.
const toasterClassNames = {
  toast:
    '!rounded-xl !border !border-border !bg-popover !text-foreground !shadow-glass-3 !p-3.5 !gap-3',
  title: '!text-[13px] !font-semibold !leading-tight !text-foreground',
  description: '!text-[13px] !leading-snug !text-muted-foreground',
  icon: '!m-0 !size-[22px] !shrink-0 !items-center !justify-center !self-start !rounded-full',
  success: '[&_[data-icon]]:!bg-primary [&_[data-icon]]:!text-primary-foreground',
  error:
    '[&_[data-icon]]:!bg-destructive-soft [&_[data-icon]]:!text-[color:var(--destructive-foreground-on-soft)]',
  warning: '[&_[data-icon]]:!bg-subtle [&_[data-icon]]:!text-foreground',
  info: '[&_[data-icon]]:!bg-subtle [&_[data-icon]]:!text-foreground',
  loading: '[&_[data-icon]]:!bg-subtle [&_[data-icon]]:!text-muted-foreground',
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes — clean up unused cache entries
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  return useRoutes(routes)
}

function ThemeInitializer() {
  const { theme } = useSettingsStore()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Accent retired — app is locked to brand emerald (index.css). Strip any
    // stale accent class persisted from before the lock; add none.
    root.classList.remove('accent-zinc', 'accent-blue', 'accent-green', 'accent-purple', 'accent-orange', 'accent-rose')
  }, [theme])

  return null
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

function GoogleProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!googleClientId) return <>{children}</>
  return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>
}

function App() {
  useEffect(() => { prefetchLazyRoutes() }, [])

  return (
    <GoogleProviderWrapper>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider delayDuration={300}>
            <ThemeInitializer />
            <ScrollToTop />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
              <AppRoutes />
            </Suspense>
            <Toaster
              position="bottom-right"
              icons={toasterIcons}
              toastOptions={{ classNames: toasterClassNames }}
            />
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleProviderWrapper>
  )
}

export default App
