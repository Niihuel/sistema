
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'
import { hashPassword } from '@/lib/auth'

const serializeUser = (user: any) => ({
  ...user,
  roles: Array.isArray(user.userRoles)
    ? user.userRoles
        .filter((relation: any) => relation?.role)
        .map((relation: any) => ({
          ...relation.role,
          isPrimary: relation.isPrimary ?? false
        }))
    : []
})

const userSelection = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    where: { isActive: true },
    select: {
      isPrimary: true,
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
          color: true,
          icon: true,
          level: true
        }
      }
    }
  }
} as const

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['users:view'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelection
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(serializeUser(user))
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error obteniendo usuario:', error)
    return NextResponse.json({ error: 'Error obteniendo usuario' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['users:edit'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()

    const payload: Record<string, unknown> = {}

    if (data.username !== undefined) payload.username = String(data.username).trim()
    if (data.email !== undefined) payload.email = data.email ? String(data.email).trim() : null
    if (data.firstName !== undefined) payload.firstName = data.firstName ? String(data.firstName).trim() : null
    if (data.lastName !== undefined) payload.lastName = data.lastName ? String(data.lastName).trim() : null
    if (data.isActive !== undefined) payload.isActive = Boolean(data.isActive)

    let roleRecordId: number | null = null
    if (data.role !== undefined && data.role !== null) {
      const roleName = String(data.role).trim().toUpperCase()
      const roleRecord = await prisma.role.findUnique({ where: { name: roleName } })
      if (!roleRecord) {
        return NextResponse.json({ error: 'Rol no encontrado' }, { status: 400 })
      }
      roleRecordId = roleRecord.id
      payload.role = roleRecord.name
    }

    if (data.password) {
      payload.passwordHash = await hashPassword(String(data.password))
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: payload,
        select: userSelection
      })

      if (roleRecordId !== null) {
        await tx.userRole.updateMany({
          where: { userId: id },
          data: { isPrimary: false }
        })

        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: id,
              roleId: roleRecordId
            }
          },
          update: { isActive: true, isPrimary: true },
          create: {
            userId: id,
            roleId: roleRecordId,
            isPrimary: true,
            isActive: true
          }
        })
      }

      return user
    })

    return NextResponse.json(serializeUser(updated))
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error actualizando usuario:', error)
    const message = error instanceof Error ? error.message : 'Error actualizando usuario'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['users:delete'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.user.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error eliminando usuario:', error)
    return NextResponse.json({ error: 'Error eliminando usuario' }, { status: 500 })
  }
}
