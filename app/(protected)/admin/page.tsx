"use client"

import { useState, useEffect } from "react"
import { useAppAuth } from "@/lib/hooks/useAppAuth"
import { useToast } from "@/lib/hooks/use-toast"
import Button from "@/components/button"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import Select from "@/components/select"

interface User {
  id: number
  username: string
  role: string
  createdAt: string
}

interface Role {
  id: number
  name: string
  permissions?: Permission[]
}

interface Permission {
  id: number
  roleId: number
  resource: string
  level: 'READ' | 'WRITE' | 'ADMIN'
}

const USER_ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "TECHNICIAN", label: "Técnico" },
  { value: "MANAGER", label: "Gerente" },
  { value: "SUPERVISOR", label: "Supervisor" }
]

const RESOURCES = [
  "TICKETS", "EQUIPMENT", "INVENTORY", "PRINTERS", "CONSUMABLES", 
  "REPLACEMENTS", "EMPLOYEES", "BACKUPS", "PURCHASE_REQUESTS", "USERS"
]

const PERMISSION_LEVELS = [
  { value: "READ", label: "Lectura" },
  { value: "WRITE", label: "Escritura" },
  { value: "ADMIN", label: "Administrador" }
]

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const { isAuthenticated, loading: authLoading, can, hasRole } = useAppAuth()

  // Toast notifications
  const { showSuccess, showError, showWarning } = useToast()
  const showAdminOnlyError = (action: string) => showError(`No tienes permisos para ${action}`)

  const isSuperAdmin = hasRole('SuperAdmin')
  const isAdmin = hasRole('Admin')
  const canAccessAdmin = can('admin:panel') || can('system:admin') || isSuperAdmin || isAdmin

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ 
    isOpen: boolean 
    user: User | null
    type: 'user' | 'role'
    role?: Role | null
  }>({ isOpen: false, user: null, type: 'user' })

  // Form data
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    role: 'TECHNICIAN'
  })
  const [roleFormData, setRoleFormData] = useState({
    name: ''
  })
  const [permissionFormData, setPermissionFormData] = useState({
    resource: '',
    level: 'READ' as 'READ' | 'WRITE' | 'ADMIN'
  })

  // Filters
  const [roleFilter, setRoleFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      setLoading(false)
      showAdminOnlyError("acceder al panel de administración")
      return
    }

    if (!canAccessAdmin) {
      showAdminOnlyError("acceder al panel de administración")
      setLoading(false)
      return
    }

    fetchData()
  }, [authLoading, isAuthenticated, canAccessAdmin, showAdminOnlyError])



  const fetchData = async () => {
    try {
      console.log('Fetching admin data...') // Debug log
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles')
      ])

      console.log('Users response status:', usersRes.status) // Debug log
      console.log('Roles response status:', rolesRes.status) // Debug log

      if (usersRes.ok) {
        const userData = await usersRes.json()
        console.log('Users data:', userData) // Debug log
        setUsers(userData)
      } else {
        const errorData = await usersRes.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Users API error:', usersRes.status, errorData)
        showError(`Error cargando usuarios: ${errorData.error || usersRes.statusText}`)
      }
      
      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        console.log('Roles data:', rolesData) // Debug log
        setRoles(rolesData)
      } else {
        const errorData = await rolesRes.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Roles API error:', rolesRes.status, errorData)
        showError(`Error cargando roles: ${errorData.error || rolesRes.statusText}`)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      showError('Error cargando datos de administración')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredUsers = () => {
    let filteredUsers = users

    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter) {
      filteredUsers = filteredUsers.filter(user => user.role === roleFilter)
    }

    return filteredUsers
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user can create users
    if (!can('users:create') && !isSuperAdmin) {
      showError('No tienes permisos para crear usuarios')
      return
    }

    try {
      const response = await fetch(`/api/users`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData)
      
      })

      if (response.ok) {
        await fetchData()
        resetUserForm()
        setIsUserModalOpen(false)
        showSuccess('Usuario creado correctamente')
      } else {
        const data = await response.json()
        showError(data.error || 'Error creando usuario')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      showError('Error creando usuario')
    }
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if user can create roles
    if (!can('roles:create') && !isSuperAdmin) {
      showError('No tienes permisos para crear roles')
      return
    }

    try {
      const response = await fetch(`/api/roles`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleFormData)
      
      })

      if (response.ok) {
        await fetchData()
        resetRoleForm()
        setIsRoleModalOpen(false)
        showSuccess('Rol creado correctamente')
      } else {
        const data = await response.json()
        showError(data.error || 'Error creando rol')
      }
    } catch (error) {
      console.error('Error creating role:', error)
      showError('Error creando rol')
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirm.user) return

    // Check if user can delete users
    if (!can('users:delete') && !isSuperAdmin) {
      showError('No tienes permisos para eliminar usuarios')
      return
    }

    try {
      const response = await fetch(`/api/users/${deleteConfirm.user.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        setDeleteConfirm({ isOpen: false, user: null, type: 'user' })
        showSuccess('Usuario eliminado correctamente')
      } else {
        showError('Error eliminando usuario')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showError('Error eliminando usuario')
    }
  }

  const handleDeleteRole = async () => {
    if (!deleteConfirm.role) return

    // Check if user can delete roles
    if (!can('roles:delete') && !isSuperAdmin) {
      showError('No tienes permisos para eliminar roles')
      return
    }

    try {
      const response = await fetch(`/api/roles/${deleteConfirm.role.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        setDeleteConfirm({ isOpen: false, user: null, type: 'user' })
        showSuccess('Rol eliminado correctamente')
      } else {
        const errorData = await response.json()
        showError(errorData.error || 'Error eliminando rol')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      showError('Error eliminando rol')
    }
  }

  const resetUserForm = () => {
    setUserFormData({
      username: '',
      password: '',
      role: 'TECHNICIAN'
    })
  }

  const resetRoleForm = () => {
    setRoleFormData({
      name: ''
    })
  }

  const resetPermissionForm = () => {
    setPermissionFormData({
      resource: '',
      level: 'READ'
    })
  }

  const handleAddPermission = async () => {
    if (!selectedRole || !permissionFormData.resource) return

    // Check if user can manage permissions
    if (!can('permissions:create') && !isSuperAdmin) {
      showError('No tienes permisos para gestionar permisos')
      return
    }

    try {
      const response = await fetch(`/api/permissions`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole.id,
          resource: permissionFormData.resource,
          level: permissionFormData.level
        })
      })

      if (response.ok) {
        await fetchData()
        resetPermissionForm()
        showSuccess('Permiso agregado correctamente')
        
        // Actualizar el rol seleccionado con los nuevos datos
        const updatedRoles = await fetch('/api/roles').then(r => r.json())
        const updatedRole = Array.isArray(updatedRoles) ? updatedRoles.find((r: Role) => r.id === selectedRole.id) : null
        if (updatedRole) {
          setSelectedRole(updatedRole)
        }
      } else {
        const data = await response.json()
        showError(data.error || 'Error agregando permiso')
      }
    } catch (error) {
      console.error('Error adding permission:', error)
      showError('Error agregando permiso')
    }
  }

  const handleDeletePermission = async (permissionId: number) => {
    // Check if user can manage permissions
    if (!can('permissions:delete') && !isSuperAdmin) {
      showError('No tienes permisos para eliminar permisos')
      return
    }

    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        showSuccess('Permiso eliminado correctamente')
        
        // Actualizar el rol seleccionado con los nuevos datos
        if (selectedRole) {
          const updatedRoles = await fetch('/api/roles').then(r => r.json())
          const updatedRole = Array.isArray(updatedRoles) ? updatedRoles.find((r: Role) => r.id === selectedRole.id) : null
          if (updatedRole) {
            setSelectedRole(updatedRole)
          }
        }
      } else {
        const data = await response.json()
        showError(data.error || 'Error eliminando permiso')
      }
    } catch (error) {
      console.error('Error deleting permission:', error)
      showError('Error eliminando permiso')
    }
  }

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Cargando panel de administración...</div>
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
            <div className="text-white/60">Debes iniciar sesión para acceder al panel de administración.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  if (!canAccessAdmin) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso Denegado</div>
            <div className="text-white/60">No tienes permisos para acceder al panel de administración.</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <FadeInUp delay={0.05}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Administración</h1>
          <p className="text-white/70">Gestión de usuarios del sistema y roles administrativos</p>
        </div>
      </FadeInUp>
      <div className="mb-8 border-b border-white/10"></div>


      {/* Quick Actions */}
      <FadeInUp delay={0.1}>
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-white">Usuarios del Sistema</h3>
                <p className="text-sm text-white/60">Crear y gestionar cuentas de usuario</p>
              </div>
              <div className="text-2xl font-bold text-white">{users.length}</div>
            </div>
            <Button
              onClick={() => {
                resetUserForm()
                setIsUserModalOpen(true)
              }}
              className="w-full"
              disabled={!can('users:create') && !isSuperAdmin}
            >
              Crear Nuevo Usuario
            </Button>
          </div>

          <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-white">Roles del Sistema</h3>
                <p className="text-sm text-white/60">Gestionar roles y permisos</p>
              </div>
              <div className="text-2xl font-bold text-white">{roles.length}</div>
            </div>
            <Button
              onClick={() => {
                resetRoleForm()
                setIsRoleModalOpen(true)
              }}
              variant="ghost"
              className="w-full"
              disabled={!can('roles:create') && !isSuperAdmin}
            >
              Crear Nuevo Rol
            </Button>
          </div>
        </div>
      </FadeInUp>

      {/* Filters Section */}
      <FadeInUp delay={0.2}>
        <div className="mb-6 p-4 sm:p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Buscar Usuario</label>
              <input
                type="text"
                placeholder="Nombre de usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none placeholder-white/40"
              />
            </div>
            <div className="w-full sm:w-auto min-w-[200px]">
              <label className="block text-xs sm:text-sm text-white/70 mb-1">Filtrar por Rol</label>
              <Select value={roleFilter} onChange={setRoleFilter} options={[{ value: '', label: 'Todos los roles' }, ...USER_ROLES as any]} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => fetchData()}>Actualizar</Button>
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* Users Table */}
      <FadeInUp delay={0.3}>
        <div className="mb-8 overflow-x-auto rounded-lg border border-white/10 bg-white/5">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-white/70 border-b border-white/10">
                <th className="p-3">Usuario</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Fecha de Creación</th>
                <th className="p-3 w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredUsers().length === 0 ? (
                <tr>
                  <td className="p-3" colSpan={4}>
                    <div className="text-center text-white/60 py-8">
                      No se encontraron usuarios
                    </div>
                  </td>
                </tr>
              ) : (
                getFilteredUsers().map((user) => (
                  <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{user.username}</div>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.role === 'ADMIN' 
                          ? 'bg-red-400/20 text-red-400' 
                          : 'bg-blue-400/20 text-blue-400'
                      }`}>
                        {USER_ROLES.find(r => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td className="p-3 text-white/60">
                      {new Date(user.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          onClick={() => setDeleteConfirm({
                            isOpen: true,
                            user,
                            type: 'user'
                          })}
                          small
                          className="text-xs"
                          disabled={!can('users:delete') && !isSuperAdmin}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FadeInUp>

      {/* Roles Section */}
      <FadeInUp delay={0.4}>
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Roles y Permisos del Sistema</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{role.name}</h3>
                    <p className="text-sm text-white/60">
                      Usuarios activos: {users.filter(u => u.role === role.name).length}
                    </p>
                    <p className="text-xs text-white/50">
                      Permisos: {role.permissions?.length || 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedRole(role)
                        setIsPermissionModalOpen(true)
                      }}
                      variant="ghost"
                      small
                      className="text-xs text-blue-400 hover:text-blue-300"
                      disabled={!can('permissions:view') && !isSuperAdmin}
                    >
                      Gestionar
                    </Button>
                    <Button
                      onClick={() => setDeleteConfirm({
                        isOpen: true,
                        user: null,
                        type: 'role',
                        role
                      })}
                      variant="ghost"
                      small
                      className="text-xs text-red-400 hover:text-red-300"
                      disabled={!can('roles:delete') && !isSuperAdmin}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
                
                {/* Permisos del rol */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white/80">Permisos actuales:</h4>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.map((permission) => (
                        <span
                          key={permission.id}
                          className={`text-xs px-2 py-1 rounded-full ${
                            permission.level === 'ADMIN' 
                              ? 'bg-red-400/20 text-red-300' 
                              : permission.level === 'WRITE'
                              ? 'bg-yellow-400/20 text-yellow-300'
                              : 'bg-green-400/20 text-green-300'
                          }`}
                        >
                          {permission.resource}:{permission.level}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-white/50 italic">Sin permisos asignados</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeInUp>

      {/* Create User Modal */}
      <Modal
        open={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false)
          resetUserForm()
        }}
        title="Crear Nuevo Usuario"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide" id="admin-user-form">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Nombre de Usuario *
            </label>
            <input
              type="text"
              required
              value={userFormData.username}
              onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none placeholder-white/40"
              placeholder="Ingrese el nombre de usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              required
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none placeholder-white/40"
              placeholder="Ingrese la contraseña"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Rol del Usuario *
            </label>
            <Select 
              value={userFormData.role} 
              onChange={(v) => setUserFormData({ ...userFormData, role: v })} 
              options={[
                { value: "TECHNICIAN", label: "Técnico" },
                { value: "ADMIN", label: "Administrador" },
                ...roles.map(role => ({ value: role.name, label: role.name }))
              ]} 
            />
          </div>

        </form>
        <div className="mt-3 sm:mt-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsUserModalOpen(false)
                resetUserForm()
              }}
              className="flex-1 px-4 py-3 text-sm sm:text-base"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => { (document.getElementById('admin-user-form') as HTMLFormElement | null)?.requestSubmit() }}
              className="flex-1 px-4 py-3 text-sm sm:text-base"
            >
              Crear Usuario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Role Modal */}
      <Modal
        open={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false)
          resetRoleForm()
        }}
        title="Crear Nuevo Rol"
      >
        <form onSubmit={handleCreateRole} className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-hide" id="admin-role-form">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Nombre del Rol *
            </label>
            <input
              type="text"
              required
              value={roleFormData.name}
              onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 focus:border-white/60 focus:ring-2 focus:ring-white/20 text-white transition-all duration-200 outline-none placeholder-white/40"
              placeholder="Ej: MANAGER, SUPERVISOR, etc."
            />
            <p className="text-xs text-white/50 mt-1">
              Use mayúsculas y guiones bajos para el nombre del rol
            </p>
          </div>

        </form>
        <div className="mt-3 sm:mt-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsRoleModalOpen(false)
                resetRoleForm()
              }}
              className="flex-1 px-4 py-3 text-sm sm:text-base"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => { (document.getElementById('admin-role-form') as HTMLFormElement | null)?.requestSubmit() }}
              className="flex-1 px-4 py-3 text-sm sm:text-base"
            >
              Crear Rol
            </Button>
          </div>
        </div>
      </Modal>

      {/* Permission Management Modal */}
      <Modal
        open={isPermissionModalOpen}
        onClose={() => {
          setIsPermissionModalOpen(false)
          setSelectedRole(null)
          setPermissionFormData({ resource: '', level: 'READ' })
        }}
        title={`Gestionar Permisos - ${selectedRole?.name || ''}`}
      >
        <div className="space-y-6 max-h-96 overflow-y-auto scrollbar-hide">
          {/* Permisos actuales */}
          <div>
            <h3 className="text-sm font-medium text-white/80 mb-3">Permisos Actuales</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedRole?.permissions && selectedRole.permissions.length > 0 ? (
                selectedRole.permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <span className="text-white font-medium">{permission.resource}</span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        permission.level === 'ADMIN' 
                          ? 'bg-red-400/20 text-red-300' 
                          : permission.level === 'WRITE'
                          ? 'bg-yellow-400/20 text-yellow-300'
                          : 'bg-green-400/20 text-green-300'
                      }`}>
                        {permission.level}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleDeletePermission(permission.id)}
                      variant="ghost"
                      small
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-white/50 text-center py-4">No hay permisos asignados</p>
              )}
            </div>
          </div>

          {/* Agregar nuevo permiso */}
          <div>
            <h3 className="text-sm font-medium text-white/80 mb-3">Agregar Nuevo Permiso</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Recurso
                </label>
                <Select 
                  value={permissionFormData.resource} 
                  onChange={(v) => setPermissionFormData({ ...permissionFormData, resource: v })} 
                  options={[
                    { value: "", label: "Seleccionar recurso..." },
                    ...RESOURCES.map(resource => ({ value: resource, label: resource }))
                  ]} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Nivel de Permiso
                </label>
                <Select 
                  value={permissionFormData.level} 
                  onChange={(v) => setPermissionFormData({ ...permissionFormData, level: v as 'READ' | 'WRITE' | 'ADMIN' })} 
                  options={PERMISSION_LEVELS} 
                />
              </div>

              <Button
                onClick={handleAddPermission}
                disabled={!permissionFormData.resource}
                className="w-full"
              >
                Agregar Permiso
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="ghost"
            onClick={() => {
              setIsPermissionModalOpen(false)
              setSelectedRole(null)
              setPermissionFormData({ resource: '', level: 'READ' })
            }}
            className="w-full"
          >
            Cerrar
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.isOpen}
        onConfirm={deleteConfirm.type === 'user' ? handleDeleteUser : handleDeleteRole}
        onCancel={() => setDeleteConfirm({ isOpen: false, user: null, type: 'user' })}
        title={`Eliminar ${deleteConfirm.type === 'user' ? 'Usuario' : 'Rol'}`}
        description={
          deleteConfirm.type === 'user' 
            ? `¿Estás seguro de que deseas eliminar el usuario "${deleteConfirm.user?.username}"? Esta acción no se puede deshacer.`
            : `¿Estás seguro de que deseas eliminar el rol "${deleteConfirm.role?.name}"? Esta acción no se puede deshacer.`
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

    </AnimatedContainer>
  )
}
