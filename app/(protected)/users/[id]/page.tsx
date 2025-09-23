"use client"

import { useState, useEffect } from "react"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import { useParams, useRouter } from "next/navigation"
import Button from "@/components/button"
import Modal from "@/components/modal"
import SearchableSelect from "@/components/searchable-select"
import { validateForm, ValidationRule } from "@/lib/validation"
import { useToast } from "@/lib/hooks/use-toast"

interface User {
  id: number
  username: string
  role: string
  createdAt: string
  updatedAt: string
}

interface Employee {
  id: number
  firstName: string
  lastName: string
  area?: string
  email?: string
  phone?: string
  position?: string
  status: string
}

interface InventoryItem {
  id: number
  name: string
  category: string
  status: string
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Modal states
  const [isNewInventoryOpen, setIsNewInventoryOpen] = useState(false)
  const [inventoryForm, setInventoryForm] = useState({ name: "", category: "HARDWARE", status: "AVAILABLE" })
  // Toast notifications
  const { showSuccess, showError } = useToast()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        
        // Si el usuario tiene un empleado asociado, buscarlo
        if (userData.employeeId || userData.username) {
          const empResponse = await fetch(`/api/employees?search=${userData.username}`)
          if (empResponse.ok) {
            const empData = await empResponse.json()
            const employees = Array.isArray(empData) ? empData : (empData.items ?? [])
            const relatedEmployee = employees.find((emp: Employee) => 
              emp.email?.includes(userData.username) || 
              `${emp.firstName}.${emp.lastName}`.toLowerCase() === userData.username.toLowerCase()
            )
            setEmployee(relatedEmployee || null)
          }
        }
      } else {
        console.error('Error fetching user')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchUserData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const validationRules: ValidationRule[] = [
    { field: 'name', required: true, minLength: 2, maxLength: 100 },
    { field: 'category', required: true }
  ]

  async function saveNewInventory() {
    setFormErrors({})
    
    const validation = validateForm(inventoryForm, validationRules)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      showError(validation.firstError || 'Por favor corrige los errores en el formulario')
      return
    }

    if (!employee) {
      showError('No hay empleado asociado para asignar el inventario')
      return
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inventoryForm.name,
          category: inventoryForm.category,
          status: inventoryForm.status,
          assignedToId: employee.id
        })
      })
      if (res.ok) {
        setIsNewInventoryOpen(false)
        setInventoryForm({ name: "", category: "HARDWARE", status: "AVAILABLE" })
        showSuccess('Item de inventario creado correctamente')
      } else {
        const errorData = await res.json()
        showError(errorData.error || 'Error creando item de inventario')
      }
    } catch (e) {
      console.error('Error creating inventory item', e)
      showError('Error creando item de inventario')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Cargando información del usuario...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-white/60">Usuario no encontrado</div>
        <Button onClick={() => router.push('/users')}>
          Volver a Usuarios
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Resumen', count: null },
    { id: 'accounts', label: 'Cuentas', count: 0 },
    { id: 'inventory', label: 'Inventario', count: 0 }
  ]

  return (
    <div className="text-white px-2 sm:px-0 space-y-6">
      {/* Header sin card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/users')}
            className="shrink-0"
          >
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">
              {user.username}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-white/60">{user.role}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-green-400">
                Activo
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {employee && (
            <Button onClick={() => setIsNewInventoryOpen(true)} variant="ghost">Nuevo Inventario</Button>
          )}
        </div>
      </div>
      <div className="mb-2 border-b border-white/10" />

      {/* Información básica */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Información del Usuario</h2>
            <div className="space-y-3">
              <div>
                <span className="text-white/60 text-sm">Usuario:</span>
                <p className="text-white">{user.username}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Rol:</span>
                <p className="text-white">{user.role}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Creado:</span>
                <p className="text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {employee && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Empleado Asociado</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-white/60 text-sm">Nombre:</span>
                  <p className="text-white">{employee.firstName} {employee.lastName}</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Área:</span>
                  <p className="text-white">{employee.area || 'No especificada'}</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Email:</span>
                  <p className="text-white">{employee.email || 'No especificado'}</p>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Puesto:</span>
                  <p className="text-white">{employee.position || 'No especificado'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Estadísticas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-white/60 text-sm">Cuentas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-white/60 text-sm">Items Inventario</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="flex flex-wrap gap-1 p-2 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Cuentas Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Cuentas del Sistema</h3>
              <div className="text-center text-white/60 py-8">
                Las cuentas se gestionan desde la página principal de usuarios
              </div>
            </div>
          )}

          {/* Inventario Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Items de Inventario Asignados</h3>
              <div className="text-center text-white/60 py-8">
                {employee ? "No hay items de inventario asignados" : "No hay empleado asociado"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Inventario */}
      <Modal
        open={isNewInventoryOpen}
        onClose={() => setIsNewInventoryOpen(false)}
        title="Nuevo Item de Inventario"
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={() => setIsNewInventoryOpen(false)} className="flex-1 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20">Cancelar</button>
            <button onClick={saveNewInventory} className="flex-1 px-3 py-2 rounded-md bg-white text-black hover:bg-white/90">Crear</button>
          </div>
        )}
      >
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
          <div>
            <label className="block text-sm text-white/70 mb-1">Nombre *</label>
            <input 
              value={inventoryForm.name} 
              onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })} 
              className={`w-full px-3 py-2 rounded-md bg-black/30 border text-sm ${formErrors.name ? 'border-red-400' : 'border-white/10'}`}
              placeholder="Ej: Mouse Logitech" 
            />
            {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Categoría *</label>
            <SearchableSelect 
              value={inventoryForm.category} 
              onChange={(v) => setInventoryForm({ ...inventoryForm, category: v })} 
              options={[
                { value: "HARDWARE", label: "Hardware" },
                { value: "SOFTWARE", label: "Software" },
                { value: "COMPONENT", label: "Componentes" },
                { value: "ACCESSORY", label: "Accesorios" },
                { value: "OTHER", label: "Otros" }
              ]}
              searchPlaceholder="Buscar categoría..."
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Estado</label>
            <SearchableSelect 
              value={inventoryForm.status} 
              onChange={(v) => setInventoryForm({ ...inventoryForm, status: v })} 
              options={[
                { value: "AVAILABLE", label: "Disponible" },
                { value: "ASSIGNED", label: "Asignado" },
                { value: "STORAGE", label: "En Almacenamiento" },
                { value: "REPAIR", label: "En Reparación" },
                { value: "RETIRED", label: "Retirado" }
              ]}
              searchPlaceholder="Buscar estado..."
            />
          </div>
        </div>
      </Modal>

    </div>
  )
}
