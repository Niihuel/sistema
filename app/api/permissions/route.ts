import { NextRequest, NextResponse } from 'next/server'
import { withDatabase } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import logger from '@/lib/logger'

// GET /api/permissions - Get all available permissions
export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req)

    const permissions = await withDatabase(async (prisma) => {
      // Check if user has permission to view permissions
      const userRole = await prisma.userRole.findFirst({
        where: { userId: ctx.userId, isActive: true },
        include: {
          role: {
            include: {
              rolePermissions: {
                where: { isActive: true },
                include: { permission: true }
              }
            }
          }
        },
        orderBy: { role: { level: 'desc' } }
      })

      const hasPermission = userRole?.role.rolePermissions.some(rp =>
        (rp.permission.resource === 'roles' && rp.permission.action === 'view') ||
        (rp.permission.resource === '*' && rp.permission.action === '*')
      )

      if (!hasPermission && !['SUPER_ADMIN', 'ADMIN'].includes(userRole?.role.name || '')) {
        throw new Error('Insufficient permissions to view permissions')
      }

      // Get all permissions
      return await prisma.permission.findMany({
        where: { isActive: true },
        orderBy: [
          { category: 'asc' },
          { resource: 'asc' },
          { action: 'asc' }
        ]
      })
    })

    logger.info('Fetched permissions list', {
      userId: ctx.userId,
      count: permissions.length,
      path: req.url
    })

    return NextResponse.json({
      success: true,
      data: permissions
    })
  } catch (error) {
    logger.error('Error fetching permissions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.url
    })

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch permissions' },
      { status: error instanceof Error && error.message.includes('permissions') ? 403 : 500 }
    )
  }
}