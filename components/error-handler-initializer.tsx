'use client'

import { useEffect } from 'react'
import installGlobalErrorHandler from '@/lib/global-error-handler'

export default function ErrorHandlerInitializer() {
  useEffect(() => {
    // Install global error handler on client side only
    installGlobalErrorHandler()
  }, [])

  // This component doesn't render anything
  return null
}