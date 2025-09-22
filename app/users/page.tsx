"use client"

import { useState, useEffect } from "react"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import Button from "@/components/button"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import Select from "@/components/select"
import SearchableSelect from "@/components/searchable-select"
import CustomNotification from "@/components/notification"
import PermissionGuard from "@/components/PermissionGuard"
import { validateForm, ValidationRule } from "@/lib/validation"
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from "@/lib/professional-export"
import { useAuth } from "@/lib/hooks/useAuth"
import { usePermissionToast } from "@/lib/hooks/usePermissionToast"

interface Employee {
  id: number
  firstName: string
  lastName: string
  area?: string
}

interface WindowsAccount {
  id: number
  employeeId: number
  employee: Employee
  username: string
  domain?: string
  password?: string
  profilePath?: string
  homeDirectory?: string
  groups?: string
  isActive: boolean
  lastLogin?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface QnapAccount {
  id: number
  employeeId: number
  employee: Employee
  username: string
  password?: string
  userGroup?: string
  folderPermissions?: string
  quotaLimit?: string
  isActive: boolean
  lastAccess?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface CalipsoAccount {
  id: number
  employeeId: number
  employee: Employee
  username: string
  password?: string
  profile?: string
  permissions?: string
  modules?: string
  isActive: boolean
  lastLogin?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface EmailAccount {
  id: number
  employeeId: number
  employee: Employee
  email: string
  password?: string
  accountType: string
  forwardingTo?: string
  aliases?: string
  isActive: boolean
  lastSync?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const { hasRole, hasPermission, isLoading: authLoading } = useAuth()
  const { showPermissionError } = usePermissionToast()
  const [activeTab, setActiveTab] = useState('windows')
  const [windowsAccounts, setWindowsAccounts] = useState<WindowsAccount[]>([])
  const [qnapAccounts, setQnapAccounts] = useState<QnapAccount[]>([])
  const [calipsoAccounts, setCalipsoAccounts] = useState<CalipsoAccount[]>([])
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<WindowsAccount | QnapAccount | CalipsoAccount | EmailAccount | null>(null)
  const [viewAccount, setViewAccount] = useState<WindowsAccount | QnapAccount | CalipsoAccount | EmailAccount | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; account: WindowsAccount | QnapAccount | CalipsoAccount | EmailAccount | null }>({ isOpen: false, account: null })

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [employeeFilter, setEmployeeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Form data
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({})
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showViewPassword, setShowViewPassword] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [windowsRes, qnapRes, calipsoRes, emailRes, employeesRes] = await Promise.all([
        fetch('/api/accounts/windows'),
        fetch('/api/accounts/qnap'),
        fetch('/api/accounts/calipso'),
        fetch('/api/accounts/email'),
        fetch('/api/employees')
      ])

      if (windowsRes.ok) setWindowsAccounts(await windowsRes.json())
      if (qnapRes.ok) setQnapAccounts(await qnapRes.json())
      if (calipsoRes.ok) setCalipsoAccounts(await calipsoRes.json())
      if (emailRes.ok) setEmailAccounts(await emailRes.json())
      if (employeesRes.ok) {
        const data = await employeesRes.json().catch(() => ([]))
        setEmployees(Array.isArray(data) ? data : (data.items ?? []))
      }
    } catch (error) {
      // Error fetching data
    } finally {
      setLoading(false)
    }
  }

  const getCurrentAccounts = (): any[] => {
    switch (activeTab) {
      case 'windows': return windowsAccounts
      case 'qnap': return qnapAccounts
      case 'calipso': return calipsoAccounts
      case 'email': return emailAccounts
      default: return []
    }
  }

  const getFilteredAccounts = () => {
    let accounts = getCurrentAccounts()

    if (searchTerm) {
      accounts = accounts.filter((account: any) => {
        const searchFields = activeTab === 'email'
          ? [account.email, account.employee.firstName, account.employee.lastName]
          : [account.username, account.employee.firstName, account.employee.lastName]
        return searchFields.some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    if (employeeFilter) {
      accounts = accounts.filter(account => 
        account.employeeId.toString() === employeeFilter
      )
    }

    if (statusFilter) {
      const isActive = statusFilter === 'active'
      accounts = accounts.filter(account => account.isActive === isActive)
    }

    return accounts
  }

  const getValidationRules = (): ValidationRule[] => {
    return [
      { field: 'employeeId', required: true, custom: (value) => {
        if (!value || value === '') return 'Empleado es requerido'
        return null
      }},
      { field: 'username', required: true, minLength: 2, maxLength: 50 },
      { field: 'email', type: 'email' },
      { field: 'password', required: true, minLength: 6 }
    ]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check permissions
    if (!hasRole(['ADMIN'])) {
      showPermissionError('No tienes permisos para gestionar cuentas de usuario')
      return
    }
    
    setFormErrors({})
    
    const validation = validateForm(formData, getValidationRules())
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      setNotification({ type: 'error', message: validation.firstError || 'Por favor corrige los errores en el formulario' })
      return
    }
    
    try {
      const endpoint = editingAccount 
        ? `/api/accounts/${activeTab}/${editingAccount.id}` 
        : `/api/accounts/${activeTab}`
      const method = editingAccount ? 'PUT' : 'POST'
      const payload = {
        ...formData,
        employeeId: parseInt(String(formData.employeeId))
      }
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchData()
        resetForm()
        setIsModalOpen(false)
        setNotification({ type: 'success', message: editingAccount ? 'Cuenta actualizada correctamente' : 'Cuenta creada correctamente' })
      } else {
        const errorData = await response.json()
        setNotification({ type: 'error', message: errorData.error || 'Error al guardar la cuenta' })
      }
    } catch (error) {
      console.error('Error saving account:', error)
    }
  }

  const handleEdit = (account: WindowsAccount | QnapAccount | CalipsoAccount | EmailAccount) => {
    setEditingAccount(account)
    
    // Preparar datos del formulario según el tipo de cuenta
    switch (activeTab) {
      case 'windows':
        const windowsAccount = account as WindowsAccount
        setFormData({
          employeeId: windowsAccount.employeeId.toString(),
          username: windowsAccount.username,
          domain: windowsAccount.domain || '',
          password: windowsAccount.password || '',
          profilePath: windowsAccount.profilePath || '',
          homeDirectory: windowsAccount.homeDirectory || '',
          groups: windowsAccount.groups || '',
          isActive: windowsAccount.isActive,
          notes: windowsAccount.notes || ''
        })
        break
      case 'qnap':
        const qnapAccount = account as QnapAccount
        setFormData({
          employeeId: qnapAccount.employeeId.toString(),
          username: qnapAccount.username,
          password: qnapAccount.password || '',
          userGroup: qnapAccount.userGroup || '',
          folderPermissions: qnapAccount.folderPermissions || '',
          quotaLimit: qnapAccount.quotaLimit || '',
          isActive: qnapAccount.isActive,
          notes: qnapAccount.notes || ''
        })
        break
      case 'calipso':
        const calipsoAccount = account as CalipsoAccount
        setFormData({
          employeeId: calipsoAccount.employeeId.toString(),
          username: calipsoAccount.username,
          password: calipsoAccount.password || '',
          profile: calipsoAccount.profile || '',
          permissions: calipsoAccount.permissions || '',
          modules: calipsoAccount.modules || '',
          isActive: calipsoAccount.isActive,
          notes: calipsoAccount.notes || ''
        })
        break
      case 'email':
        const emailAccount = account as EmailAccount
        setFormData({
          employeeId: emailAccount.employeeId.toString(),
          email: emailAccount.email,
          password: emailAccount.password || '',
          accountType: emailAccount.accountType,
          forwardingTo: emailAccount.forwardingTo || '',
          aliases: emailAccount.aliases || '',
          isActive: emailAccount.isActive,
          notes: emailAccount.notes || ''
        })
        break
    }
    
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteConfirm.account) return
    
    // Check permissions
    if (!hasRole(['ADMIN'])) {
      showPermissionError('No tienes permisos para eliminar cuentas de usuario')
      return
    }
    
    try {
      const endpoint = `/api/accounts/${activeTab}/${deleteConfirm.account.id}`
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        setDeleteConfirm({ isOpen: false, account: null })
        setNotification({ type: 'success', message: 'Eliminado correctamente' })
      } else {
        const errorData = await response.json()
        setNotification({ type: 'error', message: errorData.error || 'Error al eliminar' })
      }
    } catch (error) {
      console.error('Error deleting:', error)
      setNotification({ type: 'error', message: 'Error al eliminar' })
    }
  }

  const resetForm = () => {
    const baseForm = {
      employeeId: '',
      isActive: true,
      notes: ''
    }

    switch (activeTab) {
      case 'windows':
        setFormData({
          ...baseForm,
          username: '',
          domain: 'PRETENSA',
          password: '',
          profilePath: '',
          homeDirectory: '',
          groups: ''
        })
        break
      case 'qnap':
        setFormData({
          ...baseForm,
          username: '',
          password: '',
          userGroup: '',
          folderPermissions: '',
          quotaLimit: ''
        })
        break
      case 'calipso':
        setFormData({
          ...baseForm,
          username: '',
          password: '',
          profile: '',
          permissions: '',
          modules: ''
        })
        break
      case 'email':
        setFormData({
          ...baseForm,
          email: '',
          password: '',
          accountType: 'PRETENSA',
          forwardingTo: '',
          aliases: ''
        })
        break
    }
    
    setEditingAccount(null)
  }

  // Export functions for specific account types
  const handleExportSection = async (section: string, format: 'excel' | 'pdf') => {
    try {
      let data: any[] = []
      let columns: Record<string, string> = {}
      let title = ''
      
      switch (section) {
        case 'windows':
          data = windowsAccounts.map(account => ({
            id: account.id,
            employee: `${account.employee.firstName} ${account.employee.lastName}`,
            area: account.employee.area || '-',
            username: account.username,
            domain: account.domain || 'PRETENSA',
            groups: account.groups || '-',
            isActive: account.isActive ? 'Activa' : 'Inactiva',
            lastLogin: account.lastLogin ? new Date(account.lastLogin).toLocaleDateString('es-ES') : 'Nunca',
            createdAt: new Date(account.createdAt).toLocaleDateString('es-ES')
          }))
          columns = {
            employee: 'Empleado',
            area: 'Área',
            username: 'Usuario',
            domain: 'Dominio', 
            groups: 'Grupos',
            isActive: 'Estado',
            lastLogin: 'Último Login',
            ...(format === 'excel' ? { id: 'ID', createdAt: 'Fecha Creación' } : {})
          }
          title = 'Cuentas Windows'
          break
          
        case 'qnap':
          data = qnapAccounts.map(account => ({
            id: account.id,
            employee: `${account.employee.firstName} ${account.employee.lastName}`,
            area: account.employee.area || '-',
            username: account.username,
            userGroup: account.userGroup || '-',
            quotaLimit: account.quotaLimit || 'Sin límite',
            folderPermissions: account.folderPermissions || '-',
            isActive: account.isActive ? 'Activa' : 'Inactiva',
            lastAccess: account.lastAccess ? new Date(account.lastAccess).toLocaleDateString('es-ES') : 'Nunca',
            createdAt: new Date(account.createdAt).toLocaleDateString('es-ES')
          }))
          columns = {
            employee: 'Empleado',
            area: 'Área',
            username: 'Usuario',
            userGroup: 'Grupo',
            quotaLimit: 'Cuota',
            folderPermissions: 'Permisos',
            isActive: 'Estado',
            lastAccess: 'Último Acceso',
            ...(format === 'excel' ? { id: 'ID', createdAt: 'Fecha Creación' } : {})
          }
          title = 'Cuentas QNAP'
          break
          
        case 'calipso':
          data = calipsoAccounts.map(account => ({
            id: account.id,
            employee: `${account.employee.firstName} ${account.employee.lastName}`,
            area: account.employee.area || '-',
            username: account.username,
            profile: account.profile || '-',
            permissions: account.permissions || '-',
            modules: account.modules || '-',
            isActive: account.isActive ? 'Activa' : 'Inactiva',
            lastLogin: account.lastLogin ? new Date(account.lastLogin).toLocaleDateString('es-ES') : 'Nunca',
            createdAt: new Date(account.createdAt).toLocaleDateString('es-ES')
          }))
          columns = {
            employee: 'Empleado',
            area: 'Área', 
            username: 'Usuario',
            profile: 'Perfil',
            permissions: 'Permisos',
            modules: 'Módulos',
            isActive: 'Estado',
            lastLogin: 'Último Login',
            ...(format === 'excel' ? { id: 'ID', createdAt: 'Fecha Creación' } : {})
          }
          title = 'Cuentas Calipso'
          break
          
        case 'email':
          data = emailAccounts.map(account => ({
            id: account.id,
            employee: `${account.employee.firstName} ${account.employee.lastName}`,
            area: account.employee.area || '-',
            email: account.email,
            accountType: account.accountType,
            forwardingTo: account.forwardingTo || '-',
            aliases: account.aliases || '-',
            isActive: account.isActive ? 'Activa' : 'Inactiva',
            lastSync: account.lastSync ? new Date(account.lastSync).toLocaleDateString('es-ES') : 'Nunca',
            createdAt: new Date(account.createdAt).toLocaleDateString('es-ES')
          }))
          columns = {
            employee: 'Empleado',
            area: 'Área',
            email: 'Email',
            accountType: 'Tipo',
            forwardingTo: 'Reenvío',
            aliases: 'Alias', 
            isActive: 'Estado',
            lastSync: 'Última Sincronización',
            ...(format === 'excel' ? { id: 'ID', createdAt: 'Fecha Creación' } : {})
          }
          title = 'Cuentas Email'
          break
      }

      const exportOptions = prepareDataForExport(data, columns, {
        title,
        subtitle: `${data.length} cuentas encontradas`,
        department: 'Sistemas',
        author: 'Sistema de Gestión'
      })

      const result = format === 'excel' 
        ? await exportToProfessionalExcel(exportOptions)
        : await exportToProfessionalPDF(exportOptions)
        
      setNotification({ type: result.success ? 'success' : 'error', message: result.message })
    } catch (error) {
      setNotification({ type: 'error', message: `Error al exportar ${format.toUpperCase()}` })
    }
  }

  // Complete report with all accounts
  const handleExportComplete = async (format: 'excel' | 'pdf') => {
    try {
      const allAccounts = [
        ...windowsAccounts.map(account => ({
          type: 'Windows',
          employee: `${account.employee.firstName} ${account.employee.lastName}`,
          area: account.employee.area || '-',
          identifier: account.username,
          detail: `${account.domain || 'PRETENSA'}\\${account.username}`,
          status: account.isActive ? 'Activa' : 'Inactiva',
          lastActivity: account.lastLogin ? new Date(account.lastLogin).toLocaleDateString('es-ES') : 'Nunca'
        })),
        ...qnapAccounts.map(account => ({
          type: 'QNAP',
          employee: `${account.employee.firstName} ${account.employee.lastName}`,
          area: account.employee.area || '-',
          identifier: account.username,
          detail: `Grupo: ${account.userGroup || '-'}`,
          status: account.isActive ? 'Activa' : 'Inactiva',
          lastActivity: account.lastAccess ? new Date(account.lastAccess).toLocaleDateString('es-ES') : 'Nunca'
        })),
        ...calipsoAccounts.map(account => ({
          type: 'Calipso',
          employee: `${account.employee.firstName} ${account.employee.lastName}`,
          area: account.employee.area || '-',
          identifier: account.username,
          detail: `Perfil: ${account.profile || '-'}`,
          status: account.isActive ? 'Activa' : 'Inactiva',
          lastActivity: account.lastLogin ? new Date(account.lastLogin).toLocaleDateString('es-ES') : 'Nunca'
        })),
        ...emailAccounts.map(account => ({
          type: 'Email',
          employee: `${account.employee.firstName} ${account.employee.lastName}`,
          area: account.employee.area || '-',
          identifier: account.email,
          detail: `Tipo: ${account.accountType}`,
          status: account.isActive ? 'Activa' : 'Inactiva',
          lastActivity: account.lastSync ? new Date(account.lastSync).toLocaleDateString('es-ES') : 'Nunca'
        }))
      ]

      const exportOptions = prepareDataForExport(allAccounts, {
        type: 'Tipo',
        employee: 'Empleado',
        area: 'Área',
        identifier: 'Usuario/Email',
        detail: 'Detalle',
        status: 'Estado',
        lastActivity: 'Última Actividad'
      }, {
        title: 'Reporte Completo de Cuentas de Usuario',
        subtitle: `${allAccounts.length} cuentas totales (Windows: ${windowsAccounts.length}, QNAP: ${qnapAccounts.length}, Calipso: ${calipsoAccounts.length}, Email: ${emailAccounts.length})`,
        department: 'Sistemas',
        author: 'Sistema de Gestión'
      })

      const result = format === 'excel'
        ? await exportToProfessionalExcel(exportOptions)
        : await exportToProfessionalPDF(exportOptions)
        
      setNotification({ type: result.success ? 'success' : 'error', message: result.message })
    } catch (error) {
      setNotification({ type: 'error', message: `Error al exportar reporte completo ${format.toUpperCase()}` })
    }
  }

  const tabs = [
    { id: 'windows', label: 'Windows', count: windowsAccounts.length },
    { id: 'qnap', label: 'QNAP', count: qnapAccounts.length },
    { id: 'calipso', label: 'Calipso', count: calipsoAccounts.length },
    { id: 'email', label: 'Email', count: emailAccounts.length }
  ]

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">{authLoading ? 'Verificando permisos...' : 'Cargando cuentas de usuario...'}</div>
      </div>
    )
  }

  // Show access denied if user doesn't have required permissions
  if (!hasPermission('users', 'READ')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-white/60 mb-4">No tienes permisos para ver esta página</div>
          <div className="text-white/40 text-sm">Contacta al administrador para obtener acceso</div>
        </div>
      </div>
    )
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <FadeInUp delay={0.05}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Usuarios</h1>
          <p className="text-white/70">Gestión de cuentas de usuario por sistema</p>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.1}>
        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
          <div className="w-full sm:flex-1 sm:min-w-[200px]">
            <label className="block text-xs sm:text-sm text-white/70 mb-1">Buscar</label>
            <input
              type="text"
              placeholder={activeTab === 'email' ? "Buscar por email o empleado..." : "Buscar por usuario o empleado..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-sm"
            />
          </div>
          <div className="w-full sm:flex-1 sm:min-w-[180px]">
            <label className="block text-xs sm:text-sm text-white/70 mb-1">Empleado</label>
            <SearchableSelect value={employeeFilter} onChange={setEmployeeFilter} options={[{ value: "", label: "Todos los empleados" }, ...employees.map(emp => ({ value: emp.id.toString(), label: `${emp.firstName} ${emp.lastName}` }))]} searchPlaceholder="Buscar empleado..." />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[140px]">
            <label className="block text-xs sm:text-sm text-white/70 mb-1">Estado</label>
            <Select value={statusFilter} onChange={setStatusFilter} options={[{ value: "", label: "Todos los estados" }, { value: "active", label: "Activas" }, { value: "inactive", label: "Inactivas" }]} />
          </div>
          <div className="w-full sm:w-auto pt-2 sm:pt-0">
            <PermissionGuard roles={['ADMIN']} showToast={false}>
              <Button onClick={() => { resetForm(); setIsModalOpen(true) }} className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base">Nueva Cuenta</Button>
            </PermissionGuard>
          </div>
        </div>
        </div>
      </FadeInUp>

      {/* Separator line between filters and content */}
      <div className="mb-8 border-b border-white/10"></div>

      {/* Tabs */}
      <FadeInUp delay={0.2}>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 p-2 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 min-w-0 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20 flex-shrink-0">
                {tab.count}
              </span>
            </button>
          ))}
          
          {/* Export Buttons */}
          <PermissionGuard roles={['ADMIN']} showToast={false}>
            <div className="ml-auto flex gap-2">
              <Button
                onClick={() => handleExportSection(activeTab, 'excel')}
                variant="ghost"
                className="px-2 py-1.5 text-xs"
              >
                Excel
              </Button>
              <Button
                onClick={() => handleExportSection(activeTab, 'pdf')}
                variant="ghost"
                className="px-2 py-1.5 text-xs"
              >
                PDF
              </Button>
              <Button
                onClick={() => handleExportComplete('excel')}
                variant="ghost"
                className="px-2 py-1.5 text-xs"
              >
                Excel Completo
              </Button>
              <Button
                onClick={() => handleExportComplete('pdf')}
                variant="ghost"
                className="px-2 py-1.5 text-xs"
              >
                PDF Completo
              </Button>
            </div>
          </PermissionGuard>
        </div>

        <div className="overflow-hidden">
          <div className="p-4">
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-white/70">
                        <th className="p-3">{activeTab === 'email' ? 'Email' : 'Usuario'}</th>
                        <th className="p-3">Empleado</th>
                        <th className="p-3">Contraseña</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Fecha Creación</th>
                        <th className="p-3 w-32">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredAccounts().length === 0 ? (
                        <tr><td className="p-3" colSpan={6}>Sin cuentas</td></tr>
                      ) : (
                        getFilteredAccounts().map((account: any) => (
                          <tr key={account.id} className="border-t border-white/10">
                            <td className="p-3">
                              {activeTab === 'email' ? account.email : account.username}
                            </td>
                            <td className="p-3">
                              {account.employee ? `${account.employee.firstName} ${account.employee.lastName}` : 'N/A'}
                            </td>
                            <td className="p-3">
                              {account.password ? '••••••••' : '-'}
                            </td>
                            <td className="p-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${account.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {account.isActive ? 'Activa' : 'Inactiva'}
                              </span>
                            </td>
                            <td className="p-3">{new Date(account.createdAt).toLocaleDateString()}</td>
                            <td className="p-3 flex gap-2">
                              <Button onClick={() => setViewAccount(account)} variant="ghost" small>Ver</Button>
                              <PermissionGuard roles={['ADMIN']} showToast={false}>
                                <Button onClick={() => handleEdit(account)} variant="ghost" small>Editar</Button>
                                <Button onClick={() => setDeleteConfirm({ isOpen: true, account })} small>Eliminar</Button>
                              </PermissionGuard>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {getFilteredAccounts().map((account: any) => (
                  <div key={account.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">
                        {activeTab === 'email' ? account.email : account.username}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${account.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {account.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <div className="text-sm text-white/60 space-y-1">
                      {account.employee && <div>Empleado: {account.employee.firstName} {account.employee.lastName}</div>}
                      <div>Creado: {new Date(account.createdAt).toLocaleDateString()}</div>
                      {activeTab === 'windows' && account.domain && <div>Dominio: {account.domain}</div>}
                      {activeTab === 'qnap' && account.userGroup && <div>Grupo: {account.userGroup}</div>}
                      {activeTab === 'calipso' && account.profile && <div>Perfil: {account.profile}</div>}
                      {activeTab === 'email' && account.accountType && <div>Tipo: {account.accountType}</div>}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={() => setViewAccount(account)} variant="ghost" small>Ver</Button>
                      <PermissionGuard roles={['ADMIN']} showToast={false}>
                        <Button onClick={() => handleEdit(account)} variant="ghost" small>Editar</Button>
                        <Button onClick={() => setDeleteConfirm({ isOpen: true, account })} small>Eliminar</Button>
                      </PermissionGuard>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </FadeInUp>

      {/* Modal para crear/editar cuenta */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
        }}
        title={editingAccount ? `Editar Cuenta ${activeTab.toUpperCase()}` : `Nueva Cuenta ${activeTab.toUpperCase()}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide" id="users-form">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Empleado *
            </label>
            <SearchableSelect value={String(formData.employeeId || '')} onChange={(v) => setFormData({ ...formData, employeeId: v })} options={[{ value: "", label: "Seleccionar empleado" }, ...employees.map(emp => ({ value: String(emp.id), label: `${emp.firstName} ${emp.lastName} - ${emp.area || 'Sin área'}` }))]} searchPlaceholder="Buscar empleado..." />
          </div>

          {/* Campos específicos por tipo de cuenta */}
          {activeTab === 'windows' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Usuario *</label>
                  <input
                    type="text"
                    required
                    value={String(formData.username || '')}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={String(formData.password || '')}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Dominio</label>
                <input
                  type="text"
                  value={String(formData.domain || '')}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Grupos</label>
                <input
                  type="text"
                  value={String(formData.groups || '')}
                  onChange={(e) => setFormData({ ...formData, groups: e.target.value })}
                  placeholder="Ej: Domain Users, IT Support"
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                />
              </div>
            </>
          )}

          {activeTab === 'qnap' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Usuario *</label>
                  <input
                    type="text"
                    required
                    value={String(formData.username || '')}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={String(formData.password || '')}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Grupo</label>
                <input
                  type="text"
                  value={String(formData.userGroup || '')}
                  onChange={(e) => setFormData({ ...formData, userGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Límite de Cuota</label>
                <input
                  type="text"
                  value={String(formData.quotaLimit || '')}
                  onChange={(e) => setFormData({ ...formData, quotaLimit: e.target.value })}
                  placeholder="Ej: 10GB, Unlimited"
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                />
              </div>
            </>
          )}

          {activeTab === 'calipso' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Usuario *</label>
                  <input
                    type="text"
                    required
                    value={String(formData.username || '')}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={String(formData.password || '')}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Perfil</label>
                <input
                  type="text"
                  value={String(formData.profile || '')}
                  onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Módulos</label>
                <input
                  type="text"
                  value={String(formData.modules || '')}
                  onChange={(e) => setFormData({ ...formData, modules: e.target.value })}
                  placeholder="Ej: Ventas, Compras, Contabilidad"
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                />
              </div>
            </>
          )}

          {activeTab === 'email' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={String(formData.email || '')}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={String(formData.password || '')}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Tipo</label>
                <Select value={String(formData.accountType || 'PRETENSA')} onChange={(v) => setFormData({ ...formData, accountType: v })} options={[{ value: 'PRETENSA', label: 'Pretensa' }, { value: 'GMAIL', label: 'Gmail' }, { value: 'OTHER', label: 'Otro' }]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Reenvío</label>
                <input
                  type="email"
                  value={String(formData.forwardingTo || '')}
                  onChange={(e) => setFormData({ ...formData, forwardingTo: e.target.value })}
                  placeholder="Email de destino para reenvío"
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={Boolean(formData.isActive) || false}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-white/80">
              Cuenta activa
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Observaciones</label>
            <textarea
              value={String(formData.notes || '')}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none resize-none"
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
              onClick={() => { (document.getElementById('users-form') as HTMLFormElement | null)?.requestSubmit() }}
              className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white text-black hover:bg-white/90 text-sm sm:text-base"
            >
              {editingAccount ? 'Actualizar' : 'Crear'} Cuenta
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Ver Cuenta */}
      <Modal
        open={!!viewAccount}
        onClose={() => setViewAccount(null)}
        title={`Ver Cuenta ${activeTab.toUpperCase()}`}
        footer={(
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button onClick={() => setViewAccount(null)} className="flex-1 px-3 sm:px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm sm:text-base">Cerrar</button>
          </div>
        )}
      >
        {viewAccount && (
          <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide">
            {/* Información de la cuenta */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80 border-b border-white/10 pb-1">
                Información de la Cuenta
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-white/60 text-xs sm:text-sm">Empleado:</span>
                  <p className="text-white">
                    {viewAccount.employee ? `${viewAccount.employee.firstName} ${viewAccount.employee.lastName}` : 'N/A'}
                  </p>
                </div>
                
                <div>
                  <span className="text-white/60 text-xs sm:text-sm">
                    {activeTab === 'email' ? 'Email:' : 'Usuario:'}
                  </span>
                  <p className="text-white">
                    {activeTab === 'email' ? (viewAccount as EmailAccount).email : (viewAccount as WindowsAccount | QnapAccount | CalipsoAccount).username}
                  </p>
                </div>
                
                <div>
                  <span className="text-white/60 text-xs sm:text-sm">Contraseña:</span>
                  <div className="flex items-center gap-2">
                    <p className="text-white">
                      {(viewAccount as any).password ? 
                        (showViewPassword ? (viewAccount as any).password : '••••••••') : 
                        'Sin contraseña'
                      }
                    </p>
                    {(viewAccount as any).password && (
                      <button
                        type="button"
                        onClick={() => setShowViewPassword(!showViewPassword)}
                        className="text-white/60 hover:text-white transition-colors p-1"
                        aria-label={showViewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showViewPassword ? (
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
                    )}
                  </div>
                </div>
                
                <div>
                  <span className="text-white/60 text-xs sm:text-sm">Estado:</span>
                  <p className={`${viewAccount.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    {viewAccount.isActive ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
                
                <div>
                  <span className="text-white/60 text-xs sm:text-sm">Fecha Creación:</span>
                  <p className="text-white">{new Date(viewAccount.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Campos específicos por tipo de cuenta */}
              {activeTab === 'windows' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(viewAccount as WindowsAccount).domain && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Dominio:</span>
                        <p className="text-white">{(viewAccount as WindowsAccount).domain}</p>
                      </div>
                    )}
                    {(viewAccount as WindowsAccount).groups && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Grupos:</span>
                        <p className="text-white">{(viewAccount as WindowsAccount).groups}</p>
                      </div>
                    )}
                    {(viewAccount as WindowsAccount).profilePath && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Perfil:</span>
                        <p className="text-white">{(viewAccount as WindowsAccount).profilePath}</p>
                      </div>
                    )}
                    {(viewAccount as WindowsAccount).homeDirectory && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Directorio:</span>
                        <p className="text-white">{(viewAccount as WindowsAccount).homeDirectory}</p>
                      </div>
                    )}
                    {(viewAccount as WindowsAccount).lastLogin && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Último acceso:</span>
                        <p className="text-white">{new Date((viewAccount as WindowsAccount).lastLogin!).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {activeTab === 'qnap' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(viewAccount as QnapAccount).userGroup && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Grupo:</span>
                        <p className="text-white">{(viewAccount as QnapAccount).userGroup}</p>
                      </div>
                    )}
                    {(viewAccount as QnapAccount).quotaLimit && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Límite de cuota:</span>
                        <p className="text-white">{(viewAccount as QnapAccount).quotaLimit}</p>
                      </div>
                    )}
                    {(viewAccount as QnapAccount).folderPermissions && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Permisos:</span>
                        <p className="text-white">{(viewAccount as QnapAccount).folderPermissions}</p>
                      </div>
                    )}
                    {(viewAccount as QnapAccount).lastAccess && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Último acceso:</span>
                        <p className="text-white">{new Date((viewAccount as QnapAccount).lastAccess!).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {activeTab === 'calipso' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(viewAccount as CalipsoAccount).profile && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Perfil:</span>
                        <p className="text-white">{(viewAccount as CalipsoAccount).profile}</p>
                      </div>
                    )}
                    {(viewAccount as CalipsoAccount).permissions && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Permisos:</span>
                        <p className="text-white">{(viewAccount as CalipsoAccount).permissions}</p>
                      </div>
                    )}
                    {(viewAccount as CalipsoAccount).modules && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Módulos:</span>
                        <p className="text-white">{(viewAccount as CalipsoAccount).modules}</p>
                      </div>
                    )}
                    {(viewAccount as CalipsoAccount).lastLogin && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Último acceso:</span>
                        <p className="text-white">{new Date((viewAccount as CalipsoAccount).lastLogin!).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {activeTab === 'email' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(viewAccount as EmailAccount).accountType && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Tipo:</span>
                        <p className="text-white">{(viewAccount as EmailAccount).accountType}</p>
                      </div>
                    )}
                    {(viewAccount as EmailAccount).forwardingTo && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Reenvío:</span>
                        <p className="text-white">{(viewAccount as EmailAccount).forwardingTo}</p>
                      </div>
                    )}
                    {(viewAccount as EmailAccount).aliases && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Alias:</span>
                        <p className="text-white">{(viewAccount as EmailAccount).aliases}</p>
                      </div>
                    )}
                    {(viewAccount as EmailAccount).lastSync && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Última sincronización:</span>
                        <p className="text-white">{new Date((viewAccount as EmailAccount).lastSync!).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {viewAccount.notes && (
                <div>
                  <span className="text-white/60 text-xs sm:text-sm">Observaciones:</span>
                  <p className="text-white mt-1">{viewAccount.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, account: null })}
        title="Eliminar Cuenta"
        description={`¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <CustomNotification
        type={notification?.type || 'info'}
        message={notification?.message || ''}
        isVisible={!!notification}
        onClose={() => setNotification(null)}
      />
    </AnimatedContainer>
  )
}
