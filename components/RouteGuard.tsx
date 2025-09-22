"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/lib/hooks/use-toast'

// Route permissions configuration
const ROUTE_PERMISSIONS: Record<string, { roles?: string[] }> = {
  '/admin': { roles: ['ADMIN'] },
  '/users': { roles: ['ADMIN'] },
  '/roles': { roles: ['ADMIN'] },
  '/employees': { roles: ['ADMIN', 'TECHNICIAN'] },
  '/equipment': { roles: ['ADMIN', 'TECHNICIAN'] },
  '/inventory': { roles: ['ADMIN', 'TECHNICIAN'] },
  '/printers': { roles: ['ADMIN', 'TECHNICIAN'] },
  '/backups': { roles: ['ADMIN', 'TECHNICIAN'] },
  '/purchase-requests': { roles: ['ADMIN', 'TECHNICIAN'] },
  '/tickets': { roles: ['ADMIN', 'TECHNICIAN'] },
}

interface RouteGuardProps {
  children: React.ReactNode
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { hasRole, isAuthenticated, isLoading, user } = useAuth()
  const { showError } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only running on client
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading || !isAuthenticated) return

    const routeConfig = ROUTE_PERMISSIONS[pathname]
    
    if (routeConfig?.roles && !hasRole(routeConfig.roles)) {
      let errorMessage = "No tienes permisos suficientes para acceder a esta página"
      if (routeConfig.roles.includes('ADMIN')) {
        errorMessage = "Solo los administradores pueden acceder a esta página"
      }
      
      showError(errorMessage)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }, [mounted, pathname, isAuthenticated, isLoading, user, hasRole, showError, router])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}