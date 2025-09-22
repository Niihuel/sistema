import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin puede ver todos los permisos
    
    const permissions = await withDatabase(async (prisma) => {
      return await prisma.permission.findMany({
        include: {
          role: true
        },
        orderBy: {
          roleId: 'asc'
        }
      })
    })
    
    return Response.json(permissions)
  } catch (e) {
    console.error('Error in /api/permissions GET:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error listando permisos" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin puede crear permisos
    
    const { roleId, resource, level } = await req.json()
    
    if (!roleId || !resource || !level) {
      return Response.json({ error: "roleId, resource y level son requeridos" }, { status: 400 })
    }

    // Validar que el level sea válido
    if (!['READ', 'WRITE', 'ADMIN'].includes(level)) {
      return Response.json({ error: "Level debe ser READ, WRITE o ADMIN" }, { status: 400 })
    }
    
    const permission = await withDatabase(async (prisma) => {
      // Verificar que el rol existe
      const role = await prisma.role.findUnique({ where: { id: Number(roleId) } })
      if (!role) {
        throw new Error("Rol no encontrado")
      }
      
      // Verificar que no existe ya el mismo permiso
      const existingPermission = await prisma.permission.findUnique({
        where: {
          roleId_resource_level: {
            roleId: Number(roleId),
            resource: String(resource),
            level: String(level)
          }
        }
      })
      
      if (existingPermission) {
        throw new Error("Este permiso ya existe para el rol")
      }
      
      return await prisma.permission.create({
        data: {
          roleId: Number(roleId),
          resource: String(resource),
          level: String(level)
        },
        include: {
          role: true
        }
      })
    })
    
    return Response.json(permission, { status: 201 })
  } catch (e) {
    console.error('Error in /api/permissions POST:', e)
    if (e instanceof Response) return e
    const errorMessage = e instanceof Error ? e.message : "Error creando permiso"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}