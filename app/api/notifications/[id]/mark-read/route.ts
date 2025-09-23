import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = requireAuth(req)
    const { id } = await context.params
    const notificationId = parseInt(id)

    if (isNaN(notificationId)) {
      return Response.json({ error: "ID de notificación inválido" }, { status: 400 })
    }

    const notification = await withDatabase(async (prisma) => {
      // Verificar que la notificación pertenece al usuario
      const existingNotification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: ctx.userId
        }
      })

      if (!existingNotification) {
        throw new Error("Notificación no encontrada")
      }

      // Marcar como leída
      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })
    })

    return Response.json(notification)
  } catch (e) {
    if (e instanceof Response) return e
    if (e instanceof Error && e.message === "Notificación no encontrada") {
      return Response.json({ error: e.message }, { status: 404 })
    }
    return Response.json({ error: "Error actualizando notificación" }, { status: 500 })
  }
}