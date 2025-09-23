"use client"

import { useState, useEffect } from "react"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import PermissionGuard from "@/components/PermissionGuard"
import Modal from "@/components/modal"
import Button from "@/components/button"
import ConfirmDialog from "@/components/confirm-dialog"
import Select from "@/components/select"
import SearchableSelect from "@/components/searchable-select"
import { validateForm, ValidationRule } from "@/lib/validation"
import { useAppAuth } from "@/lib/hooks/useAppAuth"
import { useToast } from "@/lib/hooks/use-toast"
import { usePermissionToast } from "@/lib/hooks/usePermissionToast"

interface Printer {
  id: number
  model: string
  serialNumber: string
  area: string
  location: string
  ip: string
  status: string
  createdAt: string
  updatedAt: string
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'INACTIVE', label: 'Inactiva' },
  { value: 'MAINTENANCE', label: 'En Mantenimiento' }
]

import { AREA_OPTIONS } from "@/lib/constants/areas"

export default function PrintersPage() {
  const { isAuthenticated, loading: authLoading, can } = useAppAuth()
  const { showPermissionError } = usePermissionToast()
  const [printers, setPrinters] = useState<Printer[]>([])
  const [filteredPrinters, setFilteredPrinters] = useState<Printer[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; printer: Printer | null }>({ isOpen: false, printer: null })
  // Toast notifications
  const { showSuccess, showError } = useToast()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [areaFilter, setAreaFilter] = useState("")

  const [formData, setFormData] = useState({
    model: "",
    serialNumber: "",
    area: "Administración",
    location: "",
    ip: "",
    status: "ACTIVE"
  })

  useEffect(() => {
    fetchPrinters()
  }, [])

  useEffect(() => {
    let filtered = printers

    if (searchTerm) {
      filtered = filtered.filter(printer => 
        printer.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        printer.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        printer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        printer.ip.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(printer => printer.status === statusFilter)
    }

    if (areaFilter) {
      filtered = filtered.filter(printer => printer.area === areaFilter)
    }

    setFilteredPrinters(filtered)
  }, [printers, searchTerm, statusFilter, areaFilter])

  if (authLoading) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Cargando impresoras...</div>
        </div>
      </AnimatedContainer>
    )
  }

  if (!isAuthenticated) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso denegado</div>
            <div className="text-white/60">Debes iniciar sesión para acceder a esta página.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  if (!can('printers:view')) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso denegado</div>
            <div className="text-white/60">No tienes permisos para acceder a la gestión de impresoras.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  const fetchPrinters = async () => {
    try {
      const response = await fetch('/api/printers')
      if (response.ok) {
        const data = await response.json()
        setPrinters(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error('Error fetching printers:', error)
      showError('Error al cargar impresoras')
    } finally {
      setLoading(false)
    }
  }

  const validationRules: ValidationRule[] = [
    { field: 'model', required: true, minLength: 2, maxLength: 100 },
    { field: 'serialNumber', required: true, minLength: 2, maxLength: 50 },
    { field: 'area', required: true },
    { field: 'location', required: true, minLength: 2, maxLength: 100 },
    { field: 'ip', type: 'ip' },
    { field: 'status', required: true }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check permissions before saving
    if (editingPrinter) {
      if (!can('printers:edit')) {
        showPermissionError('No tienes permisos para editar impresoras')
        return
      }
    } else {
      if (!can('printers:create')) {
        showPermissionError('No tienes permisos para crear impresoras')
        return
      }
    }

    setFormErrors({})

    const validation = validateForm(formData, validationRules)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      showError(validation.firstError || 'Por favor corrige los errores en el formulario')
      return
    }

    try {
      const url = editingPrinter ? `/api/printers/${editingPrinter.id}` : '/api/printers'
      const method = editingPrinter ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchPrinters()
        resetForm()
        setIsModalOpen(false)
        showSuccess(`Impresora ${editingPrinter ? 'actualizada' : 'creada'} correctamente`)
      } else {
        const errorData = await response.json()
        showError(errorData.error || `Error ${editingPrinter ? 'actualizando' : 'creando'} impresora`)
      }
    } catch (error) {
      console.error('Error saving printer:', error)
      showError(`Error ${editingPrinter ? 'actualizando' : 'creando'} impresora`)
    }
  }

  const handleEdit = (printer: Printer) => {
    setEditingPrinter(printer)
    setFormData({
      model: printer.model,
      serialNumber: printer.serialNumber,
      area: printer.area,
      location: printer.location,
      ip: printer.ip,
      status: printer.status
    })
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.printer) return
    
    try {
      const response = await fetch(`/api/printers/${deleteConfirm.printer.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchPrinters()
        setDeleteConfirm({ isOpen: false, printer: null })
        showSuccess('Impresora eliminada correctamente')
      } else {
        const errorData = await response.json()
        showError(errorData.error || 'Error eliminando impresora')
      }
    } catch (error) {
      console.error('Error deleting printer:', error)
      showError('Error eliminando impresora')
    }
  }

  const resetForm = () => {
    setFormData({
      model: "",
      serialNumber: "",
      area: "Administración",
      location: "",
      ip: "",
      status: "ACTIVE"
    })
    setEditingPrinter(null)
    setFormErrors({})
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-400'
      case 'INACTIVE': return 'bg-gray-500/10 text-gray-400'
      case 'MAINTENANCE': return 'bg-yellow-500/10 text-yellow-400'
      default: return 'bg-gray-500/10 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    return option?.label || status
  }

  const filterOptions = [
    {
      label: 'Estado',
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: '', label: 'Todos los estados' },
        ...STATUS_OPTIONS
      ]
    },
    {
      label: 'Área',
      value: areaFilter,
      onChange: setAreaFilter,
      options: [
        { value: '', label: 'Todas las áreas' },
        ...AREA_OPTIONS
      ]
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Cargando impresoras...</div>
      </div>
    )
  }

  return (
    <AnimatedContainer className="space-y-6 text-white px-2 sm:px-0">
      {/* Header */}
      <FadeInUp delay={0.05}>
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Impresoras</h1>
          <p className="text-white/60 text-sm">Gestión de dispositivos de impresión y consumibles</p>
        </div>
      </FadeInUp>

      {/* Filtros */}
      <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs sm:text-sm text-white/70 mb-1">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por modelo, serie, ubicación o IP..."
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
            />
          </div>
          {filterOptions.map((filter, index) => (
            <div key={index} className="w-full sm:w-auto min-w-[180px]">
              <label className="block text-xs sm:text-sm text-white/70 mb-1">{filter.label}</label>
              <Select value={filter.value} onChange={filter.onChange as (v: string)=>void} options={filter.options as any} />
            </div>
          ))}
          <div className="w-full sm:w-auto">
            <PermissionGuard roles={['ADMIN', 'TECHNICIAN']} showToast={false}>
              <Button
                onClick={() => {
                  resetForm()
                  setIsModalOpen(true)
                }}
              >
                Nueva Impresora
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="mb-2 border-b border-white/10"></div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATUS_OPTIONS.map((status) => {
          const count = printers.filter(p => p.status === status.value).length
          return (
            <div key={status.value} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {count}
                </div>
                <div className="text-white/60 text-sm">{status.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-3 text-white/80 font-medium">Modelo</th>
                <th className="text-left p-3 text-white/80 font-medium">Serie</th>
                <th className="text-left p-3 text-white/80 font-medium">Área</th>
                <th className="text-left p-3 text-white/80 font-medium">Ubicación</th>
                <th className="text-left p-3 text-white/80 font-medium">IP</th>
                <th className="text-left p-3 text-white/80 font-medium">Estado</th>
                <th className="text-left p-3 text-white/80 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-white/60">
                    Cargando impresoras...
                  </td>
                </tr>
              ) : filteredPrinters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-white/60">
                    No se encontraron impresoras
                  </td>
                </tr>
              ) : (
                filteredPrinters.map((printer) => (
                  <tr key={printer.id} className="border-t border-white/10">
                    <td className="p-3">{printer.model}</td>
                    <td className="p-3">{printer.serialNumber}</td>
                    <td className="p-3">{printer.area}</td>
                    <td className="p-3">{printer.location}</td>
                    <td className="p-3">{printer.ip || '-'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(printer.status)}`}>
                        {getStatusLabel(printer.status)}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <PermissionGuard roles={['ADMIN', 'TECHNICIAN']} showToast={false}>
                        <Button onClick={() => handleEdit(printer)} variant="ghost" small>Editar</Button>
                      </PermissionGuard>
                      <PermissionGuard roles={['ADMIN']} showToast={false}>
                        <Button onClick={() => setDeleteConfirm({ isOpen: true, printer })} small>Eliminar</Button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista móvil */}
        <div className="md:hidden space-y-4 p-4">
          {loading ? (
            <div className="text-center text-white/60">Cargando impresoras...</div>
          ) : filteredPrinters.length === 0 ? (
            <div className="text-center text-white/60">No se encontraron impresoras</div>
          ) : (
            filteredPrinters.map((printer) => (
              <div key={printer.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">{printer.model}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${getStatusColor(printer.status)}`}>
                    {getStatusLabel(printer.status)}
                  </span>
                </div>
                <div className="text-sm text-white/60 space-y-1">
                  <div>Serie: {printer.serialNumber}</div>
                  <div>Área: {printer.area}</div>
                  <div>Ubicación: {printer.location}</div>
                  {printer.ip && <div>IP: {printer.ip}</div>}
                </div>
                <div className="flex gap-2 mt-3">
                  <PermissionGuard roles={['ADMIN', 'TECHNICIAN']} showToast={false}>
                    <Button onClick={() => handleEdit(printer)} variant="ghost" small>Editar</Button>
                  </PermissionGuard>
                  <PermissionGuard roles={['ADMIN']} showToast={false}>
                    <Button onClick={() => setDeleteConfirm({ isOpen: true, printer })} small>Eliminar</Button>
                  </PermissionGuard>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal para crear/editar */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingPrinter ? 'Editar Impresora' : 'Nueva Impresora'}
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={() => {
              setIsModalOpen(false)
              resetForm()
            }} className="flex-1 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cancelar</button>
            <button onClick={handleSubmit} className="flex-1 px-3 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base">
              {editingPrinter ? 'Actualizar' : 'Crear'} Impresora
            </button>
          </div>
        )}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className={`w-full px-3 py-2 rounded-md bg-black/30 border text-sm ${formErrors.model ? 'border-red-400' : 'border-white/10'}`}
                placeholder="Ej: HP LaserJet Pro M404n"
              />
              {formErrors.model && <p className="text-red-400 text-xs mt-1">{formErrors.model}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Número de Serie *
              </label>
              <input
                type="text"
                required
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className={`w-full px-3 py-2 rounded-md bg-black/30 border text-sm ${formErrors.serialNumber ? 'border-red-400' : 'border-white/10'}`}
                placeholder="Ej: ABC123456"
              />
              {formErrors.serialNumber && <p className="text-red-400 text-xs mt-1">{formErrors.serialNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Área *
              </label>
              <SearchableSelect 
                value={formData.area} 
                onChange={(v) => setFormData({ ...formData, area: v })} 
                options={AREA_OPTIONS as any}
                searchPlaceholder="Buscar área..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Ubicación *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={`w-full px-3 py-2 rounded-md bg-black/30 border text-sm ${formErrors.location ? 'border-red-400' : 'border-white/10'}`}
                placeholder="Ej: Oficina 1, Mesa 3"
              />
              {formErrors.location && <p className="text-red-400 text-xs mt-1">{formErrors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Dirección IP
              </label>
              <input
                type="text"
                value={formData.ip}
                onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                className={`w-full px-3 py-2 rounded-md bg-black/30 border text-sm ${formErrors.ip ? 'border-red-400' : 'border-white/10'}`}
                placeholder="Ej: 192.168.1.100"
              />
              {formErrors.ip && <p className="text-red-400 text-xs mt-1">{formErrors.ip}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Estado *
              </label>
              <Select value={formData.status} onChange={(v) => setFormData({ ...formData, status: v })} options={STATUS_OPTIONS as any} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, printer: null })}
        title="Eliminar Impresora"
        description={`¿Estás seguro de que deseas eliminar la impresora "${deleteConfirm.printer?.model}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

    </AnimatedContainer>
  )
}
