import { NextRequest, NextResponse } from 'next/server'
import { withDatabase } from '@/lib/prisma'
import { RoleManagementService } from '@/lib/services/RoleManagementService'
import { verifyJwtWithError } from '@/lib/auth'

export class DynamicAuthError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status = 401) {
    super(message)
    this.name = 'DynamicAuthError'
    this.code = code
    this.status = status
  }
}

export interface DynamicAuthContext {
  userId: number
  username: string
  roles: string[]
  permissions: string[]
  highestRole: {
    id: number
    name: string
    level: number
  } | null
  token: string
  /**
   * Legacy highest role name for backward compatibility
   */
  role: string | null
}

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'

function extractToken(req: NextRequest): string | null {
  const cookieToken = req.cookies?.get('auth_token')?.value
  if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    return cookieToken.trim()
  }

  const authHeader = req.headers.get('Authorization')
  if (authHeader && typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.*)$/i)
    if (match && match[1]?.trim()) {
      return match[1].trim()
    }
  }

  return null
}

function normalizeRole(role?: string | null): string | null {
  if (!role || typeof role !== 'string') {
    return null
  }

  const trimmed = role.trim()
  return trimmed.length > 0 ? trimmed.toUpperCase() : null
}

function normalizePermission(permission: string): string {
  return permission.trim().toLowerCase()
}

export async function requireDynamicAuth(req: NextRequest): Promise<DynamicAuthContext> {
  const token = extractToken(req)

  if (!token) {
    throw new DynamicAuthError('Token no proporcionado', 'TOKEN_REQUIRED', 401)
  }

  const { payload, error, errorCode } = verifyJwtWithError<{
    userId: number
    username: string
    role?: string
  }>(token)

  if (!payload || error) {
    throw new DynamicAuthError(error || 'Token inválido', errorCode || 'INVALID_TOKEN', 401)
  }

  if (typeof payload.userId !== 'number' || payload.userId <= 0) {
    throw new DynamicAuthError('ID de usuario inválido', 'INVALID_USER_ID', 401)
  }

  if (!payload.username || typeof payload.username !== 'string') {
    throw new DynamicAuthError('Usuario inválido', 'INVALID_USERNAME', 401)
  }

  try {
    return await withDatabase(async (prisma) => {
      const service = new RoleManagementService(prisma)

      const [userRoles, effectivePermissions] = await Promise.all([
        service.getUserRoles(payload.userId),
        service.calculateEffectivePermissions(payload.userId)
      ])

      const roleNames = new Set<string>()
      let highestRoleRecord: { id: number; name: string; level: number } | null = null

      for (const userRole of userRoles) {
        const roleName = normalizeRole(userRole.role?.name)
        if (!roleName) continue

        roleNames.add(roleName)

        if (!highestRoleRecord || userRole.role.level > highestRoleRecord.level) {
          highestRoleRecord = {
            id: userRole.role.id,
            name: roleName,
            level: userRole.role.level
          }
        }
      }

      const fallbackRole = normalizeRole(payload.role)
      if (fallbackRole) {
        roleNames.add(fallbackRole)
        if (!highestRoleRecord) {
          highestRoleRecord = {
            id: 0,
            name: fallbackRole,
            level: 0
          }
        }
      }

      const permissionNames = new Set<string>()
      for (const permission of effectivePermissions) {
        if (!permission.granted) continue

        const resource = permission.resource?.trim()
        const action = permission.action?.trim()
        if (!resource || !action) continue

        permissionNames.add(normalizePermission(`${resource}:${action}`))
      }

      const context: DynamicAuthContext = {
        userId: payload.userId,
        username: payload.username,
        roles: Array.from(roleNames),
        permissions: Array.from(permissionNames),
        highestRole: highestRoleRecord,
        token,
        role: highestRoleRecord?.name || fallbackRole
      }

      if (!context.roles.includes(SUPER_ADMIN_ROLE) && context.role === SUPER_ADMIN_ROLE) {
        context.roles.push(SUPER_ADMIN_ROLE)
      }

      return context
    })
  } catch (err) {
    if (err instanceof DynamicAuthError) {
      throw err
    }

    const message = err instanceof Error ? err.message : 'Error desconocido'
    throw new DynamicAuthError(
      `No se pudo cargar información de autorización: ${message}`,
      'AUTHORIZATION_LOAD_FAILED',
      500
    )
  }
}

export function hasPermission(context: DynamicAuthContext, permission: string): boolean {
  if (!permission || typeof permission !== 'string') {
    return false
  }

  if (context.roles.includes(SUPER_ADMIN_ROLE)) {
    return true
  }

  const normalized = normalizePermission(permission)
  const [resource, action] = normalized.split(':')
  const permissionSet = new Set(context.permissions)

  if (permissionSet.has(normalized)) {
    return true
  }

  if (resource && permissionSet.has(`${resource}:*`)) {
    return true
  }

  if (action && permissionSet.has(`*:${action}`)) {
    return true
  }

  return permissionSet.has('*:*')
}

/**
 * Verify that the user holds every permission in the provided list.
 */
export function requireAllDynamicPermissions(permissions: string[]) {
  const required = (Array.isArray(permissions) ? permissions : []).filter(Boolean)

  return async (req: NextRequest): Promise<DynamicAuthContext | NextResponse> => {
    try {
      const context = await requireDynamicAuth(req)

      const missingPermissions = required.filter(permission => !hasPermission(context, permission))

      if (missingPermissions.length > 0) {
        return NextResponse.json(
          {
            error: `Permisos faltantes: ${missingPermissions.join(', ')}`,
            code: 'INSUFFICIENT_PERMISSIONS',
            required,
            missing: missingPermissions
          },
          { status: 403 }
        )
      }

      return context
    } catch (error) {
      if (error instanceof DynamicAuthError) {
        return NextResponse.json(
          {
            error: 'Error de autorización',
            details: error.message,
            code: error.code
          },
          { status: error.status }
        )
      }

      const message = error instanceof Error ? error.message : 'Error desconocido'
      return NextResponse.json(
        {
          error: 'Error de autorización',
          details: message,
          code: 'AUTHORIZATION_ERROR'
        },
        { status: 401 }
      )
    }
  }
}

/**
 * Verify that the user holds at least one permission from the list.
 */
export function requireAnyDynamicPermission(permissions: string[]) {
  const required = (Array.isArray(permissions) ? permissions : []).filter(Boolean)

  return async (req: NextRequest): Promise<DynamicAuthContext | NextResponse> => {
    try {
      const context = await requireDynamicAuth(req)

      const hasAnyPermission = required.length === 0 || required.some(permission => hasPermission(context, permission))

      if (!hasAnyPermission) {
        return NextResponse.json(
          {
            error: `Se requiere al menos uno de estos permisos: ${required.join(', ')}`,
            code: 'PERMISSION_REQUIRED',
            required
          },
          { status: 403 }
        )
      }

      return context
    } catch (error) {
      if (error instanceof DynamicAuthError) {
        return NextResponse.json(
          {
            error: 'Error de autorización',
            details: error.message,
            code: error.code
          },
          { status: error.status }
        )
      }

      const message = error instanceof Error ? error.message : 'Error desconocido'
      return NextResponse.json(
        {
          error: 'Error de autorización',
          details: message,
          code: 'AUTHORIZATION_ERROR'
        },
        { status: 401 }
      )
    }
  }
}

/**
 * Require a specific role resolved dynamically from the database.
 */
export function requireDynamicRole(roleName: string) {
  const requiredRole = normalizeRole(roleName)

  return async (req: NextRequest): Promise<DynamicAuthContext | NextResponse> => {
    if (!requiredRole) {
      return NextResponse.json(
        {
          error: 'Rol requerido inválido',
          code: 'INVALID_ROLE'
        },
        { status: 400 }
      )
    }

    try {
      const context = await requireDynamicAuth(req)

      const roleSet = new Set(
        (context.roles || [])
          .map(normalizeRole)
          .filter((role): role is string => Boolean(role))
      )

      const primaryRole = normalizeRole(context.role)
      if (primaryRole) {
        roleSet.add(primaryRole)
      }

      if (!roleSet.has(requiredRole)) {
        return NextResponse.json(
          {
            error: `Rol requerido: ${requiredRole}`,
            code: 'ROLE_REQUIRED',
            userRoles: Array.from(roleSet)
          },
          { status: 403 }
        )
      }

      return context
    } catch (error) {
      if (error instanceof DynamicAuthError) {
        return NextResponse.json(
          {
            error: 'Error de autorización',
            details: error.message,
            code: error.code
          },
          { status: error.status }
        )
      }

      const message = error instanceof Error ? error.message : 'Error desconocido'
      return NextResponse.json(
        {
          error: 'Error de autorización',
          details: message,
          code: 'AUTHORIZATION_ERROR'
        },
        { status: 401 }
      )
    }
  }
}

/**
 * Wrapper for API routes enforcing all listed permissions before executing the handler.
 */
export function withDynamicPermissions(
  permissions: string | string[],
  handler: (req: NextRequest, context: DynamicAuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const permissionList = Array.isArray(permissions) ? permissions : [permissions]

    const authResult = await requireAllDynamicPermissions(permissionList)(req)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    return handler(req, authResult)
  }
}export function requireDynamicPermission(permission: string) {
  const normalizedPermission = normalizePermission(permission)

  return async (req: NextRequest): Promise<DynamicAuthContext | NextResponse> => {
    try {
      const context = await requireDynamicAuth(req)

      if (!hasPermission(context, normalizedPermission)) {
        return NextResponse.json(
          {
            error: `Permiso requerido: ${normalizedPermission}`,
            code: 'PERMISSION_DENIED',
            userPermissions: context.permissions
          },
          { status: 403 }
        )
      }

      return context
    } catch (error) {
      if (error instanceof DynamicAuthError) {
        return NextResponse.json(
          {
            error: 'Error de autorización',
            details: error.message,
            code: error.code
          },
          { status: error.status }
        )
      }

      const message = error instanceof Error ? error.message : 'Error desconocido'
      return NextResponse.json(
        {
          error: 'Error de autorización',
          details: message,
          code: 'AUTHORIZATION_ERROR'
        },
        { status: 401 }
      )
    }
  }
}


