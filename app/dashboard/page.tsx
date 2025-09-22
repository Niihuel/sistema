"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import { useAuth } from "@/lib/hooks/useAuth"

const getStatusColorForChart = (statusName: string) => {
  // Mapear diferentes tipos de estados a colores consistentes
  const normalizedStatus = statusName.toLowerCase().trim()
  
  if (normalizedStatus.includes('activo') || normalizedStatus.includes('disponible') || normalizedStatus.includes('ok') || normalizedStatus.includes('success') || normalizedStatus.includes('exitoso')) {
    return 'bg-green-500'
  }
  if (normalizedStatus.includes('proceso') || normalizedStatus.includes('progress') || normalizedStatus.includes('partial') || normalizedStatus.includes('almacenamiento') || normalizedStatus.includes('reparación') || normalizedStatus.includes('reparacion')) {
    return 'bg-yellow-500'
  }
  if (normalizedStatus.includes('pendiente') || normalizedStatus.includes('abierto') || normalizedStatus.includes('pending') || normalizedStatus.includes('media') || normalizedStatus.includes('bajo')) {
    return 'bg-blue-500'
  }
  if (normalizedStatus.includes('inactivo') || normalizedStatus.includes('baja') || normalizedStatus.includes('cerrado') || normalizedStatus.includes('failed') || normalizedStatus.includes('out') || normalizedStatus.includes('agotado') || normalizedStatus.includes('urgente') || normalizedStatus.includes('alta')) {
    return 'bg-red-500'
  }
  return 'bg-gray-500'
}

const normalizeStatusText = (statusName: string) => {
  // Normalizar texto para mostrar correctamente en minúsculas apropiadas
  const normalizedStatus = statusName.toLowerCase().trim()
  
  switch (normalizedStatus) {
    case 'activo': return 'Activo'
    case 'inactivo': return 'Inactivo'
    case 'en almacenamiento': return 'En Almacenamiento'
    case 'en reparación': case 'en reparacion': return 'En Reparación'
    case 'de baja': return 'De Baja'
    case 'finalizado': return 'Finalizado'
    case 'disponible': return 'Disponible'
    case 'agotado': return 'Agotado'
    case 'bajo stock': return 'Bajo Stock'
    case 'abierto': return 'Abierto'
    case 'cerrado': return 'Cerrado'
    case 'resuelto': return 'Resuelto'
    case 'en progreso': return 'En Progreso'
    case 'pendiente': return 'Pendiente'
    case 'baja': return 'Baja'
    case 'media': return 'Media'
    case 'alta': return 'Alta'
    case 'urgente': return 'Urgente'
    default:
      // Capitalizar primera letra como fallback
      return statusName ? statusName.charAt(0).toUpperCase() + statusName.slice(1).toLowerCase() : statusName
  }
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, hasPermission, hasRole } = useAuth()
  const [data, setData] = useState<{
    openTickets: number
    totalEquipment: number
    activeEmployees: number
    equipmentByStatus?: { name: string; value: number }[]
    printersByStatus?: { name: string; value: number }[]
    purchasesByStatus?: { name: string; value: number }[]
    ticketsByPriority?: { name: string; value: number }[]
    employeesByArea?: { name: string; value: number }[]
    inventoryByCategory?: { name: string; value: number }[]
    backupsByStatus?: { name: string; value: number }[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/summary", {
          credentials: "same-origin"
        })
        if (!res.ok) throw new Error("No autorizado o error de servidor")
        setData(await res.json() as typeof data)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error inesperado"
        setError(msg)
      }
    }
    if (!authLoading) {
      load()
    }
  }, [authLoading]) 


  if (authLoading) {
    return (
      <AnimatedContainer className="text-white p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-white/60">Verificando autenticación...</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  // Check if user has permission to access dashboard
  if (!hasPermission('DASHBOARD', 'read') && !hasRole(['ADMIN', 'TECHNICIAN', 'MANAGER', 'SUPPORT'])) {
    return (
      <AnimatedContainer className="text-white p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para acceder al dashboard.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="text-white p-4 sm:p-6">
      <FadeInUp delay={0.1}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
          <p className="text-white/70">Vista general del sistema de gestión IT</p>
        </div>
      </FadeInUp>
      
      {error && <FadeInUp delay={0.2}><p className="text-red-400 mb-4">{error}</p></FadeInUp>}
      
      {!data ? (
        <FadeInUp delay={0.3}><p className="text-white/70">Cargando...</p></FadeInUp>
      ) : (
        <>
        <FadeInUp delay={0.3}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/60 text-sm">Tickets abiertos</p>
            <p className="text-4xl font-bold">{data.openTickets}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/60 text-sm">Equipos totales</p>
            <p className="text-4xl font-bold">{data.totalEquipment}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-white/60 text-sm">Empleados activos</p>
            <p className="text-4xl font-bold">{data.activeEmployees}</p>
          </div>
          </div>
        </FadeInUp>
        
        {/* Separator line between stats and charts */}
        <div className="my-8 border-b border-white/10"></div>
        
        {/* Mini charts estilo barras suaves */}
        <FadeInUp delay={0.4}>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Equipos por estado", rows: data.equipmentByStatus }, 
            { title: "Impresoras por estado", rows: data.printersByStatus }, 
            { title: "Compras por estado", rows: data.purchasesByStatus },
            { title: "Tickets por prioridad", rows: data.ticketsByPriority },
            { title: "Empleados por área", rows: data.employeesByArea },
            { title: "Inventario por categoría", rows: data.inventoryByCategory }
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70 mb-3">{c.title}</p>
              <div className="space-y-2">
                {(c.rows ?? []).length === 0 && <p className="text-white/50 text-xs">Sin datos</p>}
                {(c.rows ?? []).slice(0, 5).map((r) => (
                  <div key={r.name} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-20">
                      <div className={`w-2 h-2 rounded-full ${getStatusColorForChart(r.name)} flex-shrink-0`}></div>
                      <span className="text-xs text-white/70 truncate" title={r.name}>{normalizeStatusText(r.name)}</span>
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full ${getStatusColorForChart(r.name)}`} style={{ width: `${Math.min(100, (r.value || 0) * 10)}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs text-white/80">{r.value}</span>
                  </div>
                ))}
                {(c.rows ?? []).length > 5 && (
                  <p className="text-xs text-white/50 mt-1">+{(c.rows ?? []).length - 5} más</p>
                )}
              </div>
            </div>
          ))}
          </div>
        </FadeInUp>
        
        {/* Separator line between charts and quick access */}
        <div className="my-8 border-b border-white/10"></div>
        
        {/* Accesos rápidos */}
        <FadeInUp delay={0.5}>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/equipment" className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Equipos</h3>
                <p className="text-xs text-white/60">Gestionar inventario</p>
              </div>
            </div>
          </a>
          
          <a href="/tickets" className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Solicitudes</h3>
                <p className="text-xs text-white/60">Tickets urgentes</p>
              </div>
            </div>
          </a>
          
          <a href="/printers" className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Impresoras</h3>
                <p className="text-xs text-white/60">Control dispositivos</p>
              </div>
            </div>
          </a>
          
          <Link href="/employees" className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Empleados</h3>
                <p className="text-xs text-white/60">Gestión personal</p>
              </div>
            </div>
          </Link>
          </div>
        </FadeInUp>
        </>
      )}
    </AnimatedContainer>
  )
}
