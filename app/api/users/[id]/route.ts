import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"
import { hashPassword } from "@/lib/auth"

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"])
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const user = await prisma.user.findUnique({ 
      where: { id }, 
      select: { id: true, username: true, role: true, createdAt: true, updatedAt: true } 
    })
    if (!user) return Response.json({ error: "Usuario no encontrado" }, { status: 404 })
    return Response.json(user)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo usuario" }, { status: 500 })
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"])
    const { id: idParam } = await context.params
    const id = Number(idParam)
    const data = await req.json()

    const payload: any = {}
    if (data.username !== undefined) payload.username = String(data.username)
    if (data.role !== undefined) payload.role = String(data.role)
    if (data.password) {
      payload.passwordHash = await hashPassword(String(data.password))
    }

    const user = await prisma.user.update({ 
      where: { id }, 
      data: payload,
      select: { id: true, username: true, role: true, createdAt: true, updatedAt: true }
    })
    return Response.json(user)
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error actualizando usuario" }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"])
    const { id: idParam } = await context.params
    const id = Number(idParam)
    await prisma.user.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando usuario" }, { status: 500 })
  }
}