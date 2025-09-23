import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"
import { hashPassword } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    
    const users = await withDatabase(async (prisma) => {
      // Si es técnico, solo devolver información básica de usuarios con rol TECHNICIAN para dropdowns
      if (ctx.role === "TECHNICIAN") {
        return await prisma.user.findMany({ 
          where: { role: { in: ["TECHNICIAN", "ADMIN"] } },
          select: { id: true, username: true, role: true }
        })
      }
      
      // Si es admin o super_admin, devolver todos los usuarios con toda la información
      requireRole(ctx, ["ADMIN", "SUPER_ADMIN"])
      return await prisma.user.findMany({ 
        select: { id: true, username: true, role: true, createdAt: true } 
      })
    })
    
    return Response.json(users)
  } catch (e) {
    console.error('Error in /api/users GET:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error listando usuarios" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN", "SUPER_ADMIN"])
    const { username, password, role } = await req.json()
    if (!username || !password) return Response.json({ error: "username y password requeridos" }, { status: 400 })
    const passwordHash = await hashPassword(password)
    const user = await withDatabase(async (prisma) => {
      return await prisma.user.create({ data: { username, passwordHash, role } })
    })
    return Response.json({ id: user.id, username: user.username, role: user.role }, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando usuario" }, { status: 500 })
  }
}


