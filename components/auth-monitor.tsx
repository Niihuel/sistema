'use client'

import { useEffect, ReactNode } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToast } from '@/lib/hooks/use-toast'

interface AuthMonitorProps {
  children: ReactNode
}

export default function AuthMonitor({ children }: AuthMonitorProps) {
  const { user, isAuthenticated, error } = useAuth()
  const { showError, showWarning } = useToast()

  useEffect(() => {
    // Monitor authentication errors
    if (error) {
      showError(`Error de autenticación: ${error}`)
    }
  }, [error, showError])

  useEffect(() => {
    // Monitor session status
    if (!isAuthenticated && !error) {
      // User might have been logged out
      // Don't show toast on initial load
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        // Only show warning if we're not on login page
        console.log('User not authenticated, monitoring...')
      }
    }
  }, [isAuthenticated, error, showWarning])

  // Monitor user permissions changes
  useEffect(() => {
    if (user) {
      console.log('User authenticated:', user.username, 'Role:', user.role)
    }
  }, [user])

  return <>{children}</>
}