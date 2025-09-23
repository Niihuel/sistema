import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'
import { hashPassword } from '@/lib/auth'

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
      select: { id: true, username: true, role: true, createdAt: true, updatedAt: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
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
    if (data.username !== undefined) payload.username = String(data.username)
    if (data.role !== undefined) payload.role = String(data.role)
    if (data.password) {
      payload.passwordHash = await hashPassword(String(data.password))
    }

    const user = await prisma.user.update({
      where: { id },
      data: payload,
      select: { id: true, username: true, role: true, createdAt: true, updatedAt: true }
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error actualizando usuario:', error)
    return NextResponse.json({ error: 'Error actualizando usuario' }, { status: 500 })
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
