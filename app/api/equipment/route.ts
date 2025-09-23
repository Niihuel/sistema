import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  requireAllDynamicPermissions
} from '@/lib/middleware'
import {
  equipmentFilterSchema,
  createEquipmentSchema,
  validateRequest
} from '@/lib/validations'

const isProduction = () => process.env.NODE_ENV === 'production'

export async function GET(req: NextRequest) {
  if (isProduction()) {
    const authResult = await requireAllDynamicPermissions(['equipment:view'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const { searchParams } = new URL(req.url)
    const filters = Object.fromEntries(searchParams.entries())

    const validation = validateRequest(equipmentFilterSchema, filters)
    if (!validation.success) {
      return validation.error
    }

    const { type, status, location, area, assignedToId, search } = validation.data

    const where = {
      AND: [
        type ? { type } : {},
        status ? { status } : {},
        location ? { location: { contains: location, mode: 'insensitive' as const } } : {},
        area ? { area: { contains: area, mode: 'insensitive' as const } } : {},
        assignedToId ? { assignedToId } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { serialNumber: { contains: search, mode: 'insensitive' as const } },
                { ip: { contains: search, mode: 'insensitive' as const } },
                { macAddress: { contains: search, mode: 'insensitive' as const } }
              ]
            }
          : {}
      ]
    }

    const items = await prisma.equipment.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        assignedTo: true
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    if (!isProduction()) {
      return NextResponse.json([])
    }

    console.error('Error listando equipos:', error)
    return NextResponse.json({ error: 'Error listando equipos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (isProduction()) {
    const authResult = await requireAllDynamicPermissions(['equipment:create'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const data = await req.json()

    const validation = validateRequest(createEquipmentSchema, data)
    if (!validation.success) {
      return validation.error
    }

    const validatedData = validation.data

    if (validatedData.serialNumber) {
      const existing = await prisma.equipment.findUnique({
        where: { serialNumber: validatedData.serialNumber }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'El número de serie ya existe' },
          { status: 400 }
        )
      }
    }

    const equipment = await prisma.equipment.create({
      data: {
        ...validatedData,
        purchaseDate: validatedData.purchaseDate
          ? new Date(validatedData.purchaseDate)
          : null
      },
      include: {
        assignedTo: true
      }
    })

    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error creando equipo:', error)
    return NextResponse.json({ error: 'Error creando equipo' }, { status: 500 })
  }
}
