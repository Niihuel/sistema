import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAllDynamicPermissions,
  type DynamicAuthContext
} from '@/lib/middleware'
import { getNotificationTriggers } from '@/lib/notification-triggers'

export async function GET(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    const authResult = await requireAllDynamicPermissions(['printers:view'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const printerId = searchParams.get('printerId')

    const items = await prisma.consumable.findMany({
      where: {
        AND: [
          status ? { status } : {},
          printerId ? { printerId: Number(printerId) } : {}
        ]
      },
      orderBy: { id: 'desc' },
      include: { printer: true }
    })

    return NextResponse.json(items)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    if (!isProd) {
      return NextResponse.json([])
    }

    console.error('Error listando consumibles:', error)
    return NextResponse.json({ error: 'Error listando consumibles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production'
  let authContext: DynamicAuthContext | null = null

  if (isProd) {
    const authResult = await requireAllDynamicPermissions(['printers:manage_consumables'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    authContext = authResult
  }

  try {
    const data = await req.json()

    const payload = {
      itemName: String(data?.itemName ?? 'Consumible'),
      color: data?.color ? String(data.color) : null,
      quantityAvailable: data?.quantityAvailable ? Number(data.quantityAvailable) : 0,
      status: data?.status ? String(data.status) : 'OK',
      printerId: data?.printerId ? Number(data.printerId) : null
    }

    const consumable = await prisma.consumable.create({ data: payload })

    if (authContext) {
      try {
        const triggers = getNotificationTriggers(prisma)
        await triggers.onConsumableChange(consumable, 'CREATE')
      } catch (notificationError) {
        console.error('Failed to trigger consumable notifications:', notificationError)
      }
    }

    return NextResponse.json(consumable, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error creando consumible:', error)
    return NextResponse.json({ error: 'Error creando consumible' }, { status: 500 })
  }
}
