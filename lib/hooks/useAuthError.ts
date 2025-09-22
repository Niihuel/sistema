'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface AuthErrorHandlerOptions {
  redirectOnExpired?: boolean
  showNotifications?: boolean
  autoLogout?: boolean
}

export function useAuthError(options: AuthErrorHandlerOptions = {}) {
  const router = useRouter()
  const {
    redirectOnExpired = true,
    showNotifications = true,
    autoLogout = true
  } = options

  const handleAuthError = useCallback((error: {
    code?: string
    message?: string
    status?: number
  }) => {
    const { code = 'AUTH_ERROR', message = '', status = 401 } = error

    console.error('[AuthError]', { code, message, status })

    switch (code) {
      case 'TOKEN_EXPIRED':
      case 'CREDENTIALS_EXPIRED':
      case 'SESSION_EXPIRED':
        if (autoLogout) {
          // Clear auth data
          try {
            localStorage.removeItem('auth_token')
            document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          } catch {}
        }

        if (redirectOnExpired) {
          const redirectUrl = `/auth-error?code=${code}&message=${encodeURIComponent(message)}`
          router.push(redirectUrl)
        }
        break

      case 'INVALID_TOKEN':
      case 'MALFORMED_TOKEN':
        if (autoLogout) {
          try {
            localStorage.removeItem('auth_token')
            document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          } catch {}
        }

        if (showNotifications) {
          // Could integrate with a toast/notification system here
          console.warn('Token inválido detectado')
        }

        router.push('/login?error=invalid_token')
        break

      case 'USER_NOT_FOUND':
      case 'USER_INACTIVE':
        router.push(`/auth-error?code=${code}&message=${encodeURIComponent(message)}`)
        break

      case 'INSUFFICIENT_PERMISSIONS':
      case 'FORBIDDEN':
        if (showNotifications) {
          console.warn('Permisos insuficientes')
        }
        // Don't redirect, let the component handle this
        break

      default:
        if (status === 401) {
          router.push('/login?error=auth_required')
        } else if (status >= 500) {
          router.push(`/auth-error?code=INTERNAL_ERROR&message=${encodeURIComponent('Error del servidor')}`)
        }
        break
    }
  }, [router, redirectOnExpired, showNotifications, autoLogout])

  const checkTokenExpiration = useCallback(() => {
    // Prevent SSR issues
    if (typeof window === 'undefined') return false
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return false

      // Basic JWT parsing to check expiration
      const parts = token.split('.')
      if (parts.length !== 3) return false

      const payload = JSON.parse(atob(parts[1]))
      const now = Date.now() / 1000

      if (payload.exp && payload.exp < now) {
        handleAuthError({
          code: 'TOKEN_EXPIRED',
          message: 'Tu sesión ha expirado'
        })
        return true
      }

      // Check if token expires soon (within 5 minutes)
      const fiveMinutes = 5 * 60
      if (payload.exp && (payload.exp - now) < fiveMinutes) {
        console.warn('[Auth] Token expires soon')
        return 'EXPIRES_SOON'
      }

      return false
    } catch (error) {
      console.error('[Auth] Error checking token expiration:', error)
      return false
    }
  }, [handleAuthError])

  return {
    handleAuthError,
    checkTokenExpiration
  }
}

// Hook específico para componentes que necesitan verificación continua
export function useAuthErrorMonitor(intervalMs: number = 60000) {
  const { checkTokenExpiration } = useAuthError()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    // Check immediately
    checkTokenExpiration()

    // Set up interval for periodic checks
    const interval = setInterval(() => {
      checkTokenExpiration()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [checkTokenExpiration, intervalMs])
}