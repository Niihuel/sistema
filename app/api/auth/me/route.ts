import { NextRequest, NextResponse } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth, AuthError } from "@/lib/middleware"
import { headers } from "next/headers"

interface PermissionScope {
  resource: string
  actions: string[]
  scope: string
  conditions?: any
  riskLevel: string
  requiresMFA: boolean
}

interface UserProfile {
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
  // Sistema Discord mejorado
  discordRoles?: Array<{
    id: string
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

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'unknown'
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

  console.log(`[/api/auth/me] ${requestId}: Starting request from ${ipAddress}`)

  try {
    // Get auth context with comprehensive error handling
    let ctx;
    try {
      console.log(`[/api/auth/me] ${requestId}: Checking auth context`)
      ctx = requireAuth(req)
      console.log(`[/api/auth/me] ${requestId}: Auth context obtained for user ${ctx.userId}`)
    } catch (authError) {
      console.log(`[/api/auth/me] ${requestId}: Auth error:`, authError)
      if (authError instanceof AuthError) {
        return NextResponse.json(
          {
            error: authError.message,
            code: authError.code,
            timestamp: new Date().toISOString(),
            requestId
          },
          { status: authError.status }
        )
      }

      return NextResponse.json(
        {
          error: "Authentication required",
          code: "AUTH_REQUIRED",
          timestamp: new Date().toISOString(),
          requestId
        },
        { status: 401 }
      )
    }

    // Validate context structure
    if (!ctx || !ctx.userId || typeof ctx.userId !== 'number') {
      console.log(`[/api/auth/me] ${requestId}: Invalid context structure:`, ctx)
      return NextResponse.json(
        {
          error: "Invalid authentication context",
          code: "INVALID_CONTEXT",
          timestamp: new Date().toISOString(),
          requestId
        },
        { status: 401 }
      )
    }

    console.log(`[/api/auth/me] ${requestId}: Starting database query for user ${ctx.userId}`)
    
    // Get basic user data (production-ready simplified version)
    const user = await withDatabase(async (prisma) => {
      console.log(`[/api/auth/me] ${requestId}: Inside withDatabase callback`)
      const userData = await prisma.user.findUnique({
        where: {
          id: ctx.userId
        },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      })
      console.log(`[/api/auth/me] ${requestId}: Database query completed, found user:`, !!userData)
      return userData
    })

    console.log(`[/api/auth/me] ${requestId}: Database query finished`)

    // Check if user exists
    if (!user) {
      console.log(`[/api/auth/me] ${requestId}: User not found for ID ${ctx.userId}`)
      return NextResponse.json(
        {
          error: "User not found",
          code: "USER_NOT_FOUND",
          timestamp: new Date().toISOString(),
          requestId
        },
        { status: 404 }
      )
    }

    console.log(`[/api/auth/me] ${requestId}: Building user profile`)

    // Build production-ready user profile with Discord system support
    const userProfile: UserProfile = {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: true,
      isEmailVerified: true,
      twoFactorEnabled: false,
      // Legacy roles for backward compatibility
      roles: [{
        id: 1,
        name: user.role,
        displayName: getRoleDisplayName(user.role),
        level: getRoleLevel(user.role),
        isActive: true,
        isPrimary: true,
        isTemporary: false,
        assignedAt: user.createdAt,
        color: getRoleColor(user.role),
        icon: getRoleIcon(user.role)
      }],
      // Discord-style roles (future expansion)
      discordRoles: [{
        id: `discord-${user.role}`,
        name: user.role,
        displayName: getRoleDisplayName(user.role),
        level: getRoleLevel(user.role),
        isActive: true,
        isPrimary: true,
        isTemporary: false,
        assignedAt: user.createdAt,
        color: getRoleColor(user.role),
        icon: getRoleIcon(user.role)
      }],
      // Simplified permissions based on role
      permissions: getPermissionsForRole(user.role),
      deniedPermissions: [],
      settings: {
        timezone: 'America/Mexico_City',
        locale: 'es-MX',
        theme: 'dark'
      },
      security: {
        sessionCount: 1,
        requiresPasswordChange: false,
        mfaRequired: false
      },
      metadata: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }

    console.log(`[/api/auth/me] ${requestId}: Sending response, total time: ${Date.now() - startTime}ms`)

    return NextResponse.json(userProfile, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })

  } catch (error) {
    console.error(`[/api/auth/me] ${requestId}: Error after ${Date.now() - startTime}ms:`, error)

    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        timestamp: new Date().toISOString(),
        requestId
      },
      { status: 500 }
    )
  }
}

// Helper functions for role management
function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    'SUPER_ADMIN': 'Super Administrador',
    'ADMIN': 'Administrador',
    'MANAGER': 'Gerente',
    'TECHNICIAN': 'Técnico',
    'SUPPORT': 'Soporte',
    'EMPLOYEE': 'Empleado',
    'USER': 'Usuario',
    'GUEST': 'Invitado'
  }
  return roleNames[role] || role
}

function getRoleLevel(role: string): number {
  const roleLevels: Record<string, number> = {
    'SUPER_ADMIN': 100,
    'ADMIN': 90,
    'MANAGER': 70,
    'TECHNICIAN': 50,
    'SUPPORT': 40,
    'EMPLOYEE': 30,
    'USER': 20,
    'GUEST': 10
  }
  return roleLevels[role] || 0
}

function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    'SUPER_ADMIN': '#E74C3C',
    'ADMIN': '#E67E22',
    'MANAGER': '#3498DB',
    'TECHNICIAN': '#9B59B6',
    'SUPPORT': '#1ABC9C',
    'EMPLOYEE': '#2ECC71',
    'USER': '#95A5A6',
    'GUEST': '#BDC3C7'
  }
  return roleColors[role] || '#95A5A6'
}

function getRoleIcon(role: string): string {
  const roleIcons: Record<string, string> = {
    'SUPER_ADMIN': '👑',
    'ADMIN': '🛡️',
    'MANAGER': '👔',
    'TECHNICIAN': '🔧',
    'SUPPORT': '🎧',
    'EMPLOYEE': '💼',
    'USER': '👤',
    'GUEST': '👁️'
  }
  return roleIcons[role] || '👤'
}

function getPermissionsForRole(role: string): PermissionScope[] {
  const basePermissions: PermissionScope[] = [
    {
      resource: 'dashboard',
      actions: ['view'],
      scope: 'ALL',
      riskLevel: 'LOW',
      requiresMFA: false
    }
  ]

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return [
      ...basePermissions,
      {
        resource: 'users',
        actions: ['view', 'create', 'edit', 'delete'],
        scope: 'ALL',
        riskLevel: 'HIGH',
        requiresMFA: false
      },
      {
        resource: 'employees',
        actions: ['view', 'create', 'edit', 'delete'],
        scope: 'ALL',
        riskLevel: 'MEDIUM',
        requiresMFA: false
      },
      {
        resource: 'equipment',
        actions: ['view', 'create', 'edit', 'delete'],
        scope: 'ALL',
        riskLevel: 'MEDIUM',
        requiresMFA: false
      },
      {
        resource: 'inventory',
        actions: ['view', 'create', 'edit', 'delete'],
        scope: 'ALL',
        riskLevel: 'MEDIUM',
        requiresMFA: false
      },
      {
        resource: 'tickets',
        actions: ['view_all', 'create', 'edit_all', 'assign', 'close'],
        scope: 'ALL',
        riskLevel: 'LOW',
        requiresMFA: false
      },
      {
        resource: 'printers',
        actions: ['view', 'create', 'edit', 'delete'],
        scope: 'ALL',
        riskLevel: 'MEDIUM',
        requiresMFA: false
      },
      {
        resource: 'purchases',
        actions: ['view', 'create', 'approve', 'process'],
        scope: 'ALL',
        riskLevel: 'MEDIUM',
        requiresMFA: false
      },
      {
        resource: 'backups',
        actions: ['view', 'create'],
        scope: 'ALL',
        riskLevel: 'HIGH',
        requiresMFA: false
      }
    ]
  }

  if (role === 'TECHNICIAN') {
    return [
      ...basePermissions,
      {
        resource: 'equipment',
        actions: ['view', 'edit'],
        scope: 'ALL',
        riskLevel: 'MEDIUM',
        requiresMFA: false
      },
      {
        resource: 'tickets',
        actions: ['view_all', 'edit_all', 'assign', 'close'],
        scope: 'ALL',
        riskLevel: 'LOW',
        requiresMFA: false
      },
      {
        resource: 'inventory',
        actions: ['view', 'edit', 'assign'],
        scope: 'ALL',
        riskLevel: 'MEDIUM',
        requiresMFA: false
      }
    ]
  }

  // Default permissions for USER/EMPLOYEE roles
  return [
    ...basePermissions,
    {
      resource: 'tickets',
      actions: ['view_own', 'create', 'edit_own'],
      scope: 'OWN',
      riskLevel: 'LOW',
      requiresMFA: false
    },
    {
      resource: 'equipment',
      actions: ['view'],
      scope: 'ALL',
      riskLevel: 'LOW',
      requiresMFA: false
    }
  ]
}