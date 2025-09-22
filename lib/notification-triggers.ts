/**
 * Notification Triggers - Integrates with APIs to automatically generate notifications
 * This module handles automatic notification creation when entities change
 */

import { PrismaClient } from '@prisma/client'
import { getNotificationEngine } from './notification-engine'

export class NotificationTriggers {
  private prisma: PrismaClient
  private engine: any

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.engine = getNotificationEngine(prisma)
  }

  /**
   * Trigger notifications for consumable changes
   */
  async onConsumableChange(consumable: any, action: 'CREATE' | 'UPDATE' | 'DELETE') {
    if (action === 'DELETE') return

    try {
      await this.engine.processEntity('consumable', consumable)
      console.log(`✅ Processed consumable notifications for ${consumable.itemName}`)
    } catch (error) {
      console.error('Error processing consumable notifications:', error)
    }
  }

  /**
   * Trigger notifications for ticket changes
   */
  async onTicketChange(ticket: any, action: 'CREATE' | 'UPDATE' | 'DELETE') {
    if (action === 'DELETE') return

    try {
      await this.engine.processEntity('ticket', ticket)
      
      // Special handling for ticket assignments
      if (action === 'UPDATE' && ticket.technicianId) {
        // Notify the assigned technician
        await this.prisma.notification.create({
          data: {
            userId: ticket.technicianId,
            type: 'TICKET_ASSIGNED',
            title: `Ticket Asignado: #${ticket.id}`,
            message: `Te han asignado el ticket "${ticket.title}". Prioridad: ${ticket.priority}`,
            priority: ticket.priority === 'URGENT' ? 'URGENT' : 'NORMAL',
            data: JSON.stringify({ ticketId: ticket.id, entityType: 'ticket' }),
            isRead: false
          }
        })
      }
      
      console.log(`✅ Processed ticket notifications for #${ticket.id}`)
    } catch (error) {
      console.error('Error processing ticket notifications:', error)
    }
  }

  /**
   * Trigger notifications for backup changes
   */
  async onBackupChange(backup: any, action: 'CREATE' | 'UPDATE' | 'DELETE') {
    if (action === 'DELETE') return

    try {
      await this.engine.processEntity('backup', backup)
      console.log(`✅ Processed backup notifications for ${backup.backupName}`)
    } catch (error) {
      console.error('Error processing backup notifications:', error)
    }
  }

  /**
   * Trigger notifications for printer changes
   */
  async onPrinterChange(printer: any, action: 'CREATE' | 'UPDATE' | 'DELETE') {
    if (action === 'DELETE') return

    try {
      await this.engine.processEntity('printer', printer)
      console.log(`✅ Processed printer notifications for ${printer.model}`)
    } catch (error) {
      console.error('Error processing printer notifications:', error)
    }
  }

  /**
   * Trigger notifications for purchase request changes
   */
  async onPurchaseRequestChange(purchase: any, action: 'CREATE' | 'UPDATE' | 'DELETE') {
    if (action === 'DELETE') return

    try {
      await this.engine.processEntity('purchase', purchase)
      
      // Special notifications for purchase status changes
      if (action === 'UPDATE') {
        if (purchase.status === 'APPROVED' && purchase.requestorId) {
          // Notify requestor of approval
          await this.prisma.notification.create({
            data: {
              userId: purchase.requestorId,
              type: 'PURCHASE_APPROVED',
              title: `Compra Aprobada: ${purchase.itemName}`,
              message: `Tu solicitud de compra "${purchase.itemName}" ha sido aprobada.`,
              priority: 'NORMAL',
              data: JSON.stringify({ purchaseId: purchase.id, entityType: 'purchase' }),
              isRead: false
            }
          })
        }
        
        if (purchase.status === 'REJECTED' && purchase.requestorId) {
          // Notify requestor of rejection
          await this.prisma.notification.create({
            data: {
              userId: purchase.requestorId,
              type: 'PURCHASE_REJECTED',
              title: `Compra Rechazada: ${purchase.itemName}`,
              message: `Tu solicitud de compra "${purchase.itemName}" ha sido rechazada.`,
              priority: 'NORMAL',
              data: JSON.stringify({ purchaseId: purchase.id, entityType: 'purchase' }),
              isRead: false
            }
          })
        }
      }
      
      console.log(`✅ Processed purchase notifications for ${purchase.itemName}`)
    } catch (error) {
      console.error('Error processing purchase notifications:', error)
    }
  }

  /**
   * Trigger notifications for equipment changes
   */
  async onEquipmentChange(equipment: any, action: 'CREATE' | 'UPDATE' | 'DELETE') {
    if (action === 'DELETE') return

    try {
      // Check for equipment assignment changes
      if (action === 'UPDATE' && equipment.assignedToId) {
        const employee = await this.prisma.employee.findUnique({
          where: { id: equipment.assignedToId },
          include: { user: true }
        })

        if (employee?.user) {
          await this.prisma.notification.create({
            data: {
              userId: employee.user.id,
              type: 'EQUIPMENT_ASSIGNED',
              title: `Equipo Asignado: ${equipment.name}`,
              message: `Te han asignado el equipo "${equipment.name}" (${equipment.type}).`,
              priority: 'NORMAL',
              data: JSON.stringify({ equipmentId: equipment.id, entityType: 'equipment' }),
              isRead: false
            }
          })
        }
      }

      console.log(`✅ Processed equipment notifications for ${equipment.name}`)
    } catch (error) {
      console.error('Error processing equipment notifications:', error)
    }
  }

  /**
   * Process inventory changes
   */
  async onInventoryChange(inventory: any, action: 'CREATE' | 'UPDATE' | 'DELETE') {
    if (action === 'DELETE') return

    try {
      // Check for low stock
      if (inventory.quantity <= 5 && inventory.quantity > 0) {
        const adminUsers = await this.prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'TECHNICIAN'] } }
        })

        for (const user of adminUsers) {
          await this.prisma.notification.create({
            data: {
              userId: user.id,
              type: 'INVENTORY_LOW',
              title: `Stock Bajo: ${inventory.name}`,
              message: `Quedan solo ${inventory.quantity} unidades de "${inventory.name}" en inventario.`,
              priority: 'HIGH',
              data: JSON.stringify({ inventoryId: inventory.id, entityType: 'inventory' }),
              isRead: false
            }
          })
        }
      }

      console.log(`✅ Processed inventory notifications for ${inventory.name}`)
    } catch (error) {
      console.error('Error processing inventory notifications:', error)
    }
  }

  /**
   * Create system-wide notification
   */
  async createSystemNotification(
    type: string,
    title: string,
    message: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL',
    targetRoles: string[] = ['ADMIN']
  ) {
    try {
      const users = await this.prisma.user.findMany({
        where: { role: { in: targetRoles } }
      })

      for (const user of users) {
        await this.prisma.notification.create({
          data: {
            userId: user.id,
            type: type,
            title: title,
            message: message,
            priority: priority,
            isRead: false
          }
        })
      }

      console.log(`✅ Created system notification for ${users.length} users`)
    } catch (error) {
      console.error('Error creating system notification:', error)
    }
  }

  /**
   * Run maintenance notifications (for scheduled tasks)
   */
  async runMaintenanceCheck() {
    try {
      // Check for overdue tickets
      const overdueTickets = await this.prisma.ticket.findMany({
        where: {
          status: { in: ['OPEN', 'ASSIGNED'] },
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
        }
      })

      if (overdueTickets.length > 0) {
        await this.createSystemNotification(
          'TICKETS_OVERDUE',
          `${overdueTickets.length} Tickets Vencidos`,
          `Hay ${overdueTickets.length} tickets que llevan más de 24 horas sin resolver.`,
          'HIGH',
          ['ADMIN', 'SUPERVISOR']
        )
      }

      // Check for failed backups
      const failedBackups = await this.prisma.backupLog.findMany({
        where: {
          status: 'FAILED',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }
      })

      if (failedBackups.length > 0) {
        await this.createSystemNotification(
          'BACKUPS_FAILED',
          `${failedBackups.length} Backups Fallidos`,
          `Se han detectado ${failedBackups.length} backups fallidos en las últimas 24 horas.`,
          'HIGH',
          ['ADMIN']
        )
      }

      // Check for critical consumables
      const criticalConsumables = await this.prisma.consumable.findMany({
        where: {
          OR: [
            { quantityAvailable: { lte: 2 } },
            { status: 'CRITICAL' },
            { status: 'EMPTY' }
          ]
        }
      })

      if (criticalConsumables.length > 0) {
        await this.createSystemNotification(
          'CONSUMABLES_CRITICAL',
          `${criticalConsumables.length} Consumibles Críticos`,
          `Hay ${criticalConsumables.length} consumibles que requieren atención urgente.`,
          'URGENT',
          ['ADMIN', 'TECHNICIAN']
        )
      }

      console.log('✅ Maintenance check completed')
    } catch (error) {
      console.error('Error in maintenance check:', error)
    }
  }
}

// Singleton instance
let notificationTriggers: NotificationTriggers | null = null

export function getNotificationTriggers(prisma: PrismaClient): NotificationTriggers {
  if (!notificationTriggers) {
    notificationTriggers = new NotificationTriggers(prisma)
  }
  return notificationTriggers
}
