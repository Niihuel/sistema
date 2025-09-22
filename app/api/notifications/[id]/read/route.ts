import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = requireAuth(req)
    const notificationId = Number(params.id)
    
    if (isNaN(notificationId)) {
      return Response.json({ error: "ID de notificación inválido" }, { status: 400 })
    }
    
    const notification = await withDatabase(async (prisma) => {
      // Verificar que la notificación pertenece al usuario
      const notification = await prisma.notification.findFirst({
        where: { 
          id: notificationId,
          userId: ctx.userId 
        }
      })
      
      if (!notification) {
        return null
      }
      
      // Marcar como leída
      return await prisma.notification.update({
        where: { id: notificationId },
        data: { 
          isRead: true,
          readAt: new Date()
        }
      })
    })
    
    if (!notification) {
      return Response.json({ error: "Notificación no encontrada" }, { status: 404 })
    }
    
    return Response.json(notification)
  } catch (e) {
    console.error('Error marking notification as read:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error marcando notificación como leída" }, { status: 500 })
  }
}