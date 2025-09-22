"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, memo, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"
import { usePermissionCheck } from "@/components/PermissionGuard"
import AdaptiveTransparency from "@/components/adaptive-transparency"
import DatabaseConfig from "@/components/db-config"
import NotificationBell from "@/components/notifications/NotificationBell"
import { Menu, X, Settings, LogOut, Home, Users, Monitor, Package, Printer, UserCircle, Shield, Cloud, ShoppingCart, Ticket } from "lucide-react"

function Header() {
  const [open, setOpen] = useState(false)
  const [showDbConfig, setShowDbConfig] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isIndexPage = pathname === '/index'

  // Auth and permissions
  const { user, isAdmin, isSuperAdmin, hasRole, hasPermission, isLoading } = useAuth()
  const { checkRole } = usePermissionCheck()


  // Check if running in PWA mode
  useEffect(() => {
    setMounted(true)
    // Only run on client side
    if (typeof window === 'undefined') return

    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          ('standalone' in window.navigator) ||
                          document.referrer.includes('android-app://')
      setIsPWA(isStandalone)
    }

    checkPWA()
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addListener(checkPWA)

    return () => mediaQuery.removeListener(checkPWA)
  }, [])

  // Block body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const navigationItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      requiresPermission: () => hasPermission('DASHBOARD', 'read') || hasRole(['ADMIN', 'TECHNICIAN'])
    },
    {
      href: "/employees",
      label: "Empleados",
      icon: Users,
      requiresPermission: () => hasPermission('EMPLOYEES', 'read') || hasRole(['ADMIN', 'MANAGER'])
    },
    {
      href: "/equipment",
      label: "Equipos",
      icon: Monitor,
      requiresPermission: () => hasPermission('EQUIPMENT', 'read') || hasRole(['ADMIN', 'TECHNICIAN'])
    },
    {
      href: "/inventory",
      label: "Inventario",
      icon: Package,
      requiresPermission: () => hasPermission('INVENTORY', 'read') || hasRole(['ADMIN', 'TECHNICIAN'])
    },
    {
      href: "/printers",
      label: "Impresoras",
      icon: Printer,
      requiresPermission: () => hasPermission('PRINTERS', 'read') || hasRole(['ADMIN', 'TECHNICIAN'])
    },
    {
      href: "/users",
      label: "Usuarios",
      icon: UserCircle,
      requiresPermission: () => hasPermission('USERS', 'read') || hasRole(['ADMIN'])
    },
    {
      href: "/admin",
      label: "Administración",
      icon: Shield,
      requiresPermission: () => hasPermission('ADMIN_PANEL', 'read') || isAdmin || isSuperAdmin
    },
    {
      href: "/backups",
      label: "Backups",
      icon: Cloud,
      requiresPermission: () => hasPermission('BACKUPS', 'read') || hasRole(['ADMIN', 'TECHNICIAN'])
    },
    {
      href: "/purchase-requests",
      label: "Compras",
      icon: ShoppingCart,
      requiresPermission: () => hasPermission('PURCHASE_REQUESTS', 'read') || hasRole(['ADMIN', 'TECHNICIAN'])
    },
    {
      href: "/tickets",
      label: "Solicitudes",
      icon: Ticket,
      requiresPermission: () => hasPermission('TICKETS', 'read') || hasRole(['ADMIN', 'TECHNICIAN'])
    },
  ]

  // Prevent hydration mismatch by not rendering until client-side mounted
  if (!mounted) {
    return (
      <header className="fixed left-0 right-0 z-50 bg-transparent top-0">
        <div className="relative flex items-center justify-between md:justify-center mx-auto w-full max-w-[1400px] px-4 md:px-6 py-3 md:py-4">
          <div className="md:hidden flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                className="p-2.5 rounded-lg bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
                disabled
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-sm w-9 h-9" />
              <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-sm w-9 h-9" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`fixed left-0 right-0 z-50 bg-transparent ${
      isPWA ? 'top-11' : 'top-0'
    }`}>
      <div className="relative flex items-center justify-between md:justify-center mx-auto w-full max-w-[1400px] px-4 md:px-6 py-3 md:py-4">

        {/* Mobile Header - Fixed with logo */}
        <div className="md:hidden flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              className="p-2.5 rounded-lg bg-white/10 backdrop-blur-sm text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
              style={{ WebkitBackdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(!open)}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setShowDbConfig(true)}
              className="p-2.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              style={{ WebkitBackdropFilter: 'blur(4px)' }}
              title="Configuración"
            >
              <Settings className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>



        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigationItems
            .filter(item => item.requiresPermission())
            .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200 ${
                pathname === item.href ? 'bg-white/10 text-white' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Controls */}
      <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 items-center gap-2">
        <NotificationBell />
        <button
          onClick={() => setShowDbConfig(true)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          title="Configuración de Base de Datos"
        >
            <Settings className="w-4 h-4 text-white/70" />
        </button>
        <button 
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="px-6 py-2 rounded-full bg-white text-black text-xs hover:bg-white/90 transition-all"
        >
          Logout
        </button>
      </div>
      </div>

      {/* Mobile Sidebar */}
      <>
        {/* Overlay */}
        <div
          className={`md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ WebkitBackdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
        
        {/* Sidebar */}
        <div className={`md:hidden fixed left-0 w-[85vw] max-w-[320px] z-50 transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`} style={{
          top: isPWA ? 'max(44px, env(safe-area-inset-top))' : '0',
          height: isPWA ? 'calc(100vh - max(44px, env(safe-area-inset-top)))' : '100vh'
        }}>
          <div className="h-full bg-black/95 backdrop-blur-xl border-r border-white/10 flex flex-col" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
            {/* Sidebar Header */}
            <div className="p-5 pt-8 border-b border-white/10">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                    <Image src="/appicon.png" alt="Logo" width={28} height={28} priority className="object-contain" />
                  </div>
                  <div>
                    <h2 className="text-white font-medium">Sistema Interno</h2>
                    <p className="text-xs text-white/50">Pretensa & Paschini</p>
                  </div>
                  </div>
                  <button 
                    onClick={() => setOpen(false)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                  <X className="w-5 h-5" />
                  </button>
                </div>
            </div>

            {/* Sidebar Navigation - With proper spacing and scroll */}
            <div className="flex-1 overflow-y-auto py-6 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              <nav className="px-4 space-y-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      onClick={() => setOpen(false)}
                      href={item.href}
                      className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-white/15 text-white shadow-lg scale-105'
                          : 'text-white/70 hover:text-white hover:bg-white/10 hover:scale-105'
                      }`}
                    >
                      <Icon className="w-6 h-6 flex-shrink-0" />
                      <span className="text-base font-medium">{item.label}</span>
                  </Link>
                  )
                })}
                </nav>
                  </div>

            {/* Sidebar Footer */}
            <div className="p-5 border-t border-white/10">
                  <button 
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      window.location.href = '/login';
                      setOpen(false);
                    }}
                className="flex items-center justify-center gap-3 w-full px-5 py-4 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-all duration-200 shadow-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
        </div>
      </>

      <DatabaseConfig
        isOpen={showDbConfig}
        onClose={() => setShowDbConfig(false)}
        onSave={(config) => {
          console.log('Configuración guardada:', config)
        }}
      />
    </header>
  )
}

export default memo(Header)