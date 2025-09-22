import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV === "production") {
      requireAuth(req)
    }
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const consumable = await prisma.consumable.findUnique({ 
      where: { id },
      include: { printer: true }
    })
    if (!consumable) return Response.json({ error: "Consumible no encontrado" }, { status: 404 })
    return Response.json(consumable)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo consumible" }, { status: 500 })
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV === "production") {
      requireAuth(req)
    }
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()

    const payload: any = {}
    if (data.itemName !== undefined) payload.itemName = String(data.itemName)
    if (data.type !== undefined) payload.type = String(data.type)
    if (data.printerId !== undefined) payload.printerId = data.printerId ? Number(data.printerId) : null
    if (data.stock !== undefined) payload.stock = Number(data.stock)
    if (data.minStock !== undefined) payload.minStock = Number(data.minStock) || null
    if (data.supplier !== undefined) payload.supplier = String(data.supplier) || null
    if (data.partNumber !== undefined) payload.partNumber = String(data.partNumber) || null
    if (data.notes !== undefined) payload.notes = String(data.notes) || null

    const consumable = await prisma.consumable.update({ where: { id }, data: payload })
    return Response.json(consumable)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error actualizando consumible" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV === "production") {
      requireAuth(req)
    }
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.consumable.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando consumible" }, { status: 500 })
  }
}