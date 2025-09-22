"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, X, Check, AlertCircle, Info, AlertTriangle, Package, HardDrive, Ticket, Printer, ShoppingCart, Settings, RefreshCw } from 'lucide-react'

interface Notification {
  id: number
  type: string
  title: string
  message?: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  isRead: boolean
  createdAt: string
  readAt?: string
  data?: unknown
}

interface NotificationStats {
  notifications: Notification[]
  totalCount: number
  unreadCount: number
  hasMore: boolean
}

const priorityColors = {
  LOW: 'text-blue-400',
  NORMAL: 'text-gray-400', 
  HIGH: 'text-orange-400',
  URGENT: 'text-red-400'
}

const priorityBgColors = {
  LOW: 'bg-blue-500/10',
  NORMAL: 'bg-gray-500/10',
  HIGH: 'bg-orange-500/10', 
  URGENT: 'bg-red-500/10'
}

const typeIcons = {
  STOCK_LOW: Package,
  CONSUMABLE_CRITICAL: AlertTriangle,
  CONSUMABLE_EMPTY: AlertCircle,
  BACKUP_FAILED: HardDrive,
  BACKUP_OVERDUE: AlertTriangle,
  BACKUP_RESTORED: Check,
  TICKET_UNASSIGNED: Ticket,
  TICKET_URGENT: AlertCircle,
  TICKET_RESOLVED: Check,
  PRINTER_OFFLINE: Printer,
  PRINTER_SUPPLIES_LOW: Package,
  PURCHASE_APPROVAL_NEEDED: ShoppingCart,
  PURCHASE_RECEIVED: Check,
  EQUIPMENT_UNASSIGNED: Settings,
  EQUIPMENT_MAINTENANCE: AlertTriangle,
  SYSTEM_UPDATE: Info,
  USER_LOGIN: Info,
  SECURITY_ALERT: AlertCircle
}

const typeLabels = {
  STOCK_LOW: 'Stock Bajo',
  CONSUMABLE_CRITICAL: 'Consumible Crítico',
  CONSUMABLE_EMPTY: 'Consumible Agotado',
  BACKUP_FAILED: 'Backup Fallido',
  BACKUP_OVERDUE: 'Backup Vencido',
  BACKUP_RESTORED: 'Backup Restaurado',
  TICKET_UNASSIGNED: 'Ticket Sin Asignar',
  TICKET_URGENT: 'Ticket Urgente',
  TICKET_RESOLVED: 'Ticket Resuelto',
  PRINTER_OFFLINE: 'Impresora Offline',
  PRINTER_SUPPLIES_LOW: 'Suministros Bajos',
  PURCHASE_APPROVAL_NEEDED: 'Aprobación Pendiente',
  PURCHASE_RECEIVED: 'Compra Recibida',
  EQUIPMENT_UNASSIGNED: 'Equipo Sin Asignar',
  EQUIPMENT_MAINTENANCE: 'Mantenimiento',
  SYSTEM_UPDATE: 'Actualización',
  USER_LOGIN: 'Inicio de Sesión',
  SECURITY_ALERT: 'Alerta de Seguridad'
}

export default function NotificationBell() {
  // Cliente-only state
  const [mounted, setMounted] = useState(false)
  const [notificationData, setNotificationData] = useState<NotificationStats>({
    notifications: [],
    totalCount: 0,
    unreadCount: 0,
    hasMore: false
  })
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all')
  
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastFetchRef = useRef<Date | undefined>(undefined)

  // Mount only on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Safe fetch function
  const fetchNotifications = useCallback(async (opts: {
    force?: boolean
    unreadOnly?: boolean
    type?: string
    limit?: number
    offset?: number
  } = {}) => {
    if (!mounted) return

    try {
      const { force = false, unreadOnly = false, type, limit = 20, offset = 0 } = opts
      
      if (!force && lastFetchRef.current) {
        const timeSince = Date.now() - lastFetchRef.current.getTime()
        if (timeSince < 3000) return
      }

      if (!refreshing && offset === 0) setLoading(true)
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })
      
      if (unreadOnly) params.set('unread', 'true')
      if (type && type !== 'all' && type !== 'unread') params.set('type', type)
      
      const response = await fetch(`/api/notifications?${params}`, {
        credentials: 'include',
        cache: force ? 'no-cache' : 'default'
      })
      
      if (response.ok) {
        const data = await response.json()
        const safeData: NotificationStats = {
          notifications: Array.isArray(data.notifications) ? data.notifications : [],
          totalCount: Number(data.totalCount) || 0,
          unreadCount: Number(data.unreadCount) || 0,
          hasMore: Boolean(data.hasMore)
        }
        
        if (offset === 0) {
          setNotificationData(safeData)
        } else {
          setNotificationData(prev => ({
            ...safeData,
            notifications: [...(Array.isArray(prev.notifications) ? prev.notifications : []), ...safeData.notifications]
          }))
        }
        
        lastFetchRef.current = new Date()
      } else {
        if (offset === 0) {
          setNotificationData({ notifications: [], totalCount: 0, unreadCount: 0, hasMore: false })
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      if (opts.offset === 0) {
        setNotificationData({ notifications: [], totalCount: 0, unreadCount: 0, hasMore: false })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [mounted, refreshing])

  // Mark as read
  const markAsRead = useCallback(async (notificationId: number) => {
    if (!mounted) return

    setNotificationData(prev => ({
      ...prev,
      notifications: (Array.isArray(prev.notifications) ? prev.notifications : []).map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true, readAt: new Date().toISOString() } : notif
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1)
    }))

    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST', credentials: 'include' })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [mounted])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!mounted) return

    setNotificationData(prev => ({
      ...prev,
      notifications: (Array.isArray(prev.notifications) ? prev.notifications : []).map(notif => ({
        ...notif, isRead: true, readAt: notif.readAt || new Date().toISOString()
      })),
      unreadCount: 0
    }))

    try {
      await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' })
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [mounted])

  // Initialize
  useEffect(() => {
    if (!mounted) return
    fetchNotifications({ force: true })
    
    intervalRef.current = setInterval(() => {
      if (!isOpen && mounted) fetchNotifications()
    }, 30000)
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [mounted, fetchNotifications, isOpen])

  // Safe data extraction
  const safeNotifications = Array.isArray(notificationData.notifications) ? notificationData.notifications : []
  const safeUnreadCount = Number(notificationData.unreadCount) || 0

  // Loading state for non-mounted
  if (!mounted) {
    return (
      <div className="relative">
        <button
          className="relative p-2 rounded-full bg-white/5 border border-white/10"
          disabled
          title="Cargando..."
        >
          <Bell className="w-4 h-4 text-white/70" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 ${
          safeUnreadCount > 0 ? 'ring-2 ring-red-400/30' : ''
        }`}
        title={`${safeUnreadCount} notificaciones no leídas`}
      >
        <Bell className={`w-4 h-4 transition-colors ${
          safeUnreadCount > 0 ? 'text-red-400' : 'text-white/70'
        }`} />
        {safeUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {safeUnreadCount > 99 ? '99+' : safeUnreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsOpen(false)} />
          
          <div className="fixed md:absolute inset-x-4 md:inset-x-auto md:right-0 top-20 md:top-full md:mt-2 w-auto md:w-96 max-w-sm md:max-w-none mx-auto md:mx-0 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
            
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <h3 className="text-white font-semibold">Notificaciones</h3>
                <span className="text-xs text-white/60">{safeUnreadCount} sin leer</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setRefreshing(true); fetchNotifications({ force: true }) }}
                  className="p-1.5 text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/10"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                {safeUnreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-2 py-1 text-xs text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/10"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-5 h-5 text-white/40 animate-spin" />
                  <span className="ml-2 text-white/60 text-sm">Cargando...</span>
                </div>
              ) : safeNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bell className="w-12 h-12 text-white/20 mb-3" />
                  <p className="text-white/60 text-sm">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {safeNotifications.map((notification) => {
                    const IconComponent = typeIcons[notification.type as keyof typeof typeIcons] || Bell
                    const typeLabel = typeLabels[notification.type as keyof typeof typeLabels] || notification.type
                    
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-white/5 transition-all ${
                          !notification.isRead ? 'bg-white/5 border-l-2 border-l-blue-400' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 p-2 rounded-lg ${priorityBgColors[notification.priority]}`}>
                            <IconComponent className={`w-4 h-4 ${priorityColors[notification.priority]}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="text-sm font-medium text-white leading-tight">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 text-white/40 hover:text-white transition-colors rounded"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            
                            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBgColors[notification.priority]} ${priorityColors[notification.priority]}`}>
                              {typeLabel}
                            </span>
                            
                            {notification.message && (
                              <p className="text-xs text-white/70 mt-2 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            
                            <p className="text-xs text-white/40 mt-2">
                              {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
