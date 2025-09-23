import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN", "SUPER_ADMIN", "TECHNICIAN"])

    const roles = await withDatabase(async (prisma) => {
      return await prisma.role.findMany({
        where: {
          isActive: true,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          color: true,
          icon: true,
          level: true,
          priority: true,
          isSystem: true,
          permissions: true,
          maxUsers: true,
          _count: {
            select: { userRoles: true }
          },
          createdAt: true,
          updatedAt: true
        },
        orderBy: [
          { level: 'desc' },
          { priority: 'asc' },
          { name: 'asc' }
        ]
      })
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
    requireRole(ctx, ["ADMIN", "SUPER_ADMIN"])

    const data = await req.json()

    // Validación básica
    if (!data.name || !data.displayName) {
      return Response.json({ error: "Nombre y nombre para mostrar son requeridos" }, { status: 400 })
    }

    const created = await withDatabase(async (prisma) => {
      // Verificar si ya existe un rol con ese nombre
      const existing = await prisma.role.findFirst({
        where: { name: data.name.toUpperCase() }
      })

      if (existing) {
        throw new Error("Ya existe un rol con ese nombre")
      }

      return await prisma.role.create({
        data: {
          name: data.name.toUpperCase(),
          displayName: data.displayName,
          description: data.description || null,
          color: data.color || '#6B7280',
          icon: data.icon || 'user',
          level: data.level || 10,
          priority: data.priority || 500,
          isSystem: false,
          isActive: true,
          permissions: data.permissions ? JSON.stringify(data.permissions) : null,
          maxUsers: data.maxUsers || null,
          createdBy: ctx.username
        }
      })
    })

    return Response.json(created, { status: 201 })
  } catch (e) {
    console.error('Error in /api/roles POST:', e)
    if (e instanceof Response) return e
    const errorMessage = e instanceof Error ? e.message : "Error creando rol"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}


