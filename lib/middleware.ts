import { NextRequest, NextResponse } from 'next/server'
import {
  DynamicAuthContext,
  DynamicAuthError,
  requireDynamicAuth,
  requireDynamicPermission,
  requireAllDynamicPermissions,
  requireAnyDynamicPermission,
  requireDynamicRole,
  withDynamicPermissions,
  hasPermission
} from '@/lib/middleware/dynamic-authorization'
import { verifyJwtWithError } from '@/lib/auth'

export type AuthContext = DynamicAuthContext
export type { DynamicAuthContext }
export {
  requireDynamicPermission,
  requireAllDynamicPermissions,
  requireAnyDynamicPermission,
  requireDynamicRole,
  withDynamicPermissions,
  hasPermission
}
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'

export class AuthError extends DynamicAuthError {
  constructor(message: string, code: string, status = 401) {
    super(message, code, status)
    this.name = 'AuthError'
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  try {
    return await requireDynamicAuth(req)
  } catch (error) {
    if (error instanceof DynamicAuthError) {
      throw new AuthError(error.message, error.code, error.status)
    }

    throw new AuthError('Error de autenticaciÃƒÆ’Ã‚Â³n', 'AUTH_ERROR', 401)
  }
}

export function requireRole(context: AuthContext, allowedRoles: string[]): void {
  if (!context || typeof context !== 'object') {
    throw new AuthError('Contexto de autenticaciÃƒÆ’Ã‚Â³n invÃƒÆ’Ã‚Â¡lido', 'INVALID_CONTEXT', 401)
  }

  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new AuthError('Roles permitidos no especificados', 'NO_ROLES_SPECIFIED', 500)
  }

  const normalizedAllowed = allowedRoles
    .map(normalizeRoleName)
    .filter((role): role is string => Boolean(role))

  if (normalizedAllowed.length === 0) {
    throw new AuthError('No hay roles vÃƒÆ’Ã‚Â¡lidos especificados', 'NO_VALID_ROLES', 500)
  }

  const userRoles = new Set(
    (context.roles || [])
      .map(normalizeRoleName)
      .filter((role): role is string => Boolean(role))
  )

  const primaryRole = normalizeRoleName(context.role)

  if (userRoles.has(SUPER_ADMIN_ROLE) || primaryRole === SUPER_ADMIN_ROLE) {
    return
  }

  const hasRequiredRole = normalizedAllowed.some(role =>
    userRoles.has(role) || primaryRole === role
  )

  if (!hasRequiredRole) {
    throw new AuthError(
      `Permisos insuficientes. Se requiere: ${allowedRoles.join(', ')}`,
      'INSUFFICIENT_PERMISSIONS',
      403
    )
  }
}

export function requireAdmin(context: AuthContext): void {
  requireRole(context, ['ADMIN', SUPER_ADMIN_ROLE])
}

export function requireTechnician(context: AuthContext): void {
  requireRole(context, ['TECHNICIAN', 'MANAGER', 'ADMIN', SUPER_ADMIN_ROLE])
}

export function requirePermission(context: AuthContext, permission: string): void {
  if (!permission || typeof permission !== 'string') {
    throw new AuthError('Permiso invÃƒÆ’Ã‚Â¡lido', 'INVALID_PERMISSION', 400)
  }

  if (!hasPermission(context, permission)) {
    throw new AuthError(`Permiso no autorizado: ${permission}`, 'PERMISSION_DENIED', 403)
  }
}

export function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const context = await requireAuth(req)
      return await handler(req, context)
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString()
          },
          { status: error.status }
        )
      }

      console.error('Error en withAuth:', error)
      return NextResponse.json(
        { error: 'Error de autenticaciÃƒÆ’Ã‚Â³n interno', code: 'INTERNAL_AUTH_ERROR' },
        { status: 500 }
      )
    }
  }
}

export function withAuthAndRole(
  allowedRoles: string[],
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return withAuth(async (req, context) => {
    try {
      requireRole(context, allowedRoles)
      return await handler(req, context)
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          {
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString()
          },
          { status: error.status }
        )
      }

      console.error('Error en withAuthAndRole:', error)
      return NextResponse.json(
        { error: 'Error de autorizaciÃƒÆ’Ã‚Â³n interno', code: 'INTERNAL_ROLE_ERROR' },
        { status: 500 }
      )
    }
  })
}

export function getUserFromToken(token: string): AuthContext | null {
  if (!token || typeof token !== 'string') {
    return null
  }

  const { payload } = verifyJwtWithError<{
    userId: number
    username: string
    role?: string
  }>(token)

  if (!payload) {
    return null
  }

  const normalizedRole = normalizeRoleName(payload.role)

  return {
    userId: payload.userId,
    username: payload.username,
    roles: normalizedRole ? [normalizedRole] : [],
    permissions: [],
    highestRole: null,
    token,
    role: normalizedRole
  }
}

function normalizeRoleName(role?: string | null): string | null {
  if (!role || typeof role !== 'string') {
    return null
  }

  const trimmed = role.trim()
  return trimmed.length > 0 ? trimmed.toUpperCase() : null
}




