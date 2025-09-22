import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin
    const { id: idParam } = await context.params
    const userId = Number(idParam)
    const roles = await prisma.userRole.findMany({ where: { userId }, include: { role: true } })
    return Response.json(roles)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error listando roles de usuario" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin
    const { id: idParam } = await context.params
    const userId = Number(idParam)
    const data = await req.json()
    const created = await prisma.userRole.create({ data: { userId, roleId: Number(data?.roleId) } })
    return Response.json(created, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error asignando rol" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin
    const { id: idParam } = await context.params
    const userId = Number(idParam)
    const { searchParams } = new URL(req.url)
    const roleId = Number(searchParams.get("roleId"))
    await prisma.userRole.delete({ where: { userId_roleId: { userId, roleId } } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error removiendo rol" }, { status: 500 })
  }
}


