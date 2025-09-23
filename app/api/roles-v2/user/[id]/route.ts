import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, authContext) => {
    try {
      const { id } = await params
      const userId = parseInt(id, 10)

      if (isNaN(userId)) {
        return NextResponse.json(
          { error: 'ID de usuario inválido' },
          { status: 400 }
        )
      }

      // Only allow users to view their own roles, unless they're admin
      if (!authContext || (authContext.userId !== userId && authContext.role !== 'SUPER_ADMIN' && authContext.role !== 'ADMIN')) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver los roles de este usuario' },
          { status: 403 }
        )
      }

      // Get user roles with details
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId: userId,
          isActive: true
        },
        include: {
          role: {
            include: {
              rolePermissions: {
                where: { isActive: true },
                include: {
                  permission: true
                }
              }
            }
          }
        },
        orderBy: {
          role: { level: 'desc' }
        }
      })

      // Format the response
      const formattedRoles = userRoles.map(userRole => ({
        id: userRole.role.id,
        name: userRole.role.name,
        displayName: userRole.role.displayName,
        description: userRole.role.description,
        color: userRole.role.color,
        icon: userRole.role.icon,
        level: userRole.role.level,
        isPrimary: userRole.isPrimary,
        assignedAt: userRole.createdAt,
        assignedBy: userRole.assignedBy,
        permissions: userRole.role.rolePermissions.map(rp => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
          displayName: rp.permission.displayName,
          riskLevel: rp.permission.riskLevel
        }))
      }))

      return NextResponse.json({
        success: true,
        roles: formattedRoles,
        userId: userId
      })

    } catch (error) {
      console.error('Error fetching user roles:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })(request)
}