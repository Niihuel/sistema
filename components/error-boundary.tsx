'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = Math.random().toString(36).substring(7)

    // Log error in production
    if (process.env.NODE_ENV === 'production') {
      console.error(`[ErrorBoundary] Error ID: ${errorId}`, error.message)
    }

    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    }

    // Update state with error info
    this.setState({
      errorInfo
    })

    // Handle webpack/module errors
    if (
      error.message?.includes('Cannot read properties of undefined') ||
      error.message?.includes('options.factory') ||
      error.message?.includes('call') ||
      error.message?.includes('webpack')
    ) {
      console.warn('[ErrorBoundary] Module loading error detected, attempting recovery...')

      // Clear caches and reload after delay
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          try {
            // Clear all caches
            if ('caches' in window) {
              caches.keys().then(names => {
                names.forEach(name => caches.delete(name))
              })
            }
            // Reload page
            window.location.reload()
          } catch (e) {
            console.error('[ErrorBoundary] Failed to recover:', e)
          }
        }, 2000)
      }
    }

    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Here you would send to error tracking service
      this.reportError(error, errorInfo)
    }
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Placeholder for error reporting service integration
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Send to monitoring endpoint
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    }).catch(() => {
      // Silently fail if reporting fails
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV !== 'production'

      // Custom fallback UI if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-red-500/20 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-white">
                    {this.state.error?.message?.includes('webpack')
                      ? 'Error de carga del módulo'
                      : 'Ha ocurrido un error'}
                  </h1>
                  <p className="text-gray-400 mt-1">
                    {this.state.error?.message?.includes('webpack')
                      ? 'La página se recargará automáticamente en unos segundos...'
                      : isDev
                        ? `Error: ${this.state.error?.message || 'Unknown error'}`
                        : 'Algo salió mal. Por favor, intenta recargar la página.'}
                  </p>
                </div>
              </div>

              {isDev && this.state.error && (
                <div className="mb-6">
                  <details className="group cursor-pointer">
                    <summary className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
                      Ver detalles del error
                    </summary>
                    <div className="mt-4 space-y-4">
                      <div className="bg-black/50 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-2">Error ID: {this.state.errorId}</p>
                        <pre className="text-xs text-gray-400 overflow-auto max-h-64 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div className="bg-black/50 rounded-lg p-4">
                          <p className="text-xs text-gray-500 mb-2">Component Stack:</p>
                          <pre className="text-xs text-gray-400 overflow-auto max-h-64 whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Intentar de nuevo
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Recargar página
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 hover:scale-105"
                >
                  Ir al Dashboard
                </button>
              </div>

              {!isDev && (
                <p className="text-xs text-gray-500 mt-6">
                  Error ID: {this.state.errorId} - Este ID ha sido registrado para su análisis.
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}