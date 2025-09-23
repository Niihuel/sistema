"use client"

import { useState, useCallback, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { Search, Filter, Shield, AlertTriangle, Plus, Download, Upload, Settings, Eye, Lock } from 'lucide-react'
import { PermissionMatrix, CompactPermissionMatrix } from '@/components/roles/PermissionMatrix'
import { RoleBadgeList } from '@/components/roles/RoleBadge'
import AnimatedContainer, { FadeInUp } from '@/components/animated-container'
import Modal from '@/components/modal'
import Button from '@/components/button'
import { usePermissionsV2 } from '@/lib/hooks/usePermissionsV2'
import { useToast } from '@/lib/hooks/use-toast'

// Mock data - replace with real API calls
const mockPermissions = [
  {
    id: 1,
    name: 'system:admin',
    displayName: 'System Administration',
    description: 'Full system administrative access',
    category: 'SYSTEM',
    resource: 'system',
    action: 'admin',
    scope: 'ALL',
    riskLevel: 'CRITICAL' as const,
    requiresMFA: true,
    isSystem: true,
    isActive: true
  },
  {
    id: 2,
    name: 'users:view',
    displayName: 'View Users',
    description: 'View user profiles and basic information',
    category: 'USER',
    resource: 'users',
    action: 'view',
    scope: 'ALL',
    riskLevel: 'LOW' as const,
    requiresMFA: false,
    isSystem: false,
    isActive: true
  },
  {
    id: 3,
    name: 'users:edit',
    displayName: 'Edit Users',
    description: 'Modify user profiles and settings',
    category: 'USER',
    resource: 'users',
    action: 'edit',
    scope: 'ALL',
    riskLevel: 'MEDIUM' as const,
    requiresMFA: false,
    isSystem: false,
    isActive: true
  },
  {
    id: 4,
    name: 'users:delete',
    displayName: 'Delete Users',
    description: 'Permanently remove user accounts',
    category: 'USER',
    resource: 'users',
    action: 'delete',
    scope: 'ALL',
    riskLevel: 'HIGH' as const,
    requiresMFA: true,
    isSystem: false,
    isActive: true
  },
  {
    id: 5,
    name: 'roles:manage',
    displayName: 'Manage Roles',
    description: 'Create, edit, and delete user roles',
    category: 'SECURITY',
    resource: 'roles',
    action: 'manage',
    scope: 'ALL',
    riskLevel: 'HIGH' as const,
    requiresMFA: true,
    isSystem: false,
    isActive: true
  },
  {
    id: 6,
    name: 'data:export',
    displayName: 'Export Data',
    description: 'Export system data and reports',
    category: 'DATA',
    resource: 'data',
    action: 'export',
    scope: 'ALL',
    riskLevel: 'MEDIUM' as const,
    requiresMFA: false,
    isSystem: false,
    isActive: true
  }
]

const mockRoles = [
  {
    id: 1,
    name: 'SuperAdmin',
    displayName: 'Super Administrator',
    color: '#E74C3C',
    icon: 'crown',
    level: 100,
    isSystem: true,
    permissions: [
      { permission: mockPermissions[0], isActive: true }, // system:admin
      { permission: mockPermissions[1], isActive: true }, // users:view
      { permission: mockPermissions[2], isActive: true }, // users:edit
      { permission: mockPermissions[3], isActive: true }, // users:delete
      { permission: mockPermissions[4], isActive: true }, // roles:manage
      { permission: mockPermissions[5], isActive: true }  // data:export
    ]
  },
  {
    id: 2,
    name: 'Manager',
    displayName: 'Manager',
    color: '#3498DB',
    icon: 'shield',
    level: 75,
    isSystem: false,
    permissions: [
      { permission: mockPermissions[1], isActive: true }, // users:view
      { permission: mockPermissions[2], isActive: true }, // users:edit
      { permission: mockPermissions[5], isActive: true }  // data:export
    ]
  },
  {
    id: 3,
    name: 'User',
    displayName: 'Standard User',
    color: '#95A5A6',
    icon: 'user',
    level: 25,
    isSystem: false,
    permissions: [
      { permission: mockPermissions[1], isActive: true } // users:view
    ]
  }
]

export default function AdminPermissionsPage() {
  const { hasPermission } = usePermissionsV2()
  const { showSuccess, showError } = useToast()

  // State
  const [roles, setRoles] = useState(mockRoles)
  const [permissions, setPermissions] = useState(mockPermissions)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('')
  const [selectedScope, setSelectedScope] = useState('')
  const [showSystemPermissions, setShowSystemPermissions] = useState(true)
  const [viewMode, setViewMode] = useState<'matrix' | 'list' | 'categories'>('matrix')

  // Modals
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showRolePermissionModal, setShowRolePermissionModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editingPermission, setEditingPermission] = useState<typeof mockPermissions[0] | null>(null)
  const [selectedRole, setSelectedRole] = useState<typeof mockRoles[0] | null>(null)

  // Debounced search
  const [debouncedSearch] = useDebounce(searchTerm, 300)

  // Permission checks
  const canViewPermissions = hasPermission('permissions', 'view')
  const canEditPermissions = hasPermission('permissions', 'edit')
  const canCreatePermissions = hasPermission('permissions', 'create')
  const canDeletePermissions = hasPermission('permissions', 'delete')
  const canManageRolePermissions = hasPermission('roles', 'manage')

  // Get unique values for filters
  const categories = useMemo(() => [...new Set(permissions.map(p => p.category))], [permissions])
  const riskLevels = useMemo(() => [...new Set(permissions.map(p => p.riskLevel))], [permissions])
  const scopes = useMemo(() => [...new Set(permissions.map(p => p.scope))], [permissions])

  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission => {
      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase()
        const matchesSearch =
          permission.name.toLowerCase().includes(searchLower) ||
          permission.displayName.toLowerCase().includes(searchLower) ||
          permission.resource.toLowerCase().includes(searchLower) ||
          permission.action.toLowerCase().includes(searchLower) ||
          permission.description?.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false
      }

      // System permissions filter
      if (!showSystemPermissions && permission.isSystem) return false

      // Category filter
      if (selectedCategory && permission.category !== selectedCategory) return false

      // Risk level filter
      if (selectedRiskLevel && permission.riskLevel !== selectedRiskLevel) return false

      // Scope filter
      if (selectedScope && permission.scope !== selectedScope) return false

      return true
    })
  }, [permissions, debouncedSearch, showSystemPermissions, selectedCategory, selectedRiskLevel, selectedScope])

  // Permission statistics
  const permissionStats = useMemo(() => {
    const totalGrants = roles.reduce((sum, role) => sum + (role.permissions?.length || 0), 0)
    const highRiskPermissions = permissions.filter(p => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length
    const mfaRequired = permissions.filter(p => p.requiresMFA).length

    return {
      total: permissions.length,
      active: permissions.filter(p => p.isActive).length,
      system: permissions.filter(p => p.isSystem).length,
      highRisk: highRiskPermissions,
      mfaRequired,
      totalGrants
    }
  }, [permissions, roles])

  // Handlers
  const handlePermissionToggle = useCallback((roleId: number, permissionId: number, granted: boolean) => {
    if (!canManageRolePermissions) {
      showError('You do not have permission to manage role permissions')
      return
    }

    setRoles(prev => prev.map(role => {
      if (role.id !== roleId) return role

      const permissions = role.permissions ? [...role.permissions] : []
      const permissionIndex = permissions.findIndex(rp => rp.permission.id === permissionId)

      if (granted) {
        if (permissionIndex === -1) {
          const permission = mockPermissions.find(p => p.id === permissionId)
          if (permission) {
            permissions.push({ permission, isActive: true })
          }
        } else {
          permissions[permissionIndex].isActive = true
        }
      } else {
        if (permissionIndex !== -1) {
          permissions[permissionIndex].isActive = false
        }
      }

      return { ...role, permissions }
    }))

    showSuccess(`Permission ${granted ? 'granted' : 'revoked'} successfully`)
  }, [canManageRolePermissions, showSuccess, showError])

  const handleBulkPermissionChange = useCallback((roleIds: number[], permissionIds: number[], granted: boolean) => {
    roleIds.forEach(roleId => {
      permissionIds.forEach(permissionId => {
        handlePermissionToggle(roleId, permissionId, granted)
      })
    })
  }, [handlePermissionToggle])

  const handlePermissionEdit = useCallback((permission: typeof mockPermissions[0]) => {
    setEditingPermission(permission)
    setShowPermissionModal(true)
  }, [])

  const handleRolePermissionManage = useCallback((role: typeof mockRoles[0]) => {
    setSelectedRole(role)
    setShowRolePermissionModal(true)
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedRiskLevel('')
    setSelectedScope('')
    setShowSystemPermissions(true)
  }, [])

  if (!canViewPermissions) {
    return (
      <AnimatedContainer className="text-white px-2 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <div className="text-white/60 mb-4">You do not have permission to view permissions</div>
            <div className="text-white/40 text-sm">Contact your administrator for access</div>
          </div>
        </div>
      </AnimatedContainer>
    )
  }

  return (
    <AnimatedContainer className="text-white px-2 sm:px-0 space-y-6">
      {/* Header */}
      <FadeInUp delay={0.05}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Permission Management</h1>
            <p className="text-white/70">Manage system permissions and role assignments</p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-white/10 p-1 bg-white/5">
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'matrix' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                Matrix
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('categories')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                  viewMode === 'categories' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                }`}
              >
                Categories
              </button>
            </div>

            {canCreatePermissions && (
              <Button onClick={() => setShowPermissionModal(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Permission
              </Button>
            )}
          </div>
        </div>
      </FadeInUp>

      {/* Stats Cards */}
      <FadeInUp delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="text-2xl font-bold text-white">{permissionStats.total}</div>
            <div className="text-white/60 text-sm">Total Permissions</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="text-2xl font-bold text-green-400">{permissionStats.active}</div>
            <div className="text-white/60 text-sm">Active</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="text-2xl font-bold text-blue-400">{permissionStats.system}</div>
            <div className="text-white/60 text-sm">System</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="text-2xl font-bold text-red-400">{permissionStats.highRisk}</div>
            <div className="text-white/60 text-sm">High Risk</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="text-2xl font-bold text-yellow-400">{permissionStats.mfaRequired}</div>
            <div className="text-white/60 text-sm">MFA Required</div>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="text-2xl font-bold text-purple-400">{permissionStats.totalGrants}</div>
            <div className="text-white/60 text-sm">Total Grants</div>
          </div>
        </div>
      </FadeInUp>

      {/* Main Content */}
      <FadeInUp delay={0.15}>
        {viewMode === 'matrix' && (
          <PermissionMatrix
            roles={roles}
            permissions={filteredPermissions}
            onPermissionToggle={handlePermissionToggle}
            onBulkPermissionChange={handleBulkPermissionChange}
            readOnly={!canManageRolePermissions}
            showRiskIndicators={true}
            showCategories={true}
          />
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                </div>

                {/* Filters */}
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

                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input
                    type="checkbox"
                    checked={showSystemPermissions}
                    onChange={(e) => setShowSystemPermissions(e.target.checked)}
                    className="rounded border-white/20 bg-white/10"
                  />
                  Show system permissions
                </label>

                <Button onClick={clearFilters} variant="ghost" small>
                  Clear
                </Button>
              </div>
            </div>

            {/* Permissions List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPermissions.map((permission) => (
                <div key={permission.id} className="p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded ${
                          permission.riskLevel === 'CRITICAL' ? 'bg-red-500' :
                          permission.riskLevel === 'HIGH' ? 'bg-orange-500' :
                          permission.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                      <span className="text-xs text-white/60">{permission.category}</span>
                    </div>
                    <div className="flex gap-1">
                      {permission.requiresMFA && (
                        <div className="p-1 bg-yellow-500/20 rounded text-yellow-400" title="MFA Required">
                          <Shield className="w-3 h-3" />
                        </div>
                      )}
                      {permission.isSystem && (
                        <div className="p-1 bg-blue-500/20 rounded text-blue-400" title="System Permission">
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  <h4 className="text-white font-semibold mb-1">{permission.displayName}</h4>
                  <p className="text-xs text-white/60 mb-2 font-mono">{permission.name}</p>

                  {permission.description && (
                    <p className="text-sm text-white/50 mb-3 line-clamp-2">{permission.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/40">
                      {permission.resource}:{permission.action}
                    </div>
                    {canEditPermissions && (
                      <button
                        onClick={() => handlePermissionEdit(permission)}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'categories' && (
          <div className="space-y-6">
            {categories.map(category => {
              const categoryPermissions = filteredPermissions.filter(p => p.category === category)
              return (
                <div key={category} className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">{category}</h3>
                    <span className="text-sm text-white/60">{categoryPermissions.length} permissions</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryPermissions.map(permission => (
                      <div key={permission.id} className="p-3 rounded-lg border border-white/10 bg-black/20">
                        <div className="text-white font-medium text-sm">{permission.displayName}</div>
                        <div className="text-xs text-white/60 font-mono mt-1">{permission.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </FadeInUp>

      {/* Permission Edit Modal */}
      <Modal
        open={showPermissionModal}
        onClose={() => {
          setShowPermissionModal(false)
          setEditingPermission(null)
        }}
        title={editingPermission ? 'Edit Permission' : 'Create Permission'}
      >
        <div className="space-y-4">
          <p className="text-white/60">Permission creation/editing form would go here...</p>
        </div>
      </Modal>

      {/* Role Permission Management Modal */}
      <Modal
        open={showRolePermissionModal}
        onClose={() => {
          setShowRolePermissionModal(false)
          setSelectedRole(null)
        }}
        title={`Manage Permissions - ${selectedRole?.displayName}`}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {selectedRole && (
            <CompactPermissionMatrix
              role={selectedRole}
              permissions={permissions}
              onPermissionToggle={(permissionId, granted) =>
                handlePermissionToggle(selectedRole.id, permissionId, granted)
              }
              readOnly={!canManageRolePermissions}
            />
          )}
        </div>
      </Modal>
    </AnimatedContainer>
  )
}