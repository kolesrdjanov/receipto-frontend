import { Suspense, useEffect } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { routes } from './routes'
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeInitializer />
        <Suspense fallback={<div className="min-h-dvh flex items-center justify-center">Loading...</div>}>
          <AppRoutes />
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
