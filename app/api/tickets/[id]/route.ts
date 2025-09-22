import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(req)
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()
    const ticket = await prisma.ticket.update({ where: { id }, data })
    return Response.json(ticket)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error actualizando ticket" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(req)
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.ticket.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando ticket" }, { status: 500 })
  }
}


