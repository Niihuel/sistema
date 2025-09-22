'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/button'
import AnimatedContainer from '@/components/animated-container'

interface AuthErrorProps {
  error?: string
  code?: string
  message?: string
  autoRedirect?: boolean
  redirectDelay?: number
}

export default function AuthError({
  error = 'Error de autenticación',
  code = 'AUTH_ERROR',
  message,
  autoRedirect = true,
  redirectDelay = 5000
}: AuthErrorProps) {
  const router = useRouter()

  useEffect(() => {
    if (autoRedirect) {
      const timer = setTimeout(() => {
        router.push('/login')
      }, redirectDelay)

      return () => clearTimeout(timer)
    }
  }, [autoRedirect, redirectDelay, router])

  const handleLoginRedirect = () => {
    router.push('/login')
  }

  const getErrorMessage = () => {
    switch (code) {
      case 'TOKEN_EXPIRED':
        return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
      case 'INVALID_TOKEN':
        return 'Token de autenticación inválido. Por favor, inicia sesión nuevamente.'
      case 'AUTH_REQUIRED':
        return 'Se requiere autenticación para acceder a esta página.'
      case 'CREDENTIALS_EXPIRED':
        return 'Tus credenciales han expirado. Por favor, inicia sesión nuevamente.'
      case 'SESSION_EXPIRED':
        return 'Tu sesión ha caducado por inactividad. Por favor, inicia sesión nuevamente.'
      case 'USER_NOT_FOUND':
        return 'Usuario no encontrado o inactivo. Contacta al administrador.'
      case 'INTERNAL_ERROR':
        return 'Error interno del sistema. Por favor, intenta nuevamente más tarde.'
      default:
        return message || 'Ha ocurrido un error de autenticación. Por favor, inicia sesión nuevamente.'
    }
  }

  const getErrorIcon = () => {
    switch (code) {
      case 'TOKEN_EXPIRED':
      case 'CREDENTIALS_EXPIRED':
      case 'SESSION_EXPIRED':
        return '⏰'
      case 'INVALID_TOKEN':
      case 'AUTH_REQUIRED':
        return '🔐'
      case 'USER_NOT_FOUND':
        return '👤'
      case 'INTERNAL_ERROR':
        return '⚠️'
      default:
        return '🚫'
    }
  }

  const getErrorTitle = () => {
    switch (code) {
      case 'TOKEN_EXPIRED':
      case 'CREDENTIALS_EXPIRED':
      case 'SESSION_EXPIRED':
        return 'Sesión Expirada'
      case 'INVALID_TOKEN':
        return 'Token Inválido'
      case 'AUTH_REQUIRED':
        return 'Autenticación Requerida'
      case 'USER_NOT_FOUND':
        return 'Usuario No Encontrado'
      case 'INTERNAL_ERROR':
        return 'Error del Sistema'
      default:
        return 'Error de Autenticación'
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <AnimatedContainer className="text-white">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-6">
            {getErrorIcon()}
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            {getErrorTitle()}
          </h1>

          <p className="text-white/70 mb-8 text-center leading-relaxed">
            {getErrorMessage()}
          </p>

          {code && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6">
              <p className="text-xs text-white/50 font-mono">
                Código de error: {code}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Button
              onClick={handleLoginRedirect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Iniciar Sesión
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="w-full text-white/70 hover:text-white"
            >
              Ir al Inicio
            </Button>
          </div>

          {autoRedirect && (
            <div className="mt-6 text-xs text-white/40 text-center">
              Serás redirigido automáticamente en {redirectDelay / 1000} segundos
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/30 text-center">
              Si el problema persiste, contacta al administrador del sistema
            </p>
          </div>
        </div>
      </AnimatedContainer>
    </div>
  )
}