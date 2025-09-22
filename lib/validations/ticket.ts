import { z } from 'zod'

// Esquema para tickets
export const ticketSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'], {
    message: 'Estado inválido'
  }).default('OPEN'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    message: 'Prioridad inválida'
  }).default('MEDIUM'),
  requestorId: z.number().int().positive('ID de solicitante inválido'),
  technicianId: z.number().int().positive().optional().nullable(),
  solution: z.string().max(2000).optional().nullable(),
  area: z.string().max(100).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Formato IP v4 inválido').optional().nullable(),
  resolutionTime: z.string().optional().nullable(),
})

// Esquemas derivados
export const createTicketSchema = ticketSchema.omit({ 
  technicianId: true, 
  solution: true,
  resolutionTime: true 
})

export const updateTicketSchema = ticketSchema.partial()

export const ticketFilterSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  area: z.string().optional(),
  category: z.string().optional(),
  requestorId: z.coerce.number().optional(),
  technicianId: z.coerce.number().optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

// Tipos TypeScript
export type Ticket = z.infer<typeof ticketSchema>
export type CreateTicket = z.infer<typeof createTicketSchema>
export type UpdateTicket = z.infer<typeof updateTicketSchema>
export type TicketFilter = z.infer<typeof ticketFilterSchema>