import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep this as console.error so it's visible in production consoles.
    console.error('[ErrorBoundary] Uncaught error:', error)
    console.error('[ErrorBoundary] Component stack:', info.componentStack)

    try {
      // Lightweight breadcrumb for debugging blank pages in production.
      localStorage.setItem(
        'receipto:last_error',
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: info.componentStack,
          time: new Date().toISOString(),
        })
      )
    } catch {
      // ignore
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ marginBottom: 12, opacity: 0.8 }}>
          The app crashed while starting. Open DevTools → Console to see the error.
        </p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, background: 'rgba(0,0,0,0.06)', padding: 12, borderRadius: 8 }}>
          {this.state.error.message}
          {'\n'}
          {this.state.error.stack}
        </pre>
      </div>
    )
  }
}

