import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // editar solo admin
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const { name } = await req.json()
    const updated = await prisma.catalogArea.update({ where: { id }, data: { name: String(name).trim() } })
    return Response.json(updated)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error actualizando área" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // eliminar solo admin
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.catalogArea.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando área" }, { status: 500 })
  }
}


