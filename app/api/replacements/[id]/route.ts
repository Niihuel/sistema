import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

const isProd = () => process.env.NODE_ENV === 'production'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (isProd()) {
    const authResult = await requireAllDynamicPermissions(['printers:manage_consumables'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)

    const replacement = await prisma.replacement.findUnique({
      where: { id },
      include: { printer: true, consumable: true }
    })

    if (!replacement) {
      return NextResponse.json({ error: 'Reemplazo no encontrado' }, { status: 404 })
    }

    return NextResponse.json(replacement)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error obteniendo reemplazo:', error)
    return NextResponse.json({ error: 'Error obteniendo reemplazo' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (isProd()) {
    const authResult = await requireAllDynamicPermissions(['printers:manage_consumables'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()

    const payload: Record<string, unknown> = {}
    if (data.printerId !== undefined) payload.printerId = Number(data.printerId)
    if (data.consumableId !== undefined) payload.consumableId = data.consumableId ? Number(data.consumableId) : null
    if (data.replacementDate !== undefined) payload.replacementDate = new Date(data.replacementDate)
    if (data.completionDate !== undefined) payload.completionDate = data.completionDate ? new Date(data.completionDate) : null
    if (data.rendimientoDays !== undefined) payload.rendimientoDays = data.rendimientoDays ? Number(data.rendimientoDays) : null
    if (data.notes !== undefined) payload.notes = data.notes ? String(data.notes) : null

    const replacement = await prisma.replacement.update({ where: { id }, data: payload })
    return NextResponse.json(replacement)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error actualizando reemplazo:', error)
    return NextResponse.json({ error: 'Error actualizando reemplazo' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (isProd()) {
    const authResult = await requireAllDynamicPermissions(['printers:manage_consumables'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.replacement.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error eliminando reemplazo:', error)
    return NextResponse.json({ error: 'Error eliminando reemplazo' }, { status: 500 })
  }
}
