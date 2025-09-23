"use client"

import { useEffect, useMemo, useState } from "react"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import Button from "@/components/button"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import MobileTable from "@/components/mobile-table"
import Select from "@/components/select"
import SearchableSelect from "@/components/searchable-select"
import { validateForm, ValidationRule } from "@/lib/validation"
import { AREA_OPTIONS } from "@/lib/constants/areas"
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from "@/lib/professional-export"
import { useAppAuth } from "@/lib/hooks/useAppAuth"
import { useToast } from "@/lib/hooks/use-toast"
import { usePermissionToast } from "@/lib/hooks/usePermissionToast"

type Ticket = {
  id: number
  title: string
  description?: string | null
  status: string
  priority: string
  requestorId: number
  technicianId?: number | null
  solution?: string | null
  category?: string | null
  area?: string | null
  ipAddress?: string | null
  resolutionTime?: string | null
}

const statusOptions = ["Abierto", "En Progreso", "Resuelto", "Cerrado"]
const priorityOptions = ["Baja", "Media", "Alta", "Urgente"]
const categoryOptions = [
  "Problemas técnicos", "Internet", "Calipso", "Programas", "Impresoras",
  "Cámaras", "Capacitación", "Qnap/Z", "Mail", "Reunión",
  "Antivirus", "Generador", "Hardware", "Otros"
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Abierto': return 'bg-blue-500/10 text-blue-400'
    case 'En Progreso': return 'bg-yellow-500/10 text-yellow-400'
    case 'Resuelto': return 'bg-green-500/10 text-green-400'
    case 'Cerrado': return 'bg-gray-500/10 text-gray-400'
    default: return 'bg-gray-500/10 text-gray-400'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Baja': return 'bg-gray-500/10 text-gray-400'
    case 'Media': return 'bg-blue-500/10 text-blue-400'
    case 'Alta': return 'bg-yellow-500/10 text-yellow-400'
    case 'Urgente': return 'bg-red-500/10 text-red-400'
    default: return 'bg-gray-500/10 text-gray-400'
  }
}

export default function TicketsPage() {
  const { isAuthenticated, loading: authLoading, can } = useAppAuth()
  const { showPermissionError } = usePermissionToast()
  const [items, setItems] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState<string | "">("")
  const [priority, setPriority] = useState<string | "">("")
  const [technicianId, setTechnicianId] = useState("")

  const [editing, setEditing] = useState<Ticket | null>(null)
  const [form, setForm] = useState<Partial<Ticket>>({ status: "Abierto", priority: "Media" })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  // Toast notifications
  const { showSuccess, showError } = useToast()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Status change modal states
  const [statusChangeTicket, setStatusChangeTicket] = useState<Ticket | null>(null)
  const [statusChangeForm, setStatusChangeForm] = useState<{
    status: string
    solution: string
    resolutionTime: string
  }>({ status: "", solution: "", resolutionTime: "" })
  
  const [employees, setEmployees] = useState<{ id: number; firstName: string; lastName: string; area?: string }[]>([])
  const [systemTechnicians, setSystemTechnicians] = useState<{ id: number; firstName: string; lastName: string; userId?: number }[]>([])

  const filtered = useMemo(() => items, [items])

  if (authLoading) {
    return (
      <AnimatedContainer className="text-white p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Verificando autenticación...</div>
        </div>
      </AnimatedContainer>
    )
  }

  if (!isAuthenticated) {
    return (
      <AnimatedContainer className="text-white p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso denegado</div>
            <div className="text-white/60">Debes iniciar sesión para gestionar tickets.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  // Check if user has permission to access tickets
  if (!can('tickets:view')) {
    return (
      <AnimatedContainer className="text-white p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para acceder a las solicitudes.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      if (priority) params.set("priority", priority)
      if (technicianId) params.set("technicianId", technicianId)
      
      const [ticketsRes, employeesRes, techniciansRes] = await Promise.all([
        fetch(`/api/tickets?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/employees"),
        fetch("/api/technicians-improved")
      ])
      
      if (!ticketsRes.ok) throw new Error("Error cargando tickets")
      setItems(await ticketsRes.json())
      
      if (employeesRes.ok) {
        const empData = await employeesRes.json()
        const allEmployees = Array.isArray(empData) ? empData : (empData.items ?? [])
        setEmployees(allEmployees)
      }
      
      if (techniciansRes.ok) {
        const techniciansData = await techniciansRes.json()
        const allTechnicians = Array.isArray(techniciansData) ? techniciansData : []
        setSystemTechnicians(allTechnicians)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openCreate() {
    if (!can('tickets:create')) {
      showPermissionError('No tienes permisos para crear solicitudes')
      return
    }
    setEditing(null)
    setForm({ status: "Abierto", priority: "Media" })
    setIsFormOpen(true)
  }

  function openEdit(ticket: Ticket) {
    if (!can('tickets:edit')) {
      showPermissionError('No tienes permisos para editar solicitudes')
      return
    }
    setEditing(ticket)
    setForm(ticket)
    setIsFormOpen(true)
  }

  function openStatusChange(ticket: Ticket) {
    if (!can('tickets:edit')) {
      showPermissionError('No tienes permisos para cambiar el estado de solicitudes')
      return
    }
    setStatusChangeTicket(ticket)
    setStatusChangeForm({
      status: ticket.status === "Abierto" ? "Resuelto" : "Cerrado",
      solution: ticket.solution || "",
      resolutionTime: ticket.resolutionTime || ""
    })
  }

  async function saveStatusChange() {
    if (!statusChangeTicket) return
    
    try {
      const payload = {
        ...statusChangeTicket,
        status: statusChangeForm.status,
        solution: statusChangeForm.solution,
        resolutionTime: statusChangeForm.resolutionTime
      }
      
      const res = await fetch(`/api/tickets/${statusChangeTicket.id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error actualizando estado")
      
      setStatusChangeTicket(null)
      setStatusChangeForm({ status: "", solution: "", resolutionTime: "" })
      showSuccess(`Solicitud ${statusChangeForm.status === 'Resuelto' ? 'resuelta' : 'cerrada'} correctamente`)
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      showError(msg)
    }
  }

  const handleExportExcel = async () => {
    try {
      const exportData = filtered.map(ticket => ({
        title: ticket.title || '-',
        description: ticket.description || '-',
        status: ticket.status || '-',
        priority: ticket.priority || '-',
        category: ticket.category || '-',
        area: ticket.area || '-',
        requestorId: ticket.requestorId ? ticket.requestorId.toString() : '-',
        technicianId: ticket.technicianId ? ticket.technicianId.toString() : '-',
        ipAddress: ticket.ipAddress || '-',
        resolutionTime: ticket.resolutionTime || '-',
        solution: ticket.solution || '-'
      }))

      const columnMap = {
        title: 'Título',
        description: 'Descripción',
        status: 'Estado',
        priority: 'Prioridad',
        category: 'Categoría',
        area: 'Área',
        requestorId: 'Solicitante',
        technicianId: 'Técnico Asignado',
        ipAddress: 'Dirección IP',
        resolutionTime: 'Tiempo de Resolución',
        solution: 'Solución'
      }
      
      const exportOptions = prepareDataForExport(exportData, columnMap, {
        title: 'Reporte de Solicitudes de Soporte',
        subtitle: 'Sistema de Tickets - Pretensa & Paschini',
        department: 'Sistemas',
        author: 'Sistema de Gestión'
      })
      
      const result = await exportToProfessionalExcel(exportOptions)
      
      if (result.success) {
        showSuccess(result.message)
      } else {
        showError(result.message)
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      showError('Error inesperado al exportar a Excel. Por favor, intenta nuevamente.')
    }
  }

  const handleExportPDF = async () => {
    try {
      const exportData = filtered.map(ticket => ({
        title: ticket.title || '-',
        status: ticket.status || '-',
        priority: ticket.priority || '-',
        category: ticket.category || '-',
        area: ticket.area || '-',
        requestorId: ticket.requestorId ? ticket.requestorId.toString() : '-',
        technicianId: ticket.technicianId ? ticket.technicianId.toString() : '-'
      }))

      const columnMap = {
        title: 'Título',
        status: 'Estado',
        priority: 'Prioridad',
        category: 'Categoría',
        area: 'Área',
        requestorId: 'Solicitante',
        technicianId: 'Técnico'
      }
      
      const exportOptions = prepareDataForExport(exportData, columnMap, {
        title: 'Reporte de Solicitudes de Soporte',
        subtitle: 'Sistema de Tickets - Pretensa & Paschini',
        department: 'Sistemas',
        author: 'Sistema de Gestión'
      })
      
      const result = await exportToProfessionalPDF(exportOptions)
      
      if (result.success) {
        showSuccess(result.message)
      } else {
        showError(result.message)
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      showError('Error inesperado al exportar a PDF. Por favor, intenta nuevamente.')
    }
  }

  const validationRules: ValidationRule[] = [
    { field: 'title', required: true, minLength: 3, maxLength: 200 },
    { field: 'requestorId', required: true, custom: (value) => {
      if (!value || value === '') return 'Solicitante es requerido'
      return null
    }},
    { field: 'ipAddress', type: 'ip' }
  ]

  async function save() {
    setError(null)
    setFormErrors({})
    
    const validation = validateForm(form, validationRules)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      showError(validation.firstError || 'Por favor corrige los errores en el formulario')
      return
    }
    
    try {
      const payload = {
        title: form.title ?? "Solicitud",
        description: form.description || null,
        status: form.status || "Abierto",
        priority: form.priority || "Media",
        requestorId: form.requestorId ? Number(form.requestorId) : null,
        technicianId: form.technicianId ? Number(form.technicianId) : null,
        solution: form.solution || null,
        category: form.category || null,
        area: form.area || null,
        ipAddress: form.ipAddress || null,
        resolutionTime: form.resolutionTime || null,
      }
      let res: Response
      if (editing) {
        res = await fetch(`/api/tickets/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      } else {
        res = await fetch(`/api/tickets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Error guardando")
      setEditing(null)
      setForm({ status: "Abierto", priority: "Media" })
      setFormErrors({})
      setIsFormOpen(false)
      showSuccess(editing ? 'Solicitud actualizada correctamente' : 'Solicitud creada correctamente')
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      setError(msg)
    }
  }

  const mobileColumns = [
    { key: "title", label: "Título" },
    { key: "priority", label: "Prioridad" },
    { key: "status", label: "Estado" },
    { key: "requestorId", label: "Solicitante" },
    { key: "technicianId", label: "Técnico", render: (value: unknown) => {
      if (!value) return "-"
      const tech = systemTechnicians.find(t => t.id === Number(value))
      return tech ? `${tech.firstName} ${tech.lastName}` : String(value)
    } },
    { 
      key: "actions", 
      label: "Acciones", 
      render: (_: unknown, item: Record<string, unknown>) => {
        const ticket = item as Ticket
        return (
          <div className="flex gap-2 justify-end">
            {(ticket.status === "Abierto" || ticket.status === "En Progreso") && can('tickets:edit') && (
              <Button
                onClick={() => openStatusChange(ticket)}
                variant="ghost"
                small
                className="text-xs text-green-400 hover:text-green-300"
              >
                Cambiar Estado
              </Button>
            )}
            {can('tickets:edit') && (
              <Button onClick={() => openEdit(ticket)} variant="ghost" small>Editar</Button>
            )}
            {can('tickets:delete') && (
              <Button onClick={() => setDeleteId(ticket.id)} small>Eliminar</Button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      {/* Header */}
      <FadeInUp delay={0.05}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Solicitudes</h1>
          <p className="text-white/70">Gestión de tickets y solicitudes de soporte técnico</p>
        </div>
      </FadeInUp>

      {/* Filters */}
      <FadeInUp delay={0.1}>
        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
            <div className="w-full sm:w-auto">
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Estado</label>
              <Select value={status} onChange={setStatus} options={[{ value: "", label: "Todos" }, ...statusOptions.map(s => ({ value: s, label: s }))]} />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Prioridad</label>
              <Select value={priority} onChange={setPriority} options={[{ value: "", label: "Todas" }, ...priorityOptions.map(s => ({ value: s, label: s }))]} />
            </div>
            <div className="w-full sm:w-auto sm:min-w-[150px]">
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Técnico ID</label>
              <input value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="ID del técnico" />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button onClick={() => load()} className="text-sm">Filtrar</Button>
              {can('tickets:create') && (
                <Button onClick={() => openCreate()} variant="ghost" className="text-sm">Nueva Solicitud</Button>
              )}
              {can('tickets:export') && (
                <>
                  <Button onClick={handleExportExcel} variant="ghost" className="text-sm">Excel</Button>
                  <Button onClick={handleExportPDF} variant="ghost" className="text-sm">PDF</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </FadeInUp>

      <div className="mb-8 border-b border-white/10"></div>

      {error && <FadeInUp delay={0.2}><div className="mb-4 text-red-400 text-sm">{error}</div></FadeInUp>}

      {/* Desktop Table */}
      <FadeInUp delay={0.3} className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-white/70">
                <th className="p-2 sm:p-3">Título</th>
                <th className="p-2 sm:p-3">Prioridad</th>
                <th className="p-2 sm:p-3">Estado</th>
                <th className="p-2 sm:p-3">Solicitante</th>
                <th className="p-2 sm:p-3">Técnico</th>
                <th className="p-2 sm:p-3 w-28">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-2 sm:p-3" colSpan={6}>Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="p-2 sm:p-3" colSpan={6}>Sin resultados</td></tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-2 sm:p-3">{t.title}</td>
                    <td className="p-2 sm:p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3">{employees.find(emp => emp.id === t.requestorId)?.firstName ? `${employees.find(emp => emp.id === t.requestorId)?.firstName} ${employees.find(emp => emp.id === t.requestorId)?.lastName}` : t.requestorId}</td>
                    <td className="p-2 sm:p-3">{t.technicianId ? (systemTechnicians.find(tech => tech.id === t.technicianId) ? `${systemTechnicians.find(tech => tech.id === t.technicianId)?.firstName} ${systemTechnicians.find(tech => tech.id === t.technicianId)?.lastName}` : t.technicianId) : "-"}</td>
                    <td className="p-2 sm:p-3">
                      <div className="flex gap-1 sm:gap-2">
                        {(t.status === "Abierto" || t.status === "En Progreso") && can('tickets:edit') && (
                          <Button
                            onClick={() => openStatusChange(t)}
                            variant="ghost"
                            small
                            className="text-xs text-green-400 hover:text-green-300"
                          >
                            Cambiar Estado
                          </Button>
                        )}
                        {can('tickets:edit') && (
                          <Button onClick={() => openEdit(t)} variant="ghost" small className="text-xs">Editar</Button>
                        )}
                        {can('tickets:delete') && (
                          <Button onClick={() => setDeleteId(t.id)} small className="text-xs">Eliminar</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FadeInUp>

      {/* Mobile Cards */}
      <FadeInUp delay={0.3} className="md:hidden">
        <MobileTable 
          data={filtered} 
          columns={mobileColumns}
          loading={loading}
          emptyMessage="Sin tickets encontrados"
        />
      </FadeInUp>

      {/* Status Change Modal */}
      <Modal 
        open={!!statusChangeTicket} 
        onClose={() => {
          setStatusChangeTicket(null)
          setStatusChangeForm({ status: "", solution: "", resolutionTime: "" })
        }} 
        title={`Cambiar Estado - ${statusChangeTicket?.title || ''}`}
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
              onClick={() => {
                setStatusChangeTicket(null)
                setStatusChangeForm({ status: "", solution: "", resolutionTime: "" })
              }} 
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button 
              onClick={() => saveStatusChange()} 
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base"
              disabled={!statusChangeForm.status || (!statusChangeForm.solution && statusChangeForm.status !== 'Cerrado')}
            >
              {statusChangeForm.status === 'Resuelto' ? 'Resolver' : 'Cerrar'} Solicitud
            </button>
          </div>
        )}
      >
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          {/* Current ticket info */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h4 className="text-white font-medium mb-2">Información de la Solicitud</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/60">Estado actual:</span>
                <div className="mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(statusChangeTicket?.status || '')}`}>
                    {statusChangeTicket?.status}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-white/60">Prioridad:</span>
                <div className="mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(statusChangeTicket?.priority || '')}`}>
                    {statusChangeTicket?.priority}
                  </span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-white/60">Descripción:</span>
                <p className="text-white text-sm mt-1">{statusChangeTicket?.description || 'Sin descripción'}</p>
              </div>
            </div>
          </div>
          
          {/* Status change form */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Cambio de Estado</h4>
            
            <div>
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Nuevo Estado *</label>
              <Select 
                value={statusChangeForm.status} 
                onChange={(v) => setStatusChangeForm({ ...statusChangeForm, status: v })} 
                options={[
                  { value: "Resuelto", label: "Resuelto" },
                  { value: "Cerrado", label: "Cerrado" }
                ]} 
              />
            </div>
            
            {statusChangeForm.status === 'Resuelto' && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm text-white/70 mb-1">Tiempo de Resolución</label>
                  <input 
                    value={statusChangeForm.resolutionTime} 
                    onChange={(e) => setStatusChangeForm({ ...statusChangeForm, resolutionTime: e.target.value })} 
                    className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" 
                    placeholder="Ej: 30 min, 2 horas, 1 día" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm text-white/70 mb-1">Solución Aplicada *</label>
                  <textarea 
                    value={statusChangeForm.solution} 
                    onChange={(e) => setStatusChangeForm({ ...statusChangeForm, solution: e.target.value })} 
                    className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" 
                    rows={4} 
                    placeholder="Describe detalladamente la solución que se aplicó al problema..."
                    required
                  />
                </div>
              </>
            )}
            
            {statusChangeForm.status === 'Cerrado' && (
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Motivo del Cierre *</label>
                <textarea 
                  value={statusChangeForm.solution} 
                  onChange={(e) => setStatusChangeForm({ ...statusChangeForm, solution: e.target.value })} 
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" 
                  rows={3} 
                  placeholder="Explica por qué se cierra esta solicitud (duplicada, no aplica, cancelada por usuario, etc.)"
                  required
                />
              </div>
            )}
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-blue-400 text-xs">
                  <p className="font-medium">Información importante:</p>
                  <p className="mt-1">
                    {statusChangeForm.status === 'Resuelto' 
                      ? 'Al marcar como "Resuelto", la solicitud se considerará completada. Asegúrate de documentar la solución aplicada.'
                      : 'Al marcar como "Cerrado", la solicitud se archivará sin resolución. Solo úsalo para solicitudes que no requieren acción.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Form Modal */}
      <Modal 
        open={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "Abierto", priority: "Media" }) }} 
        title={editing ? "Editar Solicitud" : "Nueva Solicitud"}
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "Abierto", priority: "Media" }) }} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cancelar</button>
            <button onClick={() => save()} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base">Guardar</button>
          </div>
        )}
      >
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          {/* Información Básica */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Información Básica</h3>
            <div>
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Título *</label>
              <input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`w-full px-3 py-2 rounded-md bg-black/30 border text-sm ${formErrors.title ? 'border-red-400' : 'border-white/10'}`} placeholder="Título de la solicitud" />
              {formErrors.title && <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Descripción</label>
              <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" rows={3} placeholder="Describe el problema o solicitud..." />
            </div>
          </div>
          
          {/* Categorización */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Categorización</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Categoría</label>
                <Select value={form.category ?? ""} onChange={(v) => setForm({ ...form, category: v })} options={[{ value: "", label: "Seleccionar categoría..." }, ...categoryOptions.map(s => ({ value: s, label: s }))]} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Prioridad</label>
                <Select value={form.priority ?? "Media"} onChange={(v) => setForm({ ...form, priority: v })} options={priorityOptions.map(s => ({ value: s, label: s }))} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Estado</label>
                <Select value={form.status ?? "Abierto"} onChange={(v) => setForm({ ...form, status: v })} options={statusOptions.map(s => ({ value: s, label: s }))} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Área</label>
                <SearchableSelect value={form.area ?? ""} onChange={(v) => setForm({ ...form, area: v })} options={AREA_OPTIONS} searchPlaceholder="Buscar área..." placeholder="Seleccionar área" />
              </div>
            </div>
          </div>
          
          {/* Información Técnica */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Información Técnica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Dirección IP</label>
                <input value={form.ipAddress ?? ""} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="192.168.1.10" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Solicitante *</label>
                <SearchableSelect 
                  value={String(form.requestorId || "")} 
                  onChange={(v) => setForm({ ...form, requestorId: v ? Number(v) : undefined })} 
                  options={[{ value: "", label: "Seleccionar empleado..." }, ...employees.map(emp => ({ value: String(emp.id), label: `${emp.firstName} ${emp.lastName}${emp.area ? ` - ${emp.area}` : ''}` }))]}
                  searchPlaceholder="Buscar empleado..."
                  className={formErrors.requestorId ? 'border-red-400' : ''}
                />
                {formErrors.requestorId && <p className="text-red-400 text-xs mt-1">{formErrors.requestorId}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Técnico Asignado</label>
                <SearchableSelect 
                  value={String(form.technicianId || "")} 
                  onChange={(v) => setForm({ ...form, technicianId: v ? Number(v) : undefined })} 
                  options={[{ value: "", label: "Sin asignar..." }, ...systemTechnicians.map(tech => ({ value: String(tech.id), label: `${tech.firstName} ${tech.lastName}` }))]}
                  searchPlaceholder="Buscar técnico..."
                />
              </div>
            </div>
          </div>
          
          {/* Resolución (solo visible al editar) */}
          {editing && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Resolución</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm text-white/70 mb-1">Tiempo de Resolución</label>
                  <input value={form.resolutionTime ?? ""} onChange={(e) => setForm({ ...form, resolutionTime: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="120 min" />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Solución</label>
                <textarea value={form.solution ?? ""} onChange={(e) => setForm({ ...form, solution: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" rows={3} placeholder="Describe la solución aplicada..." />
              </div>
            </div>
          )}
        </div>
      </Modal>


      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar Solicitud"
        description="Esta acción no se puede deshacer"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId != null) {
            if (!can('tickets:delete')) {
              showPermissionError('No tienes permisos para eliminar solicitudes')
              setDeleteId(null)
              return
            }
            const res = await fetch(`/api/tickets/${deleteId}`, { method: "DELETE" });
            if (res.ok) await load();
            setDeleteId(null)
          }
        }}
      />
    </AnimatedContainer>
  )
}
