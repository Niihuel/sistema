import { NextRequest, NextResponse } from 'next/server';
import { verifyJwtWithError } from '@/lib/auth';

/**
 * Interface para contexto de autenticación mejorado con sistema Discord
 */
export interface AuthContext {
  userId: number;
  username: string;
  role: string; // Mantener para compatibilidad legacy
  token?: string;
}

/**
 * Interface extendida para contexto con permisos Discord
 */
export interface DiscordAuthContext extends AuthContext {
  discordRoles?: Array<{
    id: string;
    name: string;
    displayName: string;
    level: number;
    color?: string;
    icon?: string;
  }>;
  permissions?: string[];
  highestRoleLevel?: number;
}

/**
 * Clase para errores de autenticación
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * FUNCIÓN PRINCIPAL: requireAuth - Extraer y verificar autenticación
 * Corrige problemas de "Cannot read properties of undefined"
 */
export function requireAuth(req: NextRequest): AuthContext {
  try {
    // CORRECCIÓN: Extraer token de forma segura
    let token: string | null = null;
    
    try {
      // 1. Intentar desde cookies (más seguro)
      const cookieToken = req.cookies?.get('auth_token')?.value;
      if (cookieToken && typeof cookieToken === 'string') {
        token = cookieToken.trim();
      }
      
      // 2. Si no hay cookie, intentar desde Authorization header (para APIs)
      if (!token) {
        const authHeader = req.headers?.get('Authorization');
        if (authHeader && typeof authHeader === 'string') {
          const headerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
          if (headerToken.length > 0) {
            token = headerToken;
          }
        }
      }
    } catch (tokenError) {
      console.warn('Error extrayendo token:', tokenError);
      token = null;
    }

    if (!token) {
      throw new AuthError('Token de autenticación requerido', 'TOKEN_REQUIRED', 401);
    }

    // CORRECCIÓN: Verificar token JWT con manejo robusto de errores
    const { payload, error, errorCode } = verifyJwtWithError<{
      userId: number;
      username: string;
      role: string;
      iat?: number;
      exp?: number;
    }>(token);

    if (error || !payload) {
      throw new AuthError(
        error || 'Token inválido', 
        errorCode || 'INVALID_TOKEN', 
        401
      );
    }

    // CORRECCIÓN: Validar estructura del payload para evitar undefined
    if (!payload.userId || typeof payload.userId !== 'number') {
      throw new AuthError('ID de usuario inválido en token', 'INVALID_USER_ID', 401);
    }

    if (!payload.username || typeof payload.username !== 'string') {
      throw new AuthError('Nombre de usuario inválido en token', 'INVALID_USERNAME', 401);
    }

    if (!payload.role || typeof payload.role !== 'string') {
      throw new AuthError('Rol de usuario inválido en token', 'INVALID_ROLE', 401);
    }

    // Crear contexto de autenticación válido
    const context: AuthContext = {
      userId: payload.userId,
      username: payload.username.toLowerCase().trim(),
      role: payload.role.toUpperCase().trim(),
      token: token,
    };

    return context;

  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    
    console.error('Error inesperado en requireAuth:', error);
    throw new AuthError('Error de autenticación', 'AUTH_ERROR', 401);
  }
}

/**
 * FUNCIÓN: requireRole - Verificar roles específicos
 * Corrige problemas con verificación de roles undefined
 */
export function requireRole(context: AuthContext, allowedRoles: string[]): void {
  try {
    // CORRECCIÓN: Validar contexto de entrada
    if (!context || typeof context !== 'object') {
      throw new AuthError('Contexto de autenticación inválido', 'INVALID_CONTEXT', 401);
    }

    if (!context.role || typeof context.role !== 'string') {
      throw new AuthError('Rol no válido en contexto', 'INVALID_ROLE', 401);
    }

    // CORRECCIÓN: Validar roles permitidos
    if (!allowedRoles || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      throw new AuthError('Roles permitidos no especificados', 'NO_ROLES_SPECIFIED', 500);
    }

    // Normalizar roles para comparación case-insensitive
    const userRole = context.role.toUpperCase().trim();
    const normalizedAllowedRoles = allowedRoles
      .filter(role => role && typeof role === 'string')
      .map(role => role.toUpperCase().trim());

    if (normalizedAllowedRoles.length === 0) {
      throw new AuthError('No hay roles válidos especificados', 'NO_VALID_ROLES', 500);
    }

    // CORRECCIÓN: Verificar si el usuario tiene uno de los roles permitidos
    if (!normalizedAllowedRoles.includes(userRole)) {
      throw new AuthError(
        `Permisos insuficientes. Se requiere: ${allowedRoles.join(', ')}. Actual: ${context.role}`,
        'INSUFFICIENT_PERMISSIONS',
        403
      );
    }

  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    
    console.error('Error inesperado en requireRole:', error);
    throw new AuthError('Error de verificación de roles', 'ROLE_ERROR', 500);
  }
}

/**
 * FUNCIÓN: requireAdmin - Verificar permisos de administrador
 */
export function requireAdmin(context: AuthContext): void {
  requireRole(context, ['ADMIN', 'SUPER_ADMIN']);
}

/**
 * FUNCIÓN: requireTechnician - Verificar permisos técnicos o superiores
 */
export function requireTechnician(context: AuthContext): void {
  requireRole(context, ['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN']);
}

/**
 * MIDDLEWARE WRAPPER: Convertir requireAuth a middleware de NextJS
 * Para uso en rutas API
 */
export function withAuth(handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const context = requireAuth(req);
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { 
            error: error.message, 
            code: error.code,
            timestamp: new Date().toISOString()
          },
          { status: error.status }
        );
      }
      
      console.error('Error en withAuth:', error);
      return NextResponse.json(
        { error: 'Error de autenticación interno', code: 'INTERNAL_AUTH_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * MIDDLEWARE WRAPPER: Combinar auth + roles
 */
export function withAuthAndRole(
  allowedRoles: string[],
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return withAuth(async (req, context) => {
    try {
      requireRole(context, allowedRoles);
      return await handler(req, context);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { 
            error: error.message, 
            code: error.code,
            timestamp: new Date().toISOString()
          },
          { status: error.status }
        );
      }
      
      console.error('Error en withAuthAndRole:', error);
      return NextResponse.json(
        { error: 'Error de autorización interno', code: 'INTERNAL_ROLE_ERROR' },
        { status: 500 }
      );
    }
  });
}

/**
 * FUNCIÓN: requirePermission - Sistema de permisos granulares para producción
 * Mapea permisos del nuevo sistema Discord a roles legacy para compatibilidad
 */
export function requirePermission(context: AuthContext, permission: string): void {
  // Mapeo de permisos Discord a roles legacy para compatibilidad
  const permissionToRoles: Record<string, string[]> = {
    // Dashboard permissions
    'dashboard:view': ['USER', 'EMPLOYEE', 'SUPPORT', 'TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'dashboard:export': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],

    // Equipment permissions
    'equipment:view': ['USER', 'EMPLOYEE', 'SUPPORT', 'TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'equipment:create': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'equipment:edit': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'equipment:delete': ['ADMIN', 'SUPER_ADMIN'],
    'equipment:export': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],

    // Tickets permissions
    'tickets:view_own': ['USER', 'EMPLOYEE', 'SUPPORT', 'TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'tickets:view_all': ['SUPPORT', 'TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'tickets:create': ['USER', 'EMPLOYEE', 'SUPPORT', 'TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'tickets:edit_own': ['USER', 'EMPLOYEE', 'SUPPORT', 'TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'tickets:edit_all': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'tickets:delete': ['ADMIN', 'SUPER_ADMIN'],
    'tickets:assign': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'tickets:close': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],

    // Employees permissions
    'employees:view': ['SUPPORT', 'TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'employees:create': ['ADMIN', 'SUPER_ADMIN'],
    'employees:edit': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'employees:delete': ['SUPER_ADMIN'],
    'employees:export': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],

    // Inventory permissions
    'inventory:view': ['USER', 'EMPLOYEE', 'SUPPORT', 'TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'inventory:create': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'inventory:edit': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'inventory:delete': ['ADMIN', 'SUPER_ADMIN'],
    'inventory:assign': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],

    // Printers permissions
    'printers:view': ['USER', 'EMPLOYEE', 'SUPPORT', 'TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'printers:create': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'printers:edit': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'printers:delete': ['ADMIN', 'SUPER_ADMIN'],
    'printers:manage_consumables': ['TECHNICIAN', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],

    // Purchases permissions
    'purchases:view': ['USER', 'EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'purchases:create': ['USER', 'EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'purchases:approve': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'purchases:reject': ['MANAGER', 'ADMIN', 'SUPER_ADMIN'],
    'purchases:process': ['ADMIN', 'SUPER_ADMIN'],

    // Backups permissions
    'backups:view': ['ADMIN', 'SUPER_ADMIN'],
    'backups:create': ['ADMIN', 'SUPER_ADMIN'],
    'backups:restore': ['SUPER_ADMIN'],
    'backups:delete': ['SUPER_ADMIN'],

    // Users & Roles permissions
    'users:view': ['ADMIN', 'SUPER_ADMIN'],
    'users:create': ['ADMIN', 'SUPER_ADMIN'],
    'users:edit': ['ADMIN', 'SUPER_ADMIN'],
    'users:delete': ['SUPER_ADMIN'],
    'users:reset_password': ['ADMIN', 'SUPER_ADMIN'],

    'roles:view': ['ADMIN', 'SUPER_ADMIN'],
    'roles:create': ['SUPER_ADMIN'],
    'roles:edit': ['SUPER_ADMIN'],
    'roles:delete': ['SUPER_ADMIN'],
    'roles:assign': ['ADMIN', 'SUPER_ADMIN'],

    // System permissions
    'system:configure': ['SUPER_ADMIN'],
    'system:admin': ['SUPER_ADMIN'],
    'audit:view': ['ADMIN', 'SUPER_ADMIN'],
    'audit:export': ['ADMIN', 'SUPER_ADMIN'],

    // Wildcard permissions
    '*:*': ['SUPER_ADMIN'],

    // Legacy permissions for backward compatibility
    'users:read': ['ADMIN', 'SUPER_ADMIN'],
    'users:write': ['ADMIN', 'SUPER_ADMIN'],
    'equipment:read': ['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'],
    'equipment:write': ['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'],
  };

  const requiredRoles = permissionToRoles[permission];
  if (!requiredRoles) {
    // Si no encuentra el permiso específico, rechazar acceso por seguridad
    throw new AuthError(`Permiso no autorizado: ${permission}`, 'PERMISSION_DENIED', 403);
  }

  requireRole(context, requiredRoles);
}

/**
 * FUNCIÓN HELPER: Obtener información del usuario desde token
 */
export function getUserFromToken(token: string): AuthContext | null {
  try {
    const { payload } = verifyJwtWithError<{
      userId: number;
      username: string;
      role: string;
    }>(token);

    if (!payload) return null;

    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      token
    };
  } catch (error) {
    console.warn('Error obteniendo usuario desde token:', error);
    return null;
  }
}

/**
 * FUNCIÓN HELPER: Verificar si un rol es válido
 */
export function isValidRole(role: string): boolean {
  const validRoles = ['USER', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN'];
  return validRoles.includes(role?.toUpperCase());
}

/**
 * FUNCIÓN HELPER: Comparar niveles de roles
 */
export function compareRoleLevel(role1: string, role2: string): number {
  const roleLevels: Record<string, number> = {
    'USER': 10,
    'TECHNICIAN': 20,
    'ADMIN': 30,
    'SUPER_ADMIN': 40,
  };

  const level1 = roleLevels[role1?.toUpperCase()] || 0;
  const level2 = roleLevels[role2?.toUpperCase()] || 0;

  return level1 - level2;
}

/**
 * FUNCIÓN HELPER: Log de eventos de seguridad
 */
export function logSecurityEvent(
  event: string,
  context: Partial<AuthContext> & { ip?: string; userAgent?: string }
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    userId: context.userId,
    username: context.username,
    role: context.role,
    ip: context.ip || 'unknown',
    userAgent: context.userAgent || 'unknown',
    requestId: Math.random().toString(36).substring(7),
  };

  // En producción, enviar a servicio de logging
  console.log('[SECURITY]', JSON.stringify(logData));
}