/**
 * Production-ready Logger Utility
 * Provides structured logging with different levels and environments
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

interface LogContext {
  userId?: number
  requestId?: string
  path?: string
  method?: string
  statusCode?: number
  duration?: number
  error?: any
  metadata?: Record<string, any>
}

class Logger {
  private level: LogLevel
  private isDevelopment: boolean
  private isClient: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production'
    this.isClient = typeof window !== 'undefined'
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}]`

    if (context) {
      const contextStr = Object.entries(context)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ')
      return `${prefix} ${message} ${contextStr}`
    }

    return `${prefix} ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  private log(level: LogLevel, levelStr: string, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return

    const formattedMessage = this.formatMessage(levelStr, message, context)

    // In production, send errors to monitoring service
    if (!this.isDevelopment && level >= LogLevel.ERROR && !this.isClient) {
      // Here you would send to Sentry, DataDog, etc.
      this.sendToMonitoring(levelStr, message, context)
    }

    // Console output based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
      case LogLevel.INFO:
        console.log(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage)
        break
    }
  }

  private sendToMonitoring(level: string, message: string, context?: LogContext) {
    // Placeholder for monitoring integration
    // In production, integrate with services like:
    // - Sentry
    // - DataDog
    // - LogRocket
    // - New Relic

    if (this.isClient) {
      // Client-side monitoring
      if ((window as any).Sentry) {
        (window as any).Sentry.captureMessage(message, level.toLowerCase())
      }
    } else {
      // Server-side monitoring
      // Add server monitoring logic here
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, 'INFO', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, 'WARN', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, 'ERROR', message, context)
  }

  fatal(message: string, context?: LogContext) {
    this.log(LogLevel.FATAL, 'FATAL', message, context)
  }

  // Utility method for API logging
  api(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: Partial<LogContext>
  ) {
    const level = statusCode >= 500 ? LogLevel.ERROR
                : statusCode >= 400 ? LogLevel.WARN
                : LogLevel.INFO

    this.log(level, LogLevel[level], `API ${method} ${path}`, {
      method,
      path,
      statusCode,
      duration,
      ...context
    })
  }

  // Utility method for authentication logging
  auth(event: string, userId?: number, success: boolean = true, context?: Partial<LogContext>) {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    this.log(level, LogLevel[level], `Auth: ${event}`, {
      userId,
      ...context
    })
  }

  // Performance logging
  performance(operation: string, duration: number, context?: Partial<LogContext>) {
    const level = duration > 3000 ? LogLevel.WARN : LogLevel.INFO
    this.log(level, LogLevel[level], `Performance: ${operation}`, {
      duration,
      ...context
    })
  }
}

// Export singleton instance
const logger = new Logger()
export default logger

// Export for testing
export { Logger }