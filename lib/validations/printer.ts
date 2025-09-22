import { z } from 'zod'

// Esquema para impresoras
export const printerSchema = z.object({
  model: z.string().min(1, 'El modelo es requerido').max(255),
  serialNumber: z.string().max(100).optional().nullable(),
  area: z.string().max(100).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  ip: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Formato IP v4 inválido').optional().nullable(),
  macAddress: z.string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Formato MAC inválido')
    .optional()
    .nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED'], {
    message: 'Estado inválido'
  }).default('ACTIVE'),
  notes: z.string().max(1000).optional().nullable(),
})

// Esquema para consumibles
export const consumableSchema = z.object({
  itemName: z.string().min(1, 'El nombre es requerido').max(255),
  color: z.enum(['Black', 'Cyan', 'Magenta', 'Yellow', 'Other']).optional().nullable(),
  quantityAvailable: z.number().int().min(0).default(0),
  status: z.enum(['OK', 'LOW', 'EMPTY', 'CRITICAL'], {
    message: 'Estado inválido'
  }).default('OK'),
  printerId: z.number().int().positive().optional().nullable(),
})

// Esquema para reemplazos
export const replacementSchema = z.object({
  printerId: z.number().int().positive('ID de impresora requerido'),
  consumableId: z.number().int().positive().optional().nullable(),
  replacementDate: z.string().datetime(),
  completionDate: z.string().datetime().optional().nullable(),
  rendimientoDays: z.number().int().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

// Esquemas derivados
export const createPrinterSchema = printerSchema
export const updatePrinterSchema = printerSchema.partial()

export const createConsumableSchema = consumableSchema
export const updateConsumableSchema = consumableSchema.partial()

export const createReplacementSchema = replacementSchema
export const updateReplacementSchema = replacementSchema.partial()

// Esquemas de filtros
export const printerFilterSchema = z.object({
  area: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
})

export const consumableFilterSchema = z.object({
  printerId: z.coerce.number().optional(),
  status: z.string().optional(),
  color: z.string().optional(),
})

// Tipos TypeScript
export type Printer = z.infer<typeof printerSchema>
export type CreatePrinter = z.infer<typeof createPrinterSchema>
export type UpdatePrinter = z.infer<typeof updatePrinterSchema>

export type Consumable = z.infer<typeof consumableSchema>
export type CreateConsumable = z.infer<typeof createConsumableSchema>
export type UpdateConsumable = z.infer<typeof updateConsumableSchema>

export type Replacement = z.infer<typeof replacementSchema>
export type CreateReplacement = z.infer<typeof createReplacementSchema>
export type UpdateReplacement = z.infer<typeof updateReplacementSchema>