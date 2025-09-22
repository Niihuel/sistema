import { processNotification } from './notification-engine'

// Notification triggers - Define when notifications should be sent
export interface TriggerRule {
  name: string
  condition: (data: any) => boolean
  action: string
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
}

// Stock level triggers
export const stockTriggers: TriggerRule[] = [
  {
    name: 'LOW_STOCK',
    condition: (item) => item.quantity <= item.minThreshold,
    action: 'STOCK_LOW',
    priority: 'HIGH'
  },
  {
    name: 'CRITICAL_STOCK',
    condition: (item) => item.quantity === 0,
    action: 'STOCK_LOW',
    priority: 'URGENT'
  }
]

// Ticket triggers
export const ticketTriggers: TriggerRule[] = [
  {
    name: 'URGENT_TICKET',
    condition: (ticket) => ticket.priority === 'URGENT' || ticket.priority === 'HIGH',
    action: 'TICKET_URGENT',
    priority: 'URGENT'
  },
  {
    name: 'OVERDUE_TICKET',
    condition: (ticket) => {
      const dueDate = new Date(ticket.dueDate)
      return dueDate < new Date() && ticket.status !== 'COMPLETED'
    },
    action: 'TICKET_URGENT',
    priority: 'HIGH'
  }
]

// Equipment triggers
export const equipmentTriggers: TriggerRule[] = [
  {
    name: 'MAINTENANCE_DUE',
    condition: (equipment) => {
      const lastMaintenance = new Date(equipment.lastMaintenanceDate)
      const monthsAgo = new Date()
      monthsAgo.setMonth(monthsAgo.getMonth() - 6)
      return lastMaintenance < monthsAgo
    },
    action: 'EQUIPMENT_MAINTENANCE',
    priority: 'NORMAL'
  },
  {
    name: 'EQUIPMENT_FAILURE',
    condition: (equipment) => equipment.status === 'FAILED' || equipment.status === 'ERROR',
    action: 'EQUIPMENT_MAINTENANCE',
    priority: 'HIGH'
  }
]

// Purchase triggers
export const purchaseTriggers: TriggerRule[] = [
  {
    name: 'PURCHASE_APPROVED',
    condition: (purchase) => purchase.status === 'APPROVED',
    action: 'PURCHASE_APPROVED',
    priority: 'NORMAL'
  }
]

// System triggers
export const systemTriggers: TriggerRule[] = [
  {
    name: 'BACKUP_FAILED',
    condition: (backup) => backup.status === 'FAILED',
    action: 'BACKUP_FAILED',
    priority: 'HIGH'
  }
]

// All triggers combined
export const allTriggers = [
  ...stockTriggers,
  ...ticketTriggers,
  ...equipmentTriggers,
  ...purchaseTriggers,
  ...systemTriggers
]

// Trigger evaluation functions
export async function evaluateStockTriggers(item: any) {
  for (const trigger of stockTriggers) {
    if (trigger.condition(item)) {
      await processNotification(trigger.action, item)
    }
  }
}

export async function evaluateTicketTriggers(ticket: any) {
  for (const trigger of ticketTriggers) {
    if (trigger.condition(ticket)) {
      await processNotification(trigger.action, ticket)
    }
  }
}

export async function evaluateEquipmentTriggers(equipment: any) {
  for (const trigger of equipmentTriggers) {
    if (trigger.condition(equipment)) {
      await processNotification(trigger.action, equipment)
    }
  }
}

export async function evaluatePurchaseTriggers(purchase: any) {
  for (const trigger of purchaseTriggers) {
    if (trigger.condition(purchase)) {
      await processNotification(trigger.action, { purchase, userId: purchase.requestedBy })
    }
  }
}

export async function evaluateSystemTriggers(systemData: any) {
  for (const trigger of systemTriggers) {
    if (trigger.condition(systemData)) {
      await processNotification(trigger.action, systemData)
    }
  }
}

// Generic trigger evaluator
export async function evaluateTriggers(category: string, data: any) {
  switch (category) {
    case 'stock':
      await evaluateStockTriggers(data)
      break
    case 'ticket':
      await evaluateTicketTriggers(data)
      break
    case 'equipment':
      await evaluateEquipmentTriggers(data)
      break
    case 'purchase':
      await evaluatePurchaseTriggers(data)
      break
    case 'system':
      await evaluateSystemTriggers(data)
      break
    default:
      console.warn(`Unknown trigger category: ${category}`)
  }
}

// Batch evaluation
export async function evaluateBatchTriggers(items: Array<{ category: string; data: any }>) {
  const results = await Promise.allSettled(
    items.map(item => evaluateTriggers(item.category, item.data))
  )

  const failures = results.filter(result => result.status === 'rejected').length

  return {
    processed: results.length,
    failures
  }
}

// Legacy exports for compatibility
export function getNotificationTriggers() {
  return {
    stockTriggers,
    ticketTriggers,
    equipmentTriggers,
    purchaseTriggers,
    systemTriggers,
    allTriggers,
    evaluateTriggers,
    evaluateStockTriggers,
    evaluateTicketTriggers,
    evaluateEquipmentTriggers,
    evaluatePurchaseTriggers,
    evaluateSystemTriggers,
    evaluateBatchTriggers
  }
}