'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

interface Role {
  id: number
  name: string
  displayName: string
  color: string
  icon?: string
  level: number
  permissions: RolePermission[]
}

interface RolePermission {
  permission: {
    id: number
    resource: string
    action: string
    displayName: string
    riskLevel: string
  }
  isActive: boolean
}

interface PermissionOverride {
  permission: {
    resource: string
    action: string
  }
  isDenied: boolean
  reason?: string
  expiresAt?: string
}

interface EffectivePermission {
  resource: string
  action: string
  source: 'role' | 'override' | 'direct'
  granted: boolean
  roleId?: number
  expiresAt?: Date | null
}

interface PermissionsState {
  roles: Role[]
  permissions: Set<string>
  effectivePermissions: EffectivePermission[]
  overrides: PermissionOverride[]
  isLoading: boolean
  error: Error | null
  lastFetch: Date | null
}

interface PermissionsContextValue extends PermissionsState {
  // User data
  user: any | null
  loading: boolean

  // Permission checking functions
  hasPermission: (resource: string, action: string) => boolean
  hasAnyPermission: (...permissions: string[]) => boolean
  hasAllPermissions: (...permissions: string[]) => boolean
  can: (permission: string) => boolean

  // Role checking functions
  hasRole: (roleName: string) => boolean
  hasAnyRole: (...roleNames: string[]) => boolean
  getHighestRole: () => Role | null

  // Permission source tracking
  getPermissionSource: (resource: string, action: string) => 'role' | 'override' | 'direct' | null

  // Role hierarchy functions
  canManageRole: (targetRoleId: number) => boolean
  canManageUser: (targetUserId: number) => Promise<boolean>

  // Data management
  refresh: () => Promise<void>
  clearCache: () => void
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined)

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const hasFetchedRef = useRef(false)

  const [state, setState] = useState<PermissionsState>({
    roles: [],
    permissions: new Set(),
    effectivePermissions: [],
    overrides: [],
    isLoading: true,
    error: null,
    lastFetch: null
  })

  // Fetch user roles and permissions
  const fetchPermissions = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        roles: [],
        permissions: new Set(),
        effectivePermissions: [],
        overrides: []
      }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch role and permission data in parallel
      const [rolesRes, permissionsRes] = await Promise.all([
        fetch(`/api/roles-v2/user/${user.id}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }),
        fetch(`/api/roles-v2/permissions/${user.id}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      ])

      if (!rolesRes.ok || !permissionsRes.ok) {
        throw new Error('Failed to fetch permissions')
      }

      const rolesData = await rolesRes.json()
      const permissionsData = await permissionsRes.json()

      // Process permissions into a Set for fast lookup
      const permissionsSet = new Set<string>()

      // Handle the permissions API response structure
      const effectivePerms: EffectivePermission[] = []
      const userPermissions = permissionsData.permissions || []

      // Convert permission objects to the format we need
      userPermissions.forEach((perm: any) => {
        const permKey = `${perm.resource}:${perm.action}`
        permissionsSet.add(permKey)

        effectivePerms.push({
          resource: perm.resource,
          action: perm.action,
          source: perm.source || 'role',
          granted: true,
          roleId: perm.roleId
        })
      })

      // Add wildcard permissions for SUPER_ADMIN
      if (rolesData.roles?.some((role: any) => role.name === 'SuperAdmin' || role.level >= 100)) {
        permissionsSet.add('*:*')
        effectivePerms.push({
          resource: '*',
          action: '*',
          source: 'role',
          granted: true
        })
      }

      setState({
        roles: rolesData.roles || [],
        permissions: permissionsSet,
        effectivePermissions: effectivePerms,
        overrides: [],
        isLoading: false,
        error: null,
        lastFetch: new Date()
      })
    } catch (error) {
      console.error('[usePermissionsV2] Error fetching permissions:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
        // Set cache time to prevent immediate retry
        lastFetch: new Date()
      }))
    }
  }, [user?.id, isAuthenticated])

  // Initial fetch
  useEffect(() => {
    // Skip if still loading auth
    if (authLoading) return

    // Skip if not authenticated
    if (!isAuthenticated || !user?.id) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        roles: [],
        permissions: new Set(),
        effectivePermissions: [],
        overrides: []
      }))
      hasFetchedRef.current = false
      return
    }

    // Only fetch once per user session
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchPermissions()
    }
  }, [authLoading, isAuthenticated, user?.id, fetchPermissions])

  // Permission checking functions
  const hasPermission = useCallback((resource: string, action: string): boolean => {
    // FALLBACK: Check legacy user role for SUPER_ADMIN
    if (user?.role === 'SUPER_ADMIN') {
      return true
    }

    const key = `${resource}:${action}`
    return state.permissions.has(key) || state.permissions.has('*:*')
  }, [state.permissions, user?.role])

  const hasAnyPermission = useCallback((...permissions: string[]): boolean => {
    // FALLBACK: Check legacy user role for SUPER_ADMIN
    if (user?.role === 'SUPER_ADMIN') {
      return true
    }

    if (state.permissions.has('*:*')) return true
    return permissions.some(perm => state.permissions.has(perm))
  }, [state.permissions, user?.role])

  const hasAllPermissions = useCallback((...permissions: string[]): boolean => {
    // FALLBACK: Check legacy user role for SUPER_ADMIN
    if (user?.role === 'SUPER_ADMIN') {
      return true
    }

    if (state.permissions.has('*:*')) return true
    return permissions.every(perm => state.permissions.has(perm))
  }, [state.permissions, user?.role])

  // Simple permission checker - used by components
  const can = useCallback((permission: string): boolean => {
    console.log('[usePermissionsV2] can() called:', {
      permission,
      userRole: user?.role,
      userExists: !!user,
      hasWildcard: state.permissions.has('*:*'),
      hasSpecificPerm: state.permissions.has(permission),
      permissionsSize: state.permissions.size
    })

    // FALLBACK: Check legacy user role for SUPER_ADMIN
    if (user?.role === 'SUPER_ADMIN') {
      console.log('[usePermissionsV2] SUPER_ADMIN fallback activated - granting access')
      return true
    }

    if (state.permissions.has('*:*')) return true
    return state.permissions.has(permission)
  }, [state.permissions, user?.role])

  // Role checking functions
  const hasRole = useCallback((roleName: string): boolean => {
    return state.roles.some(role => role.name === roleName)
  }, [state.roles])

  const hasAnyRole = useCallback((...roleNames: string[]): boolean => {
    return roleNames.some(name => state.roles.some(role => role.name === name))
  }, [state.roles])

  const getHighestRole = useCallback((): Role | null => {
    if (state.roles.length === 0) return null
    return state.roles.reduce((highest, role) =>
      role.level > highest.level ? role : highest
    )
  }, [state.roles])

  // Permission source tracking
  const getPermissionSource = useCallback((resource: string, action: string): 'role' | 'override' | 'direct' | null => {
    const effectivePerm = state.effectivePermissions.find(p =>
      p.resource === resource && p.action === action
    )
    return effectivePerm?.source || null
  }, [state.effectivePermissions])

  // Role hierarchy functions
  const canManageRole = useCallback((targetRoleId: number): boolean => {
    const highestRole = getHighestRole()
    if (!highestRole) return false

    const targetRole = state.roles.find(r => r.id === targetRoleId)
    if (!targetRole) return false

    return highestRole.level > targetRole.level
  }, [state.roles, getHighestRole])

  const canManageUser = useCallback(async (targetUserId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/roles-v2/can-manage/${targetUserId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) return false

      const data = await response.json()
      return data.canManage || false
    } catch (error) {
      console.error('Error checking user management permission:', error)
      return false
    }
  }, [])

  // Data management functions
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, lastFetch: null }))
    hasFetchedRef.current = false
    await fetchPermissions()
  }, [fetchPermissions])

  const clearCache = useCallback(() => {
    setState(prev => ({ ...prev, lastFetch: null }))
    hasFetchedRef.current = false
  }, [])

  const value: PermissionsContextValue = {
    ...state,
    user,
    loading: authLoading || state.isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    can,
    hasRole,
    hasAnyRole,
    getHighestRole,
    getPermissionSource,
    canManageRole,
    canManageUser,
    refresh,
    clearCache
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsV2() {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error('usePermissionsV2 must be used within a PermissionsProvider')
  }
  return context
}

// Alias for backwards compatibility
export const usePermissions = usePermissionsV2

// Helper hook for common permission patterns
export function useCan() {
  const { hasPermission, hasAnyPermission, hasRole } = usePermissionsV2()

  return {
    // Resource-based permissions
    view: (resource: string) => hasPermission(resource, 'view'),
    create: (resource: string) => hasPermission(resource, 'create'),
    edit: (resource: string) => hasPermission(resource, 'edit') || hasPermission(resource, 'update'),
    delete: (resource: string) => hasPermission(resource, 'delete'),

    // Scoped permissions
    viewOwn: (resource: string) => hasPermission(resource, 'view_own'),
    viewAll: (resource: string) => hasPermission(resource, 'view_all'),
    editOwn: (resource: string) => hasPermission(resource, 'edit_own'),
    editAll: (resource: string) => hasPermission(resource, 'edit_all'),

    // Special actions
    approve: (resource: string) => hasPermission(resource, 'approve'),
    export: (resource: string) => hasPermission(resource, 'export'),
    import: (resource: string) => hasPermission(resource, 'import'),

    // Admin checks
    isAdmin: () => hasAnyPermission('*:*', 'system:admin'),
    isSuperAdmin: () => hasPermission('*', '*'),
    isManager: () => hasRole('Manager') || hasRole('Admin'),

    // Role checks
    hasRole: (roleName: string) => hasRole(roleName),
    hasAnyRole: (...roleNames: string[]) => roleNames.some(r => hasRole(r))
  }
}

// Hook for role-specific UI
export function useRoleColors() {
  const { roles } = usePermissionsV2()

  const getHighestRoleColor = useCallback((): string => {
    if (roles.length === 0) return '#95A5A6' // Default gray

    const highestRole = roles.reduce((highest, role) =>
      role.level > highest.level ? role : highest
    )

    return highestRole.color || '#95A5A6'
  }, [roles])

  const getRoleColor = useCallback((roleName: string): string => {
    const role = roles.find(r => r.name === roleName)
    return role?.color || '#95A5A6'
  }, [roles])

  return {
    highestColor: getHighestRoleColor(),
    getRoleColor
  }
}