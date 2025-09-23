import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin puede eliminar permisos
    const { id } = await context.params
    const permissionId = Number(id)
    
    if (isNaN(permissionId)) {
      return Response.json({ error: "ID de permiso inválido" }, { status: 400 })
    }
    
    await withDatabase(async (prisma) => {
      // Verificar que el permiso existe
      const permission = await prisma.permission.findUnique({
        where: { id: permissionId }
      })
      
      if (!permission) {
        throw new Response("Permiso no encontrado", { status: 404 })
      }
      
      // Eliminar el permiso
      await prisma.permission.delete({
        where: { id: permissionId }
      })
    })
    
    return Response.json({ message: "Permiso eliminado correctamente" })
  } catch (e) {
    console.error('Error in /api/permissions/[id] DELETE:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error eliminando permiso" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Solo admin puede ver permisos específicos
    const { id } = await context.params
    const permissionId = Number(id)
    
    if (isNaN(permissionId)) {
      return Response.json({ error: "ID de permiso inválido" }, { status: 400 })
    }
    
    const permission = await withDatabase(async (prisma) => {
      return await prisma.permission.findUnique({
        where: { id: permissionId },
        include: {
          role: true
        }
      })
    })
    
    if (!permission) {
      return Response.json({ error: "Permiso no encontrado" }, { status: 404 })
    }
    
    return Response.json(permission)
  } catch (e) {
    console.error('Error in /api/permissions/[id] GET:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo permiso" }, { status: 500 })
  }
}