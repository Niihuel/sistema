import { NextRequest, NextResponse } from 'next/server'
import { withDatabase } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const authResult = await requireAllDynamicPermissions(['roles:view'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const roles = await withDatabase(async (prisma) => {
      return prisma.role.findMany({
        where: {
          isActive: true,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          color: true,
          icon: true,
          level: true,
          priority: true,
          isSystem: true,
          permissions: true,
          maxUsers: true,
          _count: { select: { userRoles: true } },
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { level: 'desc' },
          { priority: 'asc' },
          { name: 'asc' }
        ]
      })
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error in /api/roles GET:', error)
    if (error instanceof NextResponse) {
      return error
    }

    return NextResponse.json({ error: 'Error listando roles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAllDynamicPermissions(['roles:create'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const context = authResult

  try {
    const data = await req.json()

    if (!data.name || !data.displayName) {
      return NextResponse.json(
        { error: 'Nombre y nombre para mostrar son requeridos' },
        { status: 400 }
      )
    }

    const created = await withDatabase(async (prisma) => {
      const existing = await prisma.role.findFirst({
        where: { name: data.name.toUpperCase() }
      })

      if (existing) {
        throw new Error('Ya existe un rol con ese nombre')
      }

      return prisma.role.create({
        data: {
          name: data.name.toUpperCase(),
          displayName: data.displayName,
          description: data.description || null,
          color: data.color || '#6B7280',
          icon: data.icon || 'user',
          level: data.level || 10,
          priority: data.priority || 500,
          isSystem: false,
          isActive: true,
          permissions: data.permissions ? JSON.stringify(data.permissions) : null,
          maxUsers: data.maxUsers || null,
          createdBy: context.username
        }
      })
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error in /api/roles POST:', error)
    if (error instanceof NextResponse) {
      return error
    }

    const errorMessage = error instanceof Error ? error.message : 'Error creando rol'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

