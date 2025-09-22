import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["TECHNICIAN", "ADMIN"]) // lectura para staff
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page") || 1)
    const perPage = Math.min(Number(searchParams.get("perPage") || 20), 100)
    const q = searchParams.get("q") || undefined
    const where = q ? { name: { contains: q, mode: "insensitive" as const } } : {}
    const [total, items] = await Promise.all([
      prisma.catalogArea.count({ where }),
      prisma.catalogArea.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { name: "asc" } }),
    ])
    return Response.json({ total, page, perPage, items })
  } catch (e) {
    if (e instanceof Response) return e
    // En desarrollo, si la DB no está disponible, devolvemos una respuesta vacía para no romper la UI
    if (process.env.NODE_ENV !== "production") {
      return Response.json({ total: 0, page: 1, perPage: 20, items: [] })
    }
    return Response.json({ error: "Error listando áreas" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // crear solo admin
    const { name } = await req.json()
    if (!name || String(name).trim().length < 2) return Response.json({ error: "Nombre de área inválido" }, { status: 400 })
    const created = await prisma.catalogArea.create({ data: { name: String(name).trim() } })
    return Response.json(created, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando área" }, { status: 500 })
  }
}


