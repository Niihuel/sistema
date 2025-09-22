/**
 * Professional Notification Engine
 * Handles automatic notification triggers and management
 * Based on system events and business rules
 */

import { PrismaClient } from '@prisma/client'

export interface NotificationRule {
  id: string
  name: string
  condition: (data: any) => boolean
  type: NotificationType
  priority: NotificationPriority
  message: (data: any) => string
  title: (data: any) => string
  targetRoles?: string[]
  targetUsers?: number[]
  throttle?: number // Minutes between same notifications
}

export type NotificationType = 
  | 'STOCK_LOW' | 'CONSUMABLE_CRITICAL' | 'CONSUMABLE_EMPTY'
  | 'BACKUP_FAILED' | 'BACKUP_OVERDUE' | 'BACKUP_RESTORED'
  | 'TICKET_UNASSIGNED' | 'TICKET_URGENT' | 'TICKET_RESOLVED'
  | 'PRINTER_OFFLINE' | 'PRINTER_SUPPLIES_LOW'
  | 'PURCHASE_APPROVAL_NEEDED' | 'PURCHASE_RECEIVED'
  | 'EQUIPMENT_UNASSIGNED' | 'EQUIPMENT_MAINTENANCE'
  | 'SYSTEM_UPDATE' | 'USER_LOGIN' | 'SECURITY_ALERT'

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export class NotificationEngine {
  private prisma: PrismaClient
  private rules: NotificationRule[]
  private throttleCache: Map<string, Date> = new Map()

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.rules = this.initializeRules()
  }

  private initializeRules(): NotificationRule[] {
    return [
      // ===== CONSUMABLES RULES =====
      {
        id: 'consumable_low_stock',
        name: 'Consumible con Stock Bajo',
        condition: (data) => data.quantityAvailable <= 5 && data.quantityAvailable > 0,
        type: 'STOCK_LOW',
        priority: 'HIGH',
        title: (data) => `Stock Bajo: ${data.itemName}`,
        message: (data) => `Quedan solo ${data.quantityAvailable} unidades de ${data.itemName}. Considera hacer un pedido.`,
        targetRoles: ['ADMIN', 'TECHNICIAN', 'MANAGER'],
        throttle: 60 // 1 hora
      },
      {
        id: 'consumable_empty',
        name: 'Consumible Agotado',
        condition: (data) => data.quantityAvailable === 0 || data.status === 'EMPTY',
        type: 'CONSUMABLE_EMPTY',
        priority: 'URGENT',
        title: (data) => `⚠️ AGOTADO: ${data.itemName}`,
        message: (data) => `El consumible ${data.itemName} está completamente agotado. Requiere atención inmediata.`,
        targetRoles: ['ADMIN', 'TECHNICIAN'],
        throttle: 30
      },
      {
        id: 'consumable_critical',
        name: 'Estado Crítico de Consumible',
        condition: (data) => data.status === 'CRITICAL',
        type: 'CONSUMABLE_CRITICAL',
        priority: 'URGENT',
        title: (data) => `🚨 CRÍTICO: ${data.itemName}`,
        message: (data) => `El consumible ${data.itemName} está en estado crítico y requiere atención inmediata.`,
        targetRoles: ['ADMIN', 'TECHNICIAN'],
        throttle: 15
      },

      // ===== BACKUP RULES =====
      {
        id: 'backup_failed',
        name: 'Backup Fallido',
        condition: (data) => data.status === 'FAILED' || data.status === 'ERROR',
        type: 'BACKUP_FAILED',
        priority: 'HIGH',
        title: (data) => `❌ Backup Fallido: ${data.backupName}`,
        message: (data) => `El backup "${data.backupName}" ha fallado. Revisa los logs para más detalles.`,
        targetRoles: ['ADMIN'],
        throttle: 60
      },
      {
        id: 'backup_overdue',
        name: 'Backup Vencido',
        condition: (data) => {
          if (data.status !== 'PENDING') return false
          const hoursDiff = (Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60)
          return hoursDiff > 24
        },
        type: 'BACKUP_OVERDUE',
        priority: 'HIGH',
        title: (data) => `⏰ Backup Vencido: ${data.backupName}`,
        message: (data) => `El backup "${data.backupName}" lleva más de 24 horas pendiente.`,
        targetRoles: ['ADMIN'],
        throttle: 120
      },

      // ===== TICKET RULES =====
      {
        id: 'ticket_unassigned',
        name: 'Ticket Sin Asignar',
        condition: (data) => {
          if (data.technicianId || data.status !== 'OPEN') return false
          const hoursDiff = (Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60)
          return hoursDiff > 2
        },
        type: 'TICKET_UNASSIGNED',
        priority: 'HIGH',
        title: (data) => `📋 Ticket Sin Asignar: #${data.id}`,
        message: (data) => `El ticket "${data.title}" lleva más de 2 horas sin asignar.`,
        targetRoles: ['ADMIN', 'TECHNICIAN', 'SUPERVISOR'],
        throttle: 60
      },
      {
        id: 'ticket_urgent',
        name: 'Ticket Urgente',
        condition: (data) => data.priority === 'URGENT' || data.priority === 'HIGH',
        type: 'TICKET_URGENT',
        priority: 'URGENT',
        title: (data) => `🚨 Ticket ${data.priority}: #${data.id}`,
        message: (data) => `Ticket urgente "${data.title}" requiere atención inmediata.`,
        targetRoles: ['ADMIN', 'TECHNICIAN'],
        throttle: 15
      },

      // ===== PRINTER RULES =====
      {
        id: 'printer_offline',
        name: 'Impresora Desconectada',
        condition: (data) => data.status !== 'ACTIVE',
        type: 'PRINTER_OFFLINE',
        priority: 'NORMAL',
        title: (data) => `🖨️ Impresora Offline: ${data.model}`,
        message: (data) => `La impresora ${data.model} (${data.area || 'Sin área'}) está desconectada.`,
        targetRoles: ['ADMIN', 'TECHNICIAN'],
        throttle: 180
      },

      // ===== PURCHASE RULES =====
      {
        id: 'purchase_approval_needed',
        name: 'Compra Pendiente de Aprobación',
        condition: (data) => {
          if (data.status !== 'PENDING') return false
          const daysDiff = (Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          return daysDiff > 3
        },
        type: 'PURCHASE_APPROVAL_NEEDED',
        priority: 'NORMAL',
        title: (data) => `💰 Aprobación Pendiente: ${data.itemName}`,
        message: (data) => `La solicitud de compra "${data.itemName}" lleva más de 3 días pendiente de aprobación.`,
        targetRoles: ['ADMIN', 'MANAGER'],
        throttle: 1440 // 24 horas
      }
    ]
  }

  /**
   * Evaluates all rules against data and creates notifications
   */
  async processEntity(entityType: string, data: any): Promise<void> {
    for (const rule of this.rules) {
      try {
        if (rule.condition(data)) {
          await this.createNotificationIfNotThrottled(rule, data, entityType)
        }
      } catch (error) {
        console.error(`Error processing rule ${rule.id}:`, error)
      }
    }
  }

  /**
   * Creates notification respecting throttle rules
   */
  private async createNotificationIfNotThrottled(
    rule: NotificationRule, 
    data: any, 
    entityType: string
  ): Promise<void> {
    const throttleKey = `${rule.id}_${entityType}_${data.id}`
    const lastNotification = this.throttleCache.get(throttleKey)
    
    if (lastNotification && rule.throttle) {
      const minutesSince = (Date.now() - lastNotification.getTime()) / (1000 * 60)
      if (minutesSince < rule.throttle) {
        console.log(`Throttling notification ${rule.id} for ${entityType}:${data.id}`)
        return
      }
    }

    // Update throttle cache
    this.throttleCache.set(throttleKey, new Date())

    // Get target users
    const targetUsers = await this.getTargetUsers(rule.targetRoles, rule.targetUsers)

    // Create notifications for each target user
    for (const userId of targetUsers) {
      await this.createNotification({
        userId,
        type: rule.type,
        title: rule.title(data),
        message: rule.message(data),
        priority: rule.priority,
        data: { entityType, entityId: data.id, ruleId: rule.id }
      })
    }

    console.log(`✅ Created ${rule.type} notification for ${targetUsers.length} users`)
  }

  /**
   * Get users that should receive notifications based on roles
   */
  private async getTargetUsers(roles?: string[], specificUsers?: number[]): Promise<number[]> {
    const userIds: number[] = []

    if (specificUsers) {
      userIds.push(...specificUsers)
    }

    if (roles && roles.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { role: { in: roles } },
        select: { id: true }
      })
      userIds.push(...users.map(u => u.id))
    }

    // Remove duplicates
    return [...new Set(userIds)]
  }

  /**
   * Creates a single notification
   */
  private async createNotification(notification: {
    userId: number
    type: NotificationType
    title: string
    message: string
    priority: NotificationPriority
    data?: any
  }): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        data: notification.data ? JSON.stringify(notification.data) : null,
        isRead: false
      }
    })
  }

  /**
   * Bulk process entities for scheduled checks
   */
  async runScheduledChecks(): Promise<void> {
    console.log('🔄 Running scheduled notification checks...')

    try {
      // Check consumables
      const consumables = await this.prisma.consumable.findMany()
      for (const consumable of consumables) {
        await this.processEntity('consumable', consumable)
      }

      // Check backups
      const backups = await this.prisma.backupLog.findMany({
        where: { 
          OR: [
            { status: 'FAILED' },
            { status: 'PENDING' }
          ]
        }
      })
      for (const backup of backups) {
        await this.processEntity('backup', backup)
      }

      // Check tickets
      const tickets = await this.prisma.ticket.findMany({
        where: { status: { in: ['OPEN', 'ASSIGNED'] } }
      })
      for (const ticket of tickets) {
        await this.processEntity('ticket', ticket)
      }

      // Check printers
      const printers = await this.prisma.printer.findMany()
      for (const printer of printers) {
        await this.processEntity('printer', printer)
      }

      // Check purchase requests
      const purchases = await this.prisma.purchaseRequest.findMany({
        where: { status: 'PENDING' }
      })
      for (const purchase of purchases) {
        await this.processEntity('purchase', purchase)
      }

      console.log('✅ Scheduled notification checks completed')
    } catch (error) {
      console.error('❌ Error in scheduled checks:', error)
    }
  }

  /**
   * Clean up old read notifications
   */
  async cleanupOldNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const deletedCount = await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        readAt: { lt: cutoffDate }
      }
    })

    console.log(`🧹 Cleaned up ${deletedCount.count} old notifications`)
  }
}

// Singleton instance
let notificationEngine: NotificationEngine | null = null

export function getNotificationEngine(prisma: PrismaClient): NotificationEngine {
  if (!notificationEngine) {
    notificationEngine = new NotificationEngine(prisma)
  }
  return notificationEngine
}
