import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['inventory:edit'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const { name } = await req.json()

    const updated = await prisma.catalogArea.update({
      where: { id },
      data: { name: String(name).trim() }
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error actualizando área:', error)
    return NextResponse.json({ error: 'Error actualizando área' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['inventory:delete'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.catalogArea.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error eliminando área:', error)
    return NextResponse.json({ error: 'Error eliminando área' }, { status: 500 })
  }
}
