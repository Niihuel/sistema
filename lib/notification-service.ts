import { getPrisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

export interface SystemNotification {
  id: string
  type: 'backup' | 'ticket' | 'equipment' | 'inventory' | 'system'
  title: string
  message: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  count?: number
  link?: string
  createdAt: Date
}

class NotificationService {
  private prisma: PrismaClient | null = null

  async initialize() {
    try {
      this.prisma = await getPrisma()
    } catch (error) {
      console.error('Error initializing notification service:', error)
    }
  }

  async getSystemNotifications(): Promise<SystemNotification[]> {
    const notifications: SystemNotification[] = []

    if (!this.prisma) {
      // Return demo notifications if database is not available
      return this.getDemoNotifications()
    }

    try {
      // Check for pending backups
      const pendingBackups = await this.prisma.backupLog.count({
        where: { status: 'PENDING' }
      }).catch(() => 0)

      if (pendingBackups > 0) {
        notifications.push({
          id: 'backup-pending',
          type: 'backup',
          title: 'Backups Pendientes',
          message: `Hay ${pendingBackups} backup${pendingBackups > 1 ? 's' : ''} pendiente${pendingBackups > 1 ? 's' : ''} de ejecutar`,
          priority: pendingBackups > 3 ? 'HIGH' : 'NORMAL',
          count: pendingBackups,
          link: '/backups',
          createdAt: new Date()
        })
      }

      // Check for failed backups
      const failedBackups = await this.prisma.backupLog.count({
        where: { status: 'FAILED' }
      }).catch(() => 0)

      if (failedBackups > 0) {
        notifications.push({
          id: 'backup-failed',
          type: 'backup',
          title: 'Backups Fallidos',
          message: `${failedBackups} backup${failedBackups > 1 ? 's' : ''} ha${failedBackups > 1 ? 'n' : ''} fallado y requiere${failedBackups > 1 ? 'n' : ''} atención`,
          priority: 'URGENT',
          count: failedBackups,
          link: '/backups',
          createdAt: new Date()
        })
      }

      // Check for open tickets
      const openTickets = await this.prisma.ticket.count({
        where: { status: 'OPEN' }
      }).catch(() => 0)

      if (openTickets > 0) {
        const urgentTickets = await this.prisma.ticket.count({
          where: {
            status: 'OPEN',
            priority: 'URGENT'
          }
        }).catch(() => 0)

        notifications.push({
          id: 'tickets-open',
          type: 'ticket',
          title: 'Solicitudes Abiertas',
          message: `${openTickets} solicitud${openTickets > 1 ? 'es' : ''} sin resolver${urgentTickets > 0 ? ` (${urgentTickets} urgente${urgentTickets > 1 ? 's' : ''})` : ''}`,
          priority: urgentTickets > 0 ? 'URGENT' : openTickets > 10 ? 'HIGH' : 'NORMAL',
          count: openTickets,
          link: '/tickets',
          createdAt: new Date()
        })
      }

      // Check for equipment needing maintenance
      const maintenanceEquipment = await this.prisma.equipment.count({
        where: { status: 'EN_REPARACION' }
      }).catch(() => 0)

      if (maintenanceEquipment > 0) {
        notifications.push({
          id: 'equipment-maintenance',
          type: 'equipment',
          title: 'Equipos en Reparación',
          message: `${maintenanceEquipment} equipo${maintenanceEquipment > 1 ? 's' : ''} en proceso de reparación`,
          priority: 'NORMAL',
          count: maintenanceEquipment,
          link: '/equipment',
          createdAt: new Date()
        })
      }

      // Check for low inventory items
      const lowInventory = await this.prisma.inventoryItem.count({
        where: {
          quantity: { lte: 5 }
        }
      }).catch(() => 0)

      if (lowInventory > 0) {
        const criticalInventory = await this.prisma.inventoryItem.count({
          where: {
            quantity: { lte: 2 }
          }
        }).catch(() => 0)

        notifications.push({
          id: 'inventory-low',
          type: 'inventory',
          title: 'Inventario Bajo',
          message: `${lowInventory} artículo${lowInventory > 1 ? 's' : ''} con stock bajo${criticalInventory > 0 ? ` (${criticalInventory} crítico${criticalInventory > 1 ? 's' : ''})` : ''}`,
          priority: criticalInventory > 0 ? 'HIGH' : 'NORMAL',
          count: lowInventory,
          link: '/inventory',
          createdAt: new Date()
        })
      }

      // Check for pending purchase requests
      const pendingPurchases = await this.prisma.purchaseRequest.count({
        where: { status: 'PENDING' }
      }).catch(() => 0)

      if (pendingPurchases > 0) {
        notifications.push({
          id: 'purchases-pending',
          type: 'system',
          title: 'Compras Pendientes',
          message: `${pendingPurchases} solicitud${pendingPurchases > 1 ? 'es' : ''} de compra pendiente${pendingPurchases > 1 ? 's' : ''} de aprobación`,
          priority: pendingPurchases > 5 ? 'HIGH' : 'NORMAL',
          count: pendingPurchases,
          link: '/purchase-requests',
          createdAt: new Date()
        })
      }

    } catch (error) {
      console.error('Error getting system notifications:', error)
      return this.getDemoNotifications()
    }

    return notifications
  }

  private getDemoNotifications(): SystemNotification[] {
    return [
      {
        id: 'demo-1',
        type: 'backup',
        title: 'Backups Pendientes',
        message: 'Hay 2 backups pendientes de ejecutar',
        priority: 'NORMAL',
        count: 2,
        link: '/backups',
        createdAt: new Date()
      },
      {
        id: 'demo-2',
        type: 'ticket',
        title: 'Solicitudes Abiertas',
        message: '5 solicitudes sin resolver (1 urgente)',
        priority: 'HIGH',
        count: 5,
        link: '/tickets',
        createdAt: new Date()
      }
    ]
  }
}

// Singleton instance
let notificationService: NotificationService | null = null

export async function getNotificationService(): Promise<NotificationService> {
  if (!notificationService) {
    notificationService = new NotificationService()
    await notificationService.initialize()
  }
  return notificationService
}