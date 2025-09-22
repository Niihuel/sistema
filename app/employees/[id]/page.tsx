"use client"

import { useState, useEffect } from "react"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import { useParams, useRouter } from "next/navigation"
import Button from "@/components/button"
import Modal from "@/components/modal"
import Select from "@/components/select"
import SearchableSelect from "@/components/searchable-select"
import { FIXED_AREAS } from "@/lib/constants/areas"

interface Employee {
  id: number
  firstName: string
  lastName: string
  area?: string
  email?: string
  phone?: string
  position?: string
  status: string
  equipmentAssigned: Equipment[]
  inventoryAssigned: InventoryItem[]
  ticketsRequested: Ticket[]
  ticketsAssigned: Ticket[]
  windowsAccounts: WindowsAccount[]
  qnapAccounts: QnapAccount[]
  calipsoAccounts: CalipsoAccount[]
  emailAccounts: EmailAccount[]
  purchaseRequests: PurchaseRequest[]
  createdAt: string
  updatedAt: string
}

interface Equipment {
  id: number
  name: string
  type: string
  status: string
  serialNumber?: string
  ip?: string
  ipAddress?: string
  macAddress?: string
  location?: string
  area?: string
  brand?: string
  model?: string
  processor?: string
  ram?: string
  storage?: string
  storageType?: string
  storageCapacity?: string
  operatingSystem?: string
  screenSize?: string
  dvdUnit?: boolean
  purchaseDate?: string
  notes?: string
  isPersonalProperty?: boolean
}

interface InventoryItem {
  id: number
  name: string
  category: string
  brand?: string
  model?: string
  quantity: number
  status: string
  isPersonalProperty?: boolean
}

interface Ticket {
  id: number
  title: string
  status: string
  priority: string
  createdAt: string
}

interface WindowsAccount {
  id: number
  username: string
  domain?: string
  isActive: boolean
  groups?: string
  lastLogin?: string
}

interface QnapAccount {
  id: number
  username: string
  userGroup?: string
  isActive: boolean
  lastAccess?: string
}

interface CalipsoAccount {
  id: number
  username: string
  profile?: string
  isActive: boolean
  lastLogin?: string
}

interface EmailAccount {
  id: number
  email: string
  accountType: string
  isActive: boolean
  lastSync?: string
}

interface PurchaseRequest {
  id: number
  requestNumber?: string
  itemName: string
  status: string
  priority: string
  createdAt: string
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({})

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [accountType, setAccountType] = useState<'windows' | 'qnap' | 'calipso' | 'email'>('windows')
  
  // Form states
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    area: '',
    email: '',
    phone: '',
    position: '',
    status: 'Activo'
  })
  
  const [accountForm, setAccountForm] = useState({
    employeeId: 0,
    username: '',
    password: '',
    domain: '',
    userGroup: '',
    profile: '',
    accountType: 'Personal',
    isActive: true
  })

  const fetchEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${params.id}?include=all`)
      if (response.ok) {
        const data = await response.json()
        setEmployee(data)
        // Populate edit form
        setEditForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          area: data.area || '',
          email: data.email || '',
          phone: data.phone || '',
          position: data.position || '',
          status: data.status || 'Activo'
        })
        setAccountForm(prev => ({ ...prev, employeeId: data.id }))
      } else {
        // Error fetching employee
      }
    } catch (error) {
      // Error fetching employee
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchEmployee()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])
  
  const handleEditEmployee = async () => {
    try {
      const response = await fetch(`/api/employees/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (response.ok) {
        setIsEditModalOpen(false)
        await fetchEmployee() // Refresh employee data
      } else {
        console.error('Error updating employee')
      }
    } catch (error) {
      console.error('Error updating employee:', error)
    }
  }
  
  const handleCreateAccount = async () => {
    try {
      const response = await fetch(`/api/accounts/${accountType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm)
      })
      
      if (response.ok) {
        setIsAccountModalOpen(false)
        resetAccountForm()
        await fetchEmployee() // Refresh employee data
      } else {
        console.error('Error creating account')
      }
    } catch (error) {
      console.error('Error creating account:', error)
    }
  }
  
  const resetAccountForm = () => {
    setAccountForm({
      employeeId: employee?.id || 0,
      username: '',
      password: '',
      domain: '',
      userGroup: '',
      profile: '',
      accountType: 'Personal',
      isActive: true
    })
  }
  
  const openEditModal = () => {
    setIsEditModalOpen(true)
  }
  
  const openAccountModal = () => {
    resetAccountForm()
    setIsAccountModalOpen(true)
  }

  const getStatusDisplay = (status: string, type: 'equipment' | 'inventory' | 'account' = 'equipment') => {
    const normalizedStatus = status.toLowerCase()
    
    // Standardized translations
    const translations: Record<string, string> = {
      'active': 'Activo',
      'activo': 'Activo',
      'inactive': 'Inactivo',
      'inactivo': 'Inactivo',
      'available': 'Disponible',
      'disponible': 'Disponible',
      'assigned': 'Asignado',
      'asignado': 'Asignado',
      'in_use': 'En Uso',
      'en uso': 'En Uso',
      'repair': 'En Reparación',
      'en reparación': 'En Reparación',
      'reparación': 'En Reparación',
      'retired': 'Retirado',
      'retirado': 'Retirado',
      'open': 'Abierto',
      'abierto': 'Abierto',
      'closed': 'Cerrado',
      'cerrado': 'Cerrado',
      'resolved': 'Resuelto',
      'resuelto': 'Resuelto',
      'in_progress': 'En Progreso',
      'en progreso': 'En Progreso',
      'pending': 'Pendiente',
      'pendiente': 'Pendiente',
      'en almacenamiento': 'En Almacenamiento',
      'de baja': 'De Baja'
    }
    
    const displayText = translations[normalizedStatus] || status
    
    // Standardized badge colors - using unified styling
    let colorClass = 'bg-gray-500/10 text-gray-400'
    switch (normalizedStatus) {
      case 'activo': case 'active': case 'available': case 'open': case 'disponible': case 'abierto':
        colorClass = 'bg-green-500/10 text-green-400'
        break
      case 'inactivo': case 'inactive': case 'retired': case 'closed': case 'resolved': case 'retirado': case 'cerrado': case 'resuelto': case 'de baja':
        colorClass = 'bg-red-500/10 text-red-400'
        break
      case 'assigned': case 'in_use': case 'in_progress': case 'asignado': case 'en uso': case 'en almacenamiento': case 'en progreso':
        colorClass = 'bg-blue-500/10 text-blue-400'
        break
      case 'repair': case 'pending': case 'en reparación': case 'reparación': case 'pendiente':
        colorClass = 'bg-yellow-500/10 text-yellow-400'
        break
    }
    
    return { text: displayText, color: colorClass }
  }
  
  const getStatusColor = (status: string) => {
    return getStatusDisplay(status).color
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': case 'urgente': case 'alta': return 'bg-red-500/10 text-red-400'
      case 'high': return 'bg-orange-500/10 text-orange-400'
      case 'medium': case 'media': return 'bg-yellow-500/10 text-yellow-400'
      case 'low': case 'baja': return 'bg-green-500/10 text-green-400'
      default: return 'bg-gray-500/10 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Cargando información del empleado...</div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-white/60">Empleado no encontrado</div>
        <Button onClick={() => router.push('/employees')}>
          Volver a Empleados
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Resumen', count: null },
    { id: 'equipment', label: 'Equipos', count: employee.equipmentAssigned?.length || 0 },
    { id: 'inventory', label: 'Inventario', count: employee.inventoryAssigned?.length || 0 },
    { id: 'accounts', label: 'Cuentas', count: (employee.windowsAccounts?.length || 0) + (employee.qnapAccounts?.length || 0) + (employee.calipsoAccounts?.length || 0) + (employee.emailAccounts?.length || 0) },
    { id: 'tickets', label: 'Solicitudes de Reclamo', count: employee.ticketsRequested?.length || 0 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/employees')}
              className="shrink-0 px-3 py-2 text-sm sm:text-base"
            >
              ← Volver
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                {employee.firstName} {employee.lastName}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
                <span className="text-white/60 text-sm">{employee.area || 'Sin área'}</span>
                <span className={`text-xs px-2 py-1 rounded-full w-fit ${getStatusDisplay(employee.status).color}`}>
                  {getStatusDisplay(employee.status).text}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={openEditModal}
              className="flex-1 sm:flex-none px-4 py-2 text-sm sm:text-base"
            >
              Editar
            </Button>
            <Button
              onClick={openAccountModal}
              className="flex-1 sm:flex-none px-4 py-2 text-sm sm:text-base"
            >
              Nueva Cuenta
            </Button>
          </div>
        </div>
      </div>

      {/* Información básica */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Información Personal</h2>
            <div className="space-y-3">
              <div>
                <span className="text-white/60 text-sm">Email:</span>
                <p className="text-white">{employee.email || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Teléfono:</span>
                <p className="text-white">{employee.phone || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Puesto:</span>
                <p className="text-white">{employee.position || 'No especificado'}</p>
              </div>
              <div>
                <span className="text-white/60 text-sm">Área:</span>
                <p className="text-white">{employee.area || 'No especificado'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Estadísticas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {employee.equipmentAssigned?.length || 0}
                </div>
                <div className="text-white/60 text-sm">Equipos</div>
                <div className="text-xs text-white/40 mt-1">
                  {employee.equipmentAssigned?.filter(e => e.isPersonalProperty).length || 0} propios
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {employee.inventoryAssigned?.length || 0}
                </div>
                <div className="text-white/60 text-sm">Items Inventario</div>
                <div className="text-xs text-white/40 mt-1">
                  {employee.inventoryAssigned?.filter(i => i.isPersonalProperty).length || 0} propios
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {employee.ticketsRequested?.length || 0}
                </div>
                <div className="text-white/60 text-sm">Solicitudes de Reclamo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {(employee.windowsAccounts?.length || 0) + 
                   (employee.qnapAccounts?.length || 0) + 
                   (employee.calipsoAccounts?.length || 0) + 
                   (employee.emailAccounts?.length || 0)}
                </div>
                <div className="text-white/60 text-sm">Cuentas</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 p-2 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2 min-w-0 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {tab.count !== null && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20 flex-shrink-0">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {/* Equipos Tab */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Equipos Asignados</h3>
              {employee.equipmentAssigned && employee.equipmentAssigned.length > 0 ? (
                <div className="grid gap-4">
                  {employee.equipmentAssigned.map((equipment) => (
                    <div key={equipment.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="space-y-4">
                        {/* Header with name and status */}
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-medium text-lg">{equipment.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            equipment.isPersonalProperty 
                              ? 'bg-yellow-500/10 text-yellow-400' 
                              : getStatusDisplay(equipment.status, 'equipment').color
                          }`}>
                            {equipment.isPersonalProperty 
                              ? 'Propiedad Personal' 
                              : getStatusDisplay(equipment.status, 'equipment').text
                            }
                          </span>
                        </div>
                        
                        {/* Equipment details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-white/60 text-xs">Tipo</div>
                            <div className="text-white">{equipment.type}</div>
                          </div>
                          
                          {equipment.brand && (
                            <div>
                              <div className="text-white/60 text-xs">Marca</div>
                              <div className="text-white">{equipment.brand}</div>
                            </div>
                          )}
                          
                          {equipment.model && (
                            <div>
                              <div className="text-white/60 text-xs">Modelo</div>
                              <div className="text-white">{equipment.model}</div>
                            </div>
                          )}
                          
                          {equipment.serialNumber && (
                            <div>
                              <div className="text-white/60 text-xs">N° Serie</div>
                              <div className="text-white">{equipment.serialNumber}</div>
                            </div>
                          )}
                          
                          {equipment.area && (
                            <div>
                              <div className="text-white/60 text-xs">Área</div>
                              <div className="text-white">{equipment.area}</div>
                            </div>
                          )}
                          
                          {equipment.location && (
                            <div>
                              <div className="text-white/60 text-xs">Ubicación</div>
                              <div className="text-white">{equipment.location}</div>
                            </div>
                          )}
                          
                          {equipment.processor && (
                            <div>
                              <div className="text-white/60 text-xs">Procesador</div>
                              <div className="text-white">{equipment.processor}</div>
                            </div>
                          )}
                          
                          {equipment.ram && (
                            <div>
                              <div className="text-white/60 text-xs">RAM</div>
                              <div className="text-white">{equipment.ram}</div>
                            </div>
                          )}
                          
                          {equipment.storageType && (
                            <div>
                              <div className="text-white/60 text-xs">Tipo de Disco</div>
                              <div className="text-white">{equipment.storageType}</div>
                            </div>
                          )}
                          
                          {equipment.storageCapacity && (
                            <div>
                              <div className="text-white/60 text-xs">Capacidad Disco</div>
                              <div className="text-white">{equipment.storageCapacity}</div>
                            </div>
                          )}
                          
                          {equipment.operatingSystem && (
                            <div>
                              <div className="text-white/60 text-xs">Sistema Operativo</div>
                              <div className="text-white">{equipment.operatingSystem}</div>
                            </div>
                          )}
                          
                          {equipment.screenSize && (
                            <div>
                              <div className="text-white/60 text-xs">Tamaño Pantalla</div>
                              <div className="text-white">{equipment.screenSize}</div>
                            </div>
                          )}
                          
                          {(equipment.ipAddress || equipment.ip) && (
                            <div>
                              <div className="text-white/60 text-xs">Dirección IP</div>
                              <div className="text-white">{equipment.ipAddress || equipment.ip}</div>
                            </div>
                          )}
                          
                          {equipment.macAddress && (
                            <div>
                              <div className="text-white/60 text-xs">Dirección MAC</div>
                              <div className="text-white">{equipment.macAddress}</div>
                            </div>
                          )}
                          
                          {equipment.purchaseDate && (
                            <div>
                              <div className="text-white/60 text-xs">Fecha de Compra</div>
                              <div className="text-white">{new Date(equipment.purchaseDate).toLocaleDateString()}</div>
                            </div>
                          )}
                          
                          {equipment.dvdUnit !== undefined && (
                            <div>
                              <div className="text-white/60 text-xs">Unidad DVD/CD</div>
                              <div className="text-white">{equipment.dvdUnit ? 'Sí' : 'No'}</div>
                            </div>
                          )}
                        </div>
                        
                        {equipment.notes && (
                          <div>
                            <div className="text-white/60 text-xs mb-1">Observaciones</div>
                            <div className="text-white text-sm bg-white/5 rounded p-2 whitespace-pre-wrap">{equipment.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/60 py-8">
                  No tiene equipos asignados
                </div>
              )}
            </div>
          )}

          {/* Inventario Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Items de Inventario Asignados</h3>
              {employee.inventoryAssigned && employee.inventoryAssigned.length > 0 ? (
                <div className="grid gap-4">
                  {employee.inventoryAssigned.map((item) => (
                    <div key={item.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{item.name}</h4>
                          <div className="text-sm text-white/60 space-y-1 mt-1">
                            <div>Categoría: {item.category}</div>
                            {item.brand && <div>Marca: {item.brand}</div>}
                            {item.model && <div>Modelo: {item.model}</div>}
                            <div>Cantidad: {item.quantity}</div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.isPersonalProperty 
                            ? 'bg-yellow-500/10 text-yellow-400' 
                            : getStatusDisplay(item.status, 'inventory').color
                        }`}>
                          {item.isPersonalProperty 
                            ? 'Propiedad Personal' 
                            : getStatusDisplay(item.status, 'inventory').text
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/60 py-8">
                  No tiene items de inventario asignados
                </div>
              )}
            </div>
          )}

          {/* Cuentas Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Cuentas de Usuario</h3>
              
              {/* Windows Accounts */}
              {employee.windowsAccounts && employee.windowsAccounts.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">Windows</h4>
                  <div className="space-y-3">
                    {employee.windowsAccounts.map((account) => (
                      <div key={account.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">
                              {account.domain}\\{account.username}
                            </div>
                            <div className="text-sm text-white/60 mt-1">
                              {(account as any).password && (
                                <div className="flex items-center gap-2">
                                  <span>Contraseña: {showPasswords[`windows-${account.id}`] ? (account as any).password : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({
                                      ...prev,
                                      [`windows-${account.id}`]: !prev[`windows-${account.id}`]
                                    }))}
                                    className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10 flex-shrink-0"
                                    aria-label={showPasswords[`windows-${account.id}`] ? "Ocultar contraseña" : "Mostrar contraseña"}
                                  >
                                    {showPasswords[`windows-${account.id}`] ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              )}
                              {account.groups && <div>Grupos: {account.groups}</div>}
                              {account.lastLogin && <div>Último login: {new Date(account.lastLogin).toLocaleDateString()}</div>}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${account.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                            {account.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QNAP Accounts */}
              {employee.qnapAccounts && employee.qnapAccounts.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">QNAP</h4>
                  <div className="space-y-3">
                    {employee.qnapAccounts.map((account) => (
                      <div key={account.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">{account.username}</div>
                            <div className="text-sm text-white/60 mt-1">
                              {(account as any).password && (
                                <div className="flex items-center gap-2">
                                  <span>Contraseña: {showPasswords[`qnap-${account.id}`] ? (account as any).password : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({
                                      ...prev,
                                      [`qnap-${account.id}`]: !prev[`qnap-${account.id}`]
                                    }))}
                                    className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10 flex-shrink-0"
                                    aria-label={showPasswords[`qnap-${account.id}`] ? "Ocultar contraseña" : "Mostrar contraseña"}
                                  >
                                    {showPasswords[`qnap-${account.id}`] ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 01.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              )}
                              {account.userGroup && <div>Grupo: {account.userGroup}</div>}
                              {account.lastAccess && <div>Último acceso: {new Date(account.lastAccess).toLocaleDateString()}</div>}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${account.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                            {account.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calipso Accounts */}
              {employee.calipsoAccounts && employee.calipsoAccounts.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">Calipso</h4>
                  <div className="space-y-3">
                    {employee.calipsoAccounts.map((account) => (
                      <div key={account.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">{account.username}</div>
                            <div className="text-sm text-white/60 mt-1">
                              {(account as any).password && (
                                <div className="flex items-center gap-2">
                                  <span>Contraseña: {showPasswords[`calipso-${account.id}`] ? (account as any).password : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({
                                      ...prev,
                                      [`calipso-${account.id}`]: !prev[`calipso-${account.id}`]
                                    }))}
                                    className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10 flex-shrink-0"
                                    aria-label={showPasswords[`calipso-${account.id}`] ? "Ocultar contraseña" : "Mostrar contraseña"}
                                  >
                                    {showPasswords[`calipso-${account.id}`] ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 01.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              )}
                              {account.profile && <div>Perfil: {account.profile}</div>}
                              {account.lastLogin && <div>Último login: {new Date(account.lastLogin).toLocaleDateString()}</div>}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${account.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                            {account.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Accounts */}
              {employee.emailAccounts && employee.emailAccounts.length > 0 && (
                <div>
                  <h4 className="text-white font-medium mb-3">Email</h4>
                  <div className="space-y-3">
                    {employee.emailAccounts.map((account) => (
                      <div key={account.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">{account.email}</div>
                            <div className="text-sm text-white/60 mt-1">
                              {(account as any).password && (
                                <div className="flex items-center gap-2">
                                  <span>Contraseña: {showPasswords[`email-${account.id}`] ? (account as any).password : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({
                                      ...prev,
                                      [`email-${account.id}`]: !prev[`email-${account.id}`]
                                    }))}
                                    className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10 flex-shrink-0"
                                    aria-label={showPasswords[`email-${account.id}`] ? "Ocultar contraseña" : "Mostrar contraseña"}
                                  >
                                    {showPasswords[`email-${account.id}`] ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 01.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              )}
                              <div>Tipo: {account.accountType}</div>
                              {account.lastSync && <div>Última sincronización: {new Date(account.lastSync).toLocaleDateString()}</div>}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full bg-white/10 ${account.isActive ? 'text-green-400' : 'text-gray-400'}`}>
                            {account.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!employee.windowsAccounts?.length && !employee.qnapAccounts?.length && 
                !employee.calipsoAccounts?.length && !employee.emailAccounts?.length) && (
                <div className="text-center text-white/60 py-8">
                  No tiene cuentas de usuario registradas
                </div>
              )}
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Solicitudes de Reclamo</h3>
              {employee.ticketsRequested && employee.ticketsRequested.length > 0 ? (
                <div className="space-y-3">
                  {employee.ticketsRequested.map((ticket) => (
                    <div key={ticket.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{ticket.title}</h4>
                          <div className="text-sm text-white/60 mt-1">
                            Creado: {new Date(ticket.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white/60 py-8">
                  No ha solicitado reclamos
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Edit Employee Modal */}
      <Modal 
        open={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Editar Empleado"
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
              onClick={() => setIsEditModalOpen(false)} 
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button 
              onClick={handleEditEmployee} 
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base"
            >
              Guardar
            </button>
          </div>
        )}
      >
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/70 mb-1">Nombre</label>
              <input 
                value={editForm.firstName} 
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} 
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Apellido</label>
              <input 
                value={editForm.lastName} 
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} 
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Puesto</label>
              <input 
                value={editForm.position} 
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} 
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Área</label>
              <SearchableSelect 
                value={editForm.area} 
                onChange={(v) => setEditForm({ ...editForm, area: v })} 
                options={[{ value: "", label: "-- Seleccionar --" }, ...FIXED_AREAS.map(a => ({ value: a, label: a }))]}
                searchPlaceholder="Buscar área..."
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Email</label>
              <input 
                value={editForm.email} 
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Teléfono</label>
              <input 
                value={editForm.phone} 
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Estado</label>
              <Select 
                value={editForm.status} 
                onChange={(v) => setEditForm({ ...editForm, status: v })} 
                options={[{ value: "Activo", label: "Activo" }, { value: "Inactivo", label: "Inactivo" }]} 
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* New Account Modal */}
      <Modal 
        open={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        title="Nueva Cuenta"
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
              onClick={() => setIsAccountModalOpen(false)} 
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button 
              onClick={handleCreateAccount} 
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base"
            >
              Crear
            </button>
          </div>
        )}
      >
        <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm text-white/70 mb-1">Tipo de Cuenta</label>
            <Select 
              value={accountType} 
              onChange={(v) => setAccountType(v as any)} 
              options={[
                { value: "windows", label: "Windows" },
                { value: "qnap", label: "QNAP" },
                { value: "calipso", label: "Calipso" },
                { value: "email", label: "Email" }
              ]} 
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/70 mb-1">Usuario</label>
              <input 
                value={accountForm.username} 
                onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })} 
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Contraseña</label>
              <input 
                type="password"
                value={accountForm.password} 
                onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} 
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
              />
            </div>
            {accountType === 'windows' && (
              <div>
                <label className="block text-sm text-white/70 mb-1">Dominio</label>
                <input 
                  value={accountForm.domain} 
                  onChange={(e) => setAccountForm({ ...accountForm, domain: e.target.value })} 
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
                />
              </div>
            )}
            {accountType === 'qnap' && (
              <div>
                <label className="block text-sm text-white/70 mb-1">Grupo</label>
                <input 
                  value={accountForm.userGroup} 
                  onChange={(e) => setAccountForm({ ...accountForm, userGroup: e.target.value })} 
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
                />
              </div>
            )}
            {accountType === 'calipso' && (
              <div>
                <label className="block text-sm text-white/70 mb-1">Perfil</label>
                <input 
                  value={accountForm.profile} 
                  onChange={(e) => setAccountForm({ ...accountForm, profile: e.target.value })} 
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10" 
                />
              </div>
            )}
            {accountType === 'email' && (
              <div>
                <label className="block text-sm text-white/70 mb-1">Tipo de Cuenta</label>
                <Select 
                  value={accountForm.accountType} 
                  onChange={(v) => setAccountForm({ ...accountForm, accountType: v })} 
                  options={[
                    { value: "Personal", label: "Personal" },
                    { value: "Shared", label: "Compartida" },
                    { value: "Service", label: "Servicio" }
                  ]} 
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-white/70 mb-1">Estado</label>
              <Select 
                value={accountForm.isActive ? "true" : "false"} 
                onChange={(v) => setAccountForm({ ...accountForm, isActive: v === "true" })} 
                options={[
                  { value: "true", label: "Activa" },
                  { value: "false", label: "Inactiva" }
                ]} 
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
