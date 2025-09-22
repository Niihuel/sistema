import { z } from 'zod'

// Esquema para items de inventario
export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  category: z.enum([
    'Hardware',
    'Software',
    'Consumible',
    'Accesorio',
    'Repuesto',
    'Herramienta',
    'Cable',
    'Other'
  ], {
    message: 'Categoría inválida'
  }),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  quantity: z.number().int().min(0, 'La cantidad no puede ser negativa').default(0),
  location: z.string().max(255).optional().nullable(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'RESERVED', 'DAMAGED', 'RETIRED'], {
    message: 'Estado inválido'
  }).default('AVAILABLE'),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN'], {
    message: 'Condición inválida'
  }).default('NEW'),
  notes: z.string().max(1000).optional().nullable(),
  assignedToId: z.number().int().positive().optional().nullable(),
})

// Esquemas derivados
export const createInventoryItemSchema = inventoryItemSchema

export const updateInventoryItemSchema = inventoryItemSchema.partial()

export const inventoryFilterSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  assignedToId: z.coerce.number().optional(),
  search: z.string().optional(),
  minQuantity: z.coerce.number().optional(),
  maxQuantity: z.coerce.number().optional(),
})

// Esquema para movimientos de inventario
export const inventoryMovementSchema = z.object({
  itemId: z.number().int().positive(),
  type: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']),
  quantity: z.number().int().positive('La cantidad debe ser positiva'),
  fromLocation: z.string().optional().nullable(),
  toLocation: z.string().optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
  performedBy: z.number().int().positive(),
  notes: z.string().max(1000).optional().nullable(),
})

// Tipos TypeScript
export type InventoryItem = z.infer<typeof inventoryItemSchema>
export type CreateInventoryItem = z.infer<typeof createInventoryItemSchema>
export type UpdateInventoryItem = z.infer<typeof updateInventoryItemSchema>
export type InventoryFilter = z.infer<typeof inventoryFilterSchema>
export type InventoryMovement = z.infer<typeof inventoryMovementSchema>