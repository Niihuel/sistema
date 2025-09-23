import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN", "SUPER_ADMIN", "TECHNICIAN"])

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 })
    }

    const role = await withDatabase(async (prisma) => {
      return await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          _count: {
            select: { userRoles: true }
          }
        }
      })
    })

    if (!role) {
      return Response.json({ error: "Rol no encontrado" }, { status: 404 })
    }

    return Response.json(role)
  } catch (e) {
    console.error('Error in /api/roles/[id] GET:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo rol" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["ADMIN", "SUPER_ADMIN"])

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 })
    }

    const data = await req.json()

    const updated = await withDatabase(async (prisma) => {
      // Verificar que el rol existe
      const existing = await prisma.role.findUnique({
        where: { id: roleId }
      })

      if (!existing) {
        throw new Error("Rol no encontrado")
      }

      // No permitir editar roles del sistema
      if (existing.isSystem) {
        throw new Error("No se pueden editar roles del sistema")
      }

      // Si se está cambiando el nombre, verificar que no exista
      if (data.name && data.name.toUpperCase() !== existing.name) {
        const duplicate = await prisma.role.findFirst({
          where: {
            name: data.name.toUpperCase(),
            id: { not: roleId }
          }
        })
        if (duplicate) {
          throw new Error("Ya existe un rol con ese nombre")
        }
      }

      return await prisma.role.update({
        where: { id: roleId },
        data: {
          name: data.name ? data.name.toUpperCase() : undefined,
          displayName: data.displayName || undefined,
          description: data.description !== undefined ? data.description : undefined,
          color: data.color || undefined,
          icon: data.icon || undefined,
          level: data.level !== undefined ? data.level : undefined,
          priority: data.priority !== undefined ? data.priority : undefined,
          permissions: data.permissions !== undefined ? JSON.stringify(data.permissions) : undefined,
          maxUsers: data.maxUsers !== undefined ? data.maxUsers : undefined,
          updatedBy: ctx.username,
          updatedAt: new Date()
        }
      })
    })

    return Response.json(updated)
  } catch (e) {
    console.error('Error in /api/roles/[id] PUT:', e)
    if (e instanceof Response) return e
    const errorMessage = e instanceof Error ? e.message : "Error actualizando rol"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = requireAuth(req)
    requireRole(ctx, ["SUPER_ADMIN"]) // Solo SUPER_ADMIN puede eliminar roles

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return Response.json({ error: "ID inválido" }, { status: 400 })
    }

    await withDatabase(async (prisma) => {
      // Verificar que el rol existe
      const existing = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          _count: {
            select: { userRoles: true }
          }
        }
      })

      if (!existing) {
        throw new Error("Rol no encontrado")
      }

      // No permitir eliminar roles del sistema
      if (existing.isSystem) {
        throw new Error("No se pueden eliminar roles del sistema")
      }

      // No permitir eliminar si hay usuarios con este rol
      if (existing._count.userRoles > 0) {
        throw new Error(`No se puede eliminar el rol. Hay ${existing._count.userRoles} usuarios con este rol`)
      }

      // Soft delete (marcar como eliminado)
      await prisma.role.update({
        where: { id: roleId },
        data: {
          isActive: false,
          deletedAt: new Date(),
          updatedBy: ctx.username
        }
      })
    })

    return Response.json({ success: true })
  } catch (e) {
    console.error('Error in /api/roles/[id] DELETE:', e)
    if (e instanceof Response) return e
    const errorMessage = e instanceof Error ? e.message : "Error eliminando rol"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}