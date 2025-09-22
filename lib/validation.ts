export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'email' | 'url' | 'number' | 'ip' | 'mac'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  firstError?: string
}

export function validateForm(data: Record<string, any>, rules: ValidationRule[]): ValidationResult {
  const errors: Record<string, string> = {}

  for (const rule of rules) {
    const value = data[rule.field]
    const fieldError = validateField(value, rule)
    if (fieldError) {
      errors[rule.field] = fieldError
    }
  }

  const firstError = Object.values(errors)[0]
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError
  }
}

export function validateField(value: any, rule: ValidationRule): string | null {
  // Required validation
  if (rule.required && (!value || String(value).trim() === '')) {
    return `${rule.field} es requerido`
  }

  // Skip other validations if field is empty and not required
  if (!value || String(value).trim() === '') {
    return null
  }

  const stringValue = String(value).trim()

  // Type validations
  if (rule.type) {
    switch (rule.type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
          return `${rule.field} debe ser un email válido`
        }
        break
      case 'url':
        try {
          new URL(stringValue)
        } catch {
          return `${rule.field} debe ser una URL válida`
        }
        break
      case 'number':
        if (isNaN(Number(stringValue))) {
          return `${rule.field} debe ser un número válido`
        }
        break
      case 'ip':
        if (!/^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(stringValue)) {
          return `${rule.field} debe ser una IP válida`
        }
        break
      case 'mac':
        if (!/^([0-9A-Fa-f]{2}([:\-])){5}([0-9A-Fa-f]{2})$/.test(stringValue)) {
          return `${rule.field} debe ser una MAC válida`
        }
        break
    }
  }

  // Length validations
  if (rule.minLength && stringValue.length < rule.minLength) {
    return `${rule.field} debe tener al menos ${rule.minLength} caracteres`
  }
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return `${rule.field} debe tener máximo ${rule.maxLength} caracteres`
  }

  // Number range validations
  if (rule.type === 'number') {
    const numValue = Number(stringValue)
    if (rule.min !== undefined && numValue < rule.min) {
      return `${rule.field} debe ser mayor o igual a ${rule.min}`
    }
    if (rule.max !== undefined && numValue > rule.max) {
      return `${rule.field} debe ser menor o igual a ${rule.max}`
    }
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return `${rule.field} no tiene el formato correcto`
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value)
  }

  return null
}
