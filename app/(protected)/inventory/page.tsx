"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/lib/hooks/use-toast"
import Modal from "@/components/modal"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import Button from "@/components/button"
import ConfirmDialog from "@/components/confirm-dialog"
import Select from "@/components/select"
import SearchableSelect from "@/components/searchable-select"
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from "@/lib/professional-export"
import { useAppAuth } from "@/lib/hooks/useAppAuth"

type Employee = { id: number; firstName: string; lastName: string }

interface InventoryItem {
  id: number
  name: string
  category: string
  brand?: string
  model?: string
  serialNumber?: string
  quantity: number
  location?: string
  status: string
  condition: string
  notes?: string
  isPersonalProperty?: boolean
  assignedTo?: {
    id: number
    firstName: string
    lastName: string
  }
  createdAt: string
  updatedAt: string
}

type SelectOption = { value: string; label: string }

const CATEGORIES: SelectOption[] = [
  { value: 'KEYBOARD', label: 'Teclados' },
  { value: 'MOUSE', label: 'Mouse' },
  { value: 'CABLE', label: 'Cables' },
  { value: 'COMPONENT', label: 'Componentes' },
  { value: 'ACCESSORY', label: 'Accesorios' },
  { value: 'OTHER', label: 'Otros' }
]

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'ASSIGNED', label: 'Asignado' },
  { value: 'STORAGE', label: 'En Almacenamiento' },
  { value: 'REPAIR', label: 'En Reparación' },
  { value: 'RETIRED', label: 'Retirado' }
]

const CONDITION_OPTIONS: SelectOption[] = [
  { value: 'NEW', label: 'Nuevo' },
  { value: 'USED', label: 'Usado' },
  { value: 'REFURBISHED', label: 'Reacondicionado' },
  { value: 'DAMAGED', label: 'Dañado' }
]

export default function InventoryPage() {
  const { isAuthenticated, loading: authLoading, can } = useAppAuth()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: InventoryItem | null }>({ isOpen: false, item: null })
  const [viewItem, setViewItem] = useState<InventoryItem | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  // Toast notifications
  const { showSuccess, showError } = useToast()

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")

const [formData, setFormData] = useState({
    name: "",
    category: "KEYBOARD",
    brand: "",
    model: "",
    serialNumber: "",
    quantity: 1,
    location: "",
    status: "AVAILABLE",
    condition: "NEW",
    notes: "",
    assignedToId: "",
    isPersonalProperty: false
  })
  const [divideConfirm, setDivideConfirm] = useState<{
    open: boolean
    item: typeof formData | null
  }>({ open: false, item: null })

  type FilterOption = {
    label: string
    value: string
    onChange: (value: string) => void
    options: SelectOption[]
  }

  useEffect(() => {
    fetchItems()
    ;(async () => {
      try {
        const res = await fetch('/api/employees')
        const data = await res.json().catch(() => ([]))
        setEmployees(Array.isArray(data) ? data : (data.items ?? []))
      } catch {}
    })()
  }, [])

  useEffect(() => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, statusFilter, categoryFilter])

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check permissions
    if (!can('inventory:edit')) {
      showError('No tienes permisos para gestionar el inventario')
      return
    }
    
    // Validación: si está asignado, debe tener usuario asignado
    if (formData.status === 'ASSIGNED' && !formData.assignedToId) {
      showError('Si el estado es "Asignado", debe seleccionar un empleado')
      return
    }

    // Validación: si es propiedad personal, debe estar asignado
    if (formData.isPersonalProperty && !formData.assignedToId) {
      showError('Si es propiedad personal, debe estar asignado a un empleado')
      return
    }

    // Sistema inteligente para dividir periféricos
    if (formData.quantity > 1 && formData.assignedToId) {
      setDivideConfirm({ open: true, item: formData })
      return
    }
    
    try {
      const endpoint = editingItem ? `/api/inventory/${editingItem.id}` : `/api/inventory`
      const method = editingItem ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity.toString()),
          assignedToId: formData.assignedToId ? parseInt(formData.assignedToId) : null
        })
      })

      if (response.ok) {
        await fetchItems()
        resetForm()
        setIsModalOpen(false)
        showSuccess(editingItem ? 'Item actualizado correctamente' : 'Item creado correctamente')
      } else {
        const errorData = await response.json()
        showError(errorData.error || 'Error al guardar el item')
      }
    } catch (error) {
      console.error('Error saving inventory item:', error)
      showError('Error al guardar el item')
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      brand: item.brand || "",
      model: item.model || "",
      serialNumber: item.serialNumber || "",
      quantity: item.quantity,
      location: item.location || "",
      status: item.status,
      condition: item.condition,
      notes: item.notes || "",
      assignedToId: item.assignedTo?.id.toString() || "",
      isPersonalProperty: item.isPersonalProperty ?? false
    })
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.item) return
    
    // Check permissions
    if (!can('inventory:delete')) {
      showError('No tienes permisos para eliminar items del inventario')
      return
    }
    
    try {
      const response = await fetch(`/api/inventory/${deleteConfirm.item.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchItems()
        setDeleteConfirm({ isOpen: false, item: null })
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error)
    }
  }

  const handleDivideItems = async () => {
    if (!divideConfirm.item) return

    // Generar números de serie únicos si existe
    const generateUniqueSerial = (baseSerial: string, suffix: string) => {
      if (!baseSerial) return null
      return `${baseSerial}-${suffix}`
    }

    const assignedItem = {
      ...divideConfirm.item,
      quantity: 1,
      status: 'ASSIGNED',
      assignedToId: parseInt(divideConfirm.item.assignedToId),
      serialNumber: generateUniqueSerial(divideConfirm.item.serialNumber, 'A')
    }
    
    const unassignedItem = {
      ...divideConfirm.item,
      quantity: divideConfirm.item.quantity - 1,
      status: 'AVAILABLE',
      assignedToId: null,
      isPersonalProperty: false,
      serialNumber: generateUniqueSerial(divideConfirm.item.serialNumber, 'B')
    }
    
    try {
      // Si estamos editando un item existente, eliminarlo primero
      if (editingItem) {
        const deleteResponse = await fetch(`/api/inventory/${editingItem.id}`, {
          method: 'DELETE'
        })

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json()
          showError(`Error eliminando item original: ${errorData.error || 'Error desconocido'}`)
          return
        }
      }

      // Crear primero el item asignado
      const assignedResponse = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignedItem)
      })

      if (!assignedResponse.ok) {
        const errorData = await assignedResponse.json()
        showError(`Error creando item asignado: ${errorData.error || 'Error desconocido'}`)
        return
      }

      // Luego crear el item no asignado
      const unassignedResponse = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unassignedItem)
      })

      if (!unassignedResponse.ok) {
        const errorData = await unassignedResponse.json()
        showError(`Error creando item no asignado: ${errorData.error || 'Error desconocido'}`)
        return
      }
      
      await fetchItems()
      resetForm()
      setIsModalOpen(false)
      setDivideConfirm({ open: false, item: null })
      showSuccess('Items divididos correctamente: 1 asignado y el resto disponible')
    } catch (error) {
      console.error('Error dividing items:', error)
      showError('Error al dividir los items')
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "KEYBOARD",
      brand: "",
      model: "",
      serialNumber: "",
      quantity: 1,
      location: "",
      status: "AVAILABLE",
      condition: "NEW",
      notes: "",
      assignedToId: "",
      isPersonalProperty: false
    })
    setEditingItem(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-500/10 text-green-400'
      case 'ASSIGNED': return 'bg-blue-500/10 text-blue-400'
      case 'STORAGE': return 'bg-blue-500/10 text-blue-400'
      case 'REPAIR': return 'bg-yellow-500/10 text-yellow-400'
      case 'RETIRED': return 'bg-gray-500/10 text-gray-400'
      default: return 'bg-gray-500/10 text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status)
    return option?.label || status
  }

  const getCategoryLabel = (category: string) => {
    const option = CATEGORIES.find(opt => opt.value === category)
    return option?.label || category
  }

  const getConditionLabel = (condition: string) => {
    const option = CONDITION_OPTIONS.find(opt => opt.value === condition)
    return option?.label || condition
  }

  // Export functions
  const handleExportExcel = async () => {
    try {
      const exportData = filteredItems.map(item => ({
        id: item.id,
        name: item.name,
        category: getCategoryLabel(item.category),
        brand: item.brand || '-',
        model: item.model || '-',
        serialNumber: item.serialNumber || '-',
        quantity: item.quantity,
        location: item.location || '-',
        status: getStatusLabel(item.status),
        condition: getConditionLabel(item.condition),
        assignedTo: item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : 'No asignado',
        notes: item.notes || '-',
        createdAt: new Date(item.createdAt).toLocaleDateString('es-ES')
      }))

      const exportOptions = prepareDataForExport(exportData, {
        id: 'ID',
        name: 'Nombre',
        category: 'Categoría',
        brand: 'Marca',
        model: 'Modelo', 
        serialNumber: 'N° Serie',
        quantity: 'Cantidad',
        location: 'Ubicación',
        status: 'Estado',
        condition: 'Condición',
        assignedTo: 'Asignado a',
        notes: 'Notas',
        createdAt: 'Fecha Creación'
      }, {
        title: 'Reporte de Inventario',
        subtitle: `${filteredItems.length} elementos encontrados`,
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
      showError('Error al exportar a Excel')
    }
  }

  const handleExportPDF = async () => {
    try {
      const exportData = filteredItems.map(item => ({
        name: item.name,
        category: getCategoryLabel(item.category),
        brand: item.brand || '-',
        model: item.model || '-',
        quantity: item.quantity,
        status: getStatusLabel(item.status),
        condition: getConditionLabel(item.condition),
        assignedTo: item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : 'No asignado'
      }))

      const exportOptions = prepareDataForExport(exportData, {
        name: 'Nombre',
        category: 'Categoría', 
        brand: 'Marca',
        model: 'Modelo',
        quantity: 'Cant.',
        status: 'Estado',
        condition: 'Condición',
        assignedTo: 'Asignado a'
      }, {
        title: 'Reporte de Inventario',
        subtitle: `${filteredItems.length} elementos`,
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
      showError('Error al exportar a PDF')
    }
  }

  const filterOptions: FilterOption[] = [
    {
      label: 'Estado',
      value: statusFilter,
      onChange: (value: string) => setStatusFilter(value),
      options: [
        { value: '', label: 'Todos los estados' },
        ...STATUS_OPTIONS
      ]
    },
    {
      label: 'Categoría',
      value: categoryFilter,
      onChange: (value: string) => setCategoryFilter(value),
      options: [
        { value: '', label: 'Todas las categorías' },
        ...CATEGORIES
      ]
    }
  ]

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">{authLoading ? 'Verificando permisos...' : 'Cargando inventario...'}</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <AnimatedContainer className="space-y-6 text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso denegado</div>
            <div className="text-white/60">Debes iniciar sesión para acceder al inventario.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  // Show access denied if user doesn't have required permissions
  if (!can('inventory:view')) {
    return (
      <AnimatedContainer className="space-y-6 text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-white/60 mb-4">No tienes permisos para ver esta página</div>
            <div className="text-white/40 text-sm">Contacta al administrador para obtener acceso</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="space-y-6 text-white px-2 sm:px-0">
      {/* Header sin card */}
      <FadeInUp delay={0.05}>
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Inventario</h1>
          <p className="text-white/60 text-sm">Gestión de componentes, accesorios y suministros</p>
        </div>
      </FadeInUp>

      {/* Filtros en card */}
      <FadeInUp delay={0.1}>
        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-sm font-medium text-white/70 mb-1">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, marca, modelo..."
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
            />
          </div>
          {filterOptions.map((filter, index) => (
            <div key={index} className="w-full sm:w-auto min-w-[180px]">
              <label className="block text-sm font-medium text-white/70 mb-1">{filter.label}</label>
              <Select value={filter.value} onChange={filter.onChange} options={filter.options} />
            </div>
          ))}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {can('inventory:edit') && (
              <>
                <Button
                  onClick={handleExportExcel}
                  variant="ghost"
                >
                  Excel
                </Button>
                <Button
                  onClick={handleExportPDF}
                  variant="ghost"
                >
                  PDF
                </Button>
                <Button
                  onClick={() => {
                    resetForm()
                    setIsModalOpen(true)
                  }}
                >
                  Nuevo Item
                </Button>
              </>
            )}
          </div>
        </div>
        </div>
      </FadeInUp>

      {/* Separador */}
      <div className="mb-2 border-b border-white/10"></div>

      <FadeInUp delay={0.2}>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-3 text-white/80 font-medium">Nombre</th>
                <th className="text-left p-3 text-white/80 font-medium">Categoría</th>
                <th className="text-left p-3 text-white/80 font-medium">Marca</th>
                <th className="text-left p-3 text-white/80 font-medium">Cantidad</th>
                <th className="text-left p-3 text-white/80 font-medium">Estado</th>
                <th className="text-left p-3 text-white/80 font-medium">Asignado a</th>
                <th className="text-left p-3 text-white/80 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-white/60">
                    Cargando inventario...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-white/60">
                    No se encontraron items
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{getCategoryLabel(item.category)}</td>
                    <td className="p-3">{item.brand || '-'}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : '-'}
                    </td>
                    <td className="p-3 flex gap-2">
                      <Button onClick={() => setViewItem(item)} variant="ghost" small>Ver</Button>
                      {can('inventory:edit') && (
                        <Button onClick={() => handleEdit(item)} variant="ghost" small>Editar</Button>
                      )}
                      {can('inventory:delete') && (
                        <Button onClick={() => setDeleteConfirm({ isOpen: true, item })} small>Eliminar</Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-4 p-4">
          {loading ? (
            <div className="text-center text-white/60">Cargando inventario...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-white/60">No se encontraron items</div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">{item.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
                <div className="text-sm text-white/60 space-y-1">
                  <div>Categoría: {getCategoryLabel(item.category)}</div>
                  {item.brand && <div>Marca: {item.brand}</div>}
                  {item.model && <div>Modelo: {item.model}</div>}
                  <div>Cantidad: {item.quantity}</div>
                  {item.location && <div>Ubicación: {item.location}</div>}
                  <div>Condición: {getConditionLabel(item.condition)}</div>
                  {item.assignedTo && (
                    <div>Asignado a: {item.assignedTo.firstName} {item.assignedTo.lastName}</div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => setViewItem(item)} variant="ghost" small>Ver</Button>
                  {can('inventory:edit') && (
                    <Button onClick={() => handleEdit(item)} variant="ghost" small>Editar</Button>
                  )}
                  {can('inventory:delete') && (
                    <Button onClick={() => setDeleteConfirm({ isOpen: true, item })} small>Eliminar</Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </FadeInUp>

      {/* Modal para crear/editar */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingItem ? 'Editar Item de Inventario' : 'Nuevo Item de Inventario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide" id="inventory-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="Ej: Teclado Logitech K120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Categoría *
              </label>
              <Select value={formData.category} onChange={(v) => setFormData({ ...formData, category: v })} options={CATEGORIES} />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Marca
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="Ej: Logitech"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Modelo
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="Ej: K120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Número de Serie
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="Ej: SN123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                placeholder="Ej: Depósito A-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Estado *
              </label>
              <Select 
                  value={formData.status}
                  onChange={(v) => setFormData({ ...formData, status: v })}
                  options={STATUS_OPTIONS}
                disabled={formData.isPersonalProperty}
              />
              {formData.isPersonalProperty && (
                <p className="text-xs text-yellow-400 mt-1">
                  Estado fijo para propiedad personal
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Condición *
              </label>
              <Select value={formData.condition} onChange={(v) => setFormData({ ...formData, condition: v })} options={CONDITION_OPTIONS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Asignado a</label>
              <SearchableSelect 
                value={formData.assignedToId} 
                onChange={(v) => setFormData({ ...formData, assignedToId: v })} 
                options={[{ value: "", label: "Sin asignar" }, ...employees.map(e => ({ value: String(e.id), label: `${e.firstName} ${e.lastName}` }))]}
                searchPlaceholder="Buscar empleado..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPersonalProperty}
                  onChange={(e) => {
                    const isPersonal = e.target.checked
                    setFormData({ 
                      ...formData, 
                      isPersonalProperty: isPersonal,
                      status: isPersonal ? 'ASSIGNED' : formData.status
                    })
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-white/80">
                  Es propiedad personal del empleado (no de la empresa)
                </span>
              </label>
            </div>
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
              onClick={() => { (document.getElementById('inventory-form') as HTMLFormElement | null)?.requestSubmit() }}
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base"
            >
              {editingItem ? 'Actualizar' : 'Crear'} Item
            </button>
          </div>
        </div>
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, item: null })}
        title="Eliminar Item de Inventario"
        description={`¿Estás seguro de que deseas eliminar "${deleteConfirm.item?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Modal Ver Item */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `Detalle de ${viewItem.name}` : "Detalle"}
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
                <div className="text-white/60 text-xs">Categoría</div>
                <div className="text-sm">{getCategoryLabel(viewItem.category)}</div>
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
              <div>
                <div className="text-white/60 text-xs">Cantidad</div>
                <div className="text-sm">{viewItem.quantity}</div>
              </div>
              {viewItem.location && (
                <div>
                  <div className="text-white/60 text-xs">Ubicación</div>
                  <div className="text-sm">{viewItem.location}</div>
                </div>
              )}
              <div>
                <div className="text-white/60 text-xs">Estado</div>
                <div className="text-sm">{getStatusLabel(viewItem.status)}</div>
              </div>
              <div>
                <div className="text-white/60 text-xs">Condición</div>
                <div className="text-sm">{getConditionLabel(viewItem.condition)}</div>
              </div>
              <div>
                <div className="text-white/60 text-xs">Asignado a</div>
                <div className="text-sm">{viewItem.assignedTo ? `${viewItem.assignedTo.firstName} ${viewItem.assignedTo.lastName}` : '-'}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-white/60 text-xs">Observaciones</div>
                <div className="text-sm whitespace-pre-wrap">{viewItem.notes || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={divideConfirm.open}
        title="Dividir Items"
        description={`¿Desea dividir los ${divideConfirm.item?.quantity} ${divideConfirm.item?.name} y asignar 1 a ${employees.find(e => e.id.toString() === divideConfirm.item?.assignedToId)?.firstName} ${employees.find(e => e.id.toString() === divideConfirm.item?.assignedToId)?.lastName}?`}
        confirmText="Sí, dividir"
        cancelText="Cancelar"
        onConfirm={handleDivideItems}
        onCancel={() => setDivideConfirm({ open: false, item: null })}
      />

    </AnimatedContainer>
  )
}
