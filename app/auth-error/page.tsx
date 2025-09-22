'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthError from '@/components/auth-error'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code') || 'AUTH_ERROR'
  const message = searchParams.get('message') || ''

  return (
    <AuthError
      code={code}
      message={message}
      autoRedirect={true}
      redirectDelay={10000} // 10 seconds
    />
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}