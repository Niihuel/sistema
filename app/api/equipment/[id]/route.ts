import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAllDynamicPermissions } from '@/lib/middleware'

const isProduction = () => process.env.NODE_ENV === 'production'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (isProduction()) {
    const authResult = await requireAllDynamicPermissions(['equipment:edit'])(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()

    const payload: Record<string, unknown> = {}
    if (data?.name !== undefined) payload.name = String(data.name)
    if (data?.type !== undefined) payload.type = String(data.type)
    if (data?.status !== undefined) payload.status = String(data.status)
    if (data?.location !== undefined) payload.location = data.location ? String(data.location) : null
    if (data?.area !== undefined) payload.area = data.area ? String(data.area) : null
    if (data?.serialNumber !== undefined) payload.serialNumber = data.serialNumber ? String(data.serialNumber) : null
    if (data?.ip !== undefined) payload.ip = data.ip ? String(data.ip) : null
    if (data?.macAddress !== undefined) payload.macAddress = data.macAddress ? String(data.macAddress) : null
    if (data?.cpuNumber !== undefined) payload.cpuNumber = data.cpuNumber ? String(data.cpuNumber) : null
    if (data?.motherboard !== undefined) payload.motherboard = data.motherboard ? String(data.motherboard) : null
    if (data?.processor !== undefined) payload.processor = data.processor ? String(data.processor) : null
    if (data?.ram !== undefined) payload.ram = data.ram ? String(data.ram) : null
    if (data?.storage !== undefined) payload.storage = data.storage ? String(data.storage) : null
    if (data?.operatingSystem !== undefined) payload.operatingSystem = data.operatingSystem ? String(data.operatingSystem) : null
    if (data?.brand !== undefined) payload.brand = data.brand ? String(data.brand) : null
    if (data?.model !== undefined) payload.model = data.model ? String(data.model) : null
    if (data?.assignedToId !== undefined) payload.assignedToId = data.assignedToId ? Number(data.assignedToId) : null
    if (data?.storageType !== undefined) payload.storageType = data.storageType ? String(data.storageType) : null
    if (data?.storageCapacity !== undefined) payload.storageCapacity = data.storageCapacity ? String(data.storageCapacity) : null
    if (data?.ipAddress !== undefined) payload.ipAddress = data.ipAddress ? String(data.ipAddress) : null
    if (data?.screenSize !== undefined) payload.screenSize = data.screenSize ? String(data.screenSize) : null
    if (data?.dvdUnit !== undefined) payload.dvdUnit = Boolean(data.dvdUnit)
    if (data?.purchaseDate !== undefined) payload.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null
    if (data?.notes !== undefined) payload.notes = data.notes ? String(data.notes) : null

    const ipToValidate = (payload.ipAddress as string | null) ?? (payload.ip as string | null)
    if (ipToValidate && !/^(25[0-5]|2[0-4]\d|[01]?\d\d?)(\.(25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/.test(ipToValidate)) {
      return NextResponse.json({ error: 'IP inválida' }, { status: 400 })
    }

    if (payload.macAddress && !/^([0-9A-Fa-f]{2}([:\-])){5}([0-9A-Fa-f]{2})$/.test(payload.macAddress as string)) {
      return NextResponse.json({ error: 'MAC inválida' }, { status: 400 })
    }

    const equipment = await prisma.equipment.update({ where: { id }, data: payload })
    return NextResponse.json(equipment)
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error actualizando equipo:', error)
    return NextResponse.json({ error: 'Error actualizando equipo' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAllDynamicPermissions(['equipment:delete'])(req)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.equipment.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof NextResponse) {
      return error
    }

    console.error('Error eliminando equipo:', error)
    return NextResponse.json({ error: 'Error eliminando equipo' }, { status: 500 })
  }
}
