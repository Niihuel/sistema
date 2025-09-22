"use client"

import { useToast } from '@/lib/hooks/use-toast'
import { useAuth } from '@/lib/hooks/useAuth'

export function usePermissionToast() {
  const { showError, showWarning, showInfo } = useToast()
  const { user, isAdmin } = useAuth()

  const showPermissionError = (customMessage?: string) => {
    const defaultMessage = isAdmin 
      ? "Acceso restringido" 
      : "No tienes permisos suficientes para realizar esta acción"
    
    showError(customMessage || defaultMessage)
  }

  const showAdminOnlyError = (action: string = "realizar esta acción") => {
    showError(`Solo los administradores pueden ${action}`)
  }

  const showRoleRequiredError = (requiredRoles: string[], action: string = "realizar esta acción") => {
    if (requiredRoles.includes('ADMIN')) {
      showAdminOnlyError(action)
    } else {
      showError(`Necesitas uno de estos roles para ${action}: ${requiredRoles.join(', ')}`)
    }
  }

  const showLoginRequiredError = (action: string = "realizar esta acción") => {
    showError(`Debes iniciar sesión para ${action}`)
  }

  const showResourcePermissionError = (resource: string, level: string = 'lectura') => {
    showError(`No tienes permisos de ${level} para ${resource}`)
  }

  return {
    showPermissionError,
    showAdminOnlyError, 
    showRoleRequiredError,
    showLoginRequiredError,
    showResourcePermissionError
  }
}