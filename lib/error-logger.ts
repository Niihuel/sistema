'use client'

interface DebugError {
  message: string
  stack?: string
  code?: string
  component?: string
  timestamp: string
}

class ErrorLogger {
  private errors: DebugError[] = []
  private maxErrors = 50

  log(error: Error | string, component?: string) {
    const errorObj: DebugError = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      code: typeof error === 'object' ? (error as any).code : undefined,
      component,
      timestamp: new Date().toISOString()
    }

    this.errors.unshift(errorObj)
    
    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors)
    }

    // Log to console with context
    console.error(`[${component || 'Unknown'}] Error:`, errorObj)

    // Check for specific patterns that might indicate module loading issues
    if (
      errorObj.message.includes('Cannot read properties of undefined') ||
      errorObj.message.includes('options.factory') ||
      errorObj.message.includes('originalFactory.call') ||
      errorObj.stack?.includes('webpack')
    ) {
      console.warn('🚨 Detected potential webpack/module loading issue:', errorObj)
      
      // Try to provide more context
      if (typeof window !== 'undefined') {
        console.log('Current location:', window.location.href)
        console.log('User agent:', navigator.userAgent)
        console.log('Performance timing:', performance.timing ? {
          navigationStart: performance.timing.navigationStart,
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
        } : 'Not available')
      }
    }

    return errorObj
  }

  getErrors() {
    return [...this.errors]
  }

  clear() {
    this.errors = []
  }

  getErrorsForComponent(component: string) {
    return this.errors.filter(e => e.component === component)
  }
}

const errorLogger = new ErrorLogger()

export default errorLogger
export type { DebugError }