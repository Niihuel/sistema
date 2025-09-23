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

      // Default error UI - Professional design similar to HTTP 500 error page
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-3xl w-full">
            <div className="bg-black/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
              {/* Error Header - No blue line */}
              <div className="bg-gradient-to-r from-red-600/10 via-red-500/5 to-transparent p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Ha ocurrido un error
                    </h1>
                    <p className="text-gray-400 text-lg">
                      {isDev
                        ? `Error: ${this.state.error?.message || 'Error desconocido'}`
                        : 'El sistema encontró un problema inesperado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Details Section */}
              <div className="p-8 pt-0">
                {isDev && this.state.error && (
                  <div className="mb-6">
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-300 transition-colors font-medium">
                        <svg className="w-4 h-4 transform group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Ver detalles del error
                      </summary>
                      <div className="mt-4 space-y-4">
                        {/* Error ID Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full">
                          <span className="text-xs text-gray-400">ID de error:</span>
                          <code className="text-xs text-orange-400 font-mono">{this.state.errorId}</code>
                        </div>

                        {/* Error Message */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                          <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                            ReferenceError: {this.state.error.message}
                          </h4>
                          <pre className="text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{this.state.error.stack}
                          </pre>
                        </div>

                        {/* Component Stack */}
                        {this.state.errorInfo && (
                          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                              Pila de componentes:
                            </h4>
                            <pre className="text-xs text-gray-300 font-mono overflow-x-auto max-h-48">
{this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 min-w-[120px] px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-all duration-200 border border-gray-700"
                  >
                    Intentar de nuevo
                  </button>
                  <button
                    onClick={this.handleReload}
                    className="flex-1 min-w-[120px] px-5 py-3 bg-white hover:bg-gray-100 text-black font-medium rounded-xl transition-all duration-200"
                  >
                    Recargar página
                  </button>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="flex-1 min-w-[120px] px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-all duration-200 border border-gray-700"
                  >
                    Tablero de Instrumentos de IT Portal
                  </button>
                </div>

                {/* Footer Message */}
                {!isDev && (
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <p className="text-xs text-gray-500 text-center">
                      Si el problema persiste, contacta con el equipo de soporte técnico.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}