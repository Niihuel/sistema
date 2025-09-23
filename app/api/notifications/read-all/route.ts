import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req)
    
    const result = await withDatabase(async (prisma) => {
      // Marcar todas las notificaciones no leídas del usuario como leídas
      return await prisma.notification.updateMany({
        where: { 
          userId: ctx.userId,
          isRead: false
        },
        data: { 
          isRead: true,
          readAt: new Date()
        }
      })
    })
    
    return Response.json({ 
      message: "Todas las notificaciones marcadas como leídas",
      updated: result.count
    })
  } catch (e) {
    console.error('Error marking all notifications as read:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error marcando todas las notificaciones como leídas" }, { status: 500 })
  }
}
