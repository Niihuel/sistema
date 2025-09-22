/**
 * Seed script for Discord-like roles and permissions system
 * Run with: npx ts-node prisma/seed-discord-roles.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Discord-like roles and permissions system...')

  // ============================================================================
  // 1. CREATE PERMISSIONS
  // ============================================================================
  console.log('📝 Creating permissions...')

  const permissions = [
    // Dashboard permissions
    { resource: 'dashboard', action: 'view', displayName: 'Ver Dashboard', category: 'General', riskLevel: 'LOW' },
    { resource: 'dashboard', action: 'export', displayName: 'Exportar Dashboard', category: 'General', riskLevel: 'LOW' },

    // Equipment permissions
    { resource: 'equipment', action: 'view', displayName: 'Ver Equipos', category: 'Equipos', riskLevel: 'LOW' },
    { resource: 'equipment', action: 'create', displayName: 'Crear Equipos', category: 'Equipos', riskLevel: 'MEDIUM' },
    { resource: 'equipment', action: 'edit', displayName: 'Editar Equipos', category: 'Equipos', riskLevel: 'MEDIUM' },
    { resource: 'equipment', action: 'delete', displayName: 'Eliminar Equipos', category: 'Equipos', riskLevel: 'HIGH' },
    { resource: 'equipment', action: 'export', displayName: 'Exportar Equipos', category: 'Equipos', riskLevel: 'LOW' },

    // Tickets permissions
    { resource: 'tickets', action: 'view_own', displayName: 'Ver Tickets Propios', category: 'Tickets', riskLevel: 'LOW' },
    { resource: 'tickets', action: 'view_all', displayName: 'Ver Todos los Tickets', category: 'Tickets', riskLevel: 'LOW' },
    { resource: 'tickets', action: 'create', displayName: 'Crear Tickets', category: 'Tickets', riskLevel: 'LOW' },
    { resource: 'tickets', action: 'edit_own', displayName: 'Editar Tickets Propios', category: 'Tickets', riskLevel: 'LOW' },
    { resource: 'tickets', action: 'edit_all', displayName: 'Editar Todos los Tickets', category: 'Tickets', riskLevel: 'MEDIUM' },
    { resource: 'tickets', action: 'delete', displayName: 'Eliminar Tickets', category: 'Tickets', riskLevel: 'HIGH' },
    { resource: 'tickets', action: 'assign', displayName: 'Asignar Tickets', category: 'Tickets', riskLevel: 'MEDIUM' },
    { resource: 'tickets', action: 'close', displayName: 'Cerrar Tickets', category: 'Tickets', riskLevel: 'MEDIUM' },

    // Employees permissions
    { resource: 'employees', action: 'view', displayName: 'Ver Empleados', category: 'Personal', riskLevel: 'LOW' },
    { resource: 'employees', action: 'create', displayName: 'Crear Empleados', category: 'Personal', riskLevel: 'HIGH' },
    { resource: 'employees', action: 'edit', displayName: 'Editar Empleados', category: 'Personal', riskLevel: 'HIGH' },
    { resource: 'employees', action: 'delete', displayName: 'Eliminar Empleados', category: 'Personal', riskLevel: 'CRITICAL' },
    { resource: 'employees', action: 'export', displayName: 'Exportar Empleados', category: 'Personal', riskLevel: 'MEDIUM' },

    // Inventory permissions
    { resource: 'inventory', action: 'view', displayName: 'Ver Inventario', category: 'Inventario', riskLevel: 'LOW' },
    { resource: 'inventory', action: 'create', displayName: 'Crear Items', category: 'Inventario', riskLevel: 'MEDIUM' },
    { resource: 'inventory', action: 'edit', displayName: 'Editar Items', category: 'Inventario', riskLevel: 'MEDIUM' },
    { resource: 'inventory', action: 'delete', displayName: 'Eliminar Items', category: 'Inventario', riskLevel: 'HIGH' },
    { resource: 'inventory', action: 'assign', displayName: 'Asignar Items', category: 'Inventario', riskLevel: 'MEDIUM' },

    // Printers permissions
    { resource: 'printers', action: 'view', displayName: 'Ver Impresoras', category: 'Impresoras', riskLevel: 'LOW' },
    { resource: 'printers', action: 'create', displayName: 'Crear Impresoras', category: 'Impresoras', riskLevel: 'MEDIUM' },
    { resource: 'printers', action: 'edit', displayName: 'Editar Impresoras', category: 'Impresoras', riskLevel: 'MEDIUM' },
    { resource: 'printers', action: 'delete', displayName: 'Eliminar Impresoras', category: 'Impresoras', riskLevel: 'HIGH' },
    { resource: 'printers', action: 'manage_consumables', displayName: 'Gestionar Consumibles', category: 'Impresoras', riskLevel: 'MEDIUM' },

    // Purchases permissions
    { resource: 'purchases', action: 'view', displayName: 'Ver Compras', category: 'Compras', riskLevel: 'LOW' },
    { resource: 'purchases', action: 'create', displayName: 'Crear Solicitud de Compra', category: 'Compras', riskLevel: 'MEDIUM' },
    { resource: 'purchases', action: 'approve', displayName: 'Aprobar Compras', category: 'Compras', riskLevel: 'HIGH' },
    { resource: 'purchases', action: 'reject', displayName: 'Rechazar Compras', category: 'Compras', riskLevel: 'HIGH' },
    { resource: 'purchases', action: 'process', displayName: 'Procesar Compras', category: 'Compras', riskLevel: 'HIGH' },

    // Backups permissions
    { resource: 'backups', action: 'view', displayName: 'Ver Backups', category: 'Sistema', riskLevel: 'MEDIUM' },
    { resource: 'backups', action: 'create', displayName: 'Crear Backups', category: 'Sistema', riskLevel: 'HIGH' },
    { resource: 'backups', action: 'restore', displayName: 'Restaurar Backups', category: 'Sistema', riskLevel: 'CRITICAL' },
    { resource: 'backups', action: 'delete', displayName: 'Eliminar Backups', category: 'Sistema', riskLevel: 'CRITICAL' },

    // Users & Roles permissions
    { resource: 'users', action: 'view', displayName: 'Ver Usuarios', category: 'Administración', riskLevel: 'MEDIUM' },
    { resource: 'users', action: 'create', displayName: 'Crear Usuarios', category: 'Administración', riskLevel: 'HIGH' },
    { resource: 'users', action: 'edit', displayName: 'Editar Usuarios', category: 'Administración', riskLevel: 'HIGH' },
    { resource: 'users', action: 'delete', displayName: 'Eliminar Usuarios', category: 'Administración', riskLevel: 'CRITICAL' },
    { resource: 'users', action: 'reset_password', displayName: 'Resetear Contraseñas', category: 'Administración', riskLevel: 'HIGH' },

    { resource: 'roles', action: 'view', displayName: 'Ver Roles', category: 'Administración', riskLevel: 'MEDIUM' },
    { resource: 'roles', action: 'create', displayName: 'Crear Roles', category: 'Administración', riskLevel: 'CRITICAL' },
    { resource: 'roles', action: 'edit', displayName: 'Editar Roles', category: 'Administración', riskLevel: 'CRITICAL' },
    { resource: 'roles', action: 'delete', displayName: 'Eliminar Roles', category: 'Administración', riskLevel: 'CRITICAL' },
    { resource: 'roles', action: 'assign', displayName: 'Asignar Roles', category: 'Administración', riskLevel: 'HIGH' },

    // System permissions
    { resource: 'system', action: 'configure', displayName: 'Configurar Sistema', category: 'Sistema', riskLevel: 'CRITICAL', requiresMFA: true },
    { resource: 'system', action: 'admin', displayName: 'Administración Total', category: 'Sistema', riskLevel: 'CRITICAL', requiresMFA: true },
    { resource: 'audit', action: 'view', displayName: 'Ver Auditoría', category: 'Sistema', riskLevel: 'MEDIUM' },
    { resource: 'audit', action: 'export', displayName: 'Exportar Auditoría', category: 'Sistema', riskLevel: 'MEDIUM' },

    // Wildcard permission for super admin
    { resource: '*', action: '*', displayName: 'Acceso Total', category: 'Sistema', riskLevel: 'CRITICAL', requiresMFA: true, isSystem: true }
  ]

  for (const perm of permissions) {
    const name = `${perm.resource}:${perm.action}`
    await prisma.permission.upsert({
      where: {
        unique_permission_definition: {
          resource: perm.resource,
          action: perm.action,
          scope: 'ALL'
        }
      },
      update: {
        displayName: perm.displayName,
        category: perm.category,
        riskLevel: perm.riskLevel,
        requiresMFA: perm.requiresMFA || false,
        isSystem: perm.isSystem || false
      },
      create: {
        name,
        displayName: perm.displayName,
        category: perm.category,
        resource: perm.resource,
        action: perm.action,
        scope: 'ALL',
        riskLevel: perm.riskLevel,
        requiresMFA: perm.requiresMFA || false,
        isSystem: perm.isSystem || false,
        isActive: true,
        auditRequired: ['HIGH', 'CRITICAL'].includes(perm.riskLevel)
      }
    })
  }

  console.log(`✅ Created ${permissions.length} permissions`)

  // ============================================================================
  // 2. CREATE ROLES WITH HIERARCHY
  // ============================================================================
  console.log('👥 Creating roles...')

  const roles = [
    {
      name: 'SuperAdmin',
      displayName: 'Super Administrador',
      description: 'Control total del sistema',
      color: '#E74C3C',
      icon: '👑',
      level: 100,
      isSystem: true,
      permissions: ['*:*']
    },
    {
      name: 'Admin',
      displayName: 'Administrador',
      description: 'Administrador con permisos amplios',
      color: '#E67E22',
      icon: '🛡️',
      level: 90,
      isSystem: true,
      permissions: [
        'dashboard:*',
        'equipment:*',
        'tickets:*',
        'employees:*',
        'inventory:*',
        'printers:*',
        'purchases:*',
        'users:*',
        'roles:view',
        'audit:*'
      ]
    },
    {
      name: 'Manager',
      displayName: 'Gerente',
      description: 'Gerente con permisos de gestión',
      color: '#3498DB',
      icon: '👔',
      level: 70,
      permissions: [
        'dashboard:view',
        'equipment:view', 'equipment:create', 'equipment:edit',
        'tickets:view_all', 'tickets:assign', 'tickets:close',
        'employees:view', 'employees:edit',
        'inventory:*',
        'printers:*',
        'purchases:view', 'purchases:create', 'purchases:approve',
        'users:view',
        'audit:view'
      ]
    },
    {
      name: 'Technician',
      displayName: 'Técnico',
      description: 'Técnico de soporte IT',
      color: '#9B59B6',
      icon: '🔧',
      level: 50,
      permissions: [
        'dashboard:view',
        'equipment:view', 'equipment:edit',
        'tickets:view_all', 'tickets:edit_all', 'tickets:assign', 'tickets:close',
        'employees:view',
        'inventory:view', 'inventory:edit', 'inventory:assign',
        'printers:view', 'printers:edit', 'printers:manage_consumables'
      ]
    },
    {
      name: 'Support',
      displayName: 'Soporte',
      description: 'Personal de soporte básico',
      color: '#1ABC9C',
      icon: '🎧',
      level: 40,
      permissions: [
        'dashboard:view',
        'tickets:view_all', 'tickets:create', 'tickets:edit_own',
        'equipment:view',
        'employees:view',
        'inventory:view',
        'printers:view'
      ]
    },
    {
      name: 'Employee',
      displayName: 'Empleado',
      description: 'Empleado regular',
      color: '#2ECC71',
      icon: '💼',
      level: 30,
      isDefault: true,
      permissions: [
        'dashboard:view',
        'tickets:view_own', 'tickets:create', 'tickets:edit_own',
        'equipment:view',
        'inventory:view',
        'purchases:view', 'purchases:create'
      ]
    },
    {
      name: 'Guest',
      displayName: 'Invitado',
      description: 'Acceso de solo lectura',
      color: '#95A5A6',
      icon: '👁️',
      level: 10,
      permissions: [
        'dashboard:view',
        'equipment:view',
        'inventory:view'
      ]
    }
  ]

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        displayName: roleData.displayName,
        description: roleData.description,
        color: roleData.color,
        icon: roleData.icon,
        level: roleData.level,
        isActive: true
      },
      create: {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        color: roleData.color,
        icon: roleData.icon,
        level: roleData.level,
        isSystem: roleData.isSystem || false,
        isActive: true
      }
    })

    // Assign permissions to role
    for (const permPattern of roleData.permissions) {
      const [resource, action] = permPattern.split(':')

      // Find matching permissions
      const permissions = await prisma.permission.findMany({
        where: {
          resource: action === '*' ? undefined : resource,
          action: action === '*' ? undefined : action,
          ...(resource === '*' && action === '*' ? {} : {})
        }
      })

      // Create role-permission relationships
      for (const permission of permissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id
            }
          },
          update: {
            isActive: true
          },
          create: {
            roleId: role.id,
            permissionId: permission.id,
            isActive: true
          }
        })
      }
    }

    console.log(`✅ Created role: ${roleData.displayName} with ${roleData.permissions.length} permission patterns`)
  }

  // ============================================================================
  // 3. CREATE TEST USERS WITH ROLES
  // ============================================================================
  console.log('👤 Creating test users...')

  const testUsers = [
    {
      username: 'superadmin',
      email: 'superadmin@sistema.com',
      password: 'Admin123!',
      firstName: 'Super',
      lastName: 'Admin',
      roleName: 'SuperAdmin'
    },
    {
      username: 'admin',
      email: 'admin@sistema.com',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'Sistema',
      roleName: 'Admin'
    },
    {
      username: 'manager',
      email: 'manager@sistema.com',
      password: 'Manager123!',
      firstName: 'Manager',
      lastName: 'IT',
      roleName: 'Manager'
    },
    {
      username: 'tech',
      email: 'tech@sistema.com',
      password: 'Tech123!',
      firstName: 'Técnico',
      lastName: 'Soporte',
      roleName: 'Technician'
    },
    {
      username: 'support',
      email: 'support@sistema.com',
      password: 'Support123!',
      firstName: 'Soporte',
      lastName: 'IT',
      roleName: 'Support'
    },
    {
      username: 'employee',
      email: 'employee@sistema.com',
      password: 'Employee123!',
      firstName: 'Empleado',
      lastName: 'Regular',
      roleName: 'Employee'
    }
  ]

  for (const userData of testUsers) {
    console.log(`\n🔄 Processing user: ${userData.username} (${userData.email})`)

    const passwordHash = await bcrypt.hash(userData.password, 10)

    // Check if user already exists by username
    let user = await prisma.user.findUnique({
      where: { username: userData.username }
    })

    if (!user) {
      console.log(`  ➕ Creating new user: ${userData.username}`)
      try {
        // Create new user (omit nullable unique fields)
        user = await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            passwordHash,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.roleName.toUpperCase(),
            isActive: true,
            isEmailVerified: true
          }
        })
        console.log(`  ✅ User created successfully: ${userData.username}`)
      } catch (error) {
        console.error(`  ❌ Failed to create user ${userData.username}:`, error.message)
        throw error
      }
    } else {
      console.log(`  🔄 Updating existing user: ${userData.username}`)
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: true
        }
      })
      console.log(`  ✅ User updated successfully: ${userData.username}`)
    }

    // Find the role
    const role = await prisma.role.findUnique({
      where: { name: userData.roleName }
    })

    if (role) {
      // Assign role to user
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id
          }
        },
        update: {
          isActive: true,
          isPrimary: true
        },
        create: {
          userId: user.id,
          roleId: role.id,
          isActive: true,
          isPrimary: true,
          assignedBy: 'SYSTEM'
        }
      })

      console.log(`✅ Created user: ${userData.username} with role: ${userData.roleName}`)
    }
  }

  // ============================================================================
  // 4. CREATE PERMISSION GROUPS
  // ============================================================================
  console.log('📦 Creating permission groups...')

  const permissionGroups = [
    {
      name: 'basic_read',
      displayName: 'Lectura Básica',
      description: 'Permisos de solo lectura para recursos básicos',
      category: 'Básico',
      permissions: [
        'dashboard:view',
        'equipment:view',
        'inventory:view'
      ]
    },
    {
      name: 'ticket_management',
      displayName: 'Gestión de Tickets',
      description: 'Permisos completos para gestión de tickets',
      category: 'Operaciones',
      permissions: [
        'tickets:view_all',
        'tickets:create',
        'tickets:edit_all',
        'tickets:assign',
        'tickets:close'
      ]
    },
    {
      name: 'equipment_management',
      displayName: 'Gestión de Equipos',
      description: 'Permisos completos para gestión de equipos',
      category: 'Operaciones',
      permissions: [
        'equipment:view',
        'equipment:create',
        'equipment:edit',
        'equipment:delete',
        'equipment:export'
      ]
    },
    {
      name: 'user_administration',
      displayName: 'Administración de Usuarios',
      description: 'Permisos para administrar usuarios y roles',
      category: 'Administración',
      permissions: [
        'users:view',
        'users:create',
        'users:edit',
        'users:reset_password',
        'roles:view',
        'roles:assign'
      ]
    }
  ]

  for (const groupData of permissionGroups) {
    const group = await prisma.permissionGroup.upsert({
      where: { name: groupData.name },
      update: {
        displayName: groupData.displayName,
        description: groupData.description,
        category: groupData.category
      },
      create: {
        name: groupData.name,
        displayName: groupData.displayName,
        description: groupData.description,
        category: groupData.category,
        isActive: true
      }
    })

    // Add permissions to group
    for (const permPattern of groupData.permissions) {
      const [resource, action] = permPattern.split(':')
      const permission = await prisma.permission.findFirst({
        where: { resource, action, scope: 'ALL' }
      })

      if (permission) {
        await prisma.permissionGroupItem.upsert({
          where: {
            groupId_permissionId: {
              groupId: group.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            groupId: group.id,
            permissionId: permission.id
          }
        })
      }
    }

    console.log(`✅ Created permission group: ${groupData.displayName} with ${groupData.permissions.length} permissions`)
  }

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Test Users Created:')
  console.log('┌─────────────┬──────────────┬─────────────┐')
  console.log('│ Username    │ Password     │ Role        │')
  console.log('├─────────────┼──────────────┼─────────────┤')
  for (const user of testUsers) {
    console.log(`│ ${user.username.padEnd(11)} │ ${user.password.padEnd(12)} │ ${user.roleName.padEnd(11)} │`)
  }
  console.log('└─────────────┴──────────────┴─────────────┘')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })