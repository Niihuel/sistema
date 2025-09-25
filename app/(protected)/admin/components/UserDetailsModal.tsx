"use client"

import { useState } from "react"
import Modal from "@/components/modal"
import Button from "@/components/button"
import {
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  UserCheck,
  Activity,
  Lock,
  Globe,
  Server,
  Hash,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"

interface UserDetails {
  id: number
  username: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: string | null
  roles: Array<{
    id: number
    name: string
    displayName: string
    color?: string | null
    icon?: string | null
    level?: number | null
    isPrimary?: boolean | null
  }>
  isActive: boolean
  isEmailVerified?: boolean
  twoFactorEnabled?: boolean
  lastLoginAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  failedLoginAttempts?: number
  lockedUntil?: string | null
  sessionToken?: string | null
  sessionExpiresAt?: string | null
  employee?: {
    id: number
    firstName: string
    lastName: string
    area?: string | null
    position?: string | null
    phone?: string | null
    status: string
  } | null
  _count?: {
    userSessions: number
    auditLogs: number
    notifications: number
  }
}

interface UserDetailsModalProps {
  open: boolean
  onClose: () => void
  user: UserDetails | null
  onEdit?: (user: UserDetails) => void
}

const GLASS_CARD = "rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
const STAT_CARD = "p-4 rounded-lg bg-black/30 border border-white/10"
const BADGE_CLASS = "text-xs px-2 py-1 rounded-full"
const LABEL_CLASS = "text-xs text-white/50 uppercase tracking-wider"

export default function UserDetailsModal({
  open,
  onClose,
  user,
  onEdit
}: UserDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "security" | "activity" | "employee">("overview")

  if (!user) return null

  const getPrimaryRole = () => {
    return user.roles.find(r => r.isPrimary) || user.roles[0] || null
  }

  const primaryRole = getPrimaryRole()

  const formatDate = (date?: string | null) => {
    if (!date) return "Nunca"
    return new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getStatusColor = () => {
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return "bg-red-500"
    }
    if (!user.isActive) {
      return "bg-gray-500"
    }
    if (user.sessionToken && user.sessionExpiresAt && new Date(user.sessionExpiresAt) > new Date()) {
      return "bg-green-500"
    }
    return "bg-yellow-500"
  }

  const getStatusText = () => {
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return "Bloqueado"
    }
    if (!user.isActive) {
      return "Inactivo"
    }
    if (user.sessionToken && user.sessionExpiresAt && new Date(user.sessionExpiresAt) > new Date()) {
      return "En línea"
    }
    return "Desconectado"
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      size="large"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(user)}>
              Editar Usuario
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-2xl"
              style={{
                backgroundColor: primaryRole?.color || "#95A5A6",
                boxShadow: `0 0 30px ${(primaryRole?.color || "#95A5A6")}40`
              }}
            >
              <UserCheck className="w-12 h-12" />
            </div>
            <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-gray-900 ${getStatusColor()}`} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">{user.username}</h2>
              <span className={`${BADGE_CLASS} ${getStatusColor()} text-white`}>
                {getStatusText()}
              </span>
            </div>

            {(user.firstName || user.lastName) && (
              <p className="text-lg text-white/80 mb-1">
                {user.firstName} {user.lastName}
              </p>
            )}

            <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
              <Mail className="w-4 h-4" />
              <span>{user.email || "Sin email"}</span>
              {user.isEmailVerified && (
                <CheckCircle className="w-4 h-4 text-green-400" title="Email verificado" />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {user.roles.map(role => (
                <span
                  key={role.id}
                  className={`${BADGE_CLASS} text-white/90 border ${role.isPrimary ? "ring-2 ring-white/30" : ""}`}
                  style={{
                    backgroundColor: `${role.color}30`,
                    borderColor: `${role.color}60`
                  }}
                >
                  {role.icon} {role.displayName}
                  {role.level && <span className="ml-1 opacity-60">(Nivel {role.level})</span>}
                </span>
              ))}
            </div>
          </div>

          <div className="text-right">
            <p className={LABEL_CLASS}>ID de Usuario</p>
            <p className="text-2xl font-mono text-white">#{user.id}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {[
            { id: "overview" as const, label: "General", icon: User },
            { id: "security" as const, label: "Seguridad", icon: Shield },
            { id: "activity" as const, label: "Actividad", icon: Activity },
            ...(user.employee ? [{ id: "employee" as const, label: "Empleado", icon: UserCheck }] : [])
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 transition ${
                  activeTab === tab.id
                    ? "text-white border-b-2 border-white"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Nombre de Usuario</p>
                <p className="text-white mt-1">{user.username}</p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Email</p>
                <p className="text-white mt-1 flex items-center gap-2">
                  {user.email || "No configurado"}
                  {user.isEmailVerified && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Nombre Completo</p>
                <p className="text-white mt-1">
                  {user.firstName || user.lastName
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                    : "No configurado"}
                </p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Rol Principal</p>
                <p className="text-white mt-1">
                  {primaryRole?.displayName || user.role || "Sin rol"}
                </p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Estado de Cuenta</p>
                <p className={`mt-1 ${user.isActive ? "text-green-400" : "text-red-400"}`}>
                  {user.isActive ? "Activa" : "Inactiva"}
                </p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Fecha de Creación</p>
                <p className="text-white mt-1">{formatDate(user.createdAt)}</p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Última Actualización</p>
                <p className="text-white mt-1">{formatDate(user.updatedAt)}</p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Último Acceso</p>
                <p className="text-white mt-1">{formatDate(user.lastLoginAt)}</p>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={STAT_CARD}>
                  <p className={LABEL_CLASS}>Autenticación de 2 Factores</p>
                  <div className="flex items-center gap-2 mt-1">
                    {user.twoFactorEnabled ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-green-400">Habilitada</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-yellow-400" />
                        <span className="text-yellow-400">Deshabilitada</span>
                      </>
                    )}
                  </div>
                </div>

                <div className={STAT_CARD}>
                  <p className={LABEL_CLASS}>Intentos de Login Fallidos</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    (user.failedLoginAttempts || 0) > 3 ? "text-red-400" : "text-white"
                  }`}>
                    {user.failedLoginAttempts || 0}
                  </p>
                </div>

                <div className={STAT_CARD}>
                  <p className={LABEL_CLASS}>Estado de Bloqueo</p>
                  <div className="mt-1">
                    {user.lockedUntil && new Date(user.lockedUntil) > new Date() ? (
                      <div>
                        <p className="text-red-400 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Bloqueado hasta
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          {formatDate(user.lockedUntil)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-green-400">Sin bloqueos</p>
                    )}
                  </div>
                </div>

                <div className={STAT_CARD}>
                  <p className={LABEL_CLASS}>Sesión Actual</p>
                  <div className="mt-1">
                    {user.sessionToken && user.sessionExpiresAt && new Date(user.sessionExpiresAt) > new Date() ? (
                      <div>
                        <p className="text-green-400">Activa</p>
                        <p className="text-xs text-white/60 mt-1">
                          Expira: {formatDate(user.sessionExpiresAt)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400">Sin sesión activa</p>
                    )}
                  </div>
                </div>
              </div>

              {user.sessionToken && (
                <div className={`${GLASS_CARD} p-4`}>
                  <p className={LABEL_CLASS}>Token de Sesión (Parcial)</p>
                  <p className="text-xs font-mono text-white/60 mt-2 break-all">
                    {user.sessionToken.substring(0, 20)}...
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className={STAT_CARD}>
                  <p className={LABEL_CLASS}>Sesiones</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {user._count?.userSessions || 0}
                  </p>
                </div>

                <div className={STAT_CARD}>
                  <p className={LABEL_CLASS}>Logs de Auditoría</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {user._count?.auditLogs || 0}
                  </p>
                </div>

                <div className={STAT_CARD}>
                  <p className={LABEL_CLASS}>Notificaciones</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {user._count?.notifications || 0}
                  </p>
                </div>
              </div>

              <div className={`${GLASS_CARD} p-4`}>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Línea de Tiempo
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                    <div>
                      <p className="text-sm text-white">Cuenta creada</p>
                      <p className="text-xs text-white/50">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>

                  {user.lastLoginAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                      <div>
                        <p className="text-sm text-white">Último acceso</p>
                        <p className="text-xs text-white/50">{formatDate(user.lastLoginAt)}</p>
                      </div>
                    </div>
                  )}

                  {user.updatedAt && user.updatedAt !== user.createdAt && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2" />
                      <div>
                        <p className="text-sm text-white">Última actualización</p>
                        <p className="text-xs text-white/50">{formatDate(user.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "employee" && user.employee && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>ID de Empleado</p>
                <p className="text-white mt-1">#{user.employee.id}</p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Nombre Completo</p>
                <p className="text-white mt-1">
                  {user.employee.firstName} {user.employee.lastName}
                </p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Área</p>
                <p className="text-white mt-1">{user.employee.area || "No asignada"}</p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Posición</p>
                <p className="text-white mt-1">{user.employee.position || "No especificada"}</p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Teléfono</p>
                <p className="text-white mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {user.employee.phone || "No configurado"}
                </p>
              </div>

              <div className={STAT_CARD}>
                <p className={LABEL_CLASS}>Estado</p>
                <p className={`mt-1 ${
                  user.employee.status === "ACTIVE" ? "text-green-400" : "text-red-400"
                }`}>
                  {user.employee.status === "ACTIVE" ? "Activo" : user.employee.status}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}