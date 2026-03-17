import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--bg-secondary)] px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Something went wrong
            </h1>
            <p className="max-w-sm text-sm text-[var(--text-muted)]">
              {this.state.message}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <RefreshCw size={15} />
            Reload page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
