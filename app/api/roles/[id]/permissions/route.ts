import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withDatabase } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import logger from '@/lib/logger'

const updatePermissionsSchema = z.object({
  permissions: z.array(z.object({
    resource: z.string(),
    action: z.string()
  }))
})

// GET /api/roles/[id]/permissions - Get role permissions
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth(req)
    const roleId = parseInt(params.id)

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const result = await withDatabase(async (prisma) => {
      // Check permission
      const userRole = await prisma.userRole.findFirst({
        where: { userId: ctx.userId, isActive: true },
        include: { role: true },
        orderBy: { role: { level: 'desc' } }
      })

      if (!userRole || !['SUPER_ADMIN', 'ADMIN'].includes(userRole.role.name.toUpperCase())) {
        throw new Error('Insufficient permissions to view role permissions')
      }

      // Get role with permissions
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          rolePermissions: {
            where: { isActive: true },
            include: {
              permission: true
            }
          }
        }
      })

      if (!role) {
        throw new Error('Role not found')
      }

      // Format permissions
      const permissions = role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        displayName: rp.permission.displayName,
        resource: rp.permission.resource,
        action: rp.permission.action,
        category: rp.permission.category,
        riskLevel: rp.permission.riskLevel,
        description: rp.permission.description
      }))

      return {
        roleId: role.id,
        roleName: role.name,
        permissions
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error fetching role permissions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      roleId: params.id,
      path: req.url
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch permissions' },
      { status: error instanceof Error && error.message.includes('permissions') ? 403 : 500 }
    )
  }
}

// PUT /api/roles/[id]/permissions - Update role permissions
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth(req)
    const roleId = parseInt(params.id)

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = updatePermissionsSchema.parse(body)

    const result = await withDatabase(async (prisma) => {
      // Check permission
      const userRole = await prisma.userRole.findFirst({
        where: { userId: ctx.userId, isActive: true },
        include: { role: true },
        orderBy: { role: { level: 'desc' } }
      })

      if (!userRole || !['SUPER_ADMIN', 'ADMIN'].includes(userRole.role.name.toUpperCase())) {
        throw new Error('Insufficient permissions to update role permissions')
      }

      // Get role
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      })

      if (!role) {
        throw new Error('Role not found')
      }

      // Check if trying to edit a system role without super admin
      if (role.isSystem && userRole.role.name !== 'SUPER_ADMIN') {
        throw new Error('Cannot modify system role permissions')
      }

      // Start transaction
      return await prisma.$transaction(async (tx) => {
        // Deactivate all current permissions
        await tx.rolePermission.updateMany({
          where: { roleId },
          data: { isActive: false }
        })

        // Add new permissions
        for (const perm of validatedData.permissions) {
          const permission = await tx.permission.findFirst({
            where: {
              resource: perm.resource,
              action: perm.action,
              scope: 'ALL'
            }
          })

          if (permission) {
            await tx.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId,
                  permissionId: permission.id
                }
              },
              update: {
                isActive: true,
                grantedBy: ctx.username
              },
              create: {
                roleId,
                permissionId: permission.id,
                isActive: true,
                grantedBy: ctx.username
              }
            })
          }
        }

        // Log the action
        await tx.auditLog.create({
          data: {
            userId: ctx.userId,
            userName: ctx.username,
            action: 'UPDATE_ROLE_PERMISSIONS',
            entity: 'Role',
            entityId: roleId,
            description: `Updated permissions for role: ${role.name}`,
            severity: 'HIGH',
            isSuccess: true,
            category: 'SECURITY'
          }
        })

        // Return updated role with permissions
        return await tx.role.findUnique({
          where: { id: roleId },
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: {
                permission: true
              }
            }
          }
        })
      })
    })

    logger.info('Updated role permissions', {
      userId: ctx.userId,
      roleId,
      permissionCount: validatedData.permissions.length,
      path: req.url
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    logger.error('Error updating role permissions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      roleId: params.id,
      path: req.url
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update permissions' },
      { status: error instanceof Error && error.message.includes('permissions') ? 403 : 500 }
    )
  }
}