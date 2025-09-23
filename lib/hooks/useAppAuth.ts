"use client"

import { useCallback } from "react"
import { usePermissionsV2 } from "@/lib/hooks/usePermissionsV2"

export interface AppAuthContext {
  user: ReturnType<typeof usePermissionsV2>["user"]
  isAuthenticated: boolean
  loading: boolean
  can: (target: string | string[]) => boolean
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  refresh: () => Promise<void>
}

const ROLE_ONLY_REGEX = /^[A-Z_]+$/

export function useAppAuth(): AppAuthContext {
  const permissionsContext = usePermissionsV2()
  const { user, loading, hasRole, hasPermission, hasAnyRole, hasAnyPermission, refresh } = permissionsContext
  const isAuthenticated = !!user

  const can = useCallback(
    (targets: string | string[]) => {
      const values = Array.isArray(targets) ? targets : [targets]
      if (values.length === 0) return true

      return values.every((value) => {
        if (typeof value !== "string" || value.trim() === "") return false

        const normalized = value.trim()

        if (normalized.includes(":")) {
          const [resource, action] = normalized.split(":")
          if (!resource || !action) return false
          return hasPermission(resource, action)
        }

        if (ROLE_ONLY_REGEX.test(normalized)) {
          return hasAnyRole(normalized)
        }

        return hasAnyPermission(normalized)
      })
    },
    [hasAnyPermission, hasAnyRole, hasPermission]
  )

  const wrappedHasPermission = useCallback(
    (permission: string) => {
      if (!permission.includes(":")) return false
      const [resource, action] = permission.split(":")
      if (!resource || !action) return false
      return hasPermission(resource, action)
    },
    [hasPermission]
  )

  const wrappedHasRole = useCallback(
    (role: string) => hasRole(role),
    [hasRole]
  )

  return {
    user,
    isAuthenticated,
    loading,
    can,
    hasRole: wrappedHasRole,
    hasPermission: wrappedHasPermission,
    refresh,
  }
}
