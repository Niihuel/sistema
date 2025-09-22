"use client"

import { useEffect, useMemo, useState } from "react"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import Button from "@/components/button"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import MobileTable from "@/components/mobile-table"
import Select from "@/components/select"
import SearchableSelect from "@/components/searchable-select"
import CustomNotification from "@/components/notification"
import PermissionGuard from "@/components/PermissionGuard"
import { validateForm, ValidationRule } from "@/lib/validation"
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from "@/lib/professional-export"
import { useAuth } from "@/lib/hooks/useAuth"
import { usePermissionToast } from "@/lib/hooks/usePermissionToast"

type Equipment = {
  id: number
  name: string
  type: string
  status: string
  location?: string | null
  area?: string | null
  serialNumber?: string | null
  ip?: string | null
  macAddress?: string | null
  // Campos específicos para computadoras/laptops
  cpuNumber?: string | null
  motherboard?: string | null
  processor?: string | null
  ram?: string | null
  storage?: string | null
  operatingSystem?: string | null
  brand?: string | null
  model?: string | null
  assignedToId?: number | null
  // Nuevos campos agregados
  storageType?: string | null
  storageCapacity?: string | null
  ipAddress?: string | null
  screenSize?: string | null
  dvdUnit?: boolean
  purchaseDate?: string | null
  notes?: string | null
  isPersonalProperty?: boolean
}

// Datos reales extraídos de los Excel
const typeOptions = ["Desktop", "Notebook", "Celular", "Modem", "Tablet", "Impresora", "Servidor", "Otro"]
const statusOptions = ["Activo", "En Almacenamiento", "De Baja", "En Reparación", "Finalizado"]

// Áreas predefinidas
const AREAS = [
  "RRHH", "sistemas", "compras", "calidad", "finanzas", "directorio",
  "tecnica pretensa", "tecnica paschini", "ventas", "produccion", 
  "logistica", "laboratorio", "taller pretensa", "taller paschini",
  "pañol", "mantenimiento", "proveedores", "recepcion", "guardia",
  "planta hormigonera", "comedor"
]

// Ubicaciones predefinidas
const LOCATIONS = [
  "administración", "producción", "planta hormigonera", "laboratorio", "exterior"
]

// Sistemas operativos predefinidos
const OPERATING_SYSTEMS = [
  "Windows 10 Pro", "Windows 10 Home", "Windows 11 Pro", "Windows 11 Home",
  "Windows Server 2019", "Windows Server 2022", "Ubuntu 20.04", "Ubuntu 22.04",
  "CentOS 7", "CentOS 8", "macOS Monterey", "macOS Ventura"
]

  const getStatusStyle = (status: string) => {
    // Normalizar el estado para manejar diferentes casos
    const normalizedStatus = status?.toLowerCase()?.trim()
    switch (normalizedStatus) {
      case 'activo':
        return 'bg-green-500/10 text-green-400'
      case 'en almacenamiento':
        return 'bg-blue-500/10 text-blue-400'
      case 'en reparación':
      case 'en reparacion':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'de baja':
      case 'finalizado':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-gray-500/10 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    // Normalizar el texto para mostrar correctamente
    const normalizedStatus = status?.toLowerCase()?.trim()
    switch (normalizedStatus) {
      case 'activo':
        return 'Activo'
      case 'en almacenamiento':
        return 'En Almacenamiento'
      case 'en reparación':
      case 'en reparacion':
        return 'En Reparación'
      case 'de baja':
        return 'De Baja'
      case 'finalizado':
        return 'Finalizado'
      default:
        // Capitalizar primera letra como fallback
        return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : status
    }
  }
const storageTypes = ["SSD", "HDD", "N/A"]

export default function EquipmentPage() {
  const { hasRole, hasPermission, isLoading: authLoading, user, isAuthenticated } = useAuth()
  const { showPermissionError, showAdminOnlyError } = usePermissionToast()
  
  // Check permissions first
  if (authLoading) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Cargando equipos...</div>
        </div>
      </AnimatedContainer>
    )
  }

  if (!isAuthenticated) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">Debes iniciar sesión para acceder a esta página.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  if (!hasPermission('EQUIPMENT', 'read') && !hasRole(['ADMIN', 'TECHNICIAN'])) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para acceder a la gestión de equipos.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }
  const [items, setItems] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<string | "">("")
  const [status, setStatus] = useState<string | "">("")
  const [location, setLocation] = useState("")

  const [editing, setEditing] = useState<Equipment | null>(null)
  const [form, setForm] = useState<Partial<Equipment>>({ status: "Activo", type: "Desktop" })
  const [employees, setEmployees] = useState<{ id: number; firstName: string; lastName: string }[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [viewItem, setViewItem] = useState<Equipment | null>(null)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(() => items, [items])

  // Export functions
  const handleExportExcel = async () => {
    try {
      const exportData = filtered.map(equipment => ({
        id: equipment.id,
        name: equipment.name,
        type: equipment.type,
        status: getStatusLabel(equipment.status),
        location: equipment.location || '-',
        serialNumber: equipment.serialNumber || '-',
        ip: equipment.ip || '-',
        assignedTo: equipment.assignedToId ? `ID: ${equipment.assignedToId}` : 'No asignado'
      }))

      const exportOptions = prepareDataForExport(exportData, {
        id: 'ID',
        name: 'Nombre',
        type: 'Tipo',
        status: 'Estado',
        location: 'Ubicación',
        serialNumber: 'N° Serie',
        ip: 'IP',
        assignedTo: 'Asignado a'
      }, {
        title: 'Reporte de Equipos',
        subtitle: `${filtered.length} equipos encontrados`,
        department: 'Sistemas',
        author: 'Sistema de Gestión'
      })

      const result = await exportToProfessionalExcel(exportOptions)
      setNotification({ type: result.success ? 'success' : 'error', message: result.message })
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al exportar a Excel' })
    }
  }

  const handleExportPDF = async () => {
    try {
      const exportData = filtered.map(equipment => ({
        name: equipment.name,
        type: equipment.type,
        status: getStatusLabel(equipment.status),
        location: equipment.location || '-',
        serialNumber: equipment.serialNumber || '-',
        assignedTo: equipment.assignedToId ? `ID: ${equipment.assignedToId}` : 'No asignado'
      }))

      const exportOptions = prepareDataForExport(exportData, {
        name: 'Nombre',
        type: 'Tipo',
        status: 'Estado',
        location: 'Ubicación',
        serialNumber: 'N° Serie',
        assignedTo: 'Asignado a'
      }, {
        title: 'Reporte de Equipos',
        subtitle: `${filtered.length} equipos`,
        department: 'Sistemas',
        author: 'Sistema de Gestión'
      })

      const result = await exportToProfessionalPDF(exportOptions)
      setNotification({ type: result.success ? 'success' : 'error', message: result.message })
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al exportar a PDF' })
    }
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (type) params.set("type", type)
      if (status) params.set("status", status)
      if (location) params.set("location", location)
      const [equipRes, empRes] = await Promise.all([
        fetch(`/api/equipment?${params.toString()}`, { cache: "no-store" }),
        fetch('/api/employees')
      ])
      if (!equipRes.ok) throw new Error("Error cargando equipos")
      setItems(await equipRes.json())
      if (empRes.ok) {
        const empData = await empRes.json()
        setEmployees(Array.isArray(empData) ? empData : (empData.items ?? []))
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
    setEditing(null)
    setForm({ status: "Activo", type: "Desktop" })
    setIsFormOpen(true)
  }

  function openEdit(p: Equipment) {
    setEditing(p)
    setForm(p)
    setIsFormOpen(true)
  }

  const validationRules: ValidationRule[] = [
    { field: 'name', required: true, minLength: 2, maxLength: 100 },
    { field: 'type', required: true },
    { field: 'status', required: true },
    { field: 'ip', type: 'ip' },
    { field: 'ipAddress', type: 'ip' },
    { 
      field: 'macAddress', 
      type: 'mac',
      custom: (value) => {
        if (!value) return null
        if (!/^([0-9A-Fa-f]{2}([:\-])){5}([0-9A-Fa-f]{2})$/.test(value)) {
          return 'La dirección MAC debe tener el formato AA:BB:CC:DD:EE:FF (6 pares de caracteres hexadecimales separados por dos puntos)'
        }
        return null
      }
    },
    { field: 'serialNumber', minLength: 3 }
  ]

  async function save() {
    setError(null)
    setFormErrors({})

    // Check permissions before saving
    if (editing) {
      if (!hasPermission('EQUIPMENT', 'update') && !hasRole(['ADMIN', 'TECHNICIAN'])) {
        setNotification({ type: 'error', message: 'No tienes permisos para editar equipos' })
        return
      }
    } else {
      if (!hasPermission('EQUIPMENT', 'create') && !hasRole(['ADMIN', 'TECHNICIAN'])) {
        setNotification({ type: 'error', message: 'No tienes permisos para crear equipos' })
        return
      }
    }

    const validation = validateForm(form, validationRules)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      setNotification({ type: 'error', message: validation.firstError || 'Por favor corrige los errores en el formulario' })
      return
    }

    try {
      const payload = {
        name: form.name ?? "Equipo",
        type: form.type || "Desktop",
        status: form.status || "Activo",
        location: form.location && form.location.trim() !== "" ? form.location : null,
        area: form.area && form.area.trim() !== "" ? form.area : null,
        serialNumber: form.serialNumber && form.serialNumber.trim() !== "" ? form.serialNumber : null,
        ip: form.ip && form.ip.trim() !== "" ? form.ip : null,
        macAddress: form.macAddress && form.macAddress.trim() !== "" ? form.macAddress : null,
        // Campos específicos para computadoras/laptops
        cpuNumber: form.cpuNumber && form.cpuNumber.trim() !== "" ? form.cpuNumber : null,
        motherboard: form.motherboard && form.motherboard.trim() !== "" ? form.motherboard : null,
        processor: form.processor && form.processor.trim() !== "" ? form.processor : null,
        ram: form.ram && form.ram.trim() !== "" ? form.ram : null,
        storage: form.storage && form.storage.trim() !== "" ? form.storage : null,
        operatingSystem: form.operatingSystem && form.operatingSystem.trim() !== "" ? form.operatingSystem : null,
        brand: form.brand && form.brand.trim() !== "" ? form.brand : null,
        model: form.model && form.model.trim() !== "" ? form.model : null,
        assignedToId: form.assignedToId || null,
        // Nuevos campos agregados
        storageType: form.storageType && form.storageType.trim() !== "" ? form.storageType : null,
        storageCapacity: form.storageCapacity && form.storageCapacity.trim() !== "" ? form.storageCapacity : null,
        ipAddress: form.ipAddress && form.ipAddress.trim() !== "" ? form.ipAddress : null,
        screenSize: form.screenSize && form.screenSize.trim() !== "" ? form.screenSize : null,
        dvdUnit: form.dvdUnit || false,
        purchaseDate: form.purchaseDate && form.purchaseDate.trim() !== "" ? form.purchaseDate : null,
        notes: form.notes && form.notes.trim() !== "" ? form.notes : null,
        isPersonalProperty: form.isPersonalProperty || false,
      }
      let res: Response
      if (editing) {
        res = await fetch(`/api/equipment/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      } else {
        res = await fetch(`/api/equipment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      }
      
      if (res.ok) {
        setEditing(null)
        setForm({ status: "Activo", type: "Desktop" })
        setFormErrors({})
        setIsFormOpen(false)
        setNotification({ type: 'success', message: editing ? 'Equipo actualizado correctamente' : 'Equipo creado correctamente' })
        await load()
      } else {
        const errorData = await res.json()
        console.error('Server error:', errorData)
        setNotification({ type: 'error', message: errorData.error || 'Error al guardar el equipo' })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error inesperado"
      console.error('Equipment save error:', msg, e)
      setNotification({ type: 'error', message: msg })
    }
  }

  async function remove(id: number) {
    setError(null)

    // Check permissions before deleting
    if (!hasPermission('EQUIPMENT', 'delete') && !hasRole(['ADMIN'])) {
      setNotification({ type: 'error', message: 'No tienes permisos para eliminar equipos' })
      return
    }

    const res = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE'
      })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data?.error || "Error eliminando")
      return
    }
    await load()
  }

  const mobileColumns = [
                { key: "name", label: "Nombre" },
            { key: "type", label: "Tipo" },
            { key: "serialNumber", label: "N° Serie", render: (value: unknown) => String(value || "-") },
            { key: "location", label: "Ubicación", render: (value: unknown) => String(value || "-") },
            { key: "status", label: "Estado", render: (value: unknown) => (
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(String(value))}`}>
                {getStatusLabel(String(value))}
              </span>
            ) },
    { 
      key: "actions", 
      label: "Acciones", 
      render: (_: unknown, item: Record<string, unknown>) => (
        <div className="flex gap-2 justify-end">
          <Button onClick={() => setViewItem(item as Equipment)} variant="ghost" small>Ver</Button>
          {(hasPermission('EQUIPMENT', 'update') || hasRole(['ADMIN', 'TECHNICIAN'])) && (
            <Button onClick={() => openEdit(item as Equipment)} variant="ghost" small>Editar</Button>
          )}
          {(hasPermission('EQUIPMENT', 'delete') || hasRole(['ADMIN'])) && (
            <Button onClick={() => setDeleteId(item.id as number)} small>Eliminar</Button>
          )}
        </div>
      )
    }
  ]

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      {/* Header with title and description */}
      <FadeInUp delay={0.05}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Equipos</h1>
          <p className="text-white/70">Gestión de inventario de equipos informáticos</p>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.1}>
        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm" style={{ WebkitBackdropFilter: 'blur(4px)' }}>
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
        <div className="w-full sm:w-auto">
          <label className="block text-xs sm:text-sm text-white/70 mb-1">Tipo</label>
          <Select value={type} onChange={setType} options={[{ value: "", label: "Todos" }, ...typeOptions.map(s => ({ value: s, label: s }))]} />
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-xs sm:text-sm text-white/70 mb-1">Estado</label>
          <Select value={status} onChange={setStatus} options={[{ value: "", label: "Todos" }, ...statusOptions.map(s => ({ value: s, label: s }))]} />
        </div>
        <div className="flex-1 min-w-0 sm:min-w-[200px]">
          <label className="block text-xs sm:text-sm text-white/70 mb-1">Ubicación</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="Buscar por ubicación..." />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => load()} className="text-sm">Filtrar</Button>
          <Button onClick={handleExportExcel} variant="ghost" className="text-sm">Excel</Button>
          <Button onClick={handleExportPDF} variant="ghost" className="text-sm">PDF</Button>
          {(hasPermission('EQUIPMENT', 'create') || hasRole(['ADMIN', 'TECHNICIAN'])) && (
            <Button onClick={() => openCreate()} variant="ghost" className="text-sm">Nuevo Equipo</Button>
          )}
        </div>
        </div>
        </div>
      </FadeInUp>

      {/* Separator line between filters and content */}
      <div className="mb-8 border-b border-white/10"></div>

      {error && <FadeInUp delay={0.2}><div className="mb-4 text-red-400 text-sm">{error}</div></FadeInUp>}

      {/* Desktop Table */}
      <FadeInUp delay={0.3} className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-left text-white/70">
              <th className="p-2 sm:p-3">Nombre</th>
              <th className="p-2 sm:p-3">Tipo</th>
              <th className="p-2 sm:p-3">N° Serie</th>
              <th className="p-2 sm:p-3">Ubicación</th>
              <th className="p-2 sm:p-3">Estado</th>
              <th className="p-2 sm:p-3 w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2 sm:p-3" colSpan={6}>Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-2 sm:p-3" colSpan={6}>Sin resultados</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-2 sm:p-3">{p.name}</td>
                  <td className="p-2 sm:p-3">{p.type}</td>
                  <td className="p-2 sm:p-3">{p.serialNumber || "-"}</td>
                  <td className="p-2 sm:p-3">{p.location || "-"}</td>
                  <td className="p-2 sm:p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(p.status)}`}>
                      {getStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="p-2 sm:p-3">
                    <div className="flex gap-1 sm:gap-2">
                      <Button onClick={() => setViewItem(p)} variant="ghost" small className="text-xs">Ver</Button>
                      {(hasPermission('EQUIPMENT', 'update') || hasRole(['ADMIN', 'TECHNICIAN'])) && (
                        <Button onClick={() => openEdit(p)} variant="ghost" small className="text-xs">Editar</Button>
                      )}
                      {(hasPermission('EQUIPMENT', 'delete') || hasRole(['ADMIN'])) && (
                        <Button onClick={() => setDeleteId(p.id)} small className="text-xs">Eliminar</Button>
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
          emptyMessage="Sin equipos encontrados"
        />
      </FadeInUp>

      <Modal open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "Activo", type: "Desktop" }) }} title={editing ? "Editar Equipo" : "Nuevo Equipo"} footer={(
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button onClick={() => { setIsFormOpen(false); setEditing(null); setForm({ status: "Activo", type: "Desktop" }) }} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cancelar</button>
          <button onClick={() => save()} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base">Guardar</button>
        </div>
      )}>
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          {/* Información Básica */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Información Básica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Nombre</label>
                <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="Nombre del equipo" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Tipo</label>
                <Select 
                  value={form.type ?? "Desktop"} 
                  onChange={(v) => {
                    const newForm = { ...form, type: v }
                    if (v === "Desktop") {
                      newForm.brand = "N/A"
                      newForm.model = "N/A"
                      newForm.serialNumber = "N/A"
                    }
                    setForm(newForm)
                  }} 
                  options={typeOptions.map(s => ({ value: s, label: s }))} 
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Estado</label>
                <Select 
                  value={form.status ?? "Activo"} 
                  onChange={(v) => setForm({ ...form, status: v })} 
                  options={statusOptions.map(s => ({ value: s, label: s }))}
                  disabled={form.isPersonalProperty}
                />
                {form.isPersonalProperty && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Estado fijo para propiedad personal
                  </p>
                )}
              </div>
              {form.type !== "Desktop" && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm text-white/70 mb-1">Marca</label>
                    <input value={form.brand ?? ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="HP, Dell, Lenovo..." />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-white/70 mb-1">Modelo</label>
                    <input value={form.model ?? ""} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="OptiPlex 7070" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-white/70 mb-1">N° Serie</label>
                    <input value={form.serialNumber ?? ""} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="Número de serie" />
                  </div>
                </>
              )}
              {form.type === "Desktop" && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm text-white/70 mb-1">Marca</label>
                    <input value="N/A" disabled className="w-full px-3 py-2 rounded-md bg-gray-500/20 border border-white/10 text-sm text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-white/70 mb-1">Modelo</label>
                    <input value="N/A" disabled className="w-full px-3 py-2 rounded-md bg-gray-500/20 border border-white/10 text-sm text-gray-400" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-white/70 mb-1">N° Serie</label>
                    <input value="N/A" disabled className="w-full px-3 py-2 rounded-md bg-gray-500/20 border border-white/10 text-sm text-gray-400" />
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Ubicación */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Ubicación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Área</label>
                <SearchableSelect 
                  value={form.area ?? ""} 
                  onChange={(v) => setForm({ ...form, area: v })} 
                  options={[{ value: "", label: "Seleccionar área..." }, ...AREAS.map(area => ({ value: area, label: area }))]} 
                  searchPlaceholder="Buscar área..."
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Ubicación</label>
                <Select 
                  value={form.location ?? ""} 
                  onChange={(v) => setForm({ ...form, location: v })} 
                  options={[{ value: "", label: "Seleccionar ubicación..." }, ...LOCATIONS.map(location => ({ value: location, label: location }))]} 
                />
              </div>
            </div>
          </div>
          
          {/* Especificaciones Técnicas */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Especificaciones Técnicas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Microprocesador</label>
                <input value={form.processor ?? ""} onChange={(e) => setForm({ ...form, processor: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="Intel Core i5-9500" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Memoria RAM</label>
                <input value={form.ram ?? ""} onChange={(e) => setForm({ ...form, ram: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="8 GB DDR4" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Tipo de Disco</label>
                <Select value={form.storageType ?? ""} onChange={(v) => setForm({ ...form, storageType: v })} options={[{ value: "", label: "Seleccionar..." }, ...storageTypes.map(s => ({ value: s, label: s }))]} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Capacidad Disco</label>
                <input value={form.storageCapacity ?? ""} onChange={(e) => setForm({ ...form, storageCapacity: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="256 GB, 1 TB" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Sistema Operativo</label>
                <Select 
                  value={form.operatingSystem ?? ""} 
                  onChange={(v) => setForm({ ...form, operatingSystem: v })} 
                  options={[{ value: "", label: "Seleccionar SO..." }, ...OPERATING_SYSTEMS.map(os => ({ value: os, label: os }))]} 
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Tamaño Pantalla</label>
                <input value={form.screenSize ?? ""} onChange={(e) => setForm({ ...form, screenSize: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder='15.6"' />
              </div>
            </div>
          </div>
          
          {/* Red */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Configuración de Red</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Dirección IP</label>
                <input value={form.ipAddress ?? ""} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" placeholder="192.168.1.10" />
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Dirección MAC</label>
                <div className="relative">
                  <input 
                    value={form.macAddress ?? ""} 
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase()
                      // Auto-formatear MAC address mientras el usuario escribe
                      value = value.replace(/[^0-9A-F]/g, '') // Solo números y letras A-F
                      if (value.length > 12) value = value.substring(0, 12) // Máximo 12 caracteres
                      // Agregar dos puntos cada 2 caracteres
                      if (value.length > 2) value = value.substring(0, 2) + ':' + value.substring(2)
                      if (value.length > 5) value = value.substring(0, 5) + ':' + value.substring(5)
                      if (value.length > 8) value = value.substring(0, 8) + ':' + value.substring(8)
                      if (value.length > 11) value = value.substring(0, 11) + ':' + value.substring(11)
                      if (value.length > 14) value = value.substring(0, 14) + ':' + value.substring(14)
                      if (value.length > 17) value = value.substring(0, 17) // Máximo 17 caracteres con puntos
                      setForm({ ...form, macAddress: value })
                    }}
                    onBlur={(e) => {
                      const value = e.target.value
                      const hasError = value && value.length > 0 && (value.length !== 17 || !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value))
                      if (hasError) {
                        // Mostrar tooltip de error después de onBlur
                        setFormErrors({ ...formErrors, macAddress: 'Formato de MAC incorrecto' })
                      } else {
                        // Limpiar error si el formato es correcto
                        const newErrors = { ...formErrors }
                        delete newErrors.macAddress
                        setFormErrors(newErrors)
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-md bg-black/30 border text-sm ${
                      form.macAddress && form.macAddress.length === 17 
                        ? 'border-green-500/50' 
                        : formErrors.macAddress
                          ? 'border-red-500/50'
                          : form.macAddress && form.macAddress.length > 0 
                            ? 'border-yellow-500/50' 
                            : 'border-white/10'
                    }`}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    maxLength={17}
                  />
                  {/* Tooltip de validación responsivo solo cuando hay error después del blur */}
                  {formErrors.macAddress && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-red-900/90 backdrop-blur-sm border border-red-500/30 rounded-lg shadow-lg z-50" style={{ WebkitBackdropFilter: 'blur(4px)' }}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-400">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <span className="text-sm font-semibold">Formato incorrecto</span>
                        </div>
                        
                        <div className="text-xs text-white/70 space-y-1">
                          <div>• Formato: 6 pares de caracteres hexadecimales separados por dos puntos</div>
                          <div className="text-green-400">• Ejemplo válido: AA:BB:CC:DD:EE:FF</div>
                          <div className="text-yellow-400">• Solo se permiten números (0-9) y letras (A-F)</div>
                          {form.macAddress && form.macAddress.length !== 17 && (
                            <div className="text-red-400">• Faltan {17 - (form.macAddress?.length || 0)} caracteres</div>
                          )}
                          {form.macAddress && form.macAddress.length === 17 && !/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(form.macAddress) && (
                            <div className="text-red-400">• Contiene caracteres inválidos</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Otros */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">Información Adicional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-white/70 mb-1">Fecha de Compra</label>
                <input type="date" value={form.purchaseDate ?? ""} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" />
              </div>
              <div className="flex items-center pt-6">
                <input type="checkbox" checked={form.dvdUnit ?? false} onChange={(e) => setForm({ ...form, dvdUnit: e.target.checked })} className="mr-2" />
                <label className="text-xs sm:text-sm text-white/70">Unidad DVD/CD</label>
              </div>
              <div className="flex items-center pt-6">
                <input 
                  type="checkbox" 
                  checked={form.isPersonalProperty ?? false} 
                  onChange={(e) => {
                    const isPersonal = e.target.checked
                    setForm({ 
                      ...form, 
                      isPersonalProperty: isPersonal,
                      status: isPersonal ? "Activo" : form.status
                    })
                  }} 
                  className="mr-2" 
                />
                <label className="text-xs sm:text-sm text-white/70">Es propiedad personal del empleado</label>
              </div>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Observaciones</label>
              <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm" rows={3} placeholder="Observaciones adicionales..." />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Asignado a</label>
              <SearchableSelect 
                value={String(form.assignedToId || "")} 
                onChange={(v) => setForm({ ...form, assignedToId: v ? Number(v) : null })} 
                options={[{ value: "", label: "Sin asignar" }, ...employees.map(emp => ({ value: String(emp.id), label: `${emp.firstName} ${emp.lastName}` }))]} 
                searchPlaceholder="Buscar empleado..."
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Equipo */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `Detalle de ${viewItem.name}` : 'Detalle'}
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={() => setViewItem(null)} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cerrar</button>
          </div>
        )}
      >
        {viewItem && (
          <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-white/60 text-xs">Nombre</div>
                <div className="text-sm">{viewItem.name}</div>
              </div>
              <div>
                <div className="text-white/60 text-xs">Tipo</div>
                <div className="text-sm">{viewItem.type}</div>
              </div>
              <div>
                <div className="text-white/60 text-xs">Estado</div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(viewItem.status)}`}>
                  {getStatusLabel(viewItem.status)}
                </span>
              </div>
              {viewItem.brand && (
                <div>
                  <div className="text-white/60 text-xs">Marca</div>
                  <div className="text-sm">{viewItem.brand}</div>
                </div>
              )}
              {viewItem.model && (
                <div>
                  <div className="text-white/60 text-xs">Modelo</div>
                  <div className="text-sm">{viewItem.model}</div>
                </div>
              )}
              {viewItem.serialNumber && (
                <div>
                  <div className="text-white/60 text-xs">N° Serie</div>
                  <div className="text-sm">{viewItem.serialNumber}</div>
                </div>
              )}
              {viewItem.area && (
                <div>
                  <div className="text-white/60 text-xs">Área</div>
                  <div className="text-sm">{viewItem.area}</div>
                </div>
              )}
              {viewItem.location && (
                <div>
                  <div className="text-white/60 text-xs">Ubicación</div>
                  <div className="text-sm">{viewItem.location}</div>
                </div>
              )}
              {(viewItem.processor || viewItem.ram) && (
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewItem.processor && (
                    <div>
                      <div className="text-white/60 text-xs">Procesador</div>
                      <div className="text-sm">{viewItem.processor}</div>
                    </div>
                  )}
                  {viewItem.ram && (
                    <div>
                      <div className="text-white/60 text-xs">RAM</div>
                      <div className="text-sm">{viewItem.ram}</div>
                    </div>
                  )}
                </div>
              )}
              {(viewItem.storageType || viewItem.storageCapacity) && (
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewItem.storageType && (
                    <div>
                      <div className="text-white/60 text-xs">Tipo de Disco</div>
                      <div className="text-sm">{viewItem.storageType}</div>
                    </div>
                  )}
                  {viewItem.storageCapacity && (
                    <div>
                      <div className="text-white/60 text-xs">Capacidad</div>
                      <div className="text-sm">{viewItem.storageCapacity}</div>
                    </div>
                  )}
                </div>
              )}
              {(viewItem.ipAddress || viewItem.macAddress) && (
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {viewItem.ipAddress && (
                    <div>
                      <div className="text-white/60 text-xs">IP</div>
                      <div className="text-sm">{viewItem.ipAddress}</div>
                    </div>
                  )}
                  {viewItem.macAddress && (
                    <div>
                      <div className="text-white/60 text-xs">MAC</div>
                      <div className="text-sm">{viewItem.macAddress}</div>
                    </div>
                  )}
                </div>
              )}
              {viewItem.notes && (
                <div className="sm:col-span-2">
                  <div className="text-white/60 text-xs">Observaciones</div>
                  <div className="text-sm whitespace-pre-wrap">{viewItem.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <CustomNotification
        type={notification?.type || 'info'}
        message={notification?.message || ''}
        isVisible={!!notification}
        onClose={() => setNotification(null)}
      />
      
      <ConfirmDialog
        open={deleteId !== null}
        title="Eliminar equipo"
        description="Esta acción no se puede deshacer"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId != null) { await remove(deleteId); setDeleteId(null) } }}
      />
    </AnimatedContainer>
  )
}

