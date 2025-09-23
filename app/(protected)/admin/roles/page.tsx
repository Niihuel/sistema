"use client"

import { useState, useCallback, useEffect } from "react"
import { useToast } from "@/lib/hooks/use-toast"
import AnimatedContainer, { FadeInUp } from "@/components/animated-container"
import Button from "@/components/button"
import Modal from "@/components/modal"
import ConfirmDialog from "@/components/confirm-dialog"
import { RoleBadge } from "@/components/roles/RoleBadge"
import {
  Shield,
  Users,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Save,
  X,
  Crown,
  Palette,
  Hash
} from "lucide-react"

// Tipos
interface Role {
  id: number
  name: string
  displayName: string
  color?: string | null
  icon?: string | null
  level?: number
  priority?: number
  description?: string | null
  permissions?: string | null
  maxUsers?: number | null
  isSystem?: boolean
  _count?: {
    userRoles: number
  }
  createdAt: string
  updatedAt: string
}

// Colores predefinidos para los roles (estilo Discord)
const ROLE_COLORS = [
  { value: "#FF6B6B", label: "Rojo", preview: "bg-red-500" },
  { value: "#4ECDC4", label: "Turquesa", preview: "bg-teal-500" },
  { value: "#45B7D1", label: "Azul", preview: "bg-blue-500" },
  { value: "#96CEB4", label: "Verde", preview: "bg-green-500" },
  { value: "#FECA57", label: "Amarillo", preview: "bg-yellow-500" },
  { value: "#DDA0DD", label: "Púrpura", preview: "bg-purple-500" },
  { value: "#FF6B9D", label: "Rosa", preview: "bg-pink-500" },
  { value: "#778BEB", label: "Índigo", preview: "bg-indigo-500" },
  { value: "#6B7280", label: "Gris", preview: "bg-gray-500" },
  { value: "#FB923C", label: "Naranja", preview: "bg-orange-500" }
]

// Iconos disponibles para roles
const ROLE_ICONS = [
  { value: "crown", label: "Corona", icon: Crown },
  { value: "shield", label: "Escudo", icon: Shield },
  { value: "key", label: "Llave", icon: Users },
  { value: "users", label: "Usuarios", icon: Users }
]

export default function RolesPage() {
  const { showError, showSuccess } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    color: "#6B7280",
    icon: "shield",
    level: 10,
    priority: 500,
    maxUsers: null as number | null
  })

  // Cargar roles
  const loadRoles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        const error = await response.json()
        showError(error.error || "Error cargando roles")
      }
    } catch (error) {
      console.error("Error loading roles:", error)
      showError("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  // Abrir formulario para crear
  const handleCreate = () => {
    setEditingRole(null)
    setFormData({
      name: "",
      displayName: "",
      description: "",
      color: "#6B7280",
      icon: "shield",
      level: 10,
      priority: 500,
      maxUsers: null
    })
    setIsFormOpen(true)
  }

  // Abrir formulario para editar
  const handleEdit = (role: Role) => {
    if (role.isSystem) {
      showError("No se pueden editar roles del sistema")
      return
    }

    setEditingRole(role)
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || "",
      color: role.color || "#6B7280",
      icon: role.icon || "shield",
      level: role.level || 10,
      priority: role.priority || 500,
      maxUsers: role.maxUsers || null
    })
    setIsFormOpen(true)
  }

  // Guardar rol (crear o actualizar)
  const handleSave = async () => {
    try {
      // Validaciones
      if (!formData.name || !formData.displayName) {
        showError("El nombre y nombre para mostrar son requeridos")
        return
      }

      const url = editingRole
        ? `/api/roles/${editingRole.id}`
        : "/api/roles"

      const method = editingRole ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showSuccess(editingRole ? "Rol actualizado" : "Rol creado")
        setIsFormOpen(false)
        loadRoles()
      } else {
        const error = await response.json()
        showError(error.error || "Error guardando rol")
      }
    } catch (error) {
      console.error("Error saving role:", error)
      showError("Error al guardar rol")
    }
  }

  // Eliminar rol
  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/roles/${deleteId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        showSuccess("Rol eliminado")
        setDeleteId(null)
        loadRoles()
      } else {
        const error = await response.json()
        showError(error.error || "Error eliminando rol")
      }
    } catch (error) {
      console.error("Error deleting role:", error)
      showError("Error al eliminar rol")
    }
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0">
      <FadeInUp delay={0.05}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Gestión de Roles</h1>
              <p className="text-white/70 mt-1">Sistema de roles tipo Discord</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreate} variant="ghost">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Rol
            </Button>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.1}>
        {/* Lista de roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8 text-white/60">
              Cargando roles...
            </div>
          ) : roles.length === 0 ? (
            <div className="col-span-full text-center py-8 text-white/60">
              No hay roles configurados
            </div>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all"
              >
                {/* Header del rol */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: role.color || "#6B7280",
                        boxShadow: `0 0 20px ${role.color}40`
                      }}
                    >
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {role.displayName}
                      </h3>
                      <p className="text-xs text-white/50">{role.name}</p>
                    </div>
                  </div>
                  {role.isSystem && (
                    <div className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                      Sistema
                    </div>
                  )}
                </div>

                {/* Descripción */}
                {role.description && (
                  <p className="text-sm text-white/70 mb-4">
                    {role.description}
                  </p>
                )}

                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-white/50" />
                    <span className="text-white/70">Nivel: {role.level || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-white/50" />
                    <span className="text-white/70">
                      {role._count?.userRoles || 0} usuarios
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  {!role.isSystem && (
                    <>
                      <Button
                        onClick={() => handleEdit(role)}
                        variant="ghost"
                        small
                        className="flex-1"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => setDeleteId(role.id)}
                        variant="ghost"
                        small
                        className="flex-1"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </FadeInUp>

      {/* Modal de formulario */}
      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRole ? "Editar Rol" : "Crear Rol"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Nombre interno (sin espacios)
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s/g, '_') })}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white"
              placeholder="ADMIN_VENTAS"
              disabled={editingRole?.isSystem}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Nombre para mostrar
            </label>
            <input
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white"
              placeholder="Administrador de Ventas"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white"
              rows={2}
              placeholder="Descripción del rol..."
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Color del rol
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ROLE_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`h-10 rounded-md transition-all ${
                    formData.color === color.value
                      ? "ring-2 ring-white scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">
                Nivel jerárquico (0-100)
              </label>
              <input
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Prioridad
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 500 })}
                className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white"
                min="0"
                max="1000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">
              Límite de usuarios (opcional)
            </label>
            <input
              type="number"
              value={formData.maxUsers || ""}
              onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 text-white"
              placeholder="Sin límite"
              min="0"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsFormOpen(false)}
              className="flex-1 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              <Save className="w-4 h-4 inline mr-2" />
              {editingRole ? "Actualizar" : "Crear"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Eliminar Rol"
        message="¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </AnimatedContainer>
  )
}