"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

export interface User {
  id: number
  username: string
  email?: string
  firstName?: string
  lastName?: string
  role: string
  isActive: boolean
  isEmailVerified: boolean
  twoFactorEnabled: boolean
  lastLoginAt?: Date
  passwordExpiresAt?: Date
  roles: Array<{
    id: number
    name: string
    displayName: string
    description?: string
    color?: string
    icon?: string
    level: number
    isActive: boolean
    isPrimary: boolean
    isTemporary: boolean
    expiresAt?: Date
    assignedAt: Date
    conditions?: any
  }>
  permissions: PermissionScope[]
  deniedPermissions: string[]
  settings: {
    timezone?: string
    locale?: string
    theme?: string
    notifications?: any
  }
  security: {
    sessionCount: number
    lastSecurityUpdate?: Date
    requiresPasswordChange: boolean
    mfaRequired: boolean
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    lastActivity?: Date
    employeeId?: number
  }
}

export interface PermissionScope {
  resource: string
  actions: string[]
  scope: string
  conditions?: any
  riskLevel: string
  requiresMFA: boolean
}

export interface AuthError {
  message: string
  code?: string
  status?: number
  timestamp?: string
}

export interface AuthState {
  isAuthenticated: boolean | null
  isLoading: boolean
  user: User | null
  error: AuthError | null
  // Permission checking functions
  hasPermission: (resource: string, action?: string, scope?: string) => boolean
  hasAnyPermission: (permissions: Array<{ resource: string; action?: string; scope?: string }>) => boolean
  hasAllPermissions: (permissions: Array<{ resource: string; action?: string; scope?: string }>) => boolean
  // Role checking functions
  hasRole: (roles: string | string[]) => boolean
  hasAnyRole: (roles: string[]) => boolean
  hasRoleLevel: (minLevel: number) => boolean
  // Security functions
  requiresMFA: (resource: string, action?: string) => boolean
  isHighRiskAction: (resource: string, action?: string) => boolean
  // Admin checks
  isAdmin: boolean
  isSuperAdmin: boolean
  isSystemUser: boolean
  // Utility functions
  getUserDisplayName: () => string
  getPrimaryRole: () => string
  getPermissionsByResource: (resource: string) => PermissionScope | null
  // State management
  refresh: () => Promise<void>
  clearError: () => void
}

export function useAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<AuthError | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryCount = useRef(0)
  const maxRetries = 3
  const fetchStartedRef = useRef(false)

  const fetchUserData = useCallback(async (isRetry = false): Promise<void> => {
    // Avoid SSR hydration issues
    if (typeof window === 'undefined') return

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      setError(null)

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: abortControllerRef.current.signal,
      })

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return
      }

      if (response.ok) {
        const userData = await response.json()
        // Validate user data structure
        if (!userData || typeof userData.id !== 'number') {
          throw new Error('Invalid user data received')
        }
        setUser(userData)
        setIsAuthenticated(true)
        retryCount.current = 0 // Reset retry count on success
      } else {
        // Handle different error codes
        const errorData = await response.json().catch(() => ({}))

        if (response.status === 401 || response.status === 403) {
          // Handle authentication/authorization errors
          setIsAuthenticated(false)
          setUser(null)

          // Set appropriate error based on response
          const errorCode = errorData.code || (response.status === 401 ? 'AUTH_REQUIRED' : 'FORBIDDEN')
          setError({
            message: errorData.error || (response.status === 401 ? 'Authentication required' : 'Access forbidden'),
            code: errorCode,
            status: response.status,
            timestamp: new Date().toISOString()
          })

          // Handle specific auth error codes
          if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'CREDENTIALS_EXPIRED' || errorCode === 'SESSION_EXPIRED') {
            // Clear any stored tokens
            try {
              localStorage.removeItem('auth_token')
            } catch {}

            // Redirect to auth error page for expired credentials
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth-error')) {
              window.location.href = `/auth-error?code=${errorCode}&message=${encodeURIComponent(errorData.error || '')}`
            }
          }
        } else if (response.status === 500 || response.status === 502 || response.status === 503) {
          // Server error - might be temporary, retry
          if (!isRetry && retryCount.current < maxRetries) {
            retryCount.current++
            console.warn(`[useAuth] Server error (${response.status}), retrying... (${retryCount.current}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.current))
            return fetchUserData(true)
          }

          throw new Error(`Server error: ${response.status}`)
        } else {
          // Other errors
          throw new Error(errorData.error || `Authentication failed: ${response.status}`)
        }
      }
    } catch (error: any) {
      // Handle abort errors silently
      if (error?.name === 'AbortError') {
        return
      }

      // Network or other errors
      console.error('[useAuth] Error fetching user data:', error)

      // Retry on network errors
      if (!isRetry && retryCount.current < maxRetries &&
          (error.message === 'Failed to fetch' || error.message.includes('Network'))) {
        retryCount.current++
        console.warn(`[useAuth] Network error, retrying... (${retryCount.current}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.current))
        return fetchUserData(true)
      }

      setError({
        message: error.message || 'Failed to authenticate',
        code: error.code || 'AUTH_ERROR',
        timestamp: new Date().toISOString()
      })
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [])

  useEffect(() => {
    // Only run on client side to prevent hydration issues
    // Use a ref to prevent double execution in StrictMode
    if (typeof window !== 'undefined' && !fetchStartedRef.current) {
      fetchStartedRef.current = true
      fetchUserData()
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchUserData])

  // Permission checking functions
  const hasPermission = useCallback((resource: string, action?: string, scope?: string) => {
    if (!user) return false

    // Super Admin and Admin have all permissions
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true

    // Check if permission is explicitly denied
    const permissionKey = `${resource}:${action || 'read'}:${scope || 'ALL'}`
    if (user.deniedPermissions?.includes(permissionKey)) return false

    // Find matching permission scope
    const permissionScope = user.permissions?.find(p => p.resource === resource)
    if (!permissionScope) return false

    // If no action specified, check if user has any access to resource
    if (!action) return permissionScope.actions.length > 0

    // Check if user has the specific action
    return permissionScope.actions.includes(action)
  }, [user])

  const hasAnyPermission = useCallback((permissions: Array<{ resource: string; action?: string; scope?: string }>) => {
    return permissions.some(p => hasPermission(p.resource, p.action, p.scope))
  }, [hasPermission])

  const hasAllPermissions = useCallback((permissions: Array<{ resource: string; action?: string; scope?: string }>) => {
    return permissions.every(p => hasPermission(p.resource, p.action, p.scope))
  }, [hasPermission])

  // Role checking functions
  const hasRole = useCallback((roles: string | string[]) => {
    if (!user) return false

    const roleArray = Array.isArray(roles) ? roles : [roles]

    // Check main role
    if (roleArray.includes(user.role)) return true

    // Check additional roles
    return user.roles?.some(r => roleArray.includes(r.name)) || false
  }, [user])

  const hasAnyRole = useCallback((roles: string[]) => {
    return hasRole(roles)
  }, [hasRole])

  const hasRoleLevel = useCallback((minLevel: number) => {
    if (!user) return false

    // Check if any role meets the minimum level
    return user.roles?.some(role => role.level >= minLevel) || false
  }, [user])

  // Security functions
  const requiresMFA = useCallback((resource: string, action?: string) => {
    if (!user) return false

    const permissionScope = user.permissions?.find(p => p.resource === resource)
    if (!permissionScope) return false

    return permissionScope.requiresMFA
  }, [user])

  const isHighRiskAction = useCallback((resource: string, action?: string) => {
    if (!user) return false

    const permissionScope = user.permissions?.find(p => p.resource === resource)
    if (!permissionScope) return false

    return ['HIGH', 'CRITICAL'].includes(permissionScope.riskLevel)
  }, [user])

  // Admin checks
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || false
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || false
  const isSystemUser = user?.roles?.some(r => r.name.includes('ADMIN') || r.name.includes('SYSTEM')) || false

  // Utility functions
  const getUserDisplayName = useCallback(() => {
    if (!user) return 'Unknown User'

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }

    if (user.firstName) return user.firstName
    if (user.lastName) return user.lastName

    return user.username
  }, [user])

  const getPrimaryRole = useCallback(() => {
    if (!user) return 'USER'

    const primaryRole = user.roles?.find(r => r.isPrimary)
    return primaryRole?.displayName || user.role
  }, [user])

  const getPermissionsByResource = useCallback((resource: string) => {
    if (!user) return null

    return user.permissions?.find(p => p.resource === resource) || null
  }, [user])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    retryCount.current = 0 // Reset retry count
    await fetchUserData()
  }, [fetchUserData])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    // Permission checking functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    // Role checking functions
    hasRole,
    hasAnyRole,
    hasRoleLevel,
    // Security functions
    requiresMFA,
    isHighRiskAction,
    // Admin checks
    isAdmin,
    isSuperAdmin,
    isSystemUser,
    // Utility functions
    getUserDisplayName,
    getPrimaryRole,
    getPermissionsByResource,
    // State management
    refresh,
    clearError
  }
}