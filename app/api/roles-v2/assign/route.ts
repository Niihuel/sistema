import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withDatabase } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { RoleManagementService } from '@/lib/services/RoleManagementService'
import logger from '@/lib/logger'

// Validation schemas
const assignRoleSchema = z.object({
  userId: z.number(),
  roleId: z.number(),
  expiresAt: z.string().datetime().optional(),
  reason: z.string().optional(),
  isPrimary: z.boolean().optional()
})

const removeRoleSchema = z.object({
  userId: z.number(),
  roleId: z.number()
})

// POST /api/roles-v2/assign - Assign role to user
export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    const body = await req.json()

    // Validate input
    const validated = assignRoleSchema.parse(body)

    const assignment = await withDatabase(async (prisma) => {
      const service = new RoleManagementService(prisma)

      // Check permission
      const hasPermission = await service.hasPermission(ctx.userId, 'roles', 'assign')
      if (!hasPermission) {
        throw new Error('Insufficient permissions to assign roles')
      }

      // Check if user can manage this specific role
      const canManage = await service.canManageRole(ctx.userId, validated.roleId)
      if (!canManage) {
        throw new Error('Cannot assign role with higher or equal level')
      }

      // Get username for audit
      const assignedByUser = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { username: true }
      })

      return await service.assignRole(validated.userId, validated.roleId, {
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
        reason: validated.reason,
        assignedBy: assignedByUser?.username || `User ${ctx.userId}`,
        isPrimary: validated.isPrimary
      })
    })

    logger.info('Assigned role to user', {
      userId: ctx.userId,
      path: '/api/roles-v2/assign',
      metadata: {
        targetUserId: validated.userId,
        roleId: validated.roleId,
        isPrimary: validated.isPrimary
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: assignment,
        message: 'Role assigned successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error assigning role', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: '/api/roles-v2/assign'
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error &&
        (error.message.includes('Insufficient permissions') ||
         error.message.includes('Cannot assign role'))) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }

    if (error instanceof Error && error.message.includes('already has this role')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to assign role' },
      { status: 500 }
    )
  }
}

// DELETE /api/roles-v2/assign - Remove role from user
export async function DELETE(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    const body = await req.json()

    // Validate input
    const validated = removeRoleSchema.parse(body)

    await withDatabase(async (prisma) => {
      const service = new RoleManagementService(prisma)

      // Check permission
      const hasPermission = await service.hasPermission(ctx.userId, 'roles', 'assign')
      if (!hasPermission) {
        throw new Error('Insufficient permissions to remove roles')
      }

      // Check if user can manage this specific role
      const canManage = await service.canManageRole(ctx.userId, validated.roleId)
      if (!canManage) {
        throw new Error('Cannot remove role with higher or equal level')
      }

      await service.removeRole(validated.userId, validated.roleId)
    })

    logger.info('Removed role from user', {
      userId: ctx.userId,
      path: '/api/roles-v2/assign',
      metadata: {
        targetUserId: validated.userId,
        roleId: validated.roleId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Role removed successfully'
    })
  } catch (error) {
    logger.error('Error removing role', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: '/api/roles-v2/assign'
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error &&
        (error.message.includes('Insufficient permissions') ||
         error.message.includes('Cannot remove role'))) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to remove role' },
      { status: 500 }
    )
  }
}