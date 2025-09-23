import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/middleware"
import { getNotificationEngine } from "@/lib/notification-engine"
import { getNotificationTriggers } from "@/lib/notification-triggers"

/**
 * Manual notification check endpoint for testing and maintenance
 * PUT /api/notifications/check - Run all scheduled checks
 * POST /api/notifications/check - Create test notifications
 */

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Only admins can trigger manual checks
    
    console.log(`🔄 Manual notification check triggered by user ${ctx.userId}`)
    
    // Run both engine checks and maintenance
    const engine = getNotificationEngine(prisma)
    const triggers = getNotificationTriggers(prisma)
    
    await Promise.all([
      engine.runScheduledChecks(),
      triggers.runMaintenanceCheck()
    ])
    
    // Clean up old notifications (older than 30 days)
    await engine.cleanupOldNotifications(30)
    
    return Response.json({ 
      message: "Verificación de notificaciones completada",
      timestamp: new Date().toISOString()
    })
  } catch (e) {
    console.error('Error in manual notification check:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error ejecutando verificación" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req)
    requireRole(ctx, ["ADMIN"]) // Only admins can create test notifications
    
    const { type = 'test', createSample = false } = await req.json()
    
    const triggers = getNotificationTriggers(prisma)
    
    if (createSample) {
      // Create sample notifications for testing
      await triggers.createSystemNotification(
        'SYSTEM_TEST',
        '🧪 Notificación de Prueba',
        'Esta es una notificación de prueba del sistema. Puedes ignorarla de forma segura.',
        'NORMAL',
        ['ADMIN', 'TECHNICIAN']
      )
      
      await triggers.createSystemNotification(
        'STOCK_LOW',
        '📦 Test: Stock Bajo',
        'Esta es una simulación de stock bajo para probar el sistema de notificaciones.',
        'HIGH',
        ['ADMIN', 'TECHNICIAN']
      )
      
      await triggers.createSystemNotification(
        'BACKUP_FAILED',
        '💾 Test: Backup Fallido',
        'Esta es una simulación de backup fallido para probar el sistema de notificaciones.',
        'URGENT',
        ['ADMIN']
      )
      
      return Response.json({ 
        message: "Notificaciones de prueba creadas",
        count: 3
      })
    }
    
    if (type === 'maintenance') {
      await triggers.runMaintenanceCheck()
      return Response.json({ message: "Verificación de mantenimiento ejecutada" })
    }
    
    // Default test notification
    await prisma.notification.create({
      data: {
        userId: ctx.userId,
        type: 'SYSTEM_TEST',
        title: '🔔 Test de Notificación',
        message: 'Esta es una notificación de prueba creada manualmente.',
        priority: 'NORMAL',
        isRead: false
      }
    })
    
    return Response.json({ message: "Notificación de prueba creada" })
  } catch (e) {
    console.error('Error creating test notification:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error creando notificación de prueba" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req)
    requireRole(ctx, ["ADMIN"])
    
    // Get notification system status
    const stats = await prisma.notification.groupBy({
      by: ['type', 'priority'],
      _count: { _all: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
    
    const unreadStats = await prisma.notification.groupBy({
      by: ['priority'],
      _count: { _all: true },
      where: {
        isRead: false
      }
    })
    
    // Count critical items that should have notifications
    const [
      lowStockConsumables,
      overdueTickets,
      failedBackups,
      offlinePrinters
    ] = await Promise.all([
      prisma.consumable.count({
        where: { quantityAvailable: { lte: 5 } }
      }),
      prisma.ticket.count({
        where: {
          status: { in: ['OPEN', 'ASSIGNED'] },
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.backupLog.count({
        where: {
          status: 'FAILED',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.printer.count({
        where: { status: { not: 'ACTIVE' } }
      })
    ])
    
    return Response.json({
      stats: {
        last24Hours: stats,
        unreadByPriority: unreadStats,
        criticalItems: {
          lowStockConsumables,
          overdueTickets,
          failedBackups,
          offlinePrinters
        }
      },
      systemHealth: {
        status: 'operational',
        lastCheck: new Date().toISOString()
      }
    })
  } catch (e) {
    console.error('Error getting notification stats:', e)
    if (e instanceof Response) return e
    return Response.json({ error: "Error obteniendo estadísticas" }, { status: 500 })
  }
}

