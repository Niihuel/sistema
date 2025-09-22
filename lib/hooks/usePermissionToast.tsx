'use client'

import { useToast } from './use-toast'

// Legacy compatibility hook for usePermissionToast
// Maps old usePermissionToast interface to new useToast interface
export function usePermissionToast() {
  const toast = useToast()

  return {
    // Legacy methods
    showSuccess: toast.showSuccess,
    showError: toast.showError,
    showWarning: toast.showWarning,
    showInfo: toast.showInfo,
    showToast: toast.showToast,

    // Legacy aliases for backward compatibility
    success: toast.showSuccess,
    error: toast.showError,
    warning: toast.showWarning,
    info: toast.showInfo,

    // Permission-specific toast methods
    permissionDenied: (message?: string) => {
      toast.showError(message || 'No tienes permisos suficientes para realizar esta acción')
    },

    permissionGranted: (message?: string) => {
      toast.showSuccess(message || 'Acción realizada correctamente')
    },

    authRequired: (message?: string) => {
      toast.showWarning(message || 'Debes iniciar sesión para continuar')
    },

    // Admin-specific methods
    showAdminOnlyError: (message?: string) => {
      toast.showError(message || 'Esta función requiere permisos de administrador')
    },

    showPermissionError: (message?: string) => {
      toast.showError(message || 'No tienes permisos para realizar esta acción')
    }
  }
}

// Default export for compatibility
export default usePermissionToast