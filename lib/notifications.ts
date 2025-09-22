import { withDatabase } from '@/lib/prisma'

export type NotificationType = 
  | 'STOCK_LOW' 
  | 'TICKET_URGENT' 
  | 'EQUIPMENT_MAINTENANCE' 
  | 'PURCHASE_APPROVED'
  | 'BACKUP_FAILED'
  | 'SYSTEM_UPDATE'

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

interface CreateNotificationParams {
  userId?: number
  type: NotificationType
  title: string
  message?: string
  priority?: NotificationPriority
  data?: any
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  priority = 'NORMAL',
  data
}: CreateNotificationParams) {
  try {
    return await withDatabase(async (prisma) => {
      return await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          priority,
          data: data ? JSON.stringify(data) : null
        }
      })
    })
  } catch (error) {
    // Silenciar error en desarrollo
    return null
  }
}

// Funciones de notificación específicas
export async function notifyLowStock(item: any) {
  const admins = await withDatabase(async (prisma) => {
    return await prisma.user.findMany({
      where: { role: 'ADMIN' }
    })
  })
  
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'STOCK_LOW',
      title: `Stock bajo: ${item.name}`,
      message: `Quedan solo ${item.quantity} unidades`,
      priority: 'HIGH',
      data: { itemId: item.id, quantity: item.quantity }
    })
  }
}

export async function notifyUrgentTicket(ticket: any) {
  const technicians = await withDatabase(async (prisma) => {
    return await prisma.user.findMany({
      where: { role: { in: ['TECHNICIAN', 'ADMIN'] } }
    })
  })
  
  for (const tech of technicians) {
    await createNotification({
      userId: tech.id,
      type: 'TICKET_URGENT',
      title: `Ticket urgente: ${ticket.title}`,
      message: ticket.description,
      priority: 'URGENT',
      data: { ticketId: ticket.id }
    })
  }
}

export async function notifyMaintenanceRequired(equipment: any) {
  await createNotification({
    type: 'EQUIPMENT_MAINTENANCE',
    title: `Mantenimiento requerido: ${equipment.name}`,
    message: `El equipo ${equipment.serialNumber} requiere mantenimiento`,
    priority: 'NORMAL',
    data: { equipmentId: equipment.id }
  })
}

export async function notifyPurchaseApproved(purchase: any, userId: number) {
  await createNotification({
    userId,
    type: 'PURCHASE_APPROVED',
    title: `Compra aprobada: ${purchase.itemName}`,
    message: `Tu solicitud de compra ha sido aprobada`,
    priority: 'NORMAL',
    data: { purchaseId: purchase.id }
  })
}

export async function notifyBackupFailed(backup: any) {
  const admins = await withDatabase(async (prisma) => {
    return await prisma.user.findMany({
      where: { role: 'ADMIN' }
    })
  })
  
  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: 'BACKUP_FAILED',
      title: `Backup fallido: ${backup.backupName}`,
      message: backup.errorMessage,
      priority: 'HIGH',
      data: { backupId: backup.id }
    })
  }
}