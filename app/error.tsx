'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissionsV2 } from '@/lib/hooks/usePermissionsV2'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const { user, loading: isLoading } = usePermissionsV2()
  const isAuthenticated = !!user

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      // Redirigir según el estado de autenticación
      if (isAuthenticated) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }

  const handleGoHome = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-lg">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-6xl font-bold text-white">500</h1>
          <h2 className="text-2xl font-semibold text-white">Error del servidor</h2>
          <p className="text-white/60 text-lg">
            Ha ocurrido un error inesperado. Por favor, intenta nuevamente.
          </p>

          {/* Error Details (only in development) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
              <p className="text-red-400 text-sm font-mono break-all">{error.message}</p>
              {error.digest && (
                <p className="text-red-400/60 text-xs mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons - Solo mostrar cuando no estemos cargando */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex-1 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              ↻ Reintentar
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 px-6 py-3 rounded-lg bg-white text-black hover:bg-white/90 font-medium transition-colors"
            >
              {isAuthenticated ? 'Ir al Dashboard' : 'Ir al Login'}
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}

        {/* Additional Info */}
        <div className="text-white/40 text-sm">
          Si el problema persiste, contacta con el equipo de soporte
        </div>
      </div>
    </div>
  )
}
