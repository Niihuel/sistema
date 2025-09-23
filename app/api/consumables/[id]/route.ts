import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAllDynamicPermissions
} from '@/lib/middleware'

const isProduction = () => process.env.NODE_ENV === 'production'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (isProduction()) {
    const authResult = await requireAllDynamicPermissions(['printers:view'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)

    const consumable = await prisma.consumable.findUnique({
      where: { id },
      include: { printer: true }
    })

    if (!consumable) {
      return NextResponse.json({ error: 'Consumible no encontrado' }, { status: 404 })
    }

    return NextResponse.json(consumable)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error obteniendo consumible:', error)
    return NextResponse.json({ error: 'Error obteniendo consumible' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (isProduction()) {
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
    if (data.itemName !== undefined) payload.itemName = String(data.itemName)
    if (data.type !== undefined) payload.type = String(data.type)
    if (data.printerId !== undefined) payload.printerId = data.printerId ? Number(data.printerId) : null
    if (data.stock !== undefined) payload.stock = Number(data.stock)
    if (data.minStock !== undefined) payload.minStock = data.minStock ? Number(data.minStock) : null
    if (data.supplier !== undefined) payload.supplier = data.supplier ? String(data.supplier) : null
    if (data.partNumber !== undefined) payload.partNumber = data.partNumber ? String(data.partNumber) : null
    if (data.notes !== undefined) payload.notes = data.notes ? String(data.notes) : null

    const consumable = await prisma.consumable.update({ where: { id }, data: payload })
    return NextResponse.json(consumable)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error actualizando consumible:', error)
    return NextResponse.json({ error: 'Error actualizando consumible' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (isProduction()) {
    const authResult = await requireAllDynamicPermissions(['printers:manage_consumables'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.consumable.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error eliminando consumible:', error)
    return NextResponse.json({ error: 'Error eliminando consumible' }, { status: 500 })
  }
}
