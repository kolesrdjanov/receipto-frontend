import { Suspense, useEffect } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { routes, prefetchLazyRoutes } from './routes'
import { useSettingsStore } from './store/settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  return useRoutes(routes)
}

function ThemeInitializer() {
  const { theme, accentColor } = useSettingsStore()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    root.classList.remove('accent-zinc', 'accent-blue', 'accent-green', 'accent-purple', 'accent-orange', 'accent-rose')
    root.classList.add(`accent-${accentColor}`)
  }, [theme, accentColor])

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
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
              <AppRoutes />
            </Suspense>
            <Toaster
              closeButton
              toastOptions={{
                classNames: {
                  success: '!bg-emerald-600 !text-white !border-none [&_[data-close-button]]:!text-white [&_[data-close-button]]:!border-none [&_[data-close-button]]:!bg-emerald-700 [&_[data-close-button]]:!h-6 [&_[data-close-button]]:!w-6',
                  error: '!bg-red-600 !text-white !border-none [&_[data-close-button]]:!text-white [&_[data-close-button]]:!border-none [&_[data-close-button]]:!bg-red-700 [&_[data-close-button]]:!h-6 [&_[data-close-button]]:!w-6',
                },
              }}
            />
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GoogleProviderWrapper>
  )
}

export default App
