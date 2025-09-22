/**
 * Discord-like Role Management Service
 * Provides comprehensive role and permission management with hierarchy support
 */

import { PrismaClient } from '@prisma/client'
import type {
  Role,
  Permission,
  UserRole,
  RolePermission,
  UserPermission
} from '@prisma/client'

interface RoleWithPermissions extends Role {
  rolePermissions: (RolePermission & {
    permission: Permission
  })[]
}

interface UserRoleWithDetails extends UserRole {
  role: RoleWithPermissions
}

interface EffectivePermission {
  resource: string
  action: string
  source: 'role' | 'override' | 'direct'
  granted: boolean
  roleId?: number
  expiresAt?: Date | null
}

interface RoleCreateInput {
  name: string
  displayName: string
  description?: string
  color?: string
  icon?: string
  permissions?: string[]
  level?: number
  parentRoleId?: number
  isDefault?: boolean
}

interface RoleUpdateInput {
  displayName?: string
  description?: string
  color?: string
  icon?: string
  permissions?: string[]
  level?: number
  isActive?: boolean
}

interface PermissionCheck {
  resource: string
  action: string
  scope?: string
}

export class RoleManagementService {
  private prisma: PrismaClient
  private cacheStore: Map<string, { data: any; expires: number }> = new Map()
  private CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  /**
   * Create a new role with permissions
   */
  async createRole(data: RoleCreateInput): Promise<RoleWithPermissions> {
    // Check if role name already exists
    const existing = await this.prisma.role.findFirst({
      where: { name: data.name }
    })

    if (existing) {
      throw new Error(`Role with name ${data.name} already exists`)
    }

    // Calculate level if not provided
    const level = data.level ?? await this.getNextLevel()

    // Create role with permissions in a transaction
    return await this.prisma.$transaction(async (tx) => {
      // Create the role
      const role = await tx.role.create({
        data: {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          color: data.color || '#95A5A6',
          icon: data.icon,
          level,
          parentRoleId: data.parentRoleId,
          isActive: true,
          isSystem: false
        }
      })

      // Add permissions if provided
      if (data.permissions && data.permissions.length > 0) {
        const permissionRecords = await this.preparePermissions(data.permissions, tx)

        await tx.rolePermission.createMany({
          data: permissionRecords.map(p => ({
            roleId: role.id,
            permissionId: p.id
          }))
        })
      }

      // Fetch and return complete role
      return await this.getRoleWithPermissions(role.id, tx)
    })
  }

  /**
   * Update an existing role
   */
  async updateRole(roleId: number, updates: RoleUpdateInput): Promise<RoleWithPermissions> {
    const existingRole = await this.prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!existingRole) {
      throw new Error('Role not found')
    }

    if (existingRole.isSystem) {
      throw new Error('Cannot modify system roles')
    }

    return await this.prisma.$transaction(async (tx) => {
      // Update role data
      const { permissions, ...roleData } = updates

      await tx.role.update({
        where: { id: roleId },
        data: roleData
      })

      // Update permissions if provided
      if (permissions !== undefined) {
        await this.syncRolePermissions(roleId, permissions, tx)
      }

      // Clear cache for affected users
      await this.invalidateRoleCache(roleId)

      return await this.getRoleWithPermissions(roleId, tx)
    })
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: number): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { userRoles: true }
    })

    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system roles')
    }

    if (role.userRoles.length > 0) {
      throw new Error(`Cannot delete role with ${role.userRoles.length} active users`)
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        deletedAt: new Date(),
        isActive: false
      }
    })

    await this.invalidateRoleCache(roleId)
  }

  /**
   * Clone an existing role
   */
  async cloneRole(sourceRoleId: number, newName: string): Promise<RoleWithPermissions> {
    const source = await this.getRoleWithPermissions(sourceRoleId)

    if (!source) {
      throw new Error('Source role not found')
    }

    const permissions = source.rolePermissions
      .filter(rp => rp.isActive)
      .map(rp => `${rp.permission.resource}:${rp.permission.action}`)

    return await this.createRole({
      name: newName,
      displayName: `${source.displayName} (Copy)`,
      description: source.description || undefined,
      color: source.color || undefined,
      icon: source.icon || undefined,
      permissions,
      level: source.level
    })
  }

  // ============================================================================
  // ROLE HIERARCHY
  // ============================================================================

  /**
   * Get role hierarchy for display
   */
  async getRoleHierarchy(): Promise<RoleWithPermissions[]> {
    const cacheKey = 'role_hierarchy'
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    const roles = await this.prisma.role.findMany({
      where: {
        isActive: true,
        deletedAt: null
      },
      orderBy: { level: 'desc' },
      include: {
        rolePermissions: {
          where: { isActive: true },
          include: { permission: true }
        },
        userRoles: {
          select: { userId: true }
        }
      }
    })

    this.setCache(cacheKey, roles)
    return roles
  }

  /**
   * Reorder roles in hierarchy
   */
  async reorderRoles(orderedRoleIds: number[]): Promise<void> {
    const updates = orderedRoleIds.map((id, index) =>
      this.prisma.role.update({
        where: { id },
        data: { priority: orderedRoleIds.length - index }
      })
    )

    await this.prisma.$transaction(updates)
    this.clearCache()
  }

  // ============================================================================
  // USER ROLE ASSIGNMENT
  // ============================================================================

  /**
   * Assign a role to a user
   */
  async assignRole(
    userId: number,
    roleId: number,
    options?: {
      expiresAt?: Date
      reason?: string
      assignedBy?: string
      isPrimary?: boolean
    }
  ): Promise<UserRoleWithDetails> {
    // Verify role exists and is active
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        isActive: true,
        deletedAt: null
      }
    })

    if (!role) {
      throw new Error('Role not found or inactive')
    }

    // Check if assignment already exists
    const existing = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        isActive: true
      }
    })

    if (existing) {
      throw new Error('User already has this role')
    }

    // Create assignment
    const assignment = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy: options?.assignedBy,
        isActive: true,
        isPrimary: options?.isPrimary || false,
        isTemporary: !!options?.expiresAt,
        expiresAt: options?.expiresAt,
        reason: options?.reason
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: { permission: true }
            }
          }
        }
      }
    })

    // If this is primary, unset other primary roles
    if (options?.isPrimary) {
      await this.prisma.userRole.updateMany({
        where: {
          userId,
          id: { not: assignment.id },
          isPrimary: true
        },
        data: { isPrimary: false }
      })
    }

    await this.invalidateUserCache(userId)
    return assignment
  }

  /**
   * Remove a role from a user
   */
  async removeRole(userId: number, roleId: number): Promise<void> {
    const assignment = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        isActive: true
      }
    })

    if (!assignment) {
      throw new Error('Role assignment not found')
    }

    await this.prisma.userRole.update({
      where: { id: assignment.id },
      data: { isActive: false }
    })

    await this.invalidateUserCache(userId)
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: number): Promise<UserRoleWithDetails[]> {
    const cacheKey = `user_roles_${userId}`
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    const roles = await this.prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              where: { isActive: true },
              include: { permission: true }
            }
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { role: { level: 'desc' } }
      ]
    })

    this.setCache(cacheKey, roles)
    return roles
  }

  // ============================================================================
  // PERMISSION CALCULATION
  // ============================================================================

  /**
   * Calculate all effective permissions for a user
   */
  async calculateEffectivePermissions(userId: number): Promise<EffectivePermission[]> {
    const cacheKey = `permissions_${userId}`
    const cached = this.getFromCache(cacheKey)

    if (cached) return cached

    const permissions: Map<string, EffectivePermission> = new Map()

    // 1. Get permissions from roles
    const userRoles = await this.getUserRoles(userId)

    for (const userRole of userRoles) {
      for (const rp of userRole.role.rolePermissions) {
        const key = `${rp.permission.resource}:${rp.permission.action}`

        // Higher level roles override lower ones
        if (!permissions.has(key) || userRole.role.level > (permissions.get(key)?.roleId || 0)) {
          permissions.set(key, {
            resource: rp.permission.resource,
            action: rp.permission.action,
            source: 'role',
            granted: true,
            roleId: userRole.role.id,
            expiresAt: userRole.expiresAt
          })
        }
      }
    }

    // 2. Apply direct user permissions (overrides)
    const userPermissions = await this.prisma.userPermission.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: { permission: true }
    })

    for (const up of userPermissions) {
      const key = `${up.permission.resource}:${up.permission.action}`

      permissions.set(key, {
        resource: up.permission.resource,
        action: up.permission.action,
        source: up.isDenied ? 'override' : 'direct',
        granted: !up.isDenied,
        expiresAt: up.expiresAt
      })
    }

    const result = Array.from(permissions.values())
    this.setCache(cacheKey, result)
    return result
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: number,
    resource: string,
    action: string,
    scope: string = 'ALL'
  ): Promise<boolean> {
    const permissions = await this.calculateEffectivePermissions(userId)

    // Check for exact match
    const hasExact = permissions.some(p =>
      p.resource === resource &&
      p.action === action &&
      p.granted
    )

    if (hasExact) return true

    // Check for wildcard permissions
    const hasWildcard = permissions.some(p =>
      (p.resource === '*' || p.resource === resource) &&
      (p.action === '*' || p.action === action) &&
      p.granted
    )

    return hasWildcard
  }

  /**
   * Check multiple permissions (AND)
   */
  async hasAllPermissions(userId: number, checks: PermissionCheck[]): Promise<boolean> {
    for (const check of checks) {
      const has = await this.hasPermission(
        userId,
        check.resource,
        check.action,
        check.scope
      )
      if (!has) return false
    }
    return true
  }

  /**
   * Check multiple permissions (OR)
   */
  async hasAnyPermission(userId: number, checks: PermissionCheck[]): Promise<boolean> {
    for (const check of checks) {
      const has = await this.hasPermission(
        userId,
        check.resource,
        check.action,
        check.scope
      )
      if (has) return true
    }
    return false
  }

  /**
   * Check if user can manage another role
   */
  async canManageRole(userId: number, targetRoleId: number): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId)

    if (userRoles.length === 0) return false

    const highestUserLevel = Math.max(...userRoles.map(ur => ur.role.level))

    const targetRole = await this.prisma.role.findUnique({
      where: { id: targetRoleId }
    })

    if (!targetRole) return false

    // Can only manage roles with lower level
    return highestUserLevel > targetRole.level
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  /**
   * Create a new permission
   */
  async createPermission(data: {
    name: string
    displayName: string
    description?: string
    category: string
    resource: string
    action: string
    scope?: string
    requiresMFA?: boolean
    riskLevel?: string
  }): Promise<Permission> {
    // Check if permission already exists
    const existing = await this.prisma.permission.findFirst({
      where: {
        resource: data.resource,
        action: data.action,
        scope: data.scope || 'ALL'
      }
    })

    if (existing) {
      throw new Error('Permission already exists')
    }

    return await this.prisma.permission.create({
      data: {
        ...data,
        scope: data.scope || 'ALL',
        riskLevel: data.riskLevel || 'LOW',
        requiresMFA: data.requiresMFA || false,
        isActive: true,
        isSystem: false,
        auditRequired: data.riskLevel === 'HIGH' || data.riskLevel === 'CRITICAL'
      }
    })
  }

  /**
   * Get all available permissions grouped by category
   */
  async getPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    const permissions = await this.prisma.permission.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { category: 'asc' },
        { resource: 'asc' },
        { action: 'asc' }
      ]
    })

    const grouped: Record<string, Permission[]> = {}

    for (const permission of permissions) {
      if (!grouped[permission.category]) {
        grouped[permission.category] = []
      }
      grouped[permission.category].push(permission)
    }

    return grouped
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getRoleWithPermissions(
    roleId: number,
    tx?: any
  ): Promise<RoleWithPermissions> {
    const client = tx || this.prisma

    const role = await client.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          where: { isActive: true },
          include: { permission: true }
        }
      }
    })

    if (!role) {
      throw new Error('Role not found')
    }

    return role
  }

  private async preparePermissions(
    permissions: string[],
    tx?: any
  ): Promise<Permission[]> {
    const client = tx || this.prisma
    const prepared: Permission[] = []

    for (const perm of permissions) {
      const [resource, action] = perm.split(':')

      const permission = await client.permission.findFirst({
        where: {
          resource,
          action,
          isActive: true
        }
      })

      if (permission) {
        prepared.push(permission)
      }
    }

    return prepared
  }

  private async syncRolePermissions(
    roleId: number,
    permissions: string[],
    tx?: any
  ): Promise<void> {
    const client = tx || this.prisma

    // Deactivate existing permissions
    await client.rolePermission.updateMany({
      where: { roleId },
      data: { isActive: false }
    })

    // Add new permissions
    const permissionRecords = await this.preparePermissions(permissions, client)

    for (const permission of permissionRecords) {
      await client.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id
          }
        },
        update: { isActive: true },
        create: {
          roleId,
          permissionId: permission.id,
          isActive: true
        }
      })
    }
  }

  private async getNextLevel(): Promise<number> {
    const maxRole = await this.prisma.role.findFirst({
      orderBy: { level: 'desc' }
    })
    return (maxRole?.level || 0) + 10
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private getFromCache(key: string): any {
    const cached = this.cacheStore.get(key)

    if (!cached) return null
    if (Date.now() > cached.expires) {
      this.cacheStore.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: any): void {
    this.cacheStore.set(key, {
      data,
      expires: Date.now() + this.CACHE_DURATION
    })
  }

  private async invalidateUserCache(userId: number): Promise<void> {
    const keys = [
      `user_roles_${userId}`,
      `permissions_${userId}`
    ]

    keys.forEach(key => this.cacheStore.delete(key))
  }

  private async invalidateRoleCache(roleId: number): Promise<void> {
    // Clear hierarchy cache
    this.cacheStore.delete('role_hierarchy')

    // Clear cache for all users with this role
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true }
    })

    for (const ur of userRoles) {
      await this.invalidateUserCache(ur.userId)
    }
  }

  private clearCache(): void {
    this.cacheStore.clear()
  }
}

// Export singleton instance
export const roleManagementService = (prisma: PrismaClient) => new RoleManagementService(prisma)