'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Users, Shield, Crown, Zap } from 'lucide-react'
import { RoleBadge } from './RoleBadge'
import AnimatedContainer, { FadeInUp } from '@/components/animated-container'

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
  userCount?: number
  parentRoleId?: number
  children?: Role[]
}

interface RoleHierarchyProps {
  roles: Role[]
  onRoleSelect?: (role: Role) => void
  onRoleEdit?: (role: Role) => void
  selectedRoleId?: number
  interactive?: boolean
  showUserCounts?: boolean
  compact?: boolean
}

// Build hierarchical structure from flat roles array
function buildHierarchy(roles: Role[]): Role[] {
  const roleMap = new Map(roles.map(role => [role.id, { ...role, children: [] }]))
  const rootRoles: Role[] = []

  for (const role of roleMap.values()) {
    if (role.parentRoleId) {
      const parent = roleMap.get(role.parentRoleId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(role)
      } else {
        rootRoles.push(role)
      }
    } else {
      rootRoles.push(role)
    }
  }

  // Sort by level descending (highest level first)
  const sortRoles = (roles: Role[]) => {
    roles.sort((a, b) => b.level - a.level)
    roles.forEach(role => {
      if (role.children) {
        sortRoles(role.children)
      }
    })
  }

  sortRoles(rootRoles)
  return rootRoles
}

export function RoleHierarchy({
  roles,
  onRoleSelect,
  onRoleEdit,
  selectedRoleId,
  interactive = true,
  showUserCounts = true,
  compact = false
}: RoleHierarchyProps) {
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set())

  const hierarchicalRoles = useMemo(() => buildHierarchy(roles), [roles])

  const toggleExpanded = (roleId: number) => {
    const newExpanded = new Set(expandedRoles)
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId)
    } else {
      newExpanded.add(roleId)
    }
    setExpandedRoles(newExpanded)
  }

  const handleRoleClick = (role: Role, event: React.MouseEvent) => {
    event.stopPropagation()
    if (interactive && onRoleSelect) {
      onRoleSelect(role)
    }
  }

  const handleRoleEdit = (role: Role, event: React.MouseEvent) => {
    event.stopPropagation()
    if (onRoleEdit) {
      onRoleEdit(role)
    }
  }

  return (
    <AnimatedContainer>
      <div className="space-y-2">
        {hierarchicalRoles.map((role, index) => (
          <RoleHierarchyNode
            key={role.id}
            role={role}
            depth={0}
            isExpanded={expandedRoles.has(role.id)}
            onToggleExpanded={toggleExpanded}
            onRoleSelect={handleRoleClick}
            onRoleEdit={handleRoleEdit}
            selectedRoleId={selectedRoleId}
            interactive={interactive}
            showUserCounts={showUserCounts}
            compact={compact}
            animationDelay={index * 0.05}
          />
        ))}

        {hierarchicalRoles.length === 0 && (
          <FadeInUp>
            <div className="text-center py-12">
              <Crown className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No roles configured</p>
            </div>
          </FadeInUp>
        )}
      </div>
    </AnimatedContainer>
  )
}

interface RoleHierarchyNodeProps {
  role: Role
  depth: number
  isExpanded: boolean
  onToggleExpanded: (roleId: number) => void
  onRoleSelect: (role: Role, event: React.MouseEvent) => void
  onRoleEdit: (role: Role, event: React.MouseEvent) => void
  selectedRoleId?: number
  interactive: boolean
  showUserCounts: boolean
  compact: boolean
  animationDelay: number
}

function RoleHierarchyNode({
  role,
  depth,
  isExpanded,
  onToggleExpanded,
  onRoleSelect,
  onRoleEdit,
  selectedRoleId,
  interactive,
  showUserCounts,
  compact,
  animationDelay
}: RoleHierarchyNodeProps) {
  const hasChildren = role.children && role.children.length > 0
  const isSelected = selectedRoleId === role.id

  // Calculate indentation
  const indentStyle = {
    paddingLeft: `${depth * (compact ? 20 : 32)}px`
  }

  // Get appropriate icon based on role level
  const getLevelIcon = (level: number) => {
    if (level >= 90) return Crown
    if (level >= 70) return Shield
    if (level >= 50) return Zap
    return Users
  }

  const LevelIcon = getLevelIcon(role.level)

  return (
    <FadeInUp delay={animationDelay}>
      <div>
        {/* Role Node */}
        <div
          className={`
            group relative rounded-lg border backdrop-blur-sm transition-all duration-300
            ${isSelected
              ? 'bg-white/15 border-white/30 shadow-lg'
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }
            ${interactive ? 'cursor-pointer' : ''}
          `}
          style={{
            ...indentStyle,
            borderLeftColor: isSelected ? role.color : undefined,
            borderLeftWidth: isSelected ? '4px' : undefined
          }}
          onClick={(e) => onRoleSelect(role, e)}
        >
          <div className={`flex items-center gap-3 ${compact ? 'p-3' : 'p-4'}`}>
            {/* Expand/Collapse Button */}
            <div className="flex items-center w-6">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpanded(role.id)
                  }}
                  className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  )}
                </button>
              )}
            </div>

            {/* Role Icon and Level */}
            <div className="relative">
              <div
                className={`
                  ${compact ? 'w-10 h-10' : 'w-12 h-12'}
                  rounded-full flex items-center justify-center border-2
                `}
                style={{
                  backgroundColor: `${role.color}20`,
                  borderColor: role.color
                }}
              >
                <LevelIcon
                  className={`${compact ? 'w-5 h-5' : 'w-6 h-6'}`}
                  style={{ color: role.color }}
                />
              </div>

              {/* Level Badge */}
              <div
                className={`
                  absolute -bottom-1 -right-1
                  ${compact ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-xs'}
                  rounded-full flex items-center justify-center font-bold
                  border-2 border-black/20
                `}
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
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-semibold text-white truncate ${compact ? 'text-sm' : 'text-base'}`}>
                  {role.displayName}
                </h4>

                {/* Badges */}
                <div className="flex gap-1">
                  {role.isSystem && (
                    <div className="px-2 py-0.5 bg-blue-500/20 rounded text-blue-400 text-xs font-medium">
                      System
                    </div>
                  )}

                  {!role.isActive && (
                    <div className="px-2 py-0.5 bg-gray-500/20 rounded text-gray-400 text-xs font-medium">
                      Inactive
                    </div>
                  )}

                  {hasChildren && (
                    <div className="px-2 py-0.5 bg-purple-500/20 rounded text-purple-400 text-xs font-medium">
                      Parent
                    </div>
                  )}
                </div>
              </div>

              <div className={`text-white/60 ${compact ? 'text-xs' : 'text-sm'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-white/40">@{role.name}</span>
                  {showUserCounts && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {role.userCount || 0} users
                    </span>
                  )}
                </div>

                {role.description && !compact && (
                  <p className="line-clamp-1">{role.description}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {interactive && (
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => onRoleEdit(role, e)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium border border-white/10 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Connection Line to Children */}
          {hasChildren && isExpanded && (
            <div
              className="absolute left-0 top-full w-px bg-white/20"
              style={{
                left: `${depth * (compact ? 20 : 32) + (compact ? 36 : 42)}px`,
                height: '20px'
              }}
            />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {role.children!.map((child, index) => (
              <RoleHierarchyNode
                key={child.id}
                role={child}
                depth={depth + 1}
                isExpanded={expandedRoles.has(child.id)}
                onToggleExpanded={onToggleExpanded}
                onRoleSelect={onRoleSelect}
                onRoleEdit={onRoleEdit}
                selectedRoleId={selectedRoleId}
                interactive={interactive}
                showUserCounts={showUserCounts}
                compact={compact}
                animationDelay={(index + 1) * 0.05}
              />
            ))}
          </div>
        )}
      </div>
    </FadeInUp>
  )
}

// Flat list view for roles sorted by level
export function RoleLevelList({
  roles,
  onRoleSelect,
  selectedRoleId,
  compact = false
}: {
  roles: Role[]
  onRoleSelect?: (role: Role) => void
  selectedRoleId?: number
  compact?: boolean
}) {
  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => b.level - a.level)
  }, [roles])

  return (
    <AnimatedContainer>
      <div className="space-y-2">
        {sortedRoles.map((role, index) => (
          <FadeInUp key={role.id} delay={index * 0.03}>
            <div
              className={`
                group p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 cursor-pointer
                ${selectedRoleId === role.id
                  ? 'bg-white/15 border-white/30 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
              onClick={() => onRoleSelect?.(role)}
            >
              <div className="flex items-center gap-4">
                <RoleBadge
                  name={role.name}
                  displayName={role.displayName}
                  color={role.color}
                  icon={role.icon}
                  level={role.level}
                  size={compact ? 'sm' : 'md'}
                />

                <div className="flex-1">
                  {role.description && (
                    <p className="text-sm text-white/60">{role.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-white/50">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {role.userCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </FadeInUp>
        ))}

        {sortedRoles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/60">No roles available</p>
          </div>
        )}
      </div>
    </AnimatedContainer>
  )
}