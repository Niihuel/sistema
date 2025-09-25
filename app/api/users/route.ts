
import { NextRequest, NextResponse } from 'next/server'
import { withDatabase } from '@/lib/prisma'
import {
  requireAllDynamicPermissions,
  requireAnyDynamicPermission,
  hasPermission
} from '@/lib/middleware'
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

export async function GET(req: NextRequest) {
  const authResult = await requireAnyDynamicPermission([
    'users:view',
    'tickets:view_all'
  ])(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const context = authResult

  try {
    const users = await withDatabase(async (prisma) => {
      if (hasPermission(context, 'users:view')) {
        return prisma.user.findMany({
          select: userSelection,
          orderBy: { username: 'asc' }
        })
      }

      return prisma.user.findMany({
        where: { role: { in: ['TECHNICIAN', 'ADMIN'] } },
        select: userSelection,
        orderBy: { username: 'asc' }
      })
    })

    return NextResponse.json(users.map(serializeUser))
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error in /api/users GET:', error)
    return NextResponse.json({ error: 'Error listando usuarios' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAllDynamicPermissions(['users:create'])(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await req.json()
    const username = String(body?.username ?? '').trim()
    const password = String(body?.password ?? '').trim()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'username y password son requeridos' },
        { status: 400 }
      )
    }

    const roleName = body?.role ? String(body.role).trim().toUpperCase() : null

    const user = await withDatabase(async (prisma) => {
      const existing = await prisma.user.findUnique({ where: { username } })
      if (existing) {
        throw new Error('Ya existe un usuario con ese nombre')
      }

      const roleRecord = roleName
        ? await prisma.role.findUnique({ where: { name: roleName } })
        : null

      const created = await prisma.user.create({
        data: {
          username,
          passwordHash: await hashPassword(password),
          email: body?.email ? String(body.email).trim() : null,
          firstName: body?.firstName ? String(body.firstName).trim() : null,
          lastName: body?.lastName ? String(body.lastName).trim() : null,
          isActive: body?.isActive ?? true,
          role: roleRecord?.name ?? roleName ?? 'USER',
          userRoles: roleRecord
            ? {
                create: {
                  role: { connect: { id: roleRecord.id } },
                  isPrimary: true,
                  isActive: true
                }
              }
            : undefined
        },
        select: userSelection
      })

      return created
    })

    return NextResponse.json(serializeUser(user), { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error in /api/users POST:', error)
    const message = error instanceof Error ? error.message : 'Error creando usuario'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
