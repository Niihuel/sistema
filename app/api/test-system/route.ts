import { NextRequest } from "next/server"
import { withDatabase } from "@/lib/prisma"
import { requireAuth } from "@/lib/middleware"
import { getNotificationEngine } from "@/lib/notification-engine"
import { getNotificationTriggers } from "@/lib/notification-triggers"

/**
 * System Test Endpoint - Verify all components are working
 * GET /api/test-system - Run comprehensive system tests
 */

export async function GET(req: NextRequest) {
  try {
    const ctx = requireAuth(req)
    
    const results = await withDatabase(async (prisma) => {
      const tests = {
        authSystem: false,
        notificationEngine: false,
        employeeUserRelation: false,
        technicanEndpoint: false,
        notificationCreation: false
      }
      
      // Test 1: Auth system (already passed if we get here)
      tests.authSystem = true
      
      // Test 2: Employee-User relationship
      try {
        const usersWithEmployees = await prisma.user.findMany({
          include: { employee: true },
          take: 3
        })
        tests.employeeUserRelation = usersWithEmployees.length > 0 && 
                                     usersWithEmployees.some(u => u.employee !== null)
      } catch (error) {
        console.error('Employee-User relation test failed:', error)
      }
      
      // Test 3: Notification engine
      try {
        const engine = getNotificationEngine(prisma)
        const triggers = getNotificationTriggers(prisma)
        
        // Create a test notification
        await triggers.createSystemNotification(
          'SYSTEM_TEST',
          '🧪 Test del Sistema',
          'Verificación automática del sistema de notificaciones completada exitosamente.',
          'NORMAL',
          [ctx.role]
        )
        
        tests.notificationEngine = true
        tests.notificationCreation = true
      } catch (error) {
        console.error('Notification system test failed:', error)
      }
      
      // Test 4: Technician endpoint
      try {
        const technicians = await prisma.user.findMany({
          where: { 
            role: { in: ["TECHNICIAN", "ADMIN"] },
            employee: { isNot: null }
          },
          include: { employee: true },
          take: 5
        })
        tests.technicanEndpoint = technicians.length > 0
      } catch (error) {
        console.error('Technician endpoint test failed:', error)
      }
      
      // System status
      const systemStats = {
        totalUsers: await prisma.user.count(),
        totalEmployees: await prisma.employee.count(),
        usersWithEmployees: await prisma.user.count({ where: { employeeId: { not: null } } }),
        totalNotifications: await prisma.notification.count(),
        unreadNotifications: await prisma.notification.count({ where: { isRead: false } }),
        activeRoles: await prisma.role.count(),
        totalPermissions: await prisma.permission.count()
      }
      
      return { tests, systemStats }
    })
    
    const overallHealth = Object.values(results.tests).every(test => test === true)
    
    return Response.json({
      status: overallHealth ? 'HEALTHY' : 'PARTIAL',
      timestamp: new Date().toISOString(),
      testResults: results.tests,
      systemStats: results.systemStats,
      recommendations: overallHealth ? [] : [
        !results.tests.employeeUserRelation && 'Ejecutar migración Employee-User',
        !results.tests.notificationEngine && 'Verificar configuración del motor de notificaciones',
        !results.tests.technicanEndpoint && 'Verificar datos de técnicos en base de datos'
      ].filter(Boolean)
    })
  } catch (e) {
    console.error('System test failed:', e)
    if (e instanceof Response) return e
    return Response.json({ 
      status: 'ERROR',
      error: "Error ejecutando pruebas del sistema",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
