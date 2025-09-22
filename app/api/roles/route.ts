import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    
    const roles = await withDatabase(async (prisma) => {
      if (ctx.role === "TECHNICIAN") {
        // Los técnicos solo pueden ver roles básicos sin permisos detallados
        return await prisma.role.findMany({ 
          select: { id: true, name: true, createdAt: true, updatedAt: true } 
        })
      }
      
      // Los admins pueden ver todo incluyendo permisos
      requireRole(ctx, ["ADMIN"])
      return await prisma.role.findMany({ include: { permissions: true } })
    })
    
    return Response.json(roles)
  } catch (e) {
    console.error('Error in /api/roles GET:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error listando roles" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin crea
    const data = await req.json()
    const created = await withDatabase(async (prisma) => {
      return await prisma.role.create({ data: { name: String(data?.name ?? "").toUpperCase() } })
    })
    return Response.json(created, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando rol" }, { status: 500 })
  }
}


