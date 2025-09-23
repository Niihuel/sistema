'use client'

import { useState } from 'react'
import { Crown, Shield, User, Star, Settings, Zap, Users, Eye, Edit, Trash2, Copy, MoreHorizontal, AlertTriangle } from 'lucide-react'
import { RoleBadge } from './RoleBadge'
import AnimatedContainer, { FadeInUp } from '@/components/animated-container'

interface Permission {
  id: number
  name: string
  displayName: string
  resource: string
  action: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isActive: boolean
}

interface Role {
  id: number
  name: string
  displayName: string
  description?: string
  color: string
  icon?: string
  level: number
  isSystem: boolean
  isActive: boolean
  priority: number
  maxUsers?: number
  parentRoleId?: number
  permissions?: Permission[]
  userCount?: number
  children?: Role[]
}

interface RoleCardProps {
  role: Role
  onEdit?: (role: Role) => void
  onDelete?: (role: Role) => void
  onDuplicate?: (role: Role) => void
  onManagePermissions?: (role: Role) => void
  onViewUsers?: (role: Role) => void
  dragHandleProps?: any
  isDragging?: boolean
  selectable?: boolean
  selected?: boolean
  onSelect?: (role: Role) => void
  compact?: boolean
  showActions?: boolean
  showHierarchy?: boolean
}

const RISK_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#7C2D12'
}

const ROLE_ICONS = {
  crown: Crown,
  shield: Shield,
  user: User,
  star: Star,
  settings: Settings,
  zap: Zap
}

export function RoleCard({
  role,
  onEdit,
  onDelete,
  onDuplicate,
  onManagePermissions,
  onViewUsers,
  dragHandleProps,
  isDragging = false,
  selectable = false,
  selected = false,
  onSelect,
  compact = false,
  showActions = true,
  showHierarchy = false
}: RoleCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const IconComponent = role.icon ? ROLE_ICONS[role.icon as keyof typeof ROLE_ICONS] : Shield

  // Calculate permission risk distribution
  const riskDistribution = role.permissions?.reduce((acc, perm) => {
    acc[perm.riskLevel] = (acc[perm.riskLevel] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const hasHighRiskPermissions = riskDistribution.HIGH > 0 || riskDistribution.CRITICAL > 0
  const totalPermissions = role.permissions?.length || 0

  return (
    <div
      className={`
        relative group rounded-xl border bg-white/5 backdrop-blur-sm
        transition-all duration-300 ease-out
        ${compact ? 'p-4' : 'p-6'}
        ${selectable ? 'cursor-pointer hover:bg-white/10' : ''}
        ${selected ? 'ring-2 ring-offset-2 ring-offset-black/20' : ''}
        ${isDragging ? 'scale-105 rotate-2 shadow-2xl z-10' : ''}
        ${isHovered || selected ? 'shadow-xl shadow-black/20 scale-[1.02]' : 'shadow-lg shadow-black/10'}
      `.trim()}
      style={{
        borderColor: selected ? role.color : 'rgb(255 255 255 / 0.1)',
        ringColor: selected ? role.color : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => selectable && onSelect?.(role)}
      {...dragHandleProps}
    >
      {/* Selection Indicator */}
      {selectable && (
        <div className="absolute top-3 left-3">
          <div className={`
            w-5 h-5 rounded border-2 flex items-center justify-center
            transition-all duration-200
            ${selected
              ? 'border-transparent text-white'
              : 'border-white/30 hover:border-white/50'
            }
          `} style={{ backgroundColor: selected ? role.color : 'transparent' }}>
            {selected && <Shield className="w-3 h-3" />}
          </div>
        </div>
      )}

      {/* System Role Indicator */}
      {role.isSystem && (
        <div className="absolute top-3 right-3">
          <div className="px-2 py-1 bg-blue-500/20 rounded text-blue-400 text-xs font-medium border border-blue-500/30">
            System
          </div>
        </div>
      )}

      {/* High Risk Warning */}
      {hasHighRiskPermissions && (
        <div className="absolute top-3 right-16">
          <div className="p-1 bg-red-500/20 rounded text-red-400" title="Contains high-risk permissions">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Role Icon */}
        <div
          className="relative w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 border-2"
          style={{
            backgroundColor: `${role.color}20`,
            borderColor: role.color
          }}
        >
          <IconComponent
            className="w-8 h-8"
            style={{ color: role.color }}
          />

          {/* Level Badge */}
          <div
            className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-black/20"
            style={{
              backgroundColor: role.color,
              color: parseInt(role.color.slice(1), 16) > 0x888888 ? '#000' : '#fff'
            }}
          >
            {role.level}
          </div>

          {/* Glow effect for high-level roles */}
          {role.level >= 90 && (
            <div
              className="absolute inset-0 rounded-full opacity-30 blur-sm -z-10"
              style={{
                backgroundColor: role.color,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
          )}
        </div>

        {/* Role Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-white font-bold truncate text-xl">
              {role.displayName}
            </h3>

            {!role.isActive && (
              <div className="px-2 py-1 bg-gray-500/20 rounded text-gray-400 text-xs">
                Inactive
              </div>
            )}
          </div>

          <div className="text-white/60 text-sm mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white/40">@{role.name}</span>
            </div>

            {role.description && (
              <p className="line-clamp-2 mb-2">{role.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{role.userCount || 0} users</span>
                {role.maxUsers && <span className="text-white/40">/ {role.maxUsers}</span>}
              </div>

              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>{totalPermissions} permissions</span>
              </div>
            </div>
          </div>

          {/* Permission Risk Distribution */}
          {totalPermissions > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs text-white/60">Risk Distribution</span>
              </div>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/10">
                {Object.entries(riskDistribution).map(([risk, count]) => (
                  <div
                    key={risk}
                    className="transition-all duration-300"
                    style={{
                      backgroundColor: RISK_COLORS[risk as keyof typeof RISK_COLORS],
                      width: `${(count / totalPermissions) * 100}%`
                    }}
                    title={`${risk}: ${count} permissions`}
                  />
                ))}
              </div>
              <div className="flex gap-2 mt-1 text-xs">
                {Object.entries(riskDistribution).map(([risk, count]) => (
                  <span key={risk} className="text-white/40">
                    {risk}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hierarchy */}
          {showHierarchy && role.children && role.children.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-white/60 mb-2">Child Roles</div>
              <div className="flex gap-1 flex-wrap">
                {role.children.slice(0, 3).map(child => (
                  <RoleBadge
                    key={child.id}
                    name={child.name}
                    displayName={child.displayName}
                    color={child.color}
                    icon={child.icon}
                    level={child.level}
                    size="xs"
                    showLevel={false}
                  />
                ))}
                {role.children.length > 3 && (
                  <div className="h-6 px-2 bg-white/5 rounded-full flex items-center text-xs text-white/60">
                    +{role.children.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className={`
              flex gap-2 opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              ${compact ? 'flex-wrap' : ''}
            `}>
              {onViewUsers && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewUsers(role)
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium border border-white/10 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Users
                </button>
              )}

              {onManagePermissions && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onManagePermissions(role)
                  }}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-md text-xs font-medium text-blue-400 border border-blue-500/30 transition-colors flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  Permissions
                </button>
              )}

              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(role)
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium border border-white/10 transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
              )}

              {/* More Actions Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDropdown(!showDropdown)
                  }}
                  className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium border border-white/10 transition-colors"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>

                {showDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-32 bg-black/90 border border-white/20 rounded-md shadow-xl z-20">
                    {onDuplicate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDuplicate(role)
                          setShowDropdown(false)
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-white/10 flex items-center gap-2"
                      >
                        <Copy className="w-3 h-3" />
                        Duplicate
                      </button>
                    )}

                    {onDelete && !role.isSystem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(role)
                          setShowDropdown(false)
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-red-500/20 text-red-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Grid layout for role cards
export function RoleCardGrid({
  roles,
  onEdit,
  onDelete,
  onDuplicate,
  onManagePermissions,
  onViewUsers,
  selectable = false,
  selectedRoles = [],
  onSelectionChange,
  compact = false,
  showHierarchy = false,
  loading = false,
  emptyMessage = "No roles found"
}: {
  roles: Role[]
  onEdit?: (role: Role) => void
  onDelete?: (role: Role) => void
  onDuplicate?: (role: Role) => void
  onManagePermissions?: (role: Role) => void
  onViewUsers?: (role: Role) => void
  selectable?: boolean
  selectedRoles?: Role[]
  onSelectionChange?: (roles: Role[]) => void
  compact?: boolean
  showHierarchy?: boolean
  loading?: boolean
  emptyMessage?: string
}) {
  const handleRoleSelect = (role: Role) => {
    if (!selectable || !onSelectionChange) return

    const isSelected = selectedRoles.some(r => r.id === role.id)
    if (isSelected) {
      onSelectionChange(selectedRoles.filter(r => r.id !== role.id))
    } else {
      onSelectionChange([...selectedRoles, role])
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-64 rounded-xl bg-white/5" />
          </div>
        ))}
      </div>
    )
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-white/30 mx-auto mb-4" />
        <p className="text-white/60">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <AnimatedContainer>
      <div className={`
        grid gap-6
        ${compact
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
        }
      `}>
        {roles.map((role, index) => (
          <FadeInUp key={role.id} delay={index * 0.05}>
            <RoleCard
              role={role}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onManagePermissions={onManagePermissions}
              onViewUsers={onViewUsers}
              selectable={selectable}
              selected={selectedRoles.some(r => r.id === role.id)}
              onSelect={handleRoleSelect}
              compact={compact}
              showHierarchy={showHierarchy}
            />
          </FadeInUp>
        ))}
      </div>
    </AnimatedContainer>
  )
}