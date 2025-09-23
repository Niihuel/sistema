"use client"

import { useState } from "react"
import { RoleBadgeGroup } from "./RoleBadge"
import Button from "../button"

interface User {
  id: string | number
  username: string
  email?: string
  avatar?: string
  status?: "online" | "offline" | "away" | "busy"
  roles: Array<{
    id: string | number
    name: string
    displayName?: string
    color: string
    icon?: string
    level?: number
  }>
  lastActive?: Date | string
  permissions?: number
}

interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  onManageRoles?: (user: User) => void
  onViewPermissions?: (user: User) => void
  selectable?: boolean
  selected?: boolean
  onSelectionChange?: (selected: boolean) => void
  className?: string
}

export function UserCard({
  user,
  onEdit,
  onManageRoles,
  onViewPermissions,
  selectable = false,
  selected = false,
  onSelectionChange,
  className = ""
}: UserCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-500",
    away: "bg-yellow-500",
    busy: "bg-red-500"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getHighestRole = () => {
    if (!user.roles.length) return null
    return user.roles.reduce((highest, role) =>
      (role.level || 0) > (highest.level || 0) ? role : highest
    )
  }

  const highestRole = getHighestRole()

  return (
    <div
      className={`
        relative p-6 rounded-xl border transition-all duration-300
        ${isHovered ? "scale-105 shadow-2xl" : "shadow-lg"}
        ${selected ? "border-blue-500 bg-blue-500/10" : "border-white/10 bg-white/5"}
        backdrop-blur-sm ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {selectable && (
        <div className="absolute top-4 right-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelectionChange?.(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
          />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
            style={{
              backgroundColor: highestRole?.color || "#95A5A6",
              boxShadow: `0 0 20px ${highestRole?.color}40`
            }}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full" />
            ) : (
              getInitials(user.username)
            )}
          </div>
          {user.status && (
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-900 ${statusColors[user.status]}`} />
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {user.username}
          </h3>
          {user.email && (
            <p className="text-sm text-gray-400 mb-3">{user.email}</p>
          )}

          {/* Roles */}
          <RoleBadgeGroup roles={user.roles} size="sm" maxDisplay={3} />

          {/* Stats */}
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            {user.permissions !== undefined && (
              <span>{user.permissions} permisos</span>
            )}
            {user.lastActive && (
              <span>{new Date(user.lastActive).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onManageRoles || onViewPermissions) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
          {onViewPermissions && (
            <Button
              onClick={() => onViewPermissions(user)}
              variant="ghost"
              small
              className="flex-1"
            >
              Permisos
            </Button>
          )}
          {onManageRoles && (
            <Button
              onClick={() => onManageRoles(user)}
              variant="ghost"
              small
              className="flex-1"
            >
              Roles
            </Button>
          )}
          {onEdit && (
            <Button
              onClick={() => onEdit(user)}
              variant="ghost"
              small
              className="flex-1"
            >
              Editar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

interface UserCardGridProps {
  users: User[]
  onEdit?: (user: User) => void
  onManageRoles?: (user: User) => void
  onViewPermissions?: (user: User) => void
  selectable?: boolean
  selectedUsers?: Set<string | number>
  onSelectionChange?: (userId: string | number, selected: boolean) => void
  className?: string
}

export function UserCardGrid({
  users,
  onEdit,
  onManageRoles,
  onViewPermissions,
  selectable = false,
  selectedUsers = new Set(),
  onSelectionChange,
  className = ""
}: UserCardGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={onEdit}
          onManageRoles={onManageRoles}
          onViewPermissions={onViewPermissions}
          selectable={selectable}
          selected={selectedUsers.has(user.id)}
          onSelectionChange={(selected) => onSelectionChange?.(user.id, selected)}
        />
      ))}
    </div>
  )
}