import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const isDev = process.env.NODE_ENV !== "production"
    if (!isDev) {
      const ctx = requireAuth(req)
      requireRole(ctx, ["TECHNICIAN", "ADMIN"])
    }
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()

    const payload = {
      name: data?.name ? String(data.name) : undefined,
      type: data?.type ? String(data.type) : undefined,
      status: data?.status ? String(data.status) : undefined,
      location: data?.location === undefined ? undefined : (data.location ? String(data.location) : null),
      area: data?.area === undefined ? undefined : (data.area ? String(data.area) : null),
      serialNumber: data?.serialNumber === undefined ? undefined : (data.serialNumber ? String(data.serialNumber) : null),
      ip: data?.ip === undefined ? undefined : (data.ip ? String(data.ip) : null),
      macAddress: data?.macAddress === undefined ? undefined : (data.macAddress ? String(data.macAddress) : null),
      cpuNumber: data?.cpuNumber === undefined ? undefined : (data.cpuNumber ? String(data.cpuNumber) : null),
      motherboard: data?.motherboard === undefined ? undefined : (data.motherboard ? String(data.motherboard) : null),
      processor: data?.processor === undefined ? undefined : (data.processor ? String(data.processor) : null),
      ram: data?.ram === undefined ? undefined : (data.ram ? String(data.ram) : null),
      storage: data?.storage === undefined ? undefined : (data.storage ? String(data.storage) : null),
      operatingSystem: data?.operatingSystem === undefined ? undefined : (data.operatingSystem ? String(data.operatingSystem) : null),
      brand: data?.brand === undefined ? undefined : (data.brand ? String(data.brand) : null),
      model: data?.model === undefined ? undefined : (data.model ? String(data.model) : null),
      assignedToId: data?.assignedToId === undefined ? undefined : (data.assignedToId ? Number(data.assignedToId) : null),
      storageType: data?.storageType === undefined ? undefined : (data.storageType ? String(data.storageType) : null),
      storageCapacity: data?.storageCapacity === undefined ? undefined : (data.storageCapacity ? String(data.storageCapacity) : null),
      ipAddress: data?.ipAddress === undefined ? undefined : (data.ipAddress ? String(data.ipAddress) : null),
      screenSize: data?.screenSize === undefined ? undefined : (data.screenSize ? String(data.screenSize) : null),
      dvdUnit: data?.dvdUnit === undefined ? undefined : Boolean(data.dvdUnit),
      purchaseDate: data?.purchaseDate === undefined ? undefined : (data.purchaseDate ? new Date(data.purchaseDate) : null),
      notes: data?.notes === undefined ? undefined : (data.notes ? String(data.notes) : null),
    } as const

    // Validaciones simples
    const ipToValidate = payload.ipAddress ?? payload.ip
    if (ipToValidate && !/^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(ipToValidate)) {
      return Response.json({ error: "IP inválida" }, { status: 400 })
    }
    if (payload.macAddress && !/^([0-9A-Fa-f]{2}([:\-])){5}([0-9A-Fa-f]{2})$/.test(payload.macAddress)) {
      return Response.json({ error: "MAC inválida" }, { status: 400 })
    }

    const equipment = await prisma.equipment.update({ where: { id }, data: payload as any })
    return Response.json(equipment)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error actualizando equipo" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"])
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.equipment.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando equipo" }, { status: 500 })
  }
}


