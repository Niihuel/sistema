import { NextRequest, NextResponse } from 'next/server'
import { withDatabase } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['roles:delete'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await context.params
    const permissionId = Number(id)

    if (Number.isNaN(permissionId)) {
      return NextResponse.json({ error: 'ID de permiso inválido' }, { status: 400 })
    }

    await withDatabase(async (prisma) => {
      const permission = await prisma.permission.findUnique({ where: { id: permissionId } })

      if (!permission) {
        throw new NextResponse('Permiso no encontrado', { status: 404 })
      }

      await prisma.permission.delete({ where: { id: permissionId } })
    })

    return NextResponse.json({ message: 'Permiso eliminado correctamente' })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error in /api/permissions/[id] DELETE:', error)
    return NextResponse.json({ error: 'Error eliminando permiso' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['roles:view'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await context.params
    const permissionId = Number(id)

    if (Number.isNaN(permissionId)) {
      return NextResponse.json({ error: 'ID de permiso inválido' }, { status: 400 })
    }

    const permission = await withDatabase(async (prisma) => {
      return prisma.permission.findUnique({
        where: { id: permissionId },
        include: { role: true }
      })
    })

    if (!permission) {
      return NextResponse.json({ error: 'Permiso no encontrado' }, { status: 404 })
    }

    return NextResponse.json(permission)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error in /api/permissions/[id] GET:', error)
    return NextResponse.json({ error: 'Error obteniendo permiso' }, { status: 500 })
  }
}
