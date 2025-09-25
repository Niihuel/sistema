"use client"

import { useState, useEffect } from "react"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import Modal from "@/components/modal"
import Button from "@/components/button"
import ConfirmDialog from "@/components/confirm-dialog"
import Select from "@/components/select"
import SearchableSelect from "@/components/searchable-select"
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from "@/lib/professional-export"
import { useAppAuth } from "@/lib/hooks/useAppAuth"
import { useToast } from "@/lib/hooks/use-toast"
import { usePermissionToast } from "@/lib/hooks/usePermissionToast"

interface Employee {
  id: number
  firstName: string
  lastName: string
  area?: string
}

interface PurchaseRequest {
  id: number
  requestNumber?: string
  requestorId?: number
  requestor?: Employee
  itemName: string
  category: string
  description?: string
  justification?: string
  quantity: number
  estimatedCost?: number
  priority: string
  status: string
  approvedBy?: string
  approvalDate?: string
  purchaseDate?: string
  receivedDate?: string
  vendor?: string
  actualCost?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

const CATEGORIES = [
  { value: 'HARDWARE', label: 'Hardware' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'CONSUMABLE', label: 'Consumible' },
  { value: 'SERVICE', label: 'Servicio' },
  { value: 'OTHER', label: 'Otro' }
]

const PRIORITIES = [
  { value: 'LOW', label: 'Baja' },
  { value: 'MEDIUM', label: 'Media' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' }
]

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'APPROVED', label: 'Aprobada' },
  { value: 'REJECTED', label: 'Rechazada' },
  { value: 'PURCHASED', label: 'Comprada' },
  { value: 'RECEIVED', label: 'Recibida' }
]

export default function PurchaseRequestsPage() {
  const { isAuthenticated, loading: authLoading, can } = useAppAuth()
  const { showPermissionError } = usePermissionToast()
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<PurchaseRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; request: PurchaseRequest | null }>({ isOpen: false, request: null })

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  // Toast notifications
  const { showSuccess, showError } = useToast()

  const [formData, setFormData] = useState({
    requestorId: "",
    itemName: "",
    category: "HARDWARE",
    description: "",
    justification: "",
    quantity: 1,
    estimatedCost: "",
    priority: "MEDIUM",
    status: "PENDING",
    approvedBy: "",
    approvalDate: "",
    purchaseDate: "",
    receivedDate: "",
    vendor: "",
    actualCost: "",
    notes: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = requests

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestor?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestor?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    if (priorityFilter) {
      filtered = filtered.filter(request => request.priority === priorityFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter(request => request.category === categoryFilter)
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, statusFilter, priorityFilter, categoryFilter])

  const fetchData = async () => {
    try {
      const [requestsRes, employeesRes] = await Promise.all([
        fetch('/api/purchase-requests'),
        fetch('/api/employees')
      ])

      if (requestsRes.ok) setRequests(await requestsRes.json())
      if (employeesRes.ok) {
        const data = await employeesRes.json().catch(() => ([]))
        setEmployees(Array.isArray(data) ? data : (data.items ?? []))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check permissions
    if (!can('purchase-requests:create') && !can('purchase-requests:edit')) {
      showPermissionError('No tienes permisos para gestionar solicitudes de compra')
      return
    }

    try {
      const url = editingRequest ? `/api/purchase-requests/${editingRequest.id}` : '/api/purchase-requests'
      const method = editingRequest ? 'PUT' : 'POST'
      
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity.toString()),
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        actualCost: formData.actualCost ? parseFloat(formData.actualCost) : null,
        requestorId: formData.requestorId ? parseInt(formData.requestorId) : null,
        approvalDate: formData.approvalDate || null,
        purchaseDate: formData.purchaseDate || null,
        receivedDate: formData.receivedDate || null
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        await fetchData()
        resetForm()
        setIsModalOpen(false)
        showSuccess(editingRequest ? 'Solicitud actualizada correctamente' : 'Solicitud creada correctamente')
      } else {
        const errorData = await response.json()
        showError(errorData.error || 'Error al guardar la solicitud de compra')
      }
    } catch (error) {
      console.error('Error saving purchase request:', error)
      showError('Error de conexión. Por favor, intenta nuevamente.')
    }
  }

  const handleEdit = (request: PurchaseRequest) => {
    if (!can('purchase-requests:edit')) {
      showPermissionError('No tienes permisos para editar solicitudes de compra')
      return
    }
    setEditingRequest(request)
    setFormData({
      requestorId: request.requestorId?.toString() || "",
      itemName: request.itemName,
      category: request.category,
      description: request.description || "",
      justification: request.justification || "",
      quantity: request.quantity,
      estimatedCost: request.estimatedCost?.toString() || "",
      priority: request.priority,
      status: request.status,
      approvedBy: request.approvedBy || "",
      approvalDate: request.approvalDate ? request.approvalDate.slice(0, 10) : "",
      purchaseDate: request.purchaseDate ? request.purchaseDate.slice(0, 10) : "",
      receivedDate: request.receivedDate ? request.receivedDate.slice(0, 10) : "",
      vendor: request.vendor || "",
      actualCost: request.actualCost?.toString() || "",
      notes: request.notes || ""
    })
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.request) return

    // Check permissions
    if (!can('purchase-requests:delete')) {
      showPermissionError('No tienes permisos para eliminar solicitudes de compra')
      setDeleteConfirm({ isOpen: false, request: null })
      return
    }

    try {
      const response = await fetch(`/api/purchase-requests/${deleteConfirm.request.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        setDeleteConfirm({ isOpen: false, request: null })
        showSuccess('Solicitud eliminada correctamente')
      } else {
        const errorData = await response.json()
        showError(errorData.error || 'Error al eliminar la solicitud')
      }
    } catch (error) {
      console.error('Error deleting purchase request:', error)
      showError('Error de conexión. Por favor, intenta nuevamente.')
    }
  }

  const resetForm = () => {
    setFormData({
      requestorId: "",
      itemName: "",
      category: "HARDWARE",
      description: "",
      justification: "",
      quantity: 1,
      estimatedCost: "",
      priority: "MEDIUM",
      status: "PENDING",
      approvedBy: "",
      approvalDate: "",
      purchaseDate: "",
      receivedDate: "",
      vendor: "",
      actualCost: "",
      notes: ""
    })
    setEditingRequest(null)
  }

  const handleExportExcel = async () => {
    try {
      const exportData = filteredRequests.map(request => ({
        requestNumber: request.requestNumber || '-',
        itemName: request.itemName || '-',
        category: request.category || '-',
        description: request.description || '-',
        justification: request.justification || '-',
        quantity: request.quantity ? request.quantity.toString() : '-',
        estimatedCost: request.estimatedCost ? request.estimatedCost.toString() : '-',
        priority: request.priority || '-',
        status: request.status || '-',
        requestor: request.requestor || '-',
        approvedBy: request.approvedBy || '-',
        vendor: request.vendor || '-',
        actualCost: request.actualCost ? request.actualCost.toString() : '-',
        createdAt: request.createdAt ? new Date(request.createdAt).toLocaleDateString('es-ES') : '-'
      }))

      const columnMap = {
        requestNumber: 'Número de Solicitud',
        itemName: 'Artículo',
        category: 'Categoría',
        description: 'Descripción',
        justification: 'Justificación',
        quantity: 'Cantidad',
        estimatedCost: 'Costo Estimado',
        priority: 'Prioridad',
        status: 'Estado',
        requestor: 'Solicitante',
        approvedBy: 'Aprobado Por',
        vendor: 'Proveedor',
        actualCost: 'Costo Real',
        createdAt: 'Fecha de Creación'
      }
      
      const exportOptions = prepareDataForExport(exportData, columnMap, {
        title: 'Reporte de Solicitudes de Compra',
        subtitle: 'Sistema de Gestión - Pretensa & Paschini',
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
      const exportData = filteredRequests.map(request => ({
        requestNumber: request.requestNumber || '-',
        itemName: request.itemName || '-',
        category: request.category || '-',
        quantity: request.quantity ? request.quantity.toString() : '-',
        estimatedCost: request.estimatedCost ? request.estimatedCost.toString() : '-',
        priority: request.priority || '-',
        status: request.status || '-',
        requestor: request.requestor || '-'
      }))

      const columnMap = {
        requestNumber: 'Número',
        itemName: 'Artículo',
        category: 'Categoría',
        quantity: 'Cantidad',
        estimatedCost: 'Costo Est.',
        priority: 'Prioridad',
        status: 'Estado',
        requestor: 'Solicitante'
      }
      
      const exportOptions = prepareDataForExport(exportData, columnMap, {
        title: 'Reporte de Solicitudes de Compra',
        subtitle: 'Sistema de Gestión - Pretensa & Paschini',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-400'
      case 'APPROVED': return 'bg-blue-500/10 text-blue-400'
      case 'REJECTED': return 'bg-red-500/10 text-red-400'
      case 'PURCHASED': return 'bg-purple-500/10 text-purple-400'
      case 'RECEIVED': return 'bg-green-500/10 text-green-400'
      default: return 'bg-gray-500/10 text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-500/10 text-green-400'
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-400'
      case 'HIGH': return 'bg-orange-500/10 text-orange-400'
      case 'URGENT': return 'bg-red-500/10 text-red-400'
      default: return 'bg-gray-500/10 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    return option?.label || status
  }

  const getPriorityLabel = (priority: string) => {
    const option = PRIORITIES.find(opt => opt.value === priority)
    return option?.label || priority
  }

  const getCategoryLabel = (category: string) => {
    const option = CATEGORIES.find(opt => opt.value === category)
    return option?.label || category
  }



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
            <div className="text-white/60">Debes iniciar sesión para acceder a las solicitudes de compra.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  // Check if user has permission to access purchase requests
  if (!can('purchase-requests:view')) {
    return (
      <AnimatedContainer className="text-white p-4 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para acceder a las solicitudes de compra.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <div className="space-y-6">
      {/* Header sin card */}
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Solicitudes de Compra</h1>
        <p className="text-white/60 text-sm">Gestión de solicitudes y prioridades de compra</p>
      </div>

      {/* Filtros en card */}
      <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por item, número, solicitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
            />
          </div>
          <div className="w-full sm:w-auto min-w-[180px]">
            <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "", label: "Todos los estados" }, ...STATUS_OPTIONS as any]} />
          </div>
          <div className="w-full sm:w-auto min-w-[180px]">
            <Select value={priorityFilter} onChange={setPriorityFilter} options={[{ value: "", label: "Todas las prioridades" }, ...PRIORITIES as any]} />
          </div>
          <div className="w-full sm:w-auto min-w-[200px]">
            <Select value={categoryFilter} onChange={setCategoryFilter} options={[{ value: "", label: "Todas las categorías" }, ...CATEGORIES as any]} />
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            {can('purchase-requests:create') && (
              <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>Nueva Solicitud</Button>
            )}
            {can('purchase-requests:export') && (
              <>
                <Button variant="ghost" onClick={handleExportExcel}>Exportar Excel</Button>
                <Button variant="ghost" onClick={handleExportPDF}>Exportar PDF</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="mb-2 border-b border-white/10"></div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {STATUS_OPTIONS.map((status) => {
          const count = requests.filter(r => r.status === status.value).length
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

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5 border-b border-white/10">
              <tr className="text-left">
                <th className="p-3 text-white/80 font-medium">Número</th>
                <th className="p-3 text-white/80 font-medium">Item</th>
                <th className="p-3 text-white/80 font-medium">Categoría</th>
                <th className="p-3 text-white/80 font-medium">Solicitante</th>
                <th className="p-3 text-white/80 font-medium">Cantidad</th>
                <th className="p-3 text-white/80 font-medium">Costo Est.</th>
                <th className="p-3 text-white/80 font-medium">Prioridad</th>
                <th className="p-3 text-white/80 font-medium">Estado</th>
                <th className="p-3 text-white/80 font-medium w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-3" colSpan={9}>Cargando...</td></tr>
              ) : filteredRequests.length === 0 ? (
                <tr><td className="p-3" colSpan={9}>No se encontraron solicitudes</td></tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="border-t border-white/10 hover:bg-white/5">
                    <td className="p-3 text-white/80">{request.requestNumber || '-'}</td>
                    <td className="p-3 text-white font-medium">{request.itemName}</td>
                    <td className="p-3 text-white/80">{getCategoryLabel(request.category)}</td>
                    <td className="p-3 text-white/80">
                      {request.requestor
                        ? `${request.requestor.firstName} ${request.requestor.lastName}`
                        : '-'
                      }
                    </td>
                    <td className="p-3 text-white/80">{request.quantity}</td>
                    <td className="p-3 text-white/80">
                      {request.estimatedCost
                        ? `$${request.estimatedCost.toLocaleString()}`
                        : '-'
                      }
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(request.priority)}`}>
                        {getPriorityLabel(request.priority)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {can('purchase-requests:edit') && (
                          <Button onClick={() => handleEdit(request)} variant="ghost" small>Editar</Button>
                        )}
                        {can('purchase-requests:delete') && (
                          <Button onClick={() => setDeleteConfirm({ isOpen: true, request })} small>Eliminar</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-white/60 py-8">Cargando...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center text-white/60 py-8">No se encontraron solicitudes</div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-white">{request.itemName}</h3>
                    <p className="text-sm text-white/60">
                      {request.requestNumber || 'Sin número'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(request.priority)}`}>
                      {getPriorityLabel(request.priority)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-white/60">Categoría:</span>
                    <div className="text-white">{getCategoryLabel(request.category)}</div>
                  </div>
                  <div>
                    <span className="text-white/60">Cantidad:</span>
                    <div className="text-white">{request.quantity}</div>
                  </div>
                  <div>
                    <span className="text-white/60">Solicitante:</span>
                    <div className="text-white">
                      {request.requestor 
                        ? `${request.requestor.firstName} ${request.requestor.lastName}`
                        : '-'
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-white/60">Costo Est.:</span>
                    <div className="text-white">
                      {request.estimatedCost 
                        ? `$${request.estimatedCost.toLocaleString()}` 
                        : '-'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {can('purchase-requests:edit') && (
                    <Button onClick={() => handleEdit(request)} variant="ghost" small>Editar</Button>
                  )}
                  {can('purchase-requests:delete') && (
                    <Button onClick={() => setDeleteConfirm({ isOpen: true, request })} small>Eliminar</Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para crear/editar */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingRequest ? 'Editar Solicitud de Compra' : 'Nueva Solicitud de Compra'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide" id="purchase-form">
          {/* Información sobre el número de solicitud automático */}
          {!editingRequest && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
              <p className="text-blue-400 text-sm">
                <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                El número de solicitud se generará automáticamente (formato: REQ-YYYYMM-###)
              </p>
            </div>
          )}

          {/* Mostrar número de solicitud en modo edición */}
          {editingRequest && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Número de Solicitud
              </label>
              <input
                type="text"
                value={editingRequest.requestNumber || 'No asignado'}
                disabled
                className="w-full px-3 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-300 cursor-not-allowed"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Solicitante
                <span className="text-xs text-yellow-400 ml-1">(Solo área Sistemas)</span>
              </label>
              <SearchableSelect 
                value={formData.requestorId} 
                onChange={(v) => setFormData({ ...formData, requestorId: v })} 
                options={[{ value: "", label: "Sin solicitante específico" }, ...employees.filter(emp => emp.area?.toLowerCase() === 'sistemas').map(emp => ({ value: String(emp.id), label: `${emp.firstName} ${emp.lastName} - ${emp.area || 'Sin área'}` }))]} 
                searchPlaceholder="Buscar empleado..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Nombre del Item *
              </label>
              <input
                type="text"
                required
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="Ej: Notebook Dell Latitude 5520"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Categoría *
              </label>
              <Select value={formData.category} onChange={(v) => setFormData({ ...formData, category: v })} options={CATEGORIES as any} />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Costo Estimado
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Prioridad *
              </label>
              <Select value={formData.priority} onChange={(v) => setFormData({ ...formData, priority: v })} options={PRIORITIES as any} />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Estado *
              </label>
              <Select value={formData.status} onChange={(v) => setFormData({ ...formData, status: v })} options={STATUS_OPTIONS as any} />
            </div>

            {/* Campos adicionales para solicitudes aprobadas/compradas */}
            {(formData.status === 'APPROVED' || formData.status === 'PURCHASED' || formData.status === 'RECEIVED') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Aprobado por
                  </label>
                  <input
                    type="text"
                    value={formData.approvedBy}
                    onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    placeholder="Nombre del aprobador"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Fecha de Aprobación
                  </label>
                  <input
                    type="date"
                    value={formData.approvalDate}
                    onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  />
                </div>
              </>
            )}

            {(formData.status === 'PURCHASED' || formData.status === 'RECEIVED') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    placeholder="Nombre del proveedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Fecha de Compra
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Costo Real
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.actualCost}
                    onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                    placeholder="0.00"
                  />
                </div>
              </>
            )}

            {formData.status === 'RECEIVED' && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Fecha de Recepción
                </label>
                <input
                  type="date"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
              placeholder="Descripción detallada del item solicitado..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Justificación
            </label>
            <textarea
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
              placeholder="Justificación de la necesidad de compra..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
              placeholder="Observaciones adicionales..."
            />
          </div>

          
        </form>
        <div className="mt-3 sm:mt-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
              }}
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => { (document.getElementById('purchase-form') as HTMLFormElement | null)?.requestSubmit() }}
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base"
            >
              {editingRequest ? 'Actualizar' : 'Crear'} Solicitud
            </button>
          </div>
        </div>
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, request: null })}
        title="Eliminar Solicitud de Compra"
        description={`¿Estás seguro de que deseas eliminar la solicitud "${deleteConfirm.request?.itemName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      </div>
    </AnimatedContainer>
  )
}
