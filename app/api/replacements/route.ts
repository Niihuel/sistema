import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    const authResult = await requireAllDynamicPermissions(['printers:manage_consumables'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const { searchParams } = new URL(req.url)
    const printerId = searchParams.get('printerId')

    const items = await prisma.replacement.findMany({
      where: printerId ? { printerId: Number(printerId) } : {},
      orderBy: { id: 'desc' },
      include: { printer: true, consumable: true }
    })

    return NextResponse.json(items)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    if (!isProd) {
      return NextResponse.json([])
    }

    console.error('Error listando reemplazos:', error)
    return NextResponse.json({ error: 'Error listando reemplazos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    const authResult = await requireAllDynamicPermissions(['printers:manage_consumables'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const data = await req.json()

    const payload = {
      printerId: Number(data?.printerId),
      consumableId: data?.consumableId ? Number(data.consumableId) : null,
      replacementDate: new Date(data?.replacementDate ?? new Date()),
      completionDate: data?.completionDate ? new Date(data.completionDate) : null,
      rendimientoDays: data?.rendimientoDays ? Number(data.rendimientoDays) : null,
      notes: data?.notes ? String(data.notes) : null
    }

    const replacement = await prisma.replacement.create({ data: payload })
    return NextResponse.json(replacement, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error creando reemplazo:', error)
    return NextResponse.json({ error: 'Error creando reemplazo' }, { status: 500 })
  }
}
