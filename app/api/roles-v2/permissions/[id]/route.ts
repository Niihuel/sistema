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

      // Only allow users to view their own permissions, unless they're admin
      if (!authContext.user || (authContext.user.id !== userId && authContext.user.role !== 'SUPER_ADMIN' && authContext.user.role !== 'ADMIN')) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver los permisos de este usuario' },
          { status: 403 }
        )
      }

      // Get all permissions for the user through their roles
      const userPermissions = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            where: { isActive: true },
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
            }
          },
          // Also get any direct permission overrides (if they exist)
          permissionOverrides: {
            where: { isActive: true },
            include: {
              permission: true
            }
          }
        }
      })

      if (!userPermissions) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }

      // Collect all permissions from roles
      const rolePermissions = new Map()
      let highestRoleLevel = 0

      userPermissions.userRoles.forEach(userRole => {
        const role = userRole.role
        if (role.level > highestRoleLevel) {
          highestRoleLevel = role.level
        }

        role.rolePermissions.forEach(rp => {
          const permKey = `${rp.permission.resource}:${rp.permission.action}`
          if (!rolePermissions.has(permKey) || rolePermissions.get(permKey).riskLevel < rp.permission.riskLevel) {
            rolePermissions.set(permKey, {
              id: rp.permission.id,
              name: rp.permission.name,
              resource: rp.permission.resource,
              action: rp.permission.action,
              displayName: rp.permission.displayName,
              description: rp.permission.description,
              riskLevel: rp.permission.riskLevel,
              source: 'role',
              roleName: role.name,
              roleLevel: role.level
            })
          }
        })
      })

      // Apply permission overrides
      userPermissions.permissionOverrides?.forEach(override => {
        const permKey = `${override.permission.resource}:${override.permission.action}`

        if (override.granted) {
          // Grant permission override
          rolePermissions.set(permKey, {
            id: override.permission.id,
            name: override.permission.name,
            resource: override.permission.resource,
            action: override.permission.action,
            displayName: override.permission.displayName,
            description: override.permission.description,
            riskLevel: override.permission.riskLevel,
            source: 'override',
            overrideType: 'granted'
          })
        } else {
          // Revoke permission override
          rolePermissions.delete(permKey)
        }
      })

      // Convert to array and sort by resource and action
      const finalPermissions = Array.from(rolePermissions.values()).sort((a, b) => {
        if (a.resource === b.resource) {
          return a.action.localeCompare(b.action)
        }
        return a.resource.localeCompare(b.resource)
      })

      // Group permissions by resource for easier consumption
      const permissionsByResource = finalPermissions.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = []
        }
        acc[perm.resource].push(perm)
        return acc
      }, {} as Record<string, typeof finalPermissions>)

      return NextResponse.json({
        success: true,
        userId: userId,
        username: userPermissions.username,
        highestRoleLevel,
        permissions: finalPermissions,
        permissionsByResource,
        totalPermissions: finalPermissions.length,
        roles: userPermissions.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          displayName: ur.role.displayName,
          level: ur.role.level,
          isPrimary: ur.isPrimary
        }))
      })

    } catch (error) {
      console.error('Error fetching user permissions:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  })(request)
}