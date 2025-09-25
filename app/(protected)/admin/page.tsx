"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import Button from "@/components/button"
import ConfirmDialog from "@/components/confirm-dialog"
import Modal from "@/components/modal"
import MobileTable from "@/components/mobile-table"
import SearchableSelect from "@/components/searchable-select"
import Select from "@/components/select"
import { RoleCard } from "@/components/roles/RoleCard"
import { UserCard } from "@/components/roles/UserCard"
import UserDetailsModal from "./components/UserDetailsModal"
import PermissionsEditor from "./components/PermissionsEditor"
import { exportToProfessionalExcel, exportToProfessionalPDF, prepareDataForExport } from "@/lib/professional-export"
import { usePermissions } from "@/lib/hooks/usePermissionsV2"
import { useToast } from "@/lib/hooks/use-toast"
import {
  Activity,
  BarChart3,
  Crown,
  Database,
  Download,
  Edit2,
  FileText,
  HardDrive,
  History,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Upload,
  Users,
  UserCheck,
  UserPlus
} from "lucide-react"

const GLASS_CARD = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl"
const INPUT_CLASS = "w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20"
const BADGE_CLASS = "text-xs px-2 py-1 rounded-full"
const SECTION_SUBTITLE_CLASS = "text-white/60 text-sm"
const LABEL_CLASS = "block text-xs font-medium text-white/60 tracking-wide mb-1 uppercase"

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "roles", label: "Roles", icon: Crown },
  { id: "rules", label: "Reglas de Negocio", icon: ShieldCheck },
  { id: "backups", label: "Respaldos", icon: Database },
  { id: "system", label: "Sistema", icon: Settings }
] as const

const DEFAULT_PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "manage"]

type TabId = (typeof TABS)[number]["id"]
type BusinessRuleType = "technician" | "approval" | "restriction"
type UserStatusFilter = "" | "active" | "inactive"

type PermissionSummary = {
  id: number
  name: string
  displayName: string
  resource: string
  action: string
  category: string
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  isActive: boolean
  description?: string | null
}

type UserPermissionView = {
  resource: string
  actions: string[]
  roles: string[]
}

type RoleSummary = {
  id: number
  name: string
  displayName: string
  color?: string | null
  icon?: string | null
  level?: number | null
  priority?: number | null
  description?: string | null
  permissions?: PermissionSummary[] | null
  maxUsers?: number | null
  isSystem?: boolean
  isActive?: boolean
  _count?: { userRoles: number }
}

type UserRoleSummary = {
  id: number
  name: string
  displayName: string
  color?: string | null
  icon?: string | null
  level?: number | null
  isPrimary?: boolean | null
}

type UserSummary = {
  id: number
  username: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  roles: UserRoleSummary[]
  isActive: boolean
  lastLoginAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type BusinessRule = {
  id: string
  name: string
  description: string
  type: BusinessRuleType
  config: Record<string, unknown>
  isActive: boolean
}

type BackupInfo = {
  id: string
  filename: string
  size: number
  createdAt: string
  type: "manual" | "automatic"
  status: "completed" | "failed" | "in_progress"
}

type UserForm = {
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  password: string
  confirmPassword: string
}

type RoleForm = {
  name: string
  displayName: string
  description: string
  color: string
  level: number
  priority: number
  maxUsers: number | null
}

type RuleForm = {
  name: string
  description: string
  type: BusinessRuleType | ""
  isActive: boolean
  config: Record<string, unknown>
}

const DEFAULT_USER_FORM: UserForm = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  role: "",
  isActive: true,
  password: "",
  confirmPassword: ""
}

const DEFAULT_ROLE_FORM: RoleForm = {
  name: "",
  displayName: "",
  description: "",
  color: "#3B82F6",
  level: 1,
  priority: 500,
  maxUsers: null
}

const DEFAULT_RULE_FORM: RuleForm = {
  name: "",
  description: "",
  type: "",
  isActive: true,
  config: {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeUser = (raw: any): UserSummary => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawRoles = (raw?.roles ?? raw?.userRoles ?? []) as any[]
  const mappedRoles: UserRoleSummary[] = rawRoles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((entry: any, index: number) => {
      const roleData = entry?.role ?? entry
      if (!roleData) return null
      return {
        id: Number(roleData.id ?? entry?.roleId ?? index),
        name: roleData.name ?? "",
        displayName: roleData.displayName ?? roleData.name ?? "",
        color: roleData.color ?? null,
        icon: roleData.icon ?? null,
        level: roleData.level ?? null,
        isPrimary: Boolean(entry?.isPrimary)
      }
    })
    .filter((role): role is UserRoleSummary => Boolean(role?.name?.length))

  const fallbackRoles = raw?.role
    ? [{
        id: Number(raw.id ?? 0),
        name: String(raw.role),
        displayName: String(raw.role),
        color: null,
        icon: null,
        level: null,
        isPrimary: true
      }]
    : []

  const finalRoles = mappedRoles.length > 0 ? mappedRoles : fallbackRoles

  return {
    id: Number(raw.id),
    username: raw.username ?? "",
    email: raw.email ?? "",
    firstName: raw.firstName ?? "",
    lastName: raw.lastName ?? "",
    role: raw.role ?? finalRoles[0]?.name ?? "",
    roles: finalRoles,
    isActive: raw.isActive ?? true,
    lastLoginAt: raw.lastLoginAt ?? null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeBackup = (raw: any): BackupInfo => {
  const fileName = raw.backupName || raw.filename || `backup_${raw.id}`
  return {
    id: String(raw.id ?? fileName),
    filename: fileName,
    size: Number(raw.sizeBytes ?? raw.size ?? 0),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    type: raw.diskUsed === "manual" || raw.type === "manual" ? "manual" : "automatic",
    status: (raw.status ?? "completed") as BackupInfo["status"]
  }
}

export default function AdminPage() {
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  const { can, hasRole, loading: permissionsLoading, user: currentUser } = usePermissions()

  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
  const [loading, setLoading] = useState(true)

  const [users, setUsers] = useState<UserSummary[]>([])
  const [userForm, setUserForm] = useState<UserForm>({ ...DEFAULT_USER_FORM })
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false)
  const [isUserRolesModalOpen, setIsUserRolesModalOpen] = useState(false)
  const [isUserPermissionsModalOpen, setIsUserPermissionsModalOpen] = useState(false)
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [userPermissionsView, setUserPermissionsView] = useState<UserPermissionView[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("")
  const [userStatusFilter, setUserStatusFilter] = useState<UserStatusFilter>("")
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<{ isOpen: boolean; user: UserSummary | null }>({ isOpen: false, user: null })
  const [userRoleSelection, setUserRoleSelection] = useState("")
  const [userRolesList, setUserRolesList] = useState<string[]>([])
  const [detailsUser, setDetailsUser] = useState<UserSummary | null>(null)
  const [allPermissions, setAllPermissions] = useState<PermissionSummary[]>([])
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const [roles, setRoles] = useState<RoleSummary[]>([])
  const [roleForm, setRoleForm] = useState<RoleForm>({ ...DEFAULT_ROLE_FORM })
  const [rolePermissionsDraft, setRolePermissionsDraft] = useState<Record<string, string[]>>({})
  const [customPermissionInputs, setCustomPermissionInputs] = useState<Record<string, string>>({})
  const [newPermissionResource, setNewPermissionResource] = useState("")
  const [selectedRole, setSelectedRole] = useState<RoleSummary | null>(null)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [availablePermissions, setAvailablePermissions] = useState<PermissionSummary[]>([])
  const [deleteRoleConfirm, setDeleteRoleConfirm] = useState<{ isOpen: boolean; role: RoleSummary | null }>({ isOpen: false, role: null })

  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([])
  const [ruleForm, setRuleForm] = useState<RuleForm>({ ...DEFAULT_RULE_FORM })
  const [selectedRule, setSelectedRule] = useState<BusinessRule | null>(null)
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [deleteRuleConfirm, setDeleteRuleConfirm] = useState<{ isOpen: boolean; rule: BusinessRule | null }>({ isOpen: false, rule: null })

  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [deleteBackupConfirm, setDeleteBackupConfirm] = useState<{ isOpen: boolean; backup: BackupInfo | null }>({ isOpen: false, backup: null })

  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    allowRegistration: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false
  })

  const canManageUsers = can('users:view')
  const canCreateUsers = can('users:create')
  const canEditUsers = can('users:edit')
  const canDeleteUsers = can('users:delete')
  const canCreateRoles = can('roles:create')
  const canEditRoles = can('roles:edit')
  const canDeleteRoles = can('roles:delete') && hasRole('SUPER_ADMIN')

  const roleLookup = useMemo(() => {
    const map = new Map<string, RoleSummary>()
    roles.forEach(role => map.set(role.name, role))
    return map
  }, [roles])

  const permissionCatalog = useMemo(() => {
    const map = new Map<string, Set<string>>()
    availablePermissions.forEach(permission => {
      const resource = permission.resource
      if (!map.has(resource)) {
        map.set(resource, new Set<string>())
      }
      map.get(resource)!.add(permission.action)
    })
    return map
  }, [availablePermissions])

  const permissionTemplateCatalog = useMemo(() => {
    const templates = new Map<string, Map<string, PermissionSummary>>()
    availablePermissions.forEach(permission => {
      const resource = permission.resource
      const action = permission.action
      if (!templates.has(resource)) {
        templates.set(resource, new Map<string, PermissionSummary>())
      }
      templates.get(resource)!.set(action, permission)
    })
    return templates
  }, [availablePermissions])

  const availablePermissionResources = useMemo(() => {
    const resources = new Set<string>()
    permissionCatalog.forEach((_, key) => resources.add(key))
    Object.keys(rolePermissionsDraft).forEach(key => resources.add(key))
    return Array.from(resources).sort((a, b) => a.localeCompare(b))
  }, [permissionCatalog, rolePermissionsDraft])

  const buildPermissionDraft = (permissions?: PermissionSummary[] | null | any) => {
    const draft: Record<string, string[]> = {}

    if (!permissions) return draft

    // Si es un string JSON, intentar parsearlo
    if (typeof permissions === 'string') {
      try {
        permissions = JSON.parse(permissions)
      } catch {
        return draft
      }
    }

    // Si es un array, procesarlo
    if (Array.isArray(permissions)) {
      permissions.forEach(permission => {
        if (!permission) return
        const resource = permission.resource
        const action = permission.action
        if (!draft[resource]) draft[resource] = []
        if (!draft[resource].includes(action)) {
          draft[resource].push(action)
        }
      })
    }

    return draft
  }

  const formatResourceLabel = useCallback((resource: string) => {
    return resource
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [])

  const formatActionLabel = useCallback((action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [])

  const toggleRolePermission = useCallback((resource: string, action: string, enabled: boolean) => {
    setRolePermissionsDraft(prev => {
      const next: Record<string, string[]> = { ...prev }
      const current = next[resource] ? [...next[resource]] : []
      if (enabled) {
        if (!current.includes(action)) {
          current.push(action)
        }
      } else {
        const index = current.indexOf(action)
        if (index !== -1) {
          current.splice(index, 1)
        }
      }
      if (current.length === 0) {
        delete next[resource]
      } else {
        next[resource] = current
      }
      return next
    })
  }, [])

  const handleAddPermissionAction = useCallback((resource: string) => {
    const value = (customPermissionInputs[resource] || '').trim()
    if (!value) return
    toggleRolePermission(resource, value, true)
    setCustomPermissionInputs(prev => ({ ...prev, [resource]: '' }))
  }, [customPermissionInputs, toggleRolePermission])

  const handleRemovePermissionResource = useCallback((resource: string) => {
    setRolePermissionsDraft(prev => {
      const next = { ...prev }
      delete next[resource]
      return next
    })
  }, [])

  const handleAddPermissionResource = useCallback(() => {
    const value = newPermissionResource.trim()
    if (!value) return
    setRolePermissionsDraft(prev => ({ ...prev, [value]: prev[value] ?? [] }))
    setNewPermissionResource('')
  }, [newPermissionResource])

  const compileRolePermissions = useCallback((draft: Record<string, string[]>) => {
    const compiled: PermissionSummary[] = []
    Object.entries(draft).forEach(([resource, actions]) => {
      actions.forEach(action => {
        const template = permissionTemplateCatalog.get(resource)?.get(action)
        if (template) {
          compiled.push({ ...template, action, resource })
        } else {
          compiled.push({
            id: Number(`${resource.length}${action.length}${compiled.length}`),
            name: `${resource}:${action}`.toUpperCase(),
            displayName: `${formatActionLabel(action)} ${formatResourceLabel(resource)}`.trim(),
            resource,
            action,
            riskLevel: 'LOW',
            isActive: true
          })
        }
      })
    })
    return compiled
  }, [formatActionLabel, formatResourceLabel, permissionTemplateCatalog])

  const buildUserPermissionsView = useCallback((user: UserSummary): UserPermissionView[] => {
    const permissionsMap = new Map<string, { actions: Set<string>; roles: Set<string> }>()
    user.roles.forEach(userRole => {
      const roleDetail = roleLookup.get(userRole.name)
      const rolePermissions = roleDetail?.permissions ?? []
      rolePermissions.forEach(permission => {
        if (!permission) return
        const entry = permissionsMap.get(permission.resource) || { actions: new Set<string>(), roles: new Set<string>() }
        entry.actions.add(permission.action)
        entry.roles.add(roleDetail?.displayName ?? roleDetail?.name ?? userRole.name)
        permissionsMap.set(permission.resource, entry)
      })
    })
    return Array.from(permissionsMap.entries())
      .map(([resource, info]) => ({
        resource,
        actions: Array.from(info.actions).sort(),
        roles: Array.from(info.roles).sort()
      }))
      .sort((a, b) => a.resource.localeCompare(b.resource))
  }, [roleLookup])

  const filteredUsers = useMemo(() => {
    const searchValue = userSearch.trim().toLowerCase()
    return users.filter(user => {
      const matchesSearch = searchValue
        ? [user.username, user.email, user.firstName, user.lastName]
            .filter(Boolean)
            .some(value => value!.toLowerCase().includes(searchValue))
        : true

      const matchesRole = userRoleFilter
        ? user.role === userRoleFilter || user.roles.some(role => role.name === userRoleFilter)
        : true

      const matchesStatus = userStatusFilter
        ? userStatusFilter === "active" ? user.isActive : !user.isActive
        : true

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, userSearch, userRoleFilter, userStatusFilter])

  const roleOptions = useMemo(() => [
    { value: "", label: "Todos los roles" },
    ...roles.map(role => ({ value: role.name, label: role.displayName }))
  ], [roles])

  const getPrimaryRole = useCallback((user: UserSummary) => {
    return user.roles.find(role => role.isPrimary) ?? user.roles[0] ?? null
  }, [])

  const resetUserForm = useCallback(() => {
    setUserForm({ ...DEFAULT_USER_FORM })
    setSelectedUser(null)
    setUserRoleSelection("")
    setUserRolesList([])
  }, [])

  const closeUserModal = useCallback(() => {
    setIsUserModalOpen(false)
    resetUserForm()
  }, [resetUserForm])

  const resetRoleForm = useCallback(() => {
    setRoleForm({ ...DEFAULT_ROLE_FORM })
    setRolePermissionsDraft({})
    setCustomPermissionInputs({})
    setNewPermissionResource("")
    setSelectedRole(null)
  }, [])

  const closeRoleModal = useCallback(() => {
    setIsRoleModalOpen(false)
    resetRoleForm()
  }, [resetRoleForm])

  const resetRuleForm = useCallback(() => {
    setRuleForm({ ...DEFAULT_RULE_FORM })
    setSelectedRule(null)
  }, [])

  const closeRuleModal = useCallback(() => {
    setIsRuleModalOpen(false)
    resetRuleForm()
  }, [resetRuleForm])

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error("No se pudieron obtener los usuarios")
      }
      const data = await response.json()
      const normalized = Array.isArray(data) ? data.map(normalizeUser) : []
      setUsers(normalized)
    } catch (error) {
      console.error("Error loading users:", error)
      showError("No se pudieron cargar los usuarios")
    }
  }, [showError])

  const loadRoles = useCallback(async () => {
    try {
      const response = await fetch("/api/roles")
      if (!response.ok) {
        throw new Error("No se pudieron obtener los roles")
      }
      const data = await response.json()
      const normalized: RoleSummary[] = Array.isArray(data)
        ? data.map((role: RoleSummary) => ({
            ...role,
            color: role.color || "#3B82F6",
            isActive: role.isActive ?? true,
            permissions: typeof role.permissions === "string" ? JSON.parse(role.permissions || "[]") : role.permissions ?? [],
            maxUsers: role.maxUsers ?? null
          }))
        : []
      setRoles(normalized)
    } catch (error) {
      console.error("Error loading roles:", error)
      showError("No se pudieron cargar los roles")
    }
  }, [showError])

  const loadBusinessRules = useCallback(async () => {
    setBusinessRules([
      {
        id: "1",
        name: "Asignación de técnicos",
        description: "Define qué roles pueden ser asignados como técnicos en tickets y órdenes",
        type: "technician",
        config: { roles: ["TECHNICIAN", "ADMIN"] },
        isActive: true
      },
      {
        id: "2",
        name: "Límite de aprobación",
        description: "Límite máximo de aprobación para compras",
        type: "approval",
        config: { maxAmount: 5000 },
        isActive: true
      }
    ])
  }, [])

  const loadBackups = useCallback(async () => {
    try {
      const response = await fetch("/api/backups")
      if (!response.ok) {
        throw new Error("No se pudieron obtener los respaldos")
      }
      const data = await response.json()
      const normalized = Array.isArray(data) ? data.map(normalizeBackup) : []
      setBackups(normalized)
    } catch (error) {
      console.error("Error loading backups:", error)
      showError("No se pudieron cargar los respaldos")
    }
  }, [showError])

  const loadAllPermissions = useCallback(async () => {
    try {
      const response = await fetch("/api/permissions")
      if (!response.ok) {
        throw new Error("No se pudieron obtener los permisos")
      }
      const data = await response.json()
      setAllPermissions(data.data || [])
      setAvailablePermissions(data.data || [])
    } catch (error) {
      console.error("Error loading permissions:", error)
      showError("No se pudieron cargar los permisos")
    }
  }, [showError])

  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadUsers(), loadRoles(), loadBusinessRules(), loadBackups(), loadAllPermissions()])
    } catch (error) {
      console.error("Error loading admin data:", error)
      showError("Ocurrió un problema al cargar la administración")
    } finally {
      setLoading(false)
    }
  }, [loadUsers, loadRoles, loadBusinessRules, loadBackups, loadAllPermissions, showError])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const handleNewUser = () => {
    resetUserForm()
    setUserRoleSelection("")
    setIsUserModalOpen(true)
  }

  const handleViewUserDetails = (user: UserSummary) => {
    setDetailsUser(user)
    setIsUserDetailsModalOpen(true)
  }

  const handleChangePassword = (user: UserSummary) => {
    setSelectedUser(user)
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setIsChangePasswordModalOpen(true)
  }

  const openUserRoles = (user: UserSummary) => {
    setSelectedUser(user)
    setUserRolesList(user.roles.map(r => r.name))
    setIsUserRolesModalOpen(true)
  }

  const openUserPermissions = (user: UserSummary) => {
    setSelectedUser(user)
    setUserPermissionsView(buildUserPermissionsView(user))
    setIsUserPermissionsModalOpen(true)
  }

  const closeUserRolesModal = () => {
    setIsUserRolesModalOpen(false)
    setSelectedUser(null)
    setUserRolesList([])
  }

  const closeUserPermissionsModal = () => {
    setIsUserPermissionsModalOpen(false)
    setUserPermissionsView([])
    setSelectedUser(null)
  }

  const handleEditUser = async (user: UserSummary) => {
    try {
      const response = await fetch(`/api/users/${user.id}`)
      if (response.ok) {
        const detail = await response.json()
        const normalized = normalizeUser({ ...user, ...detail })
        setSelectedUser(normalized)
        setUserForm({
          username: normalized.username,
          email: normalized.email ?? "",
          firstName: normalized.firstName ?? "",
          lastName: normalized.lastName ?? "",
          role: normalized.role ?? "",
          isActive: normalized.isActive,
          password: "",
          confirmPassword: ""
        })
        setUserRoleSelection(normalized.role ?? "")
      } else {
        setSelectedUser(user)
        setUserForm({
          username: user.username,
          email: user.email ?? "",
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          role: user.role ?? "",
          isActive: user.isActive,
          password: "",
          confirmPassword: ""
        })
        setUserRoleSelection(user.role ?? "")
      }
      setIsUserModalOpen(true)
    } catch (error) {
      console.error("Error loading user detail:", error)
      setSelectedUser(user)
      setUserForm({
        username: user.username,
        email: user.email ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        role: user.role ?? "",
        isActive: user.isActive,
        password: "",
        confirmPassword: ""
      })
      setUserRoleSelection(user.role ?? "")
      setIsUserModalOpen(true)
    }
  }

  const handleSaveUserRoles = async () => {
    if (!selectedUser) return
    if (userRolesList.length === 0) {
      showError('Debe tener al menos un rol asignado')
      return
    }
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: userRolesList[0],
          roles: userRolesList
        })
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudieron actualizar los roles del usuario')
      }
      showSuccess('Roles del usuario actualizados')
      await loadUsers()
      closeUserRolesModal()
    } catch (error) {
      console.error('Error updating user roles:', error)
      showError(error instanceof Error ? error.message : 'No se pudieron actualizar los roles')
    }
  }

  const handleSavePassword = async () => {
    if (!selectedUser) return

    if (passwordForm.newPassword.length < 8) {
      showError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("Las contraseñas no coinciden")
      return
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword || undefined,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo cambiar la contraseña")
      }

      showSuccess("Contraseña actualizada correctamente")
      setIsChangePasswordModalOpen(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error("Error changing password:", error)
      showError(error instanceof Error ? error.message : "No se pudo cambiar la contraseña")
    }
  }

  const handleSaveUser = async () => {
    const isEditing = Boolean(selectedUser)

    if (!userForm.username.trim()) {
      showError("El nombre de usuario es obligatorio")
      return
    }

    if (!userForm.role) {
      showError("Selecciona un rol principal")
      return
    }

    if (!isEditing && !userForm.password.trim()) {
      showError("Debes establecer una contraseña inicial")
      return
    }

    if (!isEditing && userForm.password.trim().length < 8) {
      showError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (!isEditing && userForm.password !== userForm.confirmPassword) {
      showError("Las contraseñas no coinciden")
      return
    }

    const payload: Record<string, unknown> = {
      username: userForm.username.trim(),
      email: userForm.email.trim() || null,
      firstName: userForm.firstName.trim() || null,
      lastName: userForm.lastName.trim() || null,
      role: userForm.role,
      isActive: userForm.isActive
    }

    if (!isEditing && userForm.password.trim()) {
      payload.password = userForm.password.trim()
    }

    const method = isEditing ? "PUT" : "POST"
    const url = isEditing ? `/api/users/${selectedUser!.id}` : "/api/users"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || data?.message || "No se pudo guardar el usuario")
      }

      showSuccess(isEditing ? "Usuario actualizado correctamente" : "Usuario creado correctamente")
      await loadUsers()
      closeUserModal()
    } catch (error) {
      console.error("Error saving user:", error)
      showError(error instanceof Error ? error.message : "No se pudo guardar el usuario")
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserConfirm.user) return
    try {
      const response = await fetch(`/api/users/${deleteUserConfirm.user.id}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "No se pudo eliminar el usuario")
      }
      showSuccess("Usuario eliminado correctamente")
      await loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      showError(error instanceof Error ? error.message : "No se pudo eliminar el usuario")
    } finally {
      setDeleteUserConfirm({ isOpen: false, user: null })
    }
  }

  const handleNewRole = () => {
    resetRoleForm()
    setIsRoleModalOpen(true)
  }

  const handleEditRole = (role: RoleSummary) => {
    setSelectedRole(role)
    setRoleForm({
      name: role.name,
      displayName: role.displayName,
      description: role.description ?? "",
      color: role.color ?? "#3B82F6",
      level: role.level ?? 1,
      priority: role.priority ?? 500,
      maxUsers: role.maxUsers ?? null
    })
    setRolePermissionsDraft(buildPermissionDraft(role.permissions))
    setCustomPermissionInputs({})
    setNewPermissionResource("")
    setIsRoleModalOpen(true)
  }

  const handleSaveRole = async () => {
    if (!roleForm.name.trim() || !roleForm.displayName.trim()) {
      showError("Completa el nombre interno y el nombre visible del rol")
      return
    }

    // Convertir rolePermissionsDraft a formato de permisos para la API
    const permissionsArray: Array<{resource: string, action: string}> = []
    Object.entries(rolePermissionsDraft).forEach(([resource, actions]) => {
      actions.forEach(action => {
        permissionsArray.push({ resource, action })
      })
    })

    const payload = {
      name: roleForm.name.trim().toUpperCase(),
      displayName: roleForm.displayName.trim(),
      description: roleForm.description.trim() || null,
      color: roleForm.color,
      level: Number(roleForm.level) || 1,
      priority: Number(roleForm.priority) || 500,
      maxUsers: roleForm.maxUsers ?? null
    }

    const method = selectedRole ? "PUT" : "POST"
    const url = selectedRole ? `/api/roles/${selectedRole.id}` : "/api/roles"

    try {
      // Primero guardar el rol
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo guardar el rol")
      }

      // Si hay permisos, actualizarlos
      if (permissionsArray.length > 0 && data?.id) {
        const permResponse = await fetch(`/api/roles/${data.id}/permissions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissions: permissionsArray })
        })
        if (!permResponse.ok) {
          const permData = await permResponse.json().catch(() => null)
          throw new Error(permData?.error || "No se pudieron actualizar los permisos")
        }
      }

      showSuccess(selectedRole ? "Rol actualizado con permisos" : "Rol creado con permisos")
      await loadRoles()
      closeRoleModal()
    } catch (error) {
      console.error("Error saving role:", error)
      showError(error instanceof Error ? error.message : "No se pudo guardar el rol")
    }
  }

  const handleDeleteRole = async () => {
    if (!deleteRoleConfirm.role) return
    try {
      const response = await fetch(`/api/roles/${deleteRoleConfirm.role.id}`, { method: "DELETE" })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo eliminar el rol")
      }
      showSuccess("Rol eliminado correctamente")
      await loadRoles()
    } catch (error) {
      console.error("Error deleting role:", error)
      showError(error instanceof Error ? error.message : "No se pudo eliminar el rol")
    } finally {
      setDeleteRoleConfirm({ isOpen: false, role: null })
    }
  }

  const handleSaveRule = async () => {
    if (!ruleForm.name.trim() || !ruleForm.description.trim()) {
      showError("Complete el nombre y la descripción")
      return
    }

    const nextRule: BusinessRule = {
      id: selectedRule?.id ?? Date.now().toString(),
      name: ruleForm.name,
      description: ruleForm.description,
      type: (ruleForm.type || "technician") as BusinessRuleType,
      config: ruleForm.config,
      isActive: ruleForm.isActive
    }

    if (selectedRule) {
      setBusinessRules(prev => prev.map(rule => rule.id === selectedRule.id ? nextRule : rule))
      showSuccess("Regla actualizada")
    } else {
      setBusinessRules(prev => [...prev, nextRule])
      showSuccess("Regla creada")
    }

    closeRuleModal()
  }

  const handleDeleteRule = async () => {
    if (!deleteRuleConfirm.rule) return
    try {
      setBusinessRules(prev => prev.filter(rule => rule.id !== deleteRuleConfirm.rule!.id))
      showSuccess("Regla eliminada correctamente")
    } finally {
      setDeleteRuleConfirm({ isOpen: false, rule: null })
    }
  }

  const handleDeleteBackup = async () => {
    if (!deleteBackupConfirm.backup) return
    try {
      const response = await fetch(`/api/backups/${deleteBackupConfirm.backup.id}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "No se pudo eliminar el respaldo")
      }
      showSuccess("Respaldo eliminado correctamente")
      await loadBackups()
    } catch (error) {
      console.error("Error deleting backup:", error)
      showError(error instanceof Error ? error.message : "No se pudo eliminar el respaldo")
    } finally {
      setDeleteBackupConfirm({ isOpen: false, backup: null })
    }
  }

  const handleDownloadBackup = async (backup: BackupInfo) => {
    showInfo(`Descargando ${backup.filename}...`)
    console.log("Download requested for backup", backup.id)
  }

  const viewBackupHistory = async (backup: BackupInfo) => {
    showInfo(`Consultando historial de ${backup.filename}`)
    console.log("History requested for backup", backup.id)
  }

  const exportUsers = useCallback(async (format: "excel" | "pdf") => {
    const rows = filteredUsers.map(user => {
      const primaryRole = getPrimaryRole(user)
      return {
        id: user.id,
        username: user.username,
        email: user.email || "-",
        firstName: user.firstName || "-",
        lastName: user.lastName || "-",
        role: primaryRole?.displayName ?? primaryRole?.name ?? "-",
        status: user.isActive ? "Activo" : "Inactivo",
        lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("es-AR") : "Nunca"
      }
    })

    const options = prepareDataForExport(rows, {
      id: "ID",
      username: "Usuario",
      email: "Email",
      firstName: "Nombre",
      lastName: "Apellido",
      role: "Rol",
      status: "Estado",
      lastLogin: "Último acceso"
    }, {
      title: "Reporte de Usuarios",
      subtitle: `${filteredUsers.length} usuarios encontrados`,
      department: "Administración",
      author: "Centro de Administración"
    })

    try {
      const result = format === "excel"
        ? await exportToProfessionalExcel(options)
        : await exportToProfessionalPDF(options)
      if (!result.success) {
        throw new Error(result.message)
      }
      showSuccess(result.message)
    } catch (error) {
      console.error("Error exporting users:", error)
      showError(error instanceof Error ? error.message : "No se pudo exportar la información")
    }
  }, [filteredUsers, getPrimaryRole, showSuccess, showError])

  const createBackup = async () => {
    setBackupLoading(true)
    try {
      const now = new Date()
      const payload = {
        backupName: `backup_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`,
        diskUsed: "Disco 1",
        status: "SUCCESS",
        sizeBytes: 0,
        errorMessage: "",
        notes: "Respaldo iniciado desde el panel de administración"
      }

      const response = await fetch("/api/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo registrar el respaldo")
      }
      showSuccess("Respaldo registrado correctamente")
      await loadBackups()
    } catch (error) {
      console.error("Error creating backup:", error)
      showError(error instanceof Error ? error.message : "No se pudo crear el respaldo")
    } finally {
      setBackupLoading(false)
    }
  }

  const restoreBackup = async (backup: BackupInfo) => {
    showWarning("La restauración automática aún no está disponible desde la interfaz. Contacta a un administrador.")
    console.log("Restore requested for backup", backup.id)
  }

  const saveSystemConfig = async () => {
    try {
      const response = await fetch("/api/admin/system-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(systemConfig)
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo guardar la configuración")
      }
      showSuccess("Configuración guardada correctamente")
    } catch (error) {
      console.error("Error saving system config:", error)
      showError(error instanceof Error ? error.message : "No se pudo guardar la configuración")
    }
  }

  const loadingState = loading || permissionsLoading

  if (loadingState) {
    return (
      <AnimatedContainer className="text-white px-4">
        <div className="flex items-center justify-center min-h-[420px]">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
            <p className="text-white/60 text-sm">Cargando centro de administración...</p>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <FadeInUp>
          <div className={`${GLASS_CARD} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <UserCheck className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-semibold text-white">{users.length}</span>
            </div>
            <p className={SECTION_SUBTITLE_CLASS}>Usuarios totales</p>
            <p className="text-green-400 text-xs mt-3">{users.filter(user => user.isActive).length} activos</p>
          </div>
        </FadeInUp>
        <FadeInUp delay={0.05}>
          <div className={`${GLASS_CARD} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <Crown className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-semibold text-white">{roles.length}</span>
            </div>
            <p className={SECTION_SUBTITLE_CLASS}>Roles configurados</p>
            <p className="text-purple-300 text-xs mt-3">{roles.filter(role => role.isSystem).length} roles del sistema</p>
          </div>
        </FadeInUp>
        <FadeInUp delay={0.1}>
          <div className={`${GLASS_CARD} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-emerald-400" />
              <span className="text-2xl font-semibold text-white">
                {users.filter(user => {
                  if (!user.lastLoginAt) return false
                  const lastLogin = new Date(user.lastLoginAt)
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  return lastLogin > yesterday
                }).length}
              </span>
            </div>
            <p className={SECTION_SUBTITLE_CLASS}>Actividad en 24h</p>
            <p className="text-emerald-300 text-xs mt-3">Usuarios que iniciaron sesión recientemente</p>
          </div>
        </FadeInUp>
        <FadeInUp delay={0.15}>
          <div className={`${GLASS_CARD} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <Database className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-semibold text-white">{backups.length}</span>
            </div>
            <p className={SECTION_SUBTITLE_CLASS}>Respaldos registrados</p>
            <p className="text-yellow-300 text-xs mt-3">{backups.filter(backup => backup.status === "completed").length} completados</p>
          </div>
        </FadeInUp>
      </div>
      <FadeInUp delay={0.2}>
        <div className={`${GLASS_CARD} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-white/80" />
            <h3 className="text-lg font-semibold text-white">Actividad reciente</h3>
          </div>
          <div className="space-y-3">
            {users.slice(0, 6).map(user => {
              const primaryRole = getPrimaryRole(user)
              return (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{
                        backgroundColor: primaryRole?.color || "#95A5A6",
                        boxShadow: `0 0 10px ${(primaryRole?.color || "#95A5A6")}40`
                      }}
                    >
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{user.username}</p>
                      <p className="text-xs text-white/50">
                        {user.lastLoginAt ? `Último acceso: ${new Date(user.lastLoginAt).toLocaleDateString("es-AR")}` : "Aún no inició sesión"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {primaryRole && (
                      <span
                        className="text-[11px] px-2 py-1 rounded-full text-white/90 border"
                        style={{
                          backgroundColor: `${primaryRole.color}20`,
                          borderColor: `${primaryRole.color}40`
                        }}
                      >
                        {primaryRole.displayName}
                      </span>
                    )}
                    <span className={`${BADGE_CLASS} ${user.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              )
            })}

            {users.length === 0 && (
              <div className="text-center text-white/50 text-sm py-12 border border-dashed border-white/10 rounded-xl">
                Aún no hay usuarios registrados en el sistema
              </div>
            )}
          </div>
        </div>
      </FadeInUp>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <FadeInUp>
        <div className={`${GLASS_CARD} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <label className={LABEL_CLASS}>Buscar</label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={userSearch}
                placeholder="Busca por usuario, correo o nombre"
                onChange={(event) => setUserSearch(event.target.value)}
              />
            </div>
            <div className="w-full sm:max-w-xs space-y-2">
              <label className={LABEL_CLASS}>Rol</label>
              <Select value={userRoleFilter} onChange={setUserRoleFilter} options={roleOptions} />
            </div>
            <div className="w-full sm:max-w-xs space-y-2">
              <label className={LABEL_CLASS}>Estado</label>
              <Select
                value={userStatusFilter}
                onChange={(value) => setUserStatusFilter(value as UserStatusFilter)}
                options={[
                  { value: "", label: "Todos" },
                  { value: "active", label: "Activos" },
                  { value: "inactive", label: "Inactivos" }
                ]}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => exportUsers("excel")} variant="ghost">
                Exportar Excel
              </Button>
              <Button onClick={() => exportUsers("pdf")} variant="ghost">
                Exportar PDF
              </Button>
              {canCreateUsers && (
                <Button onClick={handleNewUser}>
                  Nuevo usuario
                </Button>
              )}
            </div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.05}>
        <div className="hidden md:block">
          {filteredUsers.length === 0 ? (
            <div className={`${GLASS_CARD} py-16 text-center text-white/50`}>
              No encontramos usuarios para los filtros seleccionados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredUsers.map(user => (
                <div key={user.id} className="relative">
                  {/* Click en el avatar abre detalles */}
                  <div
                    className="absolute top-6 left-6 w-16 h-16 rounded-full cursor-pointer z-10 hover:scale-110 transition-transform"
                    onClick={() => handleViewUserDetails(user)}
                  />
                  <UserCard
                    user={{
                      id: user.id,
                      username: user.username,
                      email: user.email || undefined,
                      roles: user.roles,
                      status: user.isActive ? "online" : "offline",
                      lastActive: user.lastLoginAt || undefined
                    }}
                    onEdit={canEditUsers ? () => handleEditUser(user) : undefined}
                    onManageRoles={canEditUsers ? () => openUserRoles(user) : undefined}
                    onViewPermissions={canManageUsers ? () => openUserPermissions(user) : undefined}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeInUp>

      <FadeInUp delay={0.1}>
        <div className="md:hidden">
          <MobileTable
            columns={[
              { key: "username", label: "Usuario" },
              { key: "email", label: "Email" },
              {
                key: "role",
                label: "Rol",
                render: (_value: unknown, item: UserSummary) => {
                  const primary = getPrimaryRole(item)
                  return primary?.displayName ?? primary?.name ?? "Sin rol"
                }
              },
              {
                key: "status",
                label: "Estado",
                render: (_value: unknown, item: UserSummary) => (
                  <span className={`${BADGE_CLASS} ${item.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                    {item.isActive ? "Activo" : "Inactivo"}
                  </span>
                )
              },
              {
                key: "actions",
                label: "Acciones",
                render: (_value: unknown, item: UserSummary) => (
                  <div className="flex flex-wrap gap-2">
                    {canManageUsers && (
                      <Button onClick={() => openUserPermissions(item)} variant="ghost" small>
                        Permisos
                      </Button>
                    )}
                    {canEditUsers && (
                      <Button onClick={() => openUserRoles(item)} variant="ghost" small>
                        Roles
                      </Button>
                    )}
                    {canEditUsers && (
                      <Button onClick={() => handleEditUser(item)} variant="ghost" small>
                        Editar
                      </Button>
                    )}
                    {canDeleteUsers && (
                      <Button
                        onClick={() => setDeleteUserConfirm({ isOpen: true, user: item })}
                        variant="ghost"
                        small
                        className="text-red-300 hover:text-red-200"
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                )
              }
            ]}
            data={filteredUsers}
          />
        </div>
      </FadeInUp>
    </div>
  )

  const renderRoles = () => (
    <div className="space-y-6">
      <FadeInUp>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">Roles y jerarquías</h3>
            <p className={SECTION_SUBTITLE_CLASS}>Gestiona roles y permisos asignados a tu organización</p>
          </div>
          {canCreateRoles && (
            <Button onClick={handleNewRole}>
              Nuevo rol
            </Button>
          )}
        </div>
      </FadeInUp>

      <FadeInUp delay={0.05}>
        {roles.length === 0 ? (
          <div className={`${GLASS_CARD} py-16 text-center text-white/50`}>
            Aún no hay roles configurados
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map(role => (
              <RoleCard
                key={role.id}
                role={{
                  id: role.id,
                  name: role.name,
                  displayName: role.displayName,
                  description: role.description ?? undefined,
                  color: role.color ?? "#3B82F6",
                  icon: role.icon ?? "shield",
                  level: role.level ?? 1,
                  isSystem: Boolean(role.isSystem),
                  isActive: role.isActive ?? true,
                  priority: role.priority ?? 500,
                  maxUsers: role.maxUsers ?? undefined,
                  permissions: role.permissions ?? [],
                  userCount: role._count?.userRoles ?? 0
                }}
                showActions={true}
                onEdit={canEditRoles ? () => handleEditRole(role) : undefined}
                onDelete={(canDeleteRoles && !role.isSystem) ? () => setDeleteRoleConfirm({ isOpen: true, role }) : undefined}
              />
            ))}
          </div>
        )}
      </FadeInUp>
    </div>
  )

  const renderBusinessRules = () => (
    <div className="space-y-6">
      <FadeInUp>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">Reglas de negocio</h3>
            <p className={SECTION_SUBTITLE_CLASS}>Automatiza decisiones y restricciones del sistema</p>
          </div>
          <Button onClick={() => {
            resetRuleForm()
            setIsRuleModalOpen(true)
          }} className="sm:w-auto">
            Nueva regla
          </Button>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.05}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {businessRules.map(rule => (
            <div key={rule.id} className={`${GLASS_CARD} p-5 space-y-3`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-white font-medium">{rule.name}</h4>
                    <span className={`${BADGE_CLASS} ${rule.isActive ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                      {rule.isActive ? "Activa" : "Inactiva"}
                    </span>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                      {rule.type === "technician" ? "Técnicos" : rule.type === "approval" ? "Aprobación" : "Restricción"}
                    </span>
                  </div>
                  <p className={SECTION_SUBTITLE_CLASS}>{rule.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    small
                    onClick={() => {
                      setSelectedRule(rule)
                      setRuleForm({
                        name: rule.name,
                        description: rule.description,
                        type: rule.type,
                        isActive: rule.isActive,
                        config: rule.config
                      })
                      setIsRuleModalOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    small
                    className="text-red-300 hover:text-red-200"
                    onClick={() => setDeleteRuleConfirm({ isOpen: true, rule })}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/70 space-y-2">
                {rule.type === "technician" && Array.isArray(rule.config.roles) && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-white/50">Roles permitidos:</span>
                    {(rule.config.roles as string[]).map((roleName: string) => {
                      const roleData = roleLookup.get(roleName)
                      return (
                        <span
                          key={roleName}
                          className={`${BADGE_CLASS} text-white/90`}
                          style={{
                            backgroundColor: `${roleData?.color || "#3B82F6"}20`,
                            borderColor: `${roleData?.color || "#3B82F6"}40`,
                            border: "1px solid"
                          }}
                        >
                          {roleData?.displayName ?? formatResourceLabel(roleName)}
                        </span>
                      )
                    })}
                  </div>
                )}
                {rule.type === "approval" && rule.config.maxAmount && (
                  <p>Límite de aprobación: <span className="text-emerald-300 font-semibold">${Number(rule.config.maxAmount).toLocaleString()}</span></p>
                )}
                {rule.type === "restriction" && (
                  <pre className="whitespace-pre-wrap text-[11px] font-mono">
                    {JSON.stringify(rule.config, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}

          {businessRules.length === 0 && (
            <div className={`${GLASS_CARD} py-12 text-center text-white/50 col-span-full`}>
              No hay reglas configuradas aún
            </div>
          )}
        </div>
      </FadeInUp>
    </div>
  )

  const renderBackups = () => (
    <div className="space-y-6">
      <FadeInUp>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-white">Respaldos del sistema</h3>
            <p className={SECTION_SUBTITLE_CLASS}>Controla los respaldos generados y su estado</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadBackups} variant="ghost" disabled={backupLoading}>
              Actualizar
            </Button>
            <Button onClick={createBackup} disabled={backupLoading}>
              Crear respaldo
            </Button>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.05}>
        <div className="space-y-4">
          {backups.map(backup => (
            <div key={backup.id} className={`${GLASS_CARD} p-5`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    backup.status === "completed" ? "bg-emerald-500/15 text-emerald-300" :
                    backup.status === "failed" ? "bg-red-500/15 text-red-300" :
                    "bg-yellow-500/15 text-yellow-300"
                  }`}>
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{backup.filename}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-white/60 mt-1">
                      <span>{new Date(backup.createdAt).toLocaleString("es-AR")}</span>
                      <span>{backup.size > 0 ? `${(backup.size / 1024 / 1024 / 1024).toFixed(2)} GB` : "Tamaño no disponible"}</span>
                      <span className={`${BADGE_CLASS} bg-white/10 text-white/70 border border-white/10`}>
                        {backup.type === "automatic" ? "Automático" : "Manual"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button variant="ghost" small onClick={() => handleDownloadBackup(backup)}>
                    Descargar
                  </Button>
                  <Button variant="ghost" small disabled={backupLoading} onClick={() => restoreBackup(backup)}>
                    Restaurar
                  </Button>
                  <Button variant="ghost" small onClick={() => viewBackupHistory(backup)}>
                    Historial
                  </Button>
                  <Button
                    variant="ghost"
                    small
                    className="text-red-300 hover:text-red-200"
                    onClick={() => setDeleteBackupConfirm({ isOpen: true, backup })}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {backups.length === 0 && (
            <div className={`${GLASS_CARD} py-16 text-center text-white/50`}>
              No hay respaldos registrados todavía
            </div>
          )}
        </div>
      </FadeInUp>
    </div>
  )

  const renderSystem = () => (
    <div className="space-y-6">
      <FadeInUp>
        <div>
          <h3 className="text-xl font-semibold text-white">Configuración del sistema</h3>
          <p className={SECTION_SUBTITLE_CLASS}>Ajusta parámetros críticos y reglas de seguridad</p>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.05}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${GLASS_CARD} p-6 space-y-4`}>
            <h4 className="text-white font-semibold text-sm flex items-center gap-2"><Settings className="w-4 h-4" /> General</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Modo mantenimiento</p>
                  <p className="text-white/50 text-xs">Sólo administradores pueden acceder</p>
                </div>
                <button
                  onClick={() => setSystemConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                  className={`w-12 h-6 rounded-full transition ${systemConfig.maintenanceMode ? "bg-blue-500" : "bg-white/20"}`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${systemConfig.maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Registro público</p>
                  <p className="text-white/50 text-xs">Permitir creación de cuentas sin invitación</p>
                </div>
                <button
                  onClick={() => setSystemConfig(prev => ({ ...prev, allowRegistration: !prev.allowRegistration }))}
                  className={`w-12 h-6 rounded-full transition ${systemConfig.allowRegistration ? "bg-blue-500" : "bg-white/20"}`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${systemConfig.allowRegistration ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
          </div>

          <div className={`${GLASS_CARD} p-6 space-y-4`}>
            <h4 className="text-white font-semibold text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Seguridad</h4>
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLASS}>Tiempo de sesión (min)</label>
                <input
                  type="number"
                  className={INPUT_CLASS}
                  value={systemConfig.sessionTimeout}
                  min={5}
                  onChange={(event) => setSystemConfig(prev => ({ ...prev, sessionTimeout: Number(event.target.value) }))}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Intentos máximos de login</label>
                <input
                  type="number"
                  className={INPUT_CLASS}
                  value={systemConfig.maxLoginAttempts}
                  min={1}
                  onChange={(event) => setSystemConfig(prev => ({ ...prev, maxLoginAttempts: Number(event.target.value) }))}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Longitud mínima de contraseña</label>
                <input
                  type="number"
                  className={INPUT_CLASS}
                  value={systemConfig.passwordMinLength}
                  min={6}
                  onChange={(event) => setSystemConfig(prev => ({ ...prev, passwordMinLength: Number(event.target.value) }))}
                />
              </div>
            </div>
          </div>

          <div className={`${GLASS_CARD} p-6 space-y-4`}>
            <h4 className="text-white font-semibold text-sm flex items-center gap-2"><Activity className="w-4 h-4" /> Estado del Sistema</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Versión</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Base de datos</span>
                <span className="text-white">SQL Server</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Almacenamiento</span>
                <span className="text-white">45.2 GB / 100 GB</span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>Última actualización</span>
                <span className="text-white">{new Date().toLocaleDateString("es-AR")}</span>
              </div>
            </div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.1}>
        <div className="flex justify-end">
          <Button onClick={saveSystemConfig}>
            Guardar cambios
          </Button>
        </div>
      </FadeInUp>
    </div>
  )

  const renderUserModal = () => (
    <Modal
      open={isUserModalOpen}
      onClose={closeUserModal}
      title={selectedUser ? "Editar Usuario" : "Nuevo Usuario"}
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" className="flex-1" onClick={closeUserModal}>
            Cancelar
          </Button>
          {selectedUser && (
            <>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  closeUserModal()
                  handleChangePassword(selectedUser)
                }}
              >
                Cambiar Contraseña
              </Button>
              {canDeleteUsers && (
                <Button
                  variant="ghost"
                  className="flex-1 text-red-300 hover:text-red-200"
                  onClick={() => {
                    closeUserModal()
                    setDeleteUserConfirm({ isOpen: true, user: selectedUser })
                  }}
                >
                  Eliminar
                </Button>
              )}
            </>
          )}
          <Button className="flex-1" onClick={handleSaveUser}>
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Usuario</label>
            <input
              type="text"
              className={INPUT_CLASS}
              value={userForm.username}
              onChange={(event) => setUserForm(prev => ({ ...prev, username: event.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Email</label>
            <input
              type="email"
              className={INPUT_CLASS}
              value={userForm.email}
              onChange={(event) => setUserForm(prev => ({ ...prev, email: event.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Nombre</label>
            <input
              type="text"
              className={INPUT_CLASS}
              value={userForm.firstName}
              onChange={(event) => setUserForm(prev => ({ ...prev, firstName: event.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Apellido</label>
            <input
              type="text"
              className={INPUT_CLASS}
              value={userForm.lastName}
              onChange={(event) => setUserForm(prev => ({ ...prev, lastName: event.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Rol principal</label>
            <SearchableSelect
              value={userForm.role}
              onChange={(value) => setUserForm(prev => ({ ...prev, role: value }))}
              options={roles.map(role => ({ value: role.name, label: role.displayName }))}
              searchPlaceholder="Buscar rol..."
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Estado</label>
            <Select
              value={userForm.isActive ? "active" : "inactive"}
              onChange={(value) => setUserForm(prev => ({ ...prev, isActive: value === "active" }))}
              options={[
                { value: "active", label: "Activo" },
                { value: "inactive", label: "Inactivo" }
              ]}
            />
          </div>
          {!selectedUser && (
            <>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Contraseña</label>
                <input
                  type="password"
                  className={INPUT_CLASS}
                  value={userForm.password}
                  placeholder="Mínimo 8 caracteres"
                  onChange={(event) => setUserForm(prev => ({ ...prev, password: event.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Confirmar contraseña</label>
                <input
                  type="password"
                  className={INPUT_CLASS}
                  value={userForm.confirmPassword}
                  placeholder="Repite la contraseña"
                  onChange={(event) => setUserForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )

  const renderUserRolesModal = () => (
    <Modal
      open={isUserRolesModalOpen}
      onClose={closeUserRolesModal}
      title={`Roles de ${selectedUser?.username || "Usuario"}`}
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" className="flex-1" onClick={closeUserRolesModal}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSaveUserRoles}>
            Guardar cambios
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          Selecciona los roles que tendrá este usuario. El primero será el rol principal.
        </p>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {roles.map(role => {
            const isSelected = userRolesList.includes(role.name)
            const isPrimary = userRolesList[0] === role.name
            return (
              <div
                key={role.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => {
                  if (isSelected) {
                    setUserRolesList(prev => prev.filter(r => r !== role.name))
                  } else {
                    setUserRolesList(prev => [...prev, role.name])
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                    />
                    <div>
                      <p className="text-white font-medium">{role.displayName}</p>
                      {role.description && (
                        <p className="text-xs text-white/60 mt-1">{role.description}</p>
                      )}
                    </div>
                  </div>
                  {isPrimary && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                      Principal
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {userRolesList.length > 1 && (
          <div className="text-xs text-white/60 border-t border-white/10 pt-3">
            Puedes arrastrar los roles para cambiar el orden de prioridad
          </div>
        )}
      </div>
    </Modal>
  )

  const renderUserPermissionsModal = () => (
    <Modal
      open={isUserPermissionsModalOpen}
      onClose={closeUserPermissionsModal}
      title={`Permisos de ${selectedUser?.username || "Usuario"}`}
      footer={
        <Button onClick={closeUserPermissionsModal} className="w-full sm:w-auto">
          Cerrar
        </Button>
      }
    >
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
        {userPermissionsView.length === 0 ? (
          <p className="text-center text-white/50 py-8">
            Este usuario no tiene permisos asignados
          </p>
        ) : (
          userPermissionsView.map(permGroup => (
            <div key={permGroup.resource} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h4 className="text-white font-medium mb-2">
                {formatResourceLabel(permGroup.resource)}
              </h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {permGroup.actions.map(action => (
                  <span key={action} className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                    {formatActionLabel(action)}
                  </span>
                ))}
              </div>
              <div className="text-xs text-white/60">
                Otorgado por: {permGroup.roles.join(", ")}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  )

  const renderRoleModal = () => (
    <Modal
      open={isRoleModalOpen}
      onClose={closeRoleModal}
      title={selectedRole ? "Editar rol" : "Nuevo rol"}
      size="large"
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" className="flex-1" onClick={closeRoleModal}>
            Cancelar
          </Button>
          {selectedRole && canDeleteRoles && !selectedRole.isSystem && (
            <Button
              variant="ghost"
              className="flex-1 text-red-300 hover:text-red-200"
              onClick={() => {
                closeRoleModal()
                setDeleteRoleConfirm({ isOpen: true, role: selectedRole })
              }}
            >
              Eliminar Rol
            </Button>
          )}
          <Button className="flex-1" onClick={handleSaveRole}>
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Nombre interno</label>
            <input
              type="text"
              className={INPUT_CLASS}
              value={roleForm.name}
              placeholder="ADMIN, USER, etc."
              onChange={(event) => setRoleForm(prev => ({ ...prev, name: event.target.value.toUpperCase() }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Nombre visible</label>
            <input
              type="text"
              className={INPUT_CLASS}
              value={roleForm.displayName}
              placeholder="Administrador, Usuario, etc."
              onChange={(event) => setRoleForm(prev => ({ ...prev, displayName: event.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Color</label>
            <input
              type="color"
              className="w-full h-10 rounded-md border border-white/10 bg-black/30 cursor-pointer"
              value={roleForm.color}
              onChange={(event) => setRoleForm(prev => ({ ...prev, color: event.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Nivel (1-100)</label>
            <input
              type="number"
              className={INPUT_CLASS}
              value={roleForm.level}
              min={1}
              max={100}
              onChange={(event) => setRoleForm(prev => ({ ...prev, level: Number(event.target.value) }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Prioridad</label>
            <input
              type="number"
              className={INPUT_CLASS}
              value={roleForm.priority}
              min={1}
              onChange={(event) => setRoleForm(prev => ({ ...prev, priority: Number(event.target.value) }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Máx. usuarios (opcional)</label>
            <input
              type="number"
              className={INPUT_CLASS}
              value={roleForm.maxUsers ?? ""}
              min={1}
              placeholder="Sin límite"
              onChange={(event) => setRoleForm(prev => ({ ...prev, maxUsers: event.target.value ? Number(event.target.value) : null }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Descripción</label>
            <textarea
              className={`${INPUT_CLASS} resize-none`}
              rows={3}
              value={roleForm.description}
              placeholder="Describe las responsabilidades de este rol..."
              onChange={(event) => setRoleForm(prev => ({ ...prev, description: event.target.value }))}
            />
          </div>
        </div>

        {/* Editor de Permisos Mejorado */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Permisos del rol</h4>
          <p className="text-xs text-white/60 mb-4">Configura los permisos de forma visual por categoría</p>

          <PermissionsEditor
            permissions={allPermissions}
            rolePermissions={rolePermissionsDraft}
            onChange={setRolePermissionsDraft}
            readOnly={selectedRole?.isSystem && !hasRole('SUPER_ADMIN')}
          />

        </div>
      </div>
    </Modal>
  )

  const renderRuleModal = () => (
    <Modal
      open={isRuleModalOpen}
      onClose={closeRuleModal}
      title={selectedRule ? "Editar Regla" : "Nueva Regla"}
      footer={
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="ghost" className="flex-1" onClick={closeRuleModal}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSaveRule}>
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={LABEL_CLASS}>Nombre</label>
            <input
              type="text"
              className={INPUT_CLASS}
              value={ruleForm.name}
              onChange={(event) => setRuleForm(prev => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Tipo de regla</label>
            <Select
              value={ruleForm.type}
              onChange={(value) => setRuleForm(prev => ({ ...prev, type: value as BusinessRuleType }))}
              options={[
                { value: "technician", label: "Asignación de técnicos" },
                { value: "approval", label: "Aprobación" },
                { value: "restriction", label: "Restricción" }
              ]}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Descripción</label>
            <textarea
              className={`${INPUT_CLASS} resize-none`}
              rows={3}
              value={ruleForm.description}
              onChange={(event) => setRuleForm(prev => ({ ...prev, description: event.target.value }))}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Estado</label>
            <Select
              value={ruleForm.isActive ? "active" : "inactive"}
              onChange={(value) => setRuleForm(prev => ({ ...prev, isActive: value === "active" }))}
              options={[
                { value: "active", label: "Activa" },
                { value: "inactive", label: "Inactiva" }
              ]}
            />
          </div>

          {ruleForm.type === "approval" && (
            <div>
              <label className={LABEL_CLASS}>Límite de aprobación</label>
              <input
                type="number"
                className={INPUT_CLASS}
                value={ruleForm.config.maxAmount ?? ""}
                onChange={(event) => setRuleForm(prev => ({
                  ...prev,
                  config: { ...prev.config, maxAmount: Number(event.target.value) || 0 }
                }))}
              />
            </div>
          )}

          {ruleForm.type === "technician" && (
            <div className="space-y-2">
              <label className={LABEL_CLASS}>Roles habilitados como técnicos</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roles.map(role => {
                  const checked = Array.isArray(ruleForm.config.roles)
                    ? (ruleForm.config.roles as string[]).includes(role.name)
                    : false
                  return (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 text-sm text-white/80 p-2 rounded-lg hover:bg-white/10 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-white/30 bg-black/40"
                        checked={checked}
                        onChange={(event) => {
                          const currentRoles: string[] = Array.isArray(ruleForm.config.roles)
                            ? [...ruleForm.config.roles as string[]]
                            : []
                          const nextRoles = event.target.checked
                            ? [...currentRoles, role.name]
                            : currentRoles.filter(name => name !== role.name)
                          setRuleForm(prev => ({
                            ...prev,
                            config: { ...prev.config, roles: nextRoles }
                          }))
                        }}
                      />
                      <span
                        className="px-2 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: `${role.color}20`,
                          color: role.color || "#fff"
                        }}
                      >
                        {role.displayName}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {ruleForm.type === "restriction" && (
            <div>
              <label className={LABEL_CLASS}>Configuración JSON</label>
              <textarea
                className={`${INPUT_CLASS} font-mono text-xs h-32`}
                value={JSON.stringify(ruleForm.config, null, 2)}
                onChange={(event) => {
                  try {
                    const parsed = JSON.parse(event.target.value)
                    setRuleForm(prev => ({ ...prev, config: parsed }))
                  } catch {
                    // Ignorar mientras se escribe JSON inválido
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0 space-y-6">
      <FadeInUp delay={0.05}>
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <Shield className="w-6 h-6 text-white/70" />
            <h1 className="text-3xl font-semibold">Centro de administración</h1>
          </div>
          <p className={SECTION_SUBTITLE_CLASS}>Gestiona usuarios, roles, reglas de negocio y respaldos desde un único lugar</p>
        </header>
      </FadeInUp>

      <FadeInUp delay={0.1}>
        <nav className={`${GLASS_CARD} p-2`}>
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </FadeInUp>

      <FadeInUp delay={0.15}>
        <section className="min-h-[500px]">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "users" && renderUsers()}
          {activeTab === "roles" && renderRoles()}
          {activeTab === "rules" && renderBusinessRules()}
          {activeTab === "backups" && renderBackups()}
          {activeTab === "system" && renderSystem()}
        </section>
      </FadeInUp>

      {renderUserModal()}
      {renderUserRolesModal()}
      {renderUserPermissionsModal()}
      {renderRoleModal()}
      {renderRuleModal()}

      {/* Modal de detalles de usuario */}
      <UserDetailsModal
        open={isUserDetailsModalOpen}
        onClose={() => {
          setIsUserDetailsModalOpen(false)
          setDetailsUser(null)
        }}
        user={detailsUser}
        onEdit={(user) => {
          setIsUserDetailsModalOpen(false)
          handleEditUser(user)
        }}
      />

      {/* Modal de cambio de contraseña */}
      <Modal
        open={isChangePasswordModalOpen}
        onClose={() => {
          setIsChangePasswordModalOpen(false)
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        }}
        title={`Cambiar Contraseña - ${selectedUser?.username}`}
        footer={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setIsChangePasswordModalOpen(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSavePassword}>
              Cambiar Contraseña
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {currentUser?.id === selectedUser?.id && (
            <div>
              <label className={LABEL_CLASS}>Contraseña Actual</label>
              <input
                type="password"
                className={INPUT_CLASS}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Ingresa tu contraseña actual"
              />
            </div>
          )}
          <div>
            <label className={LABEL_CLASS}>Nueva Contraseña</label>
            <input
              type="password"
              className={INPUT_CLASS}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              className={INPUT_CLASS}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Repite la nueva contraseña"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteUserConfirm.isOpen}
        title="Eliminar usuario"
        description={deleteUserConfirm.user ? `¿Estás seguro de eliminar a ${deleteUserConfirm.user.username}?` : undefined}
        onCancel={() => setDeleteUserConfirm({ isOpen: false, user: null })}
        onConfirm={handleDeleteUser}
      />

      <ConfirmDialog
        open={deleteRoleConfirm.isOpen}
        title="Eliminar rol"
        description={deleteRoleConfirm.role ? `¿Eliminar ${deleteRoleConfirm.role.displayName}? Esta acción no se puede revertir.` : undefined}
        onCancel={() => setDeleteRoleConfirm({ isOpen: false, role: null })}
        onConfirm={handleDeleteRole}
      />

      <ConfirmDialog
        open={deleteRuleConfirm.isOpen}
        title="Eliminar regla"
        description={deleteRuleConfirm.rule ? `¿Eliminar la regla "${deleteRuleConfirm.rule.name}"?` : undefined}
        onCancel={() => setDeleteRuleConfirm({ isOpen: false, rule: null })}
        onConfirm={handleDeleteRule}
      />

      <ConfirmDialog
        open={deleteBackupConfirm.isOpen}
        title="Eliminar respaldo"
        description={deleteBackupConfirm.backup ? `¿Eliminar ${deleteBackupConfirm.backup.filename}? Esta acción no se puede revertir.` : undefined}
        onCancel={() => setDeleteBackupConfirm({ isOpen: false, backup: null })}
        onConfirm={handleDeleteBackup}
      />
    </AnimatedContainer>
  )
}