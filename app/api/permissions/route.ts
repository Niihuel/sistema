import { NextRequest, NextResponse } from 'next/server'
import { withDatabase } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const authResult = await requireAllDynamicPermissions(['roles:view'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const permissions = await withDatabase(async (prisma) => {
      return prisma.permission.findMany({
        include: { role: true },
        orderBy: { roleId: 'asc' }
      })
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Error in /api/permissions GET:', error)
    if (error instanceof NextResponse) {
      return error
    }

    return NextResponse.json({ error: 'Error listando permisos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAllDynamicPermissions(['roles:edit'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { roleId, resource, level } = await req.json()

    if (!roleId || !resource || !level) {
      return NextResponse.json(
        { error: 'roleId, resource y level son requeridos' },
        { status: 400 }
      )
    }

    if (!['READ', 'WRITE', 'ADMIN'].includes(level)) {
      return NextResponse.json(
        { error: 'Level debe ser READ, WRITE o ADMIN' },
        { status: 400 }
      )
    }

    const permission = await withDatabase(async (prisma) => {
      const role = await prisma.role.findUnique({ where: { id: Number(roleId) } })
      if (!role) {
        throw new Error('Rol no encontrado')
      }

      const existingPermission = await prisma.permission.findUnique({
        where: {
          roleId_resource_level: {
            roleId: Number(roleId),
            resource: String(resource),
            level: String(level)
          }
        }
      })

      if (existingPermission) {
        throw new Error('Este permiso ya existe para el rol')
      }

      return prisma.permission.create({
        data: {
          roleId: Number(roleId),
          resource: String(resource),
          level: String(level)
        },
        include: { role: true }
      })
    })

    return NextResponse.json(permission, { status: 201 })
  } catch (error) {
    console.error('Error in /api/permissions POST:', error)
    if (error instanceof NextResponse) {
      return error
    }

    const errorMessage = error instanceof Error ? error.message : 'Error creando permiso'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
