"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, memo, useEffect } from "react"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/lib/hooks/usePermissionsV2"
import NotificationBell from "@/components/notifications/NotificationBell"
import { Menu, X, Settings, LogOut, Home, Users, Monitor, Package, Printer, UserCircle, Shield, Cloud, ShoppingCart, Ticket, Crown, Key } from "lucide-react"

function Header() {
  const [open, setOpen] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const isIndexPage = pathname === '/index'

  // Auth and permissions
  const { user, can, loading } = usePermissions()
  const isAdmin = can('admin:access')
  const isSuperAdmin = can('superadmin:access')


  // Check if running in PWA mode and handle scroll
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

    const handleScroll = () => {
      const isScrolled = window.scrollY > 5
      setScrolled(isScrolled)
    }

    checkPWA()
    handleScroll()

    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addListener(checkPWA)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      mediaQuery.removeListener(checkPWA)
      window.removeEventListener('scroll', handleScroll)
    }
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
      requiresPermission: () => can('dashboard:view') || can('admin:access') || can('technician:access')
    },
    {
      href: "/employees",
      label: "Empleados",
      icon: Users,
      requiresPermission: () => can('employees:view') || can('admin:access') || can('manager:access')
    },
    {
      href: "/equipment",
      label: "Equipos",
      icon: Monitor,
      requiresPermission: () => can('equipment:view') || can('admin:access') || can('technician:access')
    },
    {
      href: "/inventory",
      label: "Inventario",
      icon: Package,
      requiresPermission: () => can('inventory:view') || can('admin:access') || can('technician:access')
    },
    {
      href: "/printers",
      label: "Impresoras",
      icon: Printer,
      requiresPermission: () => can('printers:view') || can('admin:access') || can('technician:access')
    },
    {
      href: "/tickets",
      label: "Solicitudes",
      icon: Ticket,
      requiresPermission: () => can('tickets:view') || can('admin:access') || can('technician:access')
    },
    {
      href: "/purchase-requests",
      label: "Compras",
      icon: ShoppingCart,
      requiresPermission: () => can('purchases:view') || can('admin:access') || can('technician:access')
    },
    {
      href: "/admin",
      label: "Administración",
      icon: Shield,
      requiresPermission: () => can('admin:access') || can('superadmin:access')
    },
    {
      href: "/backups",
      label: "Backups",
      icon: Cloud,
      requiresPermission: () => can('backups:view') || can('admin:access') || can('technician:access')
    },
  ]

  // Prevent hydration mismatch by not rendering until client-side mounted
  if (!mounted) {
    return (
      <header className="fixed left-0 right-0 z-50 bg-transparent top-0">
        <div className="relative flex items-center justify-center mx-auto w-full max-w-[1400px] px-4 md:px-6 py-3 md:py-4">
          <div className="md:hidden flex items-center justify-between w-full absolute left-0 px-4">
            <div className="flex items-center gap-3">
              <button
                className="p-2.5 rounded-lg bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
                disabled
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-lg bg-white/10 w-9 h-9" />
              <div className="p-2.5 rounded-lg bg-white/10 w-9 h-9" />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        isPWA ? 'top-11' : 'top-0'
      } ${scrolled ? 'md:left-4 md:right-4 md:top-4 left-0 right-0 top-0' : ''}`}
      style={{
        backgroundColor: scrolled ? 'rgba(0, 0, 0, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
        border: scrolled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
        borderRadius: scrolled ? '12px' : '0px',
        boxShadow: scrolled ? '0 4px 24px rgba(0, 0, 0, 0.25), 0 1px 0 rgba(255, 255, 255, 0.05)' : 'none'
      }}
    >
      <div className={`relative flex items-center justify-center mx-auto w-full max-w-[1400px] transition-all duration-500 ${
        scrolled ? 'px-1 md:px-4 py-1.5 md:py-3' : 'px-2 md:px-6 py-2 md:py-4'
      }`}>

        {/* Mobile Header - Minimal */}
        <div className={`md:hidden flex items-center justify-between w-full absolute left-0 transition-all duration-300 ${
          scrolled ? 'px-2' : 'px-4'
        }`}>
          <button
            className={`p-2 rounded-lg transition-all duration-200 ${
              scrolled
                ? 'bg-white/10 hover:bg-white/20'
                : 'bg-transparent hover:bg-white/10'
            }`}
            onClick={() => setOpen(!open)}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <NotificationBell />
        </div>

        {/* Desktop Navigation - Centered */}
        <nav className={`hidden md:flex items-center justify-center transition-all duration-300 ${
          scrolled ? 'space-x-1' : 'space-x-1'
        }`}>
          {navigationItems
            .filter(item => item.requiresPermission())
            .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-white/80 hover:text-white transition-all duration-200 rounded-full ${
                scrolled
                  ? 'text-xs font-light px-2.5 py-1.5 hover:bg-white/10'
                  : 'text-xs font-light px-3 py-2 hover:bg-white/10'
              } ${
                pathname === item.href ? 'bg-white/10 text-white' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Controls */}
        <div className={`hidden md:flex absolute items-center gap-2 transition-all duration-300 ${
          scrolled
            ? 'right-3 top-1/2 -translate-y-1/2'
            : 'right-4 md:right-6 top-1/2 -translate-y-1/2'
        }`}>
          <NotificationBell />
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className={`rounded-full bg-white text-black transition-all duration-200 hover:bg-white/90 ${
              scrolled
                ? 'px-4 py-1.5 text-xs'
                : 'px-6 py-2 text-xs'
            }`}
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
        
        {/* Sidebar - Exact Kiro.dev style */}
        <div className={`md:hidden fixed inset-0 z-50 ${
          open ? '' : 'pointer-events-none'
        }`}>
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              open ? 'opacity-50' : 'opacity-0'
            }`}
            onClick={() => setOpen(false)}
          />

          {/* Sidebar Panel */}
          <div className={`absolute left-0 top-0 h-full w-full max-w-[380px] transform transition-transform duration-300 ease-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="h-full bg-[#0a0a0a] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
                <div>
                  <h2 className="text-white font-medium text-sm">IT Portal</h2>
                  <p className="text-white/40 text-xs mt-0.5">Sistema de gestión</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 -mr-1.5 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto py-4">
                {/* Main Navigation */}
                <div className="px-3 space-y-0.5">
                  {navigationItems.slice(0, 5).filter(item => item.requiresPermission()).map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                          isActive
                            ? 'bg-white/[0.08] text-white'
                            : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] ${
                          isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                        }`} />
                        <span className="text-[14px] font-normal">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>

                {/* Resources Section */}
                <div className="mt-8 px-3">
                  <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.08em] px-3 mb-2">
                    RECURSOS
                  </h3>
                  <div className="space-y-0.5">
                    {navigationItems.slice(5).filter(item => item.requiresPermission()).map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                            isActive
                              ? 'bg-white/[0.08] text-white'
                              : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                          }`}
                        >
                          <Icon className={`w-[18px] h-[18px] ${
                            isActive ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                          }`} />
                          <span className="text-[14px] font-normal">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* External Links */}
                <div className="mt-8 px-3 pb-4">
                  <a
                    href="#"
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/[0.04] hover:text-white transition-all duration-200 group"
                  >
                    <span className="text-[14px] font-normal">Documentación</span>
                    <svg className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-white/60 hover:bg-white/[0.04] hover:text-white transition-all duration-200 group"
                  >
                    <span className="text-[14px] font-normal">Soporte</span>
                    <svg className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-white/[0.08]">
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/login';
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white transition-all duration-200 text-[14px] font-normal"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </>

    </header>
  )
}

export default memo(Header)