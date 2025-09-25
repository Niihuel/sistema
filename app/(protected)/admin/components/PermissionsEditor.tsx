"use client"

import { useState, useMemo } from "react"
import {
  Shield,
  Eye,
  Edit,
  Trash,
  Plus,
  Save,
  Users,
  Settings,
  Database,
  FileText,
  Package,
  Printer,
  ShoppingCart,
  HardDrive,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
  X
} from "lucide-react"
import Button from "@/components/button"

interface Permission {
  id: number
  name: string
  displayName: string
  resource: string
  action: string
  category: string
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  isActive: boolean
}

interface PermissionGroup {
  category: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  permissions: Permission[]
  description: string
}

interface PermissionsEditorProps {
  permissions: Permission[]
  rolePermissions: Record<string, string[]>
  onChange: (permissions: Record<string, string[]>) => void
  readOnly?: boolean
}

const PERMISSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "General": Settings,
  "Equipos": Package,
  "Tickets": FileText,
  "Personal": Users,
  "Inventario": Database,
  "Impresoras": Printer,
  "Compras": ShoppingCart,
  "Sistema": Shield,
  "Administración": Lock
}

const PERMISSION_COLORS: Record<string, string> = {
  "General": "#3498DB",
  "Equipos": "#9B59B6",
  "Tickets": "#E67E22",
  "Personal": "#E74C3C",
  "Inventario": "#1ABC9C",
  "Impresoras": "#F39C12",
  "Compras": "#2ECC71",
  "Sistema": "#34495E",
  "Administración": "#C0392B"
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "view": Eye,
  "create": Plus,
  "edit": Edit,
  "delete": Trash,
  "manage": Settings,
  "export": FileText,
  "assign": Users,
  "*": Shield
}

const RISK_COLORS = {
  "LOW": "text-green-400 bg-green-500/10 border-green-500/20",
  "MEDIUM": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "HIGH": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "CRITICAL": "text-red-400 bg-red-500/10 border-red-500/20"
}

export default function PermissionsEditor({
  permissions,
  rolePermissions,
  onChange,
  readOnly = false
}: PermissionsEditorProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false)

  // Agrupar permisos por categoría
  const permissionGroups = useMemo(() => {
    const groups: Record<string, PermissionGroup> = {}

    const getCategoryDescriptionLocal = (category: string): string => {
      const descriptions: Record<string, string> = {
        "General": "Permisos generales del sistema y dashboard",
        "Equipos": "Gestión de equipos informáticos y hardware",
        "Tickets": "Sistema de tickets y soporte técnico",
        "Personal": "Administración de empleados y personal",
        "Inventario": "Control de inventario y activos",
        "Impresoras": "Gestión de impresoras y consumibles",
        "Compras": "Solicitudes y aprobación de compras",
        "Sistema": "Configuración y mantenimiento del sistema",
        "Administración": "Gestión de usuarios, roles y permisos"
      }
      return descriptions[category] || `Permisos de ${category}`
    }

    permissions.forEach(permission => {
      if (!groups[permission.category]) {
        groups[permission.category] = {
          category: permission.category,
          icon: PERMISSION_ICONS[permission.category] || Shield,
          color: PERMISSION_COLORS[permission.category] || "#95A5A6",
          permissions: [],
          description: getCategoryDescriptionLocal(permission.category)
        }
      }
      groups[permission.category].permissions.push(permission)
    })

    return Object.values(groups).sort((a, b) => a.category.localeCompare(b.category))
  }, [permissions])

  // Agrupar permisos por recurso dentro de cada categoría
  const groupPermissionsByResource = (permissions: Permission[]) => {
    const grouped: Record<string, Permission[]> = {}
    permissions.forEach(perm => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = []
      }
      grouped[perm.resource].push(perm)
    })
    return grouped
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const togglePermission = (resource: string, action: string, enabled: boolean) => {
    if (readOnly) return

    const newPermissions = { ...rolePermissions }
    if (!newPermissions[resource]) {
      newPermissions[resource] = []
    }

    if (enabled) {
      if (!newPermissions[resource].includes(action)) {
        newPermissions[resource].push(action)
      }
    } else {
      newPermissions[resource] = newPermissions[resource].filter(a => a !== action)
      if (newPermissions[resource].length === 0) {
        delete newPermissions[resource]
      }
    }

    onChange(newPermissions)
  }

  const toggleResourceAll = (resource: string, permissions: Permission[]) => {
    if (readOnly) return

    const allEnabled = permissions.every(p =>
      rolePermissions[p.resource]?.includes(p.action)
    )

    const newPermissions = { ...rolePermissions }

    if (allEnabled) {
      // Desactivar todos
      delete newPermissions[resource]
    } else {
      // Activar todos
      newPermissions[resource] = permissions.map(p => p.action)
    }

    onChange(newPermissions)
  }

  const toggleCategoryAll = (category: PermissionGroup) => {
    if (readOnly) return

    const allEnabled = category.permissions.every(p =>
      rolePermissions[p.resource]?.includes(p.action)
    )

    const newPermissions = { ...rolePermissions }

    category.permissions.forEach(perm => {
      if (allEnabled) {
        // Desactivar todos
        delete newPermissions[perm.resource]
      } else {
        // Activar todos
        if (!newPermissions[perm.resource]) {
          newPermissions[perm.resource] = []
        }
        if (!newPermissions[perm.resource].includes(perm.action)) {
          newPermissions[perm.resource].push(perm.action)
        }
      }
    })

    onChange(newPermissions)
  }

  const isPermissionEnabled = (resource: string, action: string): boolean => {
    return rolePermissions[resource]?.includes(action) ||
           rolePermissions[resource]?.includes("*") ||
           rolePermissions["*"]?.includes("*") || false
  }

  const getEnabledCount = (permissions: Permission[]): number => {
    return permissions.filter(p => isPermissionEnabled(p.resource, p.action)).length
  }

  const formatResourceName = (resource: string): string => {
    return resource
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatActionName = (action: string): string => {
    const actionNames: Record<string, string> = {
      "view": "Ver",
      "create": "Crear",
      "edit": "Editar",
      "delete": "Eliminar",
      "manage": "Gestionar",
      "export": "Exportar",
      "import": "Importar",
      "assign": "Asignar",
      "approve": "Aprobar",
      "reject": "Rechazar",
      "close": "Cerrar",
      "restore": "Restaurar",
      "configure": "Configurar",
      "reset_password": "Resetear Contraseña",
      "view_own": "Ver Propios",
      "view_all": "Ver Todos",
      "edit_own": "Editar Propios",
      "edit_all": "Editar Todos",
      "manage_consumables": "Gestionar Consumibles",
      "*": "Todos"
    }
    return actionNames[action] || formatResourceName(action)
  }

  const filteredGroups = useMemo(() => {
    if (!searchTerm && !showOnlyEnabled) return permissionGroups

    return permissionGroups.map(group => ({
      ...group,
      permissions: group.permissions.filter(perm => {
        const matchesSearch = !searchTerm ||
          perm.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.action.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesEnabled = !showOnlyEnabled || isPermissionEnabled(perm.resource, perm.action)

        return matchesSearch && matchesEnabled
      })
    })).filter(group => group.permissions.length > 0)
  }, [permissionGroups, searchTerm, showOnlyEnabled, rolePermissions])

  const totalPermissions = permissions.length
  const enabledPermissions = permissions.filter(p => isPermissionEnabled(p.resource, p.action)).length

  return (
    <div className="space-y-4">
      {/* Header con estadísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Editor de Permisos</h3>
          <p className="text-sm text-white/60 mt-1">
            {enabledPermissions} de {totalPermissions} permisos activos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Buscar permisos..."
            className="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white placeholder-white/40 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => setShowOnlyEnabled(!showOnlyEnabled)}
            className={`px-3 py-2 rounded-lg border text-sm transition ${
              showOnlyEnabled
                ? "bg-blue-500/20 border-blue-400 text-blue-300"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            }`}
          >
            Solo activos
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${(enabledPermissions / totalPermissions) * 100}%` }}
        />
      </div>

      {/* Permission Categories */}
      <div className="space-y-3">
        {filteredGroups.map(group => {
          const Icon = group.icon
          const isExpanded = expandedCategories.has(group.category)
          const enabledCount = getEnabledCount(group.permissions)
          const allEnabled = enabledCount === group.permissions.length

          return (
            <div
              key={group.category}
              className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden"
            >
              {/* Category Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition"
                onClick={() => toggleCategory(group.category)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${group.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: group.color }} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{group.category}</h4>
                    <p className="text-xs text-white/50">{group.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/60">
                    {enabledCount}/{group.permissions.length}
                  </span>
                  {!readOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCategoryAll(group)
                      }}
                      className={`px-3 py-1 rounded-lg text-xs transition ${
                        allEnabled
                          ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                          : "bg-white/10 text-white/60 hover:bg-white/20"
                      }`}
                    >
                      {allEnabled ? "Desactivar todo" : "Activar todo"}
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-white/60" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-white/60" />
                  )}
                </div>
              </div>

              {/* Category Permissions */}
              {isExpanded && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  {Object.entries(groupPermissionsByResource(group.permissions)).map(([resource, perms]) => {
                    const resourceEnabled = getEnabledCount(perms)
                    const allResourceEnabled = resourceEnabled === perms.length

                    return (
                      <div key={resource} className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-white/80">
                            {formatResourceName(resource)}
                          </h5>
                          {!readOnly && perms.length > 1 && (
                            <button
                              onClick={() => toggleResourceAll(resource, perms)}
                              className={`px-2 py-1 rounded text-xs transition ${
                                allResourceEnabled
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-white/10 text-white/50 hover:text-white"
                              }`}
                            >
                              {allResourceEnabled ? "Desactivar" : "Activar"} todos
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {perms.map(perm => {
                            const ActionIcon = ACTION_ICONS[perm.action] || Shield
                            const enabled = isPermissionEnabled(perm.resource, perm.action)

                            return (
                              <button
                                key={perm.id}
                                onClick={() => togglePermission(perm.resource, perm.action, !enabled)}
                                disabled={readOnly}
                                className={`
                                  relative group flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                                  border transition-all duration-200
                                  ${enabled
                                    ? `${RISK_COLORS[perm.riskLevel]} border-current`
                                    : "bg-black/20 border-white/10 text-white/40 hover:border-white/20"
                                  }
                                  ${readOnly ? "cursor-not-allowed" : "cursor-pointer hover:scale-105"}
                                `}
                              >
                                <ActionIcon className="w-4 h-4" />
                                <span>{formatActionName(perm.action)}</span>

                                {enabled && (
                                  <Check className="w-3 h-3 absolute top-1 right-1" />
                                )}

                                {/* Tooltip */}
                                <div className="
                                  absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                                  px-2 py-1 bg-gray-900 text-white text-xs rounded
                                  opacity-0 group-hover:opacity-100 pointer-events-none
                                  transition-opacity whitespace-nowrap z-10
                                ">
                                  {perm.displayName}
                                  <div className={`text-[10px] ${RISK_COLORS[perm.riskLevel].split(' ')[0]}`}>
                                    Riesgo: {perm.riskLevel}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-8 text-white/50">
          No se encontraron permisos que coincidan con los filtros
        </div>
      )}
    </div>
  )
}