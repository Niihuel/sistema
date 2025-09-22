import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withDatabase } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { RoleManagementService } from '@/lib/services/RoleManagementService'
import logger from '@/lib/logger'

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  level: z.number().optional(),
  parentRoleId: z.number().optional(),
  isDefault: z.boolean().optional()
})

// GET /api/roles-v2 - Get role hierarchy
export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(req)

    const roles = await withDatabase(async (prisma) => {
      const service = new RoleManagementService(prisma)

      // Check permission
      const hasPermission = await service.hasPermission(ctx.userId, 'roles', 'view')
      if (!hasPermission) {
        throw new Error('Insufficient permissions')
      }

      return await service.getRoleHierarchy()
    })

    logger.info('Fetched role hierarchy', {
      userId: ctx.userId,
      path: '/api/roles-v2',
      metadata: { count: roles.length }
    })

    return NextResponse.json({
      success: true,
      data: roles
    })
  } catch (error) {
    logger.error('Error fetching roles', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: '/api/roles-v2'
    })

    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST /api/roles-v2 - Create new role
export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    const body = await req.json()

    // Validate input
    const validated = createRoleSchema.parse(body)

    const role = await withDatabase(async (prisma) => {
      const service = new RoleManagementService(prisma)

      // Check permission
      const hasPermission = await service.hasPermission(ctx.userId, 'roles', 'create')
      if (!hasPermission) {
        throw new Error('Insufficient permissions')
      }

      return await service.createRole(validated)
    })

    logger.info('Created new role', {
      userId: ctx.userId,
      path: '/api/roles-v2',
      metadata: { roleId: role.id, roleName: role.name }
    })

    return NextResponse.json(
      {
        success: true,
        data: role
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error creating role', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: '/api/roles-v2'
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    )
  }
}