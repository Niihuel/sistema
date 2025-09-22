'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/button'
import { useAuth } from '@/lib/hooks/useAuth'

export default function NotFound() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

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
        {/* 404 Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-6xl font-bold text-white">404</h1>
          <h2 className="text-2xl font-semibold text-white">Página no encontrada</h2>
          <p className="text-white/60 text-lg">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
        </div>

        {/* Action Buttons - Solo mostrar cuando no estemos cargando */}
        {!isLoading && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoBack}
              variant="ghost"
              className="px-6 py-3"
            >
              ← Volver
            </Button>
            <Button
              onClick={handleGoHome}
              className="px-6 py-3"
            >
              {isAuthenticated ? 'Ir al Dashboard' : 'Ir al Login'}
            </Button>
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
          Verifica la URL o utiliza la navegación para encontrar lo que buscas
        </div>
      </div>
    </div>
  )
}