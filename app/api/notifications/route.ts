import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { getNotificationEngine } from "@/lib/notification-engine"

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    const { searchParams } = new URL(req.url)
    
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100)
    const offset = Number(searchParams.get("offset") || 0)
    const unreadOnly = searchParams.get("unread") === "true"
    const type = searchParams.get("type")
    
    const notifications = await withDatabase(async (prisma) => {
      const where: any = { userId: ctx.userId }
      
      if (unreadOnly) {
        where.isRead = false
      }
      
      if (type) {
        where.type = type
      }
      
      const [notifications, totalCount, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: [
            { isRead: 'asc' },  // Unread first
            { priority: 'desc' }, // Higher priority first
            { createdAt: 'desc' } // Newest first
          ],
          take: limit,
          skip: offset,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ 
          where: { userId: ctx.userId, isRead: false } 
        })
      ])
      
      return {
        notifications,
        totalCount,
        unreadCount,
        hasMore: totalCount > offset + limit
      }
    })
    
    return Response.json(notifications)
  } catch (e) {
    console.error('Error in /api/notifications GET:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo notificaciones" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    const { type, title, message, priority = 'NORMAL', data } = await req.json()
    
    if (!type || !title) {
      return Response.json({ error: "type y title son requeridos" }, { status: 400 })
    }

    const notification = await withDatabase(async (prisma) => {
      return await prisma.notification.create({
        data: {
          userId: ctx.userId,
          type: String(type),
          title: String(title),
          message: message ? String(message) : null,
          priority: String(priority),
          data: data ? JSON.stringify(data) : null,
          isRead: false
        }
      })
    })
    
    return Response.json(notification, { status: 201 })
  } catch (e) {
    console.error('Error in /api/notifications POST:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando notificación" }, { status: 500 })
  }
}

// Trigger manual notification check for development/testing
export async function PUT(req: NextRequest) {
  try {
    requireAuth(req)
    
    await withDatabase(async (prisma) => {
      const engine = getNotificationEngine(prisma)
      await engine.runScheduledChecks()
    })
    
    return Response.json({ message: "Verificación de notificaciones ejecutada" })
  } catch (e) {
    console.error('Error in notification check:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error ejecutando verificación" }, { status: 500 })
  }
}