// Exportar todos los esquemas de validación
export * from './equipment'
export * from './employee'
export * from './ticket'
export * from './inventory'
export * from './printer'
export * from './purchase'

// Utilidad para manejar errores de validación
import { z } from 'zod'
import { NextResponse } from 'next/server'

export function handleValidationError(error: z.ZodError) {
  const formattedErrors = error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
  
  return NextResponse.json(
    { 
      error: 'Validación fallida',
      details: formattedErrors 
    },
    { status: 400 }
  )
}

// Middleware de validación genérico
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: NextResponse } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: handleValidationError(error) 
      }
    }
    return { 
      success: false, 
      error: NextResponse.json(
        { error: 'Error de validación inesperado' },
        { status: 400 }
      )
    }
  }
}