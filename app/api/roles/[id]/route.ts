import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()
    const role = await prisma.role.update({ where: { id }, data: { name: String(data?.name ?? "") } })
    return Response.json(role)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error actualizando rol" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.role.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando rol" }, { status: 500 })
  }
}


