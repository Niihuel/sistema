import {
  createNotification,
  notifyLowStock,
  notifyUrgentTicket,
  notifyMaintenanceRequired,
  notifyPurchaseApproved,
  notifyBackupFailed,
  NotificationType,
  NotificationPriority
} from './notifications'

// Notification Engine - Centralized notification processing
export class NotificationEngine {
  private static instance: NotificationEngine

  public static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine()
    }
    return NotificationEngine.instance
  }

  // Process notification based on trigger
  async processNotification(trigger: string, data: any) {
    try {
      switch (trigger) {
        case 'STOCK_LOW':
          await notifyLowStock(data)
          break
        case 'TICKET_URGENT':
          await notifyUrgentTicket(data)
          break
        case 'EQUIPMENT_MAINTENANCE':
          await notifyMaintenanceRequired(data)
          break
        case 'PURCHASE_APPROVED':
          await notifyPurchaseApproved(data.purchase, data.userId)
          break
        case 'BACKUP_FAILED':
          await notifyBackupFailed(data)
          break
        default:
          console.warn(`Unknown notification trigger: ${trigger}`)
      }
    } catch (error) {
      console.error(`Error processing notification for trigger ${trigger}:`, error)
    }
  }

  // Create custom notification
  async createCustomNotification(params: {
    userId?: number
    type: NotificationType
    title: string
    message?: string
    priority?: NotificationPriority
    data?: any
  }) {
    return await createNotification(params)
  }

  // Batch process notifications
  async processBatch(notifications: Array<{ trigger: string; data: any }>) {
    const results = await Promise.allSettled(
      notifications.map(({ trigger, data }) => this.processNotification(trigger, data))
    )

    const failures = results
      .map((result, index) => result.status === 'rejected' ? index : null)
      .filter(index => index !== null)

    if (failures.length > 0) {
      console.warn(`Failed to process ${failures.length} notifications`)
    }

    return {
      processed: results.length,
      failures: failures.length
    }
  }
}

// Default export
export default NotificationEngine.getInstance()

// Helper functions
export async function processNotification(trigger: string, data: any) {
  return NotificationEngine.getInstance().processNotification(trigger, data)
}

export async function createCustomNotification(params: {
  userId?: number
  type: NotificationType
  title: string
  message?: string
  priority?: NotificationPriority
  data?: any
}) {
  return NotificationEngine.getInstance().createCustomNotification(params)
}

// Legacy exports for compatibility
export function getNotificationEngine() {
  return NotificationEngine.getInstance()
}