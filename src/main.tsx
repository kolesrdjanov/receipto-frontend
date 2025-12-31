import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import '@/i18n'
import '@/store/settings'
import { ErrorBoundary } from '@/components/error-boundary'

// Global crash reporting for production blank-screen issues.
window.addEventListener('error', (e) => {
  console.error('[window.error]', e.error ?? e.message)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('[unhandledrejection]', e.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
