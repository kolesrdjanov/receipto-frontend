import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import * as Sentry from "@sentry/react";

import { applyRuntimeGuards } from '@/lib/runtime-guards'
import '@/i18n'
import '@/store/settings'
import { ErrorBoundary } from '@/components/error-boundary'

applyRuntimeGuards()

// Global crash reporting for production blank-screen issues.
window.addEventListener('error', (e) => {
  console.error('[window.error]', e.error ?? e.message)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('[unhandledrejection]', e.reason)
})

Sentry.init({
    dsn: "https://d728defb2ee0b252d59657b958b6360a@o4510675980713984.ingest.de.sentry.io/4510675983990864",
    sendDefaultPii: true
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
