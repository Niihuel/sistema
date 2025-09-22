import { z } from 'zod'

// Esquema completo para empleados
export const employeeSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  area: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]+$/, 'Formato de teléfono inválido')
    .max(30)
    .optional()
    .nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'VACATION', 'SUSPENDED'], {
    message: 'Estado inválido'
  }).default('ACTIVE'),
})

// Esquema para crear empleado
export const createEmployeeSchema = employeeSchema

// Esquema para actualizar empleado
export const updateEmployeeSchema = employeeSchema.partial()

// Esquema para filtros
export const employeeFilterSchema = z.object({
  area: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
})

// Tipos TypeScript
export type Employee = z.infer<typeof employeeSchema>
export type CreateEmployee = z.infer<typeof createEmployeeSchema>
export type UpdateEmployee = z.infer<typeof updateEmployeeSchema>
export type EmployeeFilter = z.infer<typeof employeeFilterSchema>