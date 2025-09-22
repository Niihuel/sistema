'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

export default function AuthGuard({
  children,
  fallback,
  requireAuth = true
}: AuthGuardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-white/60 rounded-full animate-spin" />
            </div>
          </div>
          <p className="text-white/80 font-medium">Inicializando...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuardInner
      children={children}
      fallback={fallback}
      requireAuth={requireAuth}
    />
  )
}

function AuthGuardInner({
  children,
  fallback,
  requireAuth = true
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, error, refresh } = useAuth()
  const [retrying, setRetrying] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Skip redirect during loading or if already redirected
    if (isLoading || retrying || hasRedirected) return

    // If authentication is required and user is not authenticated
    if (requireAuth && isAuthenticated === false) {
      // Public paths that don't require authentication
      const publicPaths = ['/login', '/auth-error', '/unauthorized', '/register', '/forgot-password']
      const normalizedPath = pathname?.endsWith('/') && pathname !== '/'
        ? pathname.slice(0, -1)
        : pathname
      const isPublicPath = publicPaths.some(path => normalizedPath?.startsWith(path))

      if (!isPublicPath && pathname !== '/login') {
        // Store attempted path for redirect after login
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectAfterLogin', pathname || '/dashboard')
        }
        setHasRedirected(true)
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, requireAuth, hasRedirected])

  useEffect(() => {
    // Handle authentication errors with retry
    if (error && error.code === 'AUTH_ERROR' && !retrying) {
      setRetrying(true)
      console.warn('[AuthGuard] Authentication error detected, retrying...')

      // Retry after a delay
      const retryTimeout = setTimeout(async () => {
        await refresh()
        setRetrying(false)
      }, 2000)

      return () => clearTimeout(retryTimeout)
    }
  }, [error, refresh, retrying])

  // Show loading state
  if (isLoading || retrying) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-white/60 rounded-full animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-white/80 font-medium">
              {retrying ? 'Reconectando...' : 'Verificando autenticación...'}
            </p>
            {error && (
              <p className="text-red-400 text-sm">
                {error.message}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show error state if there's a critical error
  if (error && error.code === 'INTERNAL_ERROR') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-red-500/20">
          <div className="text-center space-y-4">
            <div className="text-red-500">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Error de Autenticación</h2>
            <p className="text-gray-400">{error.message}</p>
            <button
              onClick={() => {
                setRetrying(true)
                refresh().then(() => setRetrying(false))
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && isAuthenticated === false) {
    return null // Will redirect via useEffect
  }

  // If authentication is not required or user is authenticated, render children
  if (!requireAuth || isAuthenticated === true) {
    return <>{children}</>
  }

  // Default: don't render anything
  return null
}