import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['tickets:edit_all'])(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()

    const ticket = await prisma.ticket.update({ where: { id }, data })
    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error actualizando ticket:', error)
    return NextResponse.json({ error: 'Error actualizando ticket' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['tickets:delete'])(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.ticket.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error eliminando ticket:', error)
    return NextResponse.json({ error: 'Error eliminando ticket' }, { status: 500 })
  }
}
