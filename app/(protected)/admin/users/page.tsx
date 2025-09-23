"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { usePermissionsV2 } from "@/lib/hooks/usePermissionsV2"
import { useToast } from "@/lib/hooks/use-toast"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import Button from "@/components/button"
import Modal from "@/components/modal"
import Select from "@/components/select"
import { UserCardGrid } from "@/components/roles/UserCard"
import { RoleBadge, RoleBadgeGroup } from "@/components/roles/RoleBadge"

// Tipos
interface Role {
  id: string
  name: string
  displayName: string
  color: string
  icon: string
  level: number
  description?: string
  permissions?: string[]
}

interface User {
  id: string
  username: string
  email: string
  avatar?: string
  status: "online" | "offline" | "away" | "busy"
  roles: Role[]
  lastActive: Date
  permissions: number
  createdAt: Date
}

export default function UsersAdminPage() {
  const { hasPermission, can, loading: authLoading } = usePermissionsV2()
  const { showSuccess, showError } = useToast()

  // Estados
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  // Modales
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roleAssignments, setRoleAssignments] = useState<string[]>([])

  // Datos mock para demostración - REEMPLAZAR CON API REAL
  useEffect(() => {
    const mockRoles: Role[] = [
      {
        id: "1",
        name: "SuperAdmin",
        displayName: "Super Administrador",
        color: "#E74C3C",
        icon: "👑",
        level: 100,
        description: "Control total del sistema",
        permissions: ["*:*"]
      },
      {
        id: "2",
        name: "Admin",
        displayName: "Administrador",
        color: "#F39C12",
        icon: "⚡",
        level: 90,
        description: "Administración general",
        permissions: ["users:*", "roles:*", "equipment:*"]
      },
      {
        id: "3",
        name: "Manager",
        displayName: "Gerente",
        color: "#3498DB",
        icon: "📊",
        level: 70,
        description: "Gestión departamental",
        permissions: ["users:view", "equipment:*", "reports:*"]
      },
      {
        id: "4",
        name: "Technician",
        displayName: "Técnico",
        color: "#2ECC71",
        icon: "🔧",
        level: 50,
        description: "Soporte técnico",
        permissions: ["equipment:view", "equipment:edit", "tickets:*"]
      },
      {
        id: "5",
        name: "Employee",
        displayName: "Empleado",
        color: "#95A5A6",
        icon: "👤",
        level: 30,
        description: "Usuario estándar",
        permissions: ["dashboard:view", "tickets:create"]
      }
    ]

    const mockUsers: User[] = [
      {
        id: "1",
        username: "admin.principal",
        email: "admin@empresa.com",
        status: "online",
        roles: [mockRoles[0], mockRoles[1]],
        lastActive: new Date(),
        permissions: 150,
        createdAt: new Date("2024-01-01")
      },
      {
        id: "2",
        username: "gerente.ventas",
        email: "gerente@empresa.com",
        status: "away",
        roles: [mockRoles[2]],
        lastActive: new Date(),
        permissions: 45,
        createdAt: new Date("2024-02-15")
      },
      {
        id: "3",
        username: "tecnico.senior",
        email: "tecnico1@empresa.com",
        status: "online",
        roles: [mockRoles[3]],
        lastActive: new Date(),
        permissions: 32,
        createdAt: new Date("2024-03-10")
      },
      {
        id: "4",
        username: "empleado.nuevo",
        email: "empleado@empresa.com",
        status: "offline",
        roles: [mockRoles[4]],
        lastActive: new Date("2024-12-20"),
        permissions: 12,
        createdAt: new Date("2024-06-01")
      },
      {
        id: "5",
        username: "soporte.ti",
        email: "soporte@empresa.com",
        status: "busy",
        roles: [mockRoles[3], mockRoles[4]],
        lastActive: new Date(),
        permissions: 44,
        createdAt: new Date("2024-04-20")
      },
      {
        id: "6",
        username: "desarrollador.web",
        email: "dev@empresa.com",
        status: "online",
        roles: [mockRoles[1], mockRoles[3]],
        lastActive: new Date(),
        permissions: 88,
        createdAt: new Date("2024-01-15")
      }
    ]

    setRoles(mockRoles)
    setUsers(mockUsers)
    setLoading(false)
  }, [])

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === "" ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = selectedRole === "" ||
        user.roles.some(role => role.id === selectedRole)

      const matchesStatus = selectedStatus === "" ||
        user.status === selectedStatus

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, selectedRole, selectedStatus])

  // Manejo de roles
  const handleManageRoles = useCallback((user: User) => {
    setSelectedUser(user)
    setRoleAssignments(user.roles.map(r => r.id))
    setIsRoleModalOpen(true)
  }, [])

  const handleSaveRoles = useCallback(async () => {
    if (!selectedUser) return

    try {
      // TODO: Llamar a API real
      // const response = await fetch(`/api/users/${selectedUser.id}/roles`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ roleIds: roleAssignments })
      // })

      // Actualizar usuario localmente (temporal)
      const newRoles = roles.filter(r => roleAssignments.includes(r.id))
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { ...u, roles: newRoles }
          : u
      ))

      showSuccess(`Roles actualizados para ${selectedUser.username}`)
      setIsRoleModalOpen(false)
      setSelectedUser(null)
    } catch (error) {
      showError("Error al actualizar roles")
    }
  }, [selectedUser, roleAssignments, roles, showSuccess, showError])

  // Manejo de permisos
  const handleViewPermissions = useCallback((user: User) => {
    setSelectedUser(user)
    setIsPermissionsModalOpen(true)
  }, [])

  // Operaciones en lote
  const handleBulkAssignRole = useCallback(async (roleId: string) => {
    if (selectedUsers.size === 0) {
      showError("Selecciona al menos un usuario")
      return
    }

    try {
      // TODO: Llamar a API real
      showSuccess(`Rol asignado a ${selectedUsers.size} usuarios`)
      setSelectedUsers(new Set())
    } catch (error) {
      showError("Error al asignar rol masivamente")
    }
  }, [selectedUsers, showSuccess, showError])

  // Estadísticas
  const stats = useMemo(() => ({
    totalUsers: users.length,
    onlineUsers: users.filter(u => u.status === "online").length,
    adminUsers: users.filter(u => u.roles.some(r => r.level >= 90)).length,
    newUsers: users.filter(u => {
      const daysSinceCreated = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceCreated <= 30
    }).length
  }), [users])

  if (authLoading || loading) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white/60">Cargando sistema de usuarios...</div>
        </div>
      </AnimatedContainer>
    )
  }

  if (!hasPermission("users", "view")) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Acceso denegado</div>
            <div className="text-white/60">No tienes permisos para gestionar usuarios</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <FadeInUp delay={0.05}>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Gestión de Usuarios</h1>
          <p className="text-white/70">Sistema de roles y permisos tipo Discord</p>
        </div>
      </FadeInUp>

      {/* Estadísticas */}
      <FadeInUp delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-sm text-gray-400">Usuarios totales</div>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
            <div className="text-2xl font-bold text-green-400">{stats.onlineUsers}</div>
            <div className="text-sm text-gray-400">En línea ahora</div>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
            <div className="text-2xl font-bold text-red-400">{stats.adminUsers}</div>
            <div className="text-sm text-gray-400">Administradores</div>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
            <div className="text-2xl font-bold text-blue-400">{stats.newUsers}</div>
            <div className="text-sm text-gray-400">Nuevos (30 días)</div>
          </div>
        </div>
      </FadeInUp>

      {/* Filtros y acciones */}
      <FadeInUp delay={0.15}>
        <div className="mb-6 p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Usuario o email..."
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Filtrar por rol</label>
              <Select
                value={selectedRole}
                onChange={setSelectedRole}
                options={[
                  { value: "", label: "Todos los roles" },
                  ...roles.map(r => ({ value: r.id, label: r.displayName }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Estado</label>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: "", label: "Todos" },
                  { value: "online", label: "En línea" },
                  { value: "away", label: "Ausente" },
                  { value: "busy", label: "Ocupado" },
                  { value: "offline", label: "Desconectado" }
                ]}
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Acciones</label>
              <div className="flex gap-2">
                {selectedUsers.size > 0 && (
                  <Button
                    onClick={() => {
                      // TODO: Implementar asignación masiva
                      showSuccess(`${selectedUsers.size} usuarios seleccionados`)
                    }}
                    variant="ghost"
                    small
                  >
                    Asignar rol ({selectedUsers.size})
                  </Button>
                )}
                {can('users:create') && (
                  <Button
                    onClick={() => showSuccess("Crear usuario - Por implementar")}
                    variant="ghost"
                    small
                  >
                    + Nuevo usuario
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* Grid de usuarios */}
      <FadeInUp delay={0.2}>
        <UserCardGrid
          users={filteredUsers}
          onManageRoles={handleManageRoles}
          onViewPermissions={handleViewPermissions}
          onEdit={(user) => showSuccess(`Editar ${user.username} - Por implementar`)}
          selectable={can('users:edit')}
          selectedUsers={selectedUsers}
          onSelectionChange={(userId, selected) => {
            const newSelection = new Set(selectedUsers)
            if (selected) {
              newSelection.add(userId as string)
            } else {
              newSelection.delete(userId as string)
            }
            setSelectedUsers(newSelection)
          }}
        />
      </FadeInUp>

      {/* Modal de gestión de roles */}
      <Modal
        open={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={`Gestionar roles - ${selectedUser?.username}`}
        footer={(
          <div className="flex gap-3">
            <Button onClick={() => setIsRoleModalOpen(false)} variant="ghost">
              Cancelar
            </Button>
            <Button onClick={handleSaveRoles}>
              Guardar cambios
            </Button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-400 mb-4">
            Selecciona los roles para este usuario. Los roles determinan los permisos y el acceso al sistema.
          </div>

          {roles.map((role) => (
            <div
              key={role.id}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all
                ${roleAssignments.includes(role.id)
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
                }
              `}
              onClick={() => {
                if (roleAssignments.includes(role.id)) {
                  setRoleAssignments(prev => prev.filter(r => r !== role.id))
                } else {
                  setRoleAssignments(prev => [...prev, role.id])
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={roleAssignments.includes(role.id)}
                    onChange={() => {}}
                    className="w-4 h-4"
                  />
                  <RoleBadge
                    name={role.name}
                    displayName={role.displayName}
                    color={role.color}
                    icon={role.icon}
                    level={role.level}
                    showLevel
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {role.permissions?.length || 0} permisos
                </span>
              </div>
              {role.description && (
                <p className="text-sm text-gray-400 mt-2 ml-7">{role.description}</p>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Modal de visualización de permisos */}
      <Modal
        open={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title={`Permisos de ${selectedUser?.username}`}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-2">Roles asignados</h4>
            <RoleBadgeGroup roles={selectedUser?.roles || []} size="md" maxDisplay={10} />
          </div>

          <div>
            <h4 className="text-sm font-medium text-white/80 mb-2">Permisos efectivos</h4>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {selectedUser?.roles.flatMap(r => r.permissions || []).map((permission, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1 rounded bg-white/5 border border-white/10 text-sm text-gray-300"
                >
                  {permission}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Total: {selectedUser?.permissions || 0} permisos únicos
          </div>
        </div>
      </Modal>
    </AnimatedContainer>
  )
}