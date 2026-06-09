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

// Glass toast styling — a clean white (popover) card with a soft border + lifted
// shadow, and a tinted rounded "icon chip" per status (emerald-soft for success,
// red-soft for error, etc.) holding a strong status-colored glyph. Token-driven,
// so it adapts to dark mode. No dismiss button — toasts auto-dismiss.
const toasterIcons = {
  success: <Check className="size-[18px]" strokeWidth={3} />,
  error: <X className="size-[18px]" strokeWidth={3} />,
  warning: <TriangleAlert className="size-[17px]" strokeWidth={2.5} />,
  info: <Info className="size-[17px]" strokeWidth={2.5} />,
}

const toasterClassNames = {
  toast:
    '!rounded-2xl !border !border-hairline-soft !bg-popover !text-foreground !shadow-glass-3 !p-3.5 !gap-3',
  title: '!text-[14px] !font-semibold !leading-tight !text-foreground',
  description: '!text-[13px] !leading-snug !text-muted-foreground',
  // The default icon slot becomes the tinted 36px chip; the per-type rows below set its colors.
  icon: '!m-0 !size-9 !shrink-0 !items-center !justify-center !self-start !rounded-xl',
  success: '[&_[data-icon]]:!bg-success-soft [&_[data-icon]]:!text-success',
  error: '[&_[data-icon]]:!bg-destructive-soft [&_[data-icon]]:!text-destructive',
  warning: '[&_[data-icon]]:!bg-warning-soft [&_[data-icon]]:!text-warning-foreground',
  info: '[&_[data-icon]]:!bg-info-soft [&_[data-icon]]:!text-info-foreground',
  loading: '[&_[data-icon]]:!bg-bg-subtle [&_[data-icon]]:!text-muted-foreground',
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
              position="top-right"
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
