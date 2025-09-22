"use client"

import { ReactNode } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToast } from '@/lib/hooks/use-toast'

interface PermissionGuardProps {
  children: ReactNode
  resource?: string
  action?: string
  scope?: string
  level?: 'READ' | 'WRITE' | 'ADMIN' | 'read' | 'write' | 'admin' // Keeping for backwards compatibility
  roles?: string[]
  fallback?: ReactNode
  showToast?: boolean
  toastMessage?: string
}

export default function PermissionGuard({
  children,
  resource,
  action,
  scope,
  level = 'read' as const,
  roles,
  fallback = null,
  showToast = true,
  toastMessage = "No tienes permisos suficientes para ver este contenido"
}: PermissionGuardProps) {
  const { hasPermission, hasRole, isLoading, isAuthenticated } = useAuth()
  const { showError } = useToast()

  // If still loading, return loading state or children
  if (isLoading) {
    return <>{children}</>
  }

  // If not authenticated, don't show content
  if (!isAuthenticated) {
    if (showToast) {
      showError("Debes iniciar sesión para acceder a este contenido")
    }
    return <>{fallback}</>
  }

  // Check role-based permissions
  if (roles && !hasRole(roles)) {
    if (showToast) {
      showError(toastMessage)
    }
    return <>{fallback}</>
  }

  // Check resource-based permissions using new permission system
  if (resource) {
    const permissionAction = action || (level === 'admin' ? 'admin' : level === 'write' ? 'write' : 'read')
    if (!hasPermission(resource, permissionAction, scope)) {
      if (showToast) {
        showError(toastMessage)
      }
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

// Higher Order Component version
export function withPermissionGuard<T extends object>(
  Component: React.ComponentType<T>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) {
  return function ProtectedComponent(props: T) {
    return (
      <PermissionGuard {...guardProps}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}

// Hook for imperative permission checking
export function usePermissionCheck() {
  const { hasPermission, hasRole, isAuthenticated, isAdmin } = useAuth()
  const { showError } = useToast()

  const checkPermission = (
    resource?: string,
    action: string = 'read',
    scope?: string,
    showToastOnFail = true,
    customMessage?: string
  ) => {
    if (!isAuthenticated) {
      if (showToastOnFail) {
        showError("Debes iniciar sesión para realizar esta acción")
      }
      return false
    }

    if (resource && !hasPermission(resource, action, scope)) {
      if (showToastOnFail) {
        showError(customMessage || "No tienes permisos suficientes para realizar esta acción")
      }
      return false
    }

    return true
  }

  const checkRole = (
    roles: string[],
    showToastOnFail = true,
    customMessage?: string
  ) => {
    if (!isAuthenticated) {
      if (showToastOnFail) {
        showError("Debes iniciar sesión para realizar esta acción")
      }
      return false
    }

    if (!hasRole(roles)) {
      if (showToastOnFail) {
        showError(customMessage || "No tienes el rol necesario para realizar esta acción")
      }
      return false
    }

    return true
  }

  return {
    checkPermission,
    checkRole,
    hasPermission,
    hasRole,
    isAuthenticated,
    isAdmin
  }
}