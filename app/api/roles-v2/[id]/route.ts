import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withDatabase } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { RoleManagementService } from '@/lib/services/RoleManagementService'
import logger from '@/lib/logger'

// Validation schemas
const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  level: z.number().optional(),
  isActive: z.boolean().optional()
})

// GET /api/roles-v2/[id] - Get role details
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth(req)
    const { id } = await context.params
    const roleId = parseInt(id)

    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const role = await withDatabase(async (prisma) => {
      const service = new RoleManagementService(prisma)

      // Check permission
      const hasPermission = await service.hasPermission(ctx.userId, 'roles', 'view')
      if (!hasPermission) {
        throw new Error('Insufficient permissions')
      }

      return await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          rolePermissions: {
            where: { isActive: true },
            include: { permission: true }
          },
          userRoles: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      })
    })

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: role
    })
  } catch (error) {
    logger.error('Error fetching role', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: `/api/roles-v2/${id}`
    })

    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PUT /api/roles-v2/[id] - Update role
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth(req)
    const { id } = await context.params
    const roleId = parseInt(id)
    const body = await req.json()

    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    // Validate input
    const validated = updateRoleSchema.parse(body)

    const role = await withDatabase(async (prisma) => {
      const service = new RoleManagementService(prisma)

      // Check permission
      const hasPermission = await service.hasPermission(ctx.userId, 'roles', 'edit')
      if (!hasPermission) {
        throw new Error('Insufficient permissions')
      }

      // Check if user can manage this specific role
      const canManage = await service.canManageRole(ctx.userId, roleId)
      if (!canManage) {
        throw new Error('Cannot manage role with higher or equal level')
      }

      return await service.updateRole(roleId, validated)
    })

    logger.info('Updated role', {
      userId: ctx.userId,
      path: `/api/roles-v2/${id}`,
      metadata: { roleId: role.id, changes: Object.keys(validated) }
    })

    return NextResponse.json({
      success: true,
      data: role
    })
  } catch (error) {
    logger.error('Error updating role', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: `/api/roles-v2/${id}`
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error &&
        (error.message === 'Insufficient permissions' ||
         error.message.includes('Cannot manage role'))) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/roles-v2/[id] - Delete role
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth(req)
    const { id } = await context.params
    const roleId = parseInt(id)

    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    await withDatabase(async (prisma) => {
      const service = new RoleManagementService(prisma)

      // Check permission
      const hasPermission = await service.hasPermission(ctx.userId, 'roles', 'delete')
      if (!hasPermission) {
        throw new Error('Insufficient permissions')
      }

      // Check if user can manage this specific role
      const canManage = await service.canManageRole(ctx.userId, roleId)
      if (!canManage) {
        throw new Error('Cannot delete role with higher or equal level')
      }

      await service.deleteRole(roleId)
    })

    logger.info('Deleted role', {
      userId: ctx.userId,
      path: `/api/roles-v2/${id}`,
      metadata: { roleId }
    })

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting role', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: `/api/roles-v2/${id}`
    })

    if (error instanceof Error &&
        (error.message === 'Insufficient permissions' ||
         error.message.includes('Cannot delete role') ||
         error.message.includes('Cannot delete system roles') ||
         error.message.includes('Cannot delete role with'))) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}