import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['roles:view'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const userId = Number(idParam)
    const roles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true }
    })
    return NextResponse.json(roles)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error listando roles de usuario:', error)
    return NextResponse.json({ error: 'Error listando roles de usuario' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['roles:assign'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const userId = Number(idParam)
    const data = await req.json()

    const created = await prisma.userRole.create({
      data: { userId, roleId: Number(data?.roleId) }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error asignando rol:', error)
    return NextResponse.json({ error: 'Error asignando rol' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['roles:assign'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const userId = Number(idParam)
    const { searchParams } = new URL(req.url)
    const roleId = Number(searchParams.get('roleId'))

    await prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error removiendo rol:', error)
    return NextResponse.json({ error: 'Error removiendo rol' }, { status: 500 })
  }
}
