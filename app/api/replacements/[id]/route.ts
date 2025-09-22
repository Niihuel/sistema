import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV === "production") {
      requireAuth(req)
    }
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const replacement = await prisma.replacement.findUnique({ 
      where: { id },
      include: { printer: true, consumable: true }
    })
    if (!replacement) return Response.json({ error: "Reemplazo no encontrado" }, { status: 404 })
    return Response.json(replacement)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo reemplazo" }, { status: 500 })
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
    if (data.printerId !== undefined) payload.printerId = Number(data.printerId)
    if (data.consumableId !== undefined) payload.consumableId = Number(data.consumableId)
    if (data.replacementDate !== undefined) payload.replacementDate = new Date(data.replacementDate)
    if (data.completionDate !== undefined) payload.completionDate = data.completionDate ? new Date(data.completionDate) : null
    if (data.rendimientoDays !== undefined) payload.rendimientoDays = data.rendimientoDays ? Number(data.rendimientoDays) : null
    if (data.notes !== undefined) payload.notes = String(data.notes) || null

    const replacement = await prisma.replacement.update({ where: { id }, data: payload })
    return Response.json(replacement)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error actualizando reemplazo" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (process.env.NODE_ENV === "production") {
      requireAuth(req)
    }
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.replacement.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando reemplazo" }, { status: 500 })
  }
}