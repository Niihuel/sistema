'use client'

import { useState, useMemo } from 'react'
import { Check, X, AlertTriangle, Shield, Lock, Eye, EyeOff, Search, Filter } from 'lucide-react'
import { RoleBadge } from './RoleBadge'
import AnimatedContainer, { FadeInUp } from '@/components/animated-container'

interface Permission {
  id: number
  name: string
  displayName: string
  description?: string
  category: string
  resource: string
  action: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  requiresMFA: boolean
  isSystem: boolean
  isActive: boolean
}

interface Role {
  id: number
  name: string
  displayName: string
  color: string
  icon?: string
  level: number
  isSystem: boolean
  permissions: Array<{
    permission: Permission
    isActive: boolean
    expiresAt?: string
  }>
}

interface PermissionMatrixProps {
  roles: Role[]
  permissions: Permission[]
  onPermissionToggle: (roleId: number, permissionId: number, granted: boolean) => void
  onBulkPermissionChange: (roleIds: number[], permissionIds: number[], granted: boolean) => void
  readOnly?: boolean
  compact?: boolean
  showRiskIndicators?: boolean
  showCategories?: boolean
}

const RISK_COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#7C2D12'
}

const CATEGORY_COLORS = {
  SYSTEM: '#8B5CF6',
  USER: '#3B82F6',
  DATA: '#10B981',
  SECURITY: '#EF4444',
  INTEGRATION: '#F59E0B'
}

export function PermissionMatrix({
  roles,
  permissions,
  onPermissionToggle,
  onBulkPermissionChange,
  readOnly = false,
  compact = false,
  showRiskIndicators = true,
  showCategories = true
}: PermissionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('')
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [showSystemPermissions, setShowSystemPermissions] = useState(true)

  // Filter permissions based on search and filters
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      if (!showSystemPermissions && permission.isSystem) return false
      if (selectedCategory && permission.category !== selectedCategory) return false
      if (selectedRiskLevel && permission.riskLevel !== selectedRiskLevel) return false
      if (searchTerm && !permission.displayName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !permission.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !permission.resource.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
  }, [permissions, searchTerm, selectedCategory, selectedRiskLevel, showSystemPermissions])

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    if (!showCategories) return { 'All Permissions': filteredPermissions }

    return filteredPermissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = []
      }
      acc[permission.category].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)
  }, [filteredPermissions, showCategories])

  // Get unique categories and risk levels for filters
  const categories = useMemo(() => [...new Set(permissions.map(p => p.category))], [permissions])
  const riskLevels = useMemo(() => [...new Set(permissions.map(p => p.riskLevel))], [permissions])

  // Check if role has permission
  const hasPermission = (role: Role, permissionId: number) => {
    return role.permissions.some(rp => rp.permission.id === permissionId && rp.isActive)
  }

  // Handle permission toggle
  const handlePermissionToggle = (roleId: number, permissionId: number) => {
    if (readOnly) return

    const role = roles.find(r => r.id === roleId)
    if (!role) return

    const hasIt = hasPermission(role, permissionId)
    onPermissionToggle(roleId, permissionId, !hasIt)
  }

  // Handle bulk operations
  const handleBulkGrant = () => {
    if (selectedRoles.length === 0 || selectedPermissions.length === 0) return
    onBulkPermissionChange(selectedRoles, selectedPermissions, true)
    setSelectedRoles([])
    setSelectedPermissions([])
  }

  const handleBulkRevoke = () => {
    if (selectedRoles.length === 0 || selectedPermissions.length === 0) return
    onBulkPermissionChange(selectedRoles, selectedPermissions, false)
    setSelectedRoles([])
    setSelectedPermissions([])
  }

  return (
    <AnimatedContainer className="space-y-6">
      {/* Controls */}
      <FadeInUp delay={0.1}>
        <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-md text-white placeholder-white/40 w-64"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-black/30 border border-white/10 rounded-md text-white"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Risk Level Filter */}
              <select
                value={selectedRiskLevel}
                onChange={(e) => setSelectedRiskLevel(e.target.value)}
                className="px-3 py-2 bg-black/30 border border-white/10 rounded-md text-white"
              >
                <option value="">All Risk Levels</option>
                {riskLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>

              {/* Show System Permissions Toggle */}
              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={showSystemPermissions}
                  onChange={(e) => setShowSystemPermissions(e.target.checked)}
                  className="rounded border-white/20 bg-white/10"
                />
                Show system permissions
              </label>
            </div>

            {/* Bulk Actions */}
            {!readOnly && (selectedRoles.length > 0 && selectedPermissions.length > 0) && (
              <div className="flex gap-2">
                <button
                  onClick={handleBulkGrant}
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-md text-sm font-medium transition-colors"
                >
                  Grant Selected ({selectedRoles.length} roles, {selectedPermissions.length} perms)
                </button>
                <button
                  onClick={handleBulkRevoke}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-md text-sm font-medium transition-colors"
                >
                  Revoke Selected
                </button>
              </div>
            )}
          </div>
        </div>
      </FadeInUp>

      {/* Matrix */}
      <FadeInUp delay={0.2}>
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header */}
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="sticky left-0 bg-white/5 z-10 px-4 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-white/70 font-medium">Permissions</span>
                      <Filter className="w-4 h-4 text-white/40" />
                    </div>
                  </th>
                  {roles.map(role => (
                    <th key={role.id} className="px-3 py-4 text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className={`
                            cursor-pointer rounded-lg p-2 transition-colors
                            ${selectedRoles.includes(role.id)
                              ? 'bg-white/20 ring-2'
                              : 'hover:bg-white/10'
                            }
                          `}
                          style={{
                            ringColor: selectedRoles.includes(role.id) ? role.color : undefined
                          }}
                          onClick={() => {
                            if (selectedRoles.includes(role.id)) {
                              setSelectedRoles(selectedRoles.filter(id => id !== role.id))
                            } else {
                              setSelectedRoles([...selectedRoles, role.id])
                            }
                          }}
                        >
                          <RoleBadge
                            name={role.name}
                            displayName={role.displayName}
                            color={role.color}
                            icon={role.icon}
                            level={role.level}
                            size="sm"
                            showName={!compact}
                          />
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <React.Fragment key={category}>
                    {/* Category Header */}
                    {showCategories && Object.keys(groupedPermissions).length > 1 && (
                      <tr className="bg-white/5">
                        <td colSpan={roles.length + 1} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6B7280' }}
                            />
                            <span className="font-medium text-white/80">{category}</span>
                            <span className="text-xs text-white/50">({categoryPermissions.length} permissions)</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Permission Rows */}
                    {categoryPermissions.map((permission, index) => (
                      <tr key={permission.id} className={`border-t border-white/10 hover:bg-white/5 ${index % 2 === 0 ? 'bg-black/10' : ''}`}>
                        <td className="sticky left-0 bg-inherit z-10 px-4 py-3">
                          <div
                            className={`
                              flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors
                              ${selectedPermissions.includes(permission.id)
                                ? 'bg-white/20'
                                : 'hover:bg-white/10'
                              }
                            `}
                            onClick={() => {
                              if (selectedPermissions.includes(permission.id)) {
                                setSelectedPermissions(selectedPermissions.filter(id => id !== permission.id))
                              } else {
                                setSelectedPermissions([...selectedPermissions, permission.id])
                              }
                            }}
                          >
                            {/* Risk Indicator */}
                            {showRiskIndicators && (
                              <div
                                className="w-2 h-8 rounded-full"
                                style={{ backgroundColor: RISK_COLORS[permission.riskLevel] }}
                                title={`Risk Level: ${permission.riskLevel}`}
                              />
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white truncate">
                                  {permission.displayName}
                                </span>

                                {/* Badges */}
                                <div className="flex gap-1">
                                  {permission.requiresMFA && (
                                    <div className="p-1 bg-yellow-500/20 rounded text-yellow-400" title="Requires MFA">
                                      <Shield className="w-3 h-3" />
                                    </div>
                                  )}

                                  {permission.isSystem && (
                                    <div className="p-1 bg-blue-500/20 rounded text-blue-400" title="System Permission">
                                      <Lock className="w-3 h-3" />
                                    </div>
                                  )}

                                  {permission.riskLevel === 'CRITICAL' && (
                                    <div className="p-1 bg-red-500/20 rounded text-red-400" title="Critical Risk">
                                      <AlertTriangle className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-xs text-white/50">
                                <span className="font-mono">{permission.resource}:{permission.action}</span>
                                {permission.description && (
                                  <span className="ml-2">{permission.description}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Permission Cells */}
                        {roles.map(role => {
                          const granted = hasPermission(role, permission.id)
                          const canModify = !readOnly && !role.isSystem && !permission.isSystem

                          return (
                            <td key={`${role.id}-${permission.id}`} className="px-3 py-3 text-center">
                              <button
                                onClick={() => canModify && handlePermissionToggle(role.id, permission.id)}
                                disabled={!canModify}
                                className={`
                                  w-8 h-8 rounded-full flex items-center justify-center transition-all
                                  ${granted
                                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                                    : 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                                  }
                                  ${canModify
                                    ? 'hover:scale-110 cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'
                                  }
                                `}
                                title={`${granted ? 'Granted' : 'Denied'} ${canModify ? '(Click to toggle)' : '(Read-only)'}`}
                              >
                                {granted ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {filteredPermissions.length === 0 && (
                  <tr>
                    <td colSpan={roles.length + 1} className="px-4 py-12 text-center text-white/50">
                      <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>No permissions found matching your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </FadeInUp>

      {/* Legend */}
      {showRiskIndicators && (
        <FadeInUp delay={0.3}>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <h4 className="text-white/80 font-medium mb-3">Risk Level Legend</h4>
            <div className="flex flex-wrap gap-4">
              {Object.entries(RISK_COLORS).map(([level, color]) => (
                <div key={level} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                  <span className="text-sm text-white/60 capitalize">{level.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeInUp>
      )}
    </AnimatedContainer>
  )
}

// Simplified permission matrix for smaller views
export function CompactPermissionMatrix({
  role,
  permissions,
  onPermissionToggle,
  readOnly = false
}: {
  role: Role
  permissions: Permission[]
  onPermissionToggle: (permissionId: number, granted: boolean) => void
  readOnly?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPermissions = permissions.filter(permission =>
    permission.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const hasPermission = (permissionId: number) => {
    return role.permissions.some(rp => rp.permission.id === permissionId && rp.isActive)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search permissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-md text-white placeholder-white/40"
        />
      </div>

      {/* Permissions List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredPermissions.map(permission => {
          const granted = hasPermission(permission.id)

          return (
            <div
              key={permission.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white">{permission.displayName}</span>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: RISK_COLORS[permission.riskLevel] }}
                  />
                </div>
                <div className="text-xs text-white/50 font-mono">
                  {permission.resource}:{permission.action}
                </div>
              </div>

              <button
                onClick={() => !readOnly && onPermissionToggle(permission.id, !granted)}
                disabled={readOnly}
                className={`
                  w-12 h-6 rounded-full flex items-center transition-all
                  ${granted ? 'bg-green-500 justify-end' : 'bg-red-500 justify-start'}
                  ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                `}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-lg transition-transform" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}