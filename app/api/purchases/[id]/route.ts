import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(req)
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const item = await prisma.purchase.findUnique({ where: { id } })
    if (!item) return new Response("Not Found", { status: 404 })
    return Response.json(item)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo compra" }, { status: 500 })
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["TECHNICIAN", "ADMIN"])
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()
    const updated = await prisma.purchase.update({ where: { id }, data })
    return Response.json(updated)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error actualizando compra" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"])
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.purchase.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando compra" }, { status: 500 })
  }
}


