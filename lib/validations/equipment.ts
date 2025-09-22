import { z } from 'zod'

// Esquema completo para equipos
export const equipmentSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  type: z.enum(['Desktop', 'Laptop', 'Server', 'Printer', 'Network', 'Monitor', 'Other'], {
    message: 'Tipo de equipo inválido'
  }),
  status: z.enum(['Activo', 'En Almacenamiento', 'De Baja', 'En Reparación', 'Finalizado'], {
    message: 'Estado inválido'
  }).default('Activo'),
  location: z.string().max(255).optional().nullable(),
  serialNumber: z.string().max(100).optional().nullable(),
  assignedToId: z.number().int().positive().nullable().optional(),
  
  // Información de red
  ip: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Formato IP v4 inválido').optional().nullable(),
  ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Formato IP v4 inválido').optional().nullable(),
  macAddress: z.string()
    .regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Formato MAC inválido')
    .optional()
    .nullable(),
  
  // Información de hardware
  area: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  cpuNumber: z.string().max(50).optional().nullable(),
  processor: z.string().max(255).optional().nullable(),
  motherboard: z.string().max(255).optional().nullable(),
  ram: z.string().max(50).optional().nullable(),
  storage: z.string().max(255).optional().nullable(),
  storageType: z.enum(['HDD', 'SSD', 'NVMe', 'Hybrid']).optional().nullable(),
  storageCapacity: z.string().max(50).optional().nullable(),
  
  // Información adicional
  operatingSystem: z.string().max(100).optional().nullable(),
  screenSize: z.string().max(50).optional().nullable(),
  dvdUnit: z.boolean().default(false),
  purchaseDate: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isPersonalProperty: z.boolean().default(false),
})

// Esquema para crear equipo
export const createEquipmentSchema = equipmentSchema

// Esquema para actualizar equipo (todos los campos opcionales)
export const updateEquipmentSchema = equipmentSchema.partial()

// Esquema para filtros de búsqueda
export const equipmentFilterSchema = z.object({
  type: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  area: z.string().optional(),
  assignedToId: z.coerce.number().optional(),
  search: z.string().optional(),
})

// Tipos TypeScript inferidos
export type Equipment = z.infer<typeof equipmentSchema>
export type CreateEquipment = z.infer<typeof createEquipmentSchema>
export type UpdateEquipment = z.infer<typeof updateEquipmentSchema>
export type EquipmentFilter = z.infer<typeof equipmentFilterSchema>