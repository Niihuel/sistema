'use client'

import { ReactNode } from 'react'
import { usePermissionsV2 } from '@/lib/hooks/usePermissionsV2'
import { Shield, Lock, AlertTriangle } from 'lucide-react'

interface RoleGuardProps {
  children: ReactNode
  requires?: string[] // Format: ["resource:action"]
  requiresAll?: boolean // true = AND, false = OR (default)
  requiresRole?: string | string[]
  fallback?: ReactNode
  showError?: boolean
  loadingFallback?: ReactNode
}

export function RoleGuard({
  children,
  requires = [],
  requiresAll = false,
  requiresRole,
  fallback,
  showError = true,
  loadingFallback
}: RoleGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, isLoading } = usePermissionsV2()

  // Show loading state
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>

    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3 text-white/60">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white/60 rounded-full animate-spin" />
          <span className="text-sm">Verificando permisos...</span>
        </div>
      </div>
    )
  }

  // Check role requirements
  let hasRoleAccess = true
  if (requiresRole) {
    if (Array.isArray(requiresRole)) {
      hasRoleAccess = requiresRole.some(r => hasRole(r))
    } else {
      hasRoleAccess = hasRole(requiresRole)
    }
  }

  // Check permission requirements
  let hasPermissionAccess = true
  if (requires.length > 0) {
    if (requiresAll) {
      hasPermissionAccess = hasAllPermissions(...requires)
    } else {
      hasPermissionAccess = hasAnyPermission(...requires)
    }
  }

  // Check if user has access
  const hasAccess = hasRoleAccess && hasPermissionAccess

  if (!hasAccess) {
    // Return custom fallback if provided
    if (fallback) return <>{fallback}</>

    // Return error UI if showError is true
    if (showError) {
      return (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">Acceso Denegado</h3>
              <p className="text-white/60 text-sm">
                No tienes los permisos necesarios para acceder a este contenido.
              </p>

              {(requires.length > 0 || requiresRole) && (
                <div className="mt-4 space-y-2">
                  {requires.length > 0 && (
                    <div className="text-xs">
                      <span className="text-white/40">Permisos requeridos:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {requires.map(perm => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 bg-white/5 rounded text-white/60"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {requiresRole && (
                    <div className="text-xs">
                      <span className="text-white/40">Rol requerido:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(Array.isArray(requiresRole) ? requiresRole : [requiresRole]).map(role => (
                          <span
                            key={role}
                            className="px-2 py-0.5 bg-white/5 rounded text-white/60"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Return null if no error should be shown
    return null
  }

  // User has access, render children
  return <>{children}</>
}

// Simple permission check component
export function Can({
  I,
  perform,
  on,
  children,
  fallback
}: {
  I?: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export'
  perform?: string
  on?: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasPermission } = usePermissionsV2()

  const action = perform || I || 'view'
  const resource = on || '*'

  const canPerform = hasPermission(resource, action)

  if (!canPerform) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// Component to show content based on role
export function RoleOnly({
  role,
  children,
  fallback
}: {
  role: string | string[]
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasRole, hasAnyRole } = usePermissionsV2()

  const hasRequiredRole = Array.isArray(role)
    ? hasAnyRole(...role)
    : hasRole(role)

  if (!hasRequiredRole) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// Component to hide content from specific roles
export function HideFromRole({
  role,
  children
}: {
  role: string | string[]
  children: ReactNode
}) {
  const { hasRole, hasAnyRole } = usePermissionsV2()

  const hasRestrictedRole = Array.isArray(role)
    ? hasAnyRole(...role)
    : hasRole(role)

  if (hasRestrictedRole) {
    return null
  }

  return <>{children}</>
}

// Show warning for dangerous permissions
export function DangerousAction({
  children,
  resource,
  action,
  message = 'Esta acción es peligrosa y puede tener consecuencias irreversibles.'
}: {
  children: ReactNode
  resource: string
  action: string
  message?: string
}) {
  const { hasPermission, effectivePermissions } = usePermissionsV2()

  if (!hasPermission(resource, action)) {
    return null
  }

  const permission = effectivePermissions.find(p =>
    p.resource === resource && p.action === action
  )

  const isDangerous = permission && ['HIGH', 'CRITICAL'].includes(
    (permission as any).riskLevel || 'LOW'
  )

  return (
    <div>
      {isDangerous && (
        <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-500 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}