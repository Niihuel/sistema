import { NextRequest, NextResponse } from 'next/server'
import { withDatabase } from '@/lib/prisma'
import {
  requireAllDynamicPermissions,
  requireAnyDynamicPermission,
  hasPermission
} from '@/lib/middleware'
import { hashPassword } from '@/lib/auth'

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
          select: { id: true, username: true, role: true, createdAt: true }
        })
      }

      return prisma.user.findMany({
        where: { role: { in: ['TECHNICIAN', 'ADMIN'] } },
        select: { id: true, username: true, role: true }
      })
    })

    return NextResponse.json(users)
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
    const { username, password, role } = await req.json()
    if (!username || !password) {
      return NextResponse.json(
        { error: 'username y password requeridos' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)
    const user = await withDatabase(async (prisma) => {
      return prisma.user.create({ data: { username, passwordHash, role } })
    })

    return NextResponse.json({ id: user.id, username: user.username, role: user.role }, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error in /api/users POST:', error)
    return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 })
  }
}
