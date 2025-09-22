'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Button from '@/components/button'

export default function Unauthorized() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleLoginRedirect = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-lg">
        {/* Lock Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3">
          <h1 className="text-6xl font-bold text-white">401</h1>
          <h2 className="text-2xl font-semibold text-white">No Autorizado</h2>
          <p className="text-white/60 text-lg">
            No tienes permisos para acceder a esta página.
          </p>
          <p className="text-white/40 text-base">
            Por favor, inicia sesión para continuar.
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg px-6 py-3 border border-white/10">
              <p className="text-white/80 text-sm">
                Redirigiendo al login en{' '}
                <span className="text-white font-bold text-xl">{countdown}</span>
                {' '}segundos...
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000 ease-linear"
              style={{ width: `${(5 - countdown) * 20}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="px-6 py-3"
          >
            ← Volver
          </Button>
          <Button
            onClick={handleLoginRedirect}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            Ir al Login Ahora
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-white/40 text-sm">
          Si crees que esto es un error, contacta al administrador del sistema
        </div>

        {/* Security Icon */}
        <div className="flex justify-center pt-4">
          <div className="flex items-center gap-2 text-white/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs">Sesión Segura Requerida</span>
          </div>
        </div>
      </div>
    </div>
  )
}