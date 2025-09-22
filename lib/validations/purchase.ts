import { z } from 'zod'

// Esquema para solicitudes de compra
export const purchaseRequestSchema = z.object({
  requestNumber: z.string().max(50).optional().nullable(),
  requestorId: z.number().int().positive().optional().nullable(),
  itemName: z.string().min(1, 'El nombre del artículo es requerido').max(255),
  category: z.enum([
    'Hardware',
    'Software',
    'Consumible',
    'Servicio',
    'Licencia',
    'Repuesto',
    'Other'
  ], {
    message: 'Categoría inválida'
  }),
  description: z.string().max(1000).optional().nullable(),
  justification: z.string().max(1000).optional().nullable(),
  quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1').default(1),
  estimatedCost: z.number().min(0).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    message: 'Prioridad inválida'
  }).default('MEDIUM'),
  status: z.enum([
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ORDERED',
    'RECEIVED',
    'CANCELLED'
  ], {
    message: 'Estado inválido'
  }).default('PENDING'),
  approvedBy: z.string().max(100).optional().nullable(),
  approvalDate: z.string().datetime().optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  receivedDate: z.string().datetime().optional().nullable(),
  vendor: z.string().max(255).optional().nullable(),
  actualCost: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

// Esquema para compras simples (tracking)
export const purchaseSchema = z.object({
  requestId: z.string().max(50).optional().nullable(),
  itemName: z.string().min(1, 'El nombre es requerido').max(255),
  requestedQty: z.number().int().min(0).default(0),
  requestedDate: z.string().datetime().optional().nullable(),
  receivedQty: z.number().int().min(0).default(0),
  receivedDate: z.string().datetime().optional().nullable(),
  pendingQty: z.number().int().min(0).default(0),
  status: z.enum(['PENDING', 'PARTIAL', 'COMPLETE', 'CANCELLED'], {
    message: 'Estado inválido'
  }).default('PENDING'),
})

// Esquemas derivados
export const createPurchaseRequestSchema = purchaseRequestSchema.omit({
  approvedBy: true,
  approvalDate: true,
  actualCost: true,
})

export const updatePurchaseRequestSchema = purchaseRequestSchema.partial()

export const createPurchaseSchema = purchaseSchema
export const updatePurchaseSchema = purchaseSchema.partial()

// Esquemas de filtros
export const purchaseRequestFilterSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  category: z.string().optional(),
  requestorId: z.coerce.number().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
})

export const purchaseFilterSchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
})

// Tipos TypeScript
export type PurchaseRequest = z.infer<typeof purchaseRequestSchema>
export type CreatePurchaseRequest = z.infer<typeof createPurchaseRequestSchema>
export type UpdatePurchaseRequest = z.infer<typeof updatePurchaseRequestSchema>

export type Purchase = z.infer<typeof purchaseSchema>
export type CreatePurchase = z.infer<typeof createPurchaseSchema>
export type UpdatePurchase = z.infer<typeof updatePurchaseSchema>