"use client"

import { ReactNode } from "react"
import {
  Crown,
  Shield,
  Briefcase,
  Wrench,
  User,
  UserCheck,
  Settings,
  Database,
  Monitor,
  Key,
  Lock,
  Unlock,
  type LucideIcon
} from "lucide-react"

// Mapa de iconos disponibles para roles
export const roleIcons: Record<string, LucideIcon> = {
  crown: Crown,
  shield: Shield,
  briefcase: Briefcase,
  wrench: Wrench,
  user: User,
  userCheck: UserCheck,
  settings: Settings,
  database: Database,
  monitor: Monitor,
  key: Key,
  lock: Lock,
  unlock: Unlock
}

interface RoleBadgeProps {
  name: string
  displayName?: string
  color: string
  icon?: string | LucideIcon
  level?: number
  size?: "sm" | "md" | "lg"
  showLevel?: boolean
  className?: string
}

export function RoleBadge({
  name,
  displayName,
  color,
  icon = "user",
  level = 0,
  size = "md",
  showLevel = false,
  className = ""
}: RoleBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  }

  const levelColors = {
    100: "ring-2 ring-red-500/50", // SuperAdmin
    90: "ring-2 ring-orange-500/50", // Admin
    70: "ring-2 ring-blue-500/50", // Manager
    50: "ring-2 ring-green-500/50", // Technician
    30: "ring-2 ring-gray-500/50", // Employee
    10: "ring-1 ring-gray-600/50" // Guest
  }

  const getLevelRing = () => {
    if (level >= 100) return levelColors[100]
    if (level >= 90) return levelColors[90]
    if (level >= 70) return levelColors[70]
    if (level >= 50) return levelColors[50]
    if (level >= 30) return levelColors[30]
    return levelColors[10]
  }

  // Determinar el icono a usar
  let IconComponent: LucideIcon = User
  if (typeof icon === "string" && icon in roleIcons) {
    IconComponent = roleIcons[icon]
  } else if (typeof icon === "function") {
    IconComponent = icon as LucideIcon
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${sizeClasses[size]}
        ${showLevel ? getLevelRing() : ""}
        ${className}
        transition-all duration-200 hover:scale-105
      `}
      style={{
        backgroundColor: color + "20",
        color: color,
        borderColor: color + "40",
        borderWidth: "1px"
      }}
    >
      <IconComponent size={iconSizes[size]} className="flex-shrink-0" />
      <span>{displayName || name}</span>
      {showLevel && (
        <span className="opacity-60 text-xs">Lv.{level}</span>
      )}
    </div>
  )
}

// Preset role badges
export const SuperAdminBadge = (props: Partial<RoleBadgeProps>) => (
  <RoleBadge
    name="SuperAdmin"
    displayName="Super Admin"
    color="#E74C3C"
    icon="crown"
    level={100}
    {...props}
  />
)

export const AdminBadge = (props: Partial<RoleBadgeProps>) => (
  <RoleBadge
    name="Admin"
    displayName="Administrador"
    color="#F39C12"
    icon="shield"
    level={90}
    {...props}
  />
)

export const ManagerBadge = (props: Partial<RoleBadgeProps>) => (
  <RoleBadge
    name="Manager"
    displayName="Gerente"
    color="#3498DB"
    icon="briefcase"
    level={70}
    {...props}
  />
)

export const TechnicianBadge = (props: Partial<RoleBadgeProps>) => (
  <RoleBadge
    name="Technician"
    displayName="Técnico"
    color="#2ECC71"
    icon="wrench"
    level={50}
    {...props}
  />
)

export const EmployeeBadge = (props: Partial<RoleBadgeProps>) => (
  <RoleBadge
    name="Employee"
    displayName="Empleado"
    color="#95A5A6"
    icon="user"
    level={30}
    {...props}
  />
)

export const GuestBadge = (props: Partial<RoleBadgeProps>) => (
  <RoleBadge
    name="Guest"
    displayName="Invitado"
    color="#7F8C8D"
    icon="userCheck"
    level={10}
    {...props}
  />
)

interface RoleBadgeGroupProps {
  roles: Array<{
    id: string | number
    name: string
    displayName?: string
    color: string
    icon?: string
    level?: number
  }>
  size?: "sm" | "md" | "lg"
  maxDisplay?: number
  className?: string
}

export function RoleBadgeGroup({
  roles,
  size = "sm",
  maxDisplay = 3,
  className = ""
}: RoleBadgeGroupProps) {
  const displayedRoles = roles.slice(0, maxDisplay)
  const remainingCount = roles.length - maxDisplay

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {displayedRoles.map((role) => (
        <RoleBadge
          key={role.id}
          name={role.name}
          displayName={role.displayName}
          color={role.color}
          icon={role.icon}
          level={role.level}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-400 px-2">
          +{remainingCount} más
        </span>
      )}
    </div>
  )
}