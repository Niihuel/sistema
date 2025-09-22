'use client'

import errorLogger from './error-logger'

declare global {
  interface Window {
    __ERROR_HANDLER_INSTALLED__: boolean
  }
}

function installGlobalErrorHandler() {
  if (typeof window === 'undefined' || window.__ERROR_HANDLER_INSTALLED__) {
    return
  }

  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message)
    
    // Check for specific webpack/module loading errors
    if (
      error.message?.includes('Cannot read properties of undefined') ||
      error.message?.includes('options.factory') ||
      error.message?.includes('originalFactory.call') ||
      event.filename?.includes('webpack') ||
      event.filename?.includes('_next/static')
    ) {
      console.warn('🚨 Detected webpack/module loading error:', {
        message: error.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: error.stack
      })
      
      errorLogger.log(error, 'GlobalErrorHandler')
      
      // Try to recover by reloading the page
      if (error.message?.includes('Cannot read properties of undefined')) {
        console.log('🔄 Attempting to recover from module loading error...')
        
        // Clear potential problematic cache
        try {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
              registrations.forEach(registration => {
                registration.unregister()
              })
            })
          }
          
          // Clear local storage items that might be causing issues
          localStorage.removeItem('auth_token')
          
          // Reload after a short delay
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        } catch (e) {
          console.error('Failed to clear cache during recovery:', e)
        }
      }
      
      // Prevent the error from propagating and breaking the entire app
      event.preventDefault()
      return false
    }
    
    // Log other errors normally
    errorLogger.log(error, 'GlobalErrorHandler')
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    
    // Check for module loading related rejections
    if (
      error?.message?.includes('Cannot read properties of undefined') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('webpack') ||
      error?.toString()?.includes('module loading')
    ) {
      console.warn('🚨 Detected module loading promise rejection:', error)
      
      errorLogger.log(
        error instanceof Error ? error : new Error(String(error)), 
        'GlobalErrorHandler'
      )
      
      // Prevent the rejection from causing app-wide issues
      event.preventDefault()
      return false
    }
    
    // Log other rejections
    errorLogger.log(
      error instanceof Error ? error : new Error(String(error)), 
      'GlobalErrorHandler'
    )
  })

  // Handle React error boundaries that might miss some errors
  const originalConsoleError = console.error
  console.error = (...args) => {
    const message = args.join(' ')
    
    if (
      message.includes('Cannot read properties of undefined') ||
      message.includes('options.factory') ||
      message.includes('originalFactory.call') ||
      message.includes('The above error occurred in the <')
    ) {
      errorLogger.log(new Error(message), 'Console')
    }
    
    originalConsoleError.apply(console, args)
  }

  window.__ERROR_HANDLER_INSTALLED__ = true
  console.log('✅ Global error handler installed')
}

export default installGlobalErrorHandler