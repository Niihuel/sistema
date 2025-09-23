/**
 * Authorization Middleware for Discord-like Roles System
 * Provides permission checking and role validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { withDatabase } from '@/lib/prisma'
import { requireAuth, AuthContext } from '@/lib/middleware'
import { RoleManagementService } from '@/lib/services/RoleManagementService'
import logger from '@/lib/logger'

export interface AuthorizationContext extends AuthContext {
  permissions?: string[]
  roles?: string[]
  highestRole?: {
    id: number
    name: string
    level: number
  }
}

/**
 * Require specific permission(s) to access route
 */
export function requirePermission(resource: string, action: string) {
  return async (req: NextRequest): Promise<AuthorizationContext | NextResponse> => {
    try {
      // First check authentication
      const authContext = await requireAuth(req)

      // Check permission
      const hasPermission = await withDatabase(async (prisma) => {
        const service = new RoleManagementService(prisma)
        return await service.hasPermission(authContext.userId, resource, action)
      })

      if (!hasPermission) {
        logger.warn('Permission denied', {
          userId: authContext.userId,
          resource,
          action,
          path: req.nextUrl.pathname
        })

        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            code: 'PERMISSION_DENIED',
            required: `${resource}:${action}`
          },
          { status: 403 }
        )
      }

      return authContext
    } catch (error) {
      logger.error('Authorization error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.nextUrl.pathname
      })

      if (error instanceof NextResponse) {
        return error
      }

      return NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Require any of the specified permissions
 */
export function requireAnyPermission(permissions: Array<{ resource: string; action: string }>) {
  return async (req: NextRequest): Promise<AuthorizationContext | NextResponse> => {
    try {
      const authContext = await requireAuth(req)

      const hasPermission = await withDatabase(async (prisma) => {
        const service = new RoleManagementService(prisma)
        return await service.hasAnyPermission(authContext.userId, permissions)
      })

      if (!hasPermission) {
        logger.warn('Permission denied (any)', {
          userId: authContext.userId,
          permissions,
          path: req.nextUrl.pathname
        })

        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            code: 'PERMISSION_DENIED',
            required: permissions.map(p => `${p.resource}:${p.action}`)
          },
          { status: 403 }
        )
      }

      return authContext
    } catch (error) {
      logger.error('Authorization error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.nextUrl.pathname
      })

      if (error instanceof NextResponse) {
        return error
      }

      return NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Require all of the specified permissions
 */
export function requireAllPermissions(permissions: Array<{ resource: string; action: string }>) {
  return async (req: NextRequest): Promise<AuthorizationContext | NextResponse> => {
    try {
      const authContext = await requireAuth(req)

      const hasPermission = await withDatabase(async (prisma) => {
        const service = new RoleManagementService(prisma)
        return await service.hasAllPermissions(authContext.userId, permissions)
      })

      if (!hasPermission) {
        logger.warn('Permission denied (all)', {
          userId: authContext.userId,
          permissions,
          path: req.nextUrl.pathname
        })

        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            code: 'PERMISSION_DENIED',
            required: permissions.map(p => `${p.resource}:${p.action}`)
          },
          { status: 403 }
        )
      }

      return authContext
    } catch (error) {
      logger.error('Authorization error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.nextUrl.pathname
      })

      if (error instanceof NextResponse) {
        return error
      }

      return NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Attach user's permissions to context
 */
export async function attachPermissions(req: NextRequest): Promise<AuthorizationContext> {
  try {
    const authContext = await requireAuth(req)

    const enrichedContext = await withDatabase(async (prisma) => {
      const service = new RoleManagementService(prisma)

      // Get user's effective permissions
      const permissions = await service.calculateEffectivePermissions(authContext.userId)

      // Get user's roles
      const userRoles = await service.getUserRoles(authContext.userId)

      // Find highest role
      const highestRole = userRoles.length > 0
        ? userRoles.reduce((highest, current) =>
            current.role.level > highest.role.level ? current : highest
          ).role
        : null

      return {
        ...authContext,
        permissions: permissions
          .filter(p => p.granted)
          .map(p => `${p.resource}:${p.action}`),
        roles: userRoles.map(ur => ur.role.name),
        highestRole: highestRole ? {
          id: highestRole.id,
          name: highestRole.name,
          level: highestRole.level
        } : undefined
      }
    })

    return enrichedContext
  } catch (error) {
    logger.error('Error attaching permissions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.nextUrl.pathname
    })

    throw error
  }
}

/**
 * Helper to check if user has a specific role
 */
export function requireRole(roleName: string) {
  return async (req: NextRequest): Promise<AuthorizationContext | NextResponse> => {
    try {
      const context = await attachPermissions(req)

      if (!context.roles?.includes(roleName)) {
        logger.warn('Role requirement not met', {
          userId: context.userId,
          requiredRole: roleName,
          userRoles: context.roles,
          path: req.nextUrl.pathname
        })

        return NextResponse.json(
          {
            error: 'Insufficient role privileges',
            code: 'ROLE_REQUIRED',
            required: roleName
          },
          { status: 403 }
        )
      }

      return context
    } catch (error) {
      if (error instanceof NextResponse) {
        return error
      }

      return NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to check if user has any of the specified roles
 */
export function requireAnyRole(roleNames: string[]) {
  return async (req: NextRequest): Promise<AuthorizationContext | NextResponse> => {
    try {
      const context = await attachPermissions(req)

      const hasRole = roleNames.some(role => context.roles?.includes(role))

      if (!hasRole) {
        logger.warn('Role requirement not met (any)', {
          userId: context.userId,
          requiredRoles: roleNames,
          userRoles: context.roles,
          path: req.nextUrl.pathname
        })

        return NextResponse.json(
          {
            error: 'Insufficient role privileges',
            code: 'ROLE_REQUIRED',
            required: roleNames
          },
          { status: 403 }
        )
      }

      return context
    } catch (error) {
      if (error instanceof NextResponse) {
        return error
      }

      return NextResponse.json(
        { error: 'Authorization failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Check if user can perform admin actions
 */
export function requireAdmin() {
  return requireAnyPermission([
    { resource: '*', action: '*' },
    { resource: 'system', action: 'admin' }
  ])
}

/**
 * Check if user can manage a specific role
 */
export function canManageRole(targetRoleId: number) {
  return async (req: NextRequest): Promise<boolean> => {
    try {
      const authContext = await requireAuth(req)

      return await withDatabase(async (prisma) => {
        const service = new RoleManagementService(prisma)
        return await service.canManageRole(authContext.userId, targetRoleId)
      })
    } catch (error) {
      logger.error('Error checking role management permission', {
        error: error instanceof Error ? error.message : 'Unknown error',
        targetRoleId
      })

      return false
    }
  }
}
