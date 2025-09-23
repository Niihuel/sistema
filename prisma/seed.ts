import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Limpiar datos existentes
  await prisma.userPermission.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.userRole.deleteMany()
  await prisma.permissionGroupItem.deleteMany()
  await prisma.permissionGroup.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.role.deleteMany()
  await prisma.user.deleteMany()

  console.log('📦 Creating permissions...')

  // Crear permisos del sistema
  const permissions = await Promise.all([
    // Dashboard
    prisma.permission.create({
      data: {
        name: 'dashboard.view',
        displayName: 'Ver Dashboard',
        description: 'Permite ver el dashboard principal',
        category: 'Dashboard',
        resource: 'dashboard',
        action: 'view',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'LOW',
        auditRequired: false
      }
    }),

    // Equipment
    prisma.permission.create({
      data: {
        name: 'equipment.view',
        displayName: 'Ver Equipos',
        description: 'Permite ver la lista de equipos',
        category: 'Equipment',
        resource: 'equipment',
        action: 'view',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'LOW'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'equipment.create',
        displayName: 'Crear Equipos',
        description: 'Permite crear nuevos equipos',
        category: 'Equipment',
        resource: 'equipment',
        action: 'create',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'MEDIUM'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'equipment.edit',
        displayName: 'Editar Equipos',
        description: 'Permite editar equipos existentes',
        category: 'Equipment',
        resource: 'equipment',
        action: 'edit',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'MEDIUM'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'equipment.delete',
        displayName: 'Eliminar Equipos',
        description: 'Permite eliminar equipos',
        category: 'Equipment',
        resource: 'equipment',
        action: 'delete',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'HIGH'
      }
    }),

    // Tickets
    prisma.permission.create({
      data: {
        name: 'tickets.view_own',
        displayName: 'Ver Tickets Propios',
        description: 'Permite ver tickets creados por el usuario',
        category: 'Tickets',
        resource: 'tickets',
        action: 'view_own',
        scope: 'OWN',
        isSystem: true,
        riskLevel: 'LOW'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tickets.view_all',
        displayName: 'Ver Todos los Tickets',
        description: 'Permite ver todos los tickets del sistema',
        category: 'Tickets',
        resource: 'tickets',
        action: 'view_all',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'LOW'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tickets.create',
        displayName: 'Crear Tickets',
        description: 'Permite crear nuevos tickets',
        category: 'Tickets',
        resource: 'tickets',
        action: 'create',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'LOW'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tickets.assign',
        displayName: 'Asignar Tickets',
        description: 'Permite asignar tickets a técnicos',
        category: 'Tickets',
        resource: 'tickets',
        action: 'assign',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'MEDIUM'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'tickets.close',
        displayName: 'Cerrar Tickets',
        description: 'Permite cerrar tickets resueltos',
        category: 'Tickets',
        resource: 'tickets',
        action: 'close',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'MEDIUM'
      }
    }),

    // Inventory
    prisma.permission.create({
      data: {
        name: 'inventory.view',
        displayName: 'Ver Inventario',
        description: 'Permite ver el inventario',
        category: 'Inventory',
        resource: 'inventory',
        action: 'view',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'LOW'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'inventory.manage',
        displayName: 'Gestionar Inventario',
        description: 'Permite gestionar el inventario',
        category: 'Inventory',
        resource: 'inventory',
        action: 'manage',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'MEDIUM'
      }
    }),

    // Employees
    prisma.permission.create({
      data: {
        name: 'employees.view',
        displayName: 'Ver Empleados',
        description: 'Permite ver la lista de empleados',
        category: 'Employees',
        resource: 'employees',
        action: 'view',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'LOW'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'employees.manage',
        displayName: 'Gestionar Empleados',
        description: 'Permite gestionar empleados',
        category: 'Employees',
        resource: 'employees',
        action: 'manage',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'HIGH'
      }
    }),

    // Users
    prisma.permission.create({
      data: {
        name: 'users.view',
        displayName: 'Ver Usuarios',
        description: 'Permite ver usuarios del sistema',
        category: 'Users',
        resource: 'users',
        action: 'view',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'MEDIUM'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users.create',
        displayName: 'Crear Usuarios',
        description: 'Permite crear nuevos usuarios',
        category: 'Users',
        resource: 'users',
        action: 'create',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'HIGH'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users.edit',
        displayName: 'Editar Usuarios',
        description: 'Permite editar usuarios existentes',
        category: 'Users',
        resource: 'users',
        action: 'edit',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'HIGH'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'users.delete',
        displayName: 'Eliminar Usuarios',
        description: 'Permite eliminar usuarios',
        category: 'Users',
        resource: 'users',
        action: 'delete',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'CRITICAL',
        requiresMFA: true
      }
    }),

    // Roles
    prisma.permission.create({
      data: {
        name: 'roles.view',
        displayName: 'Ver Roles',
        description: 'Permite ver roles del sistema',
        category: 'Roles',
        resource: 'roles',
        action: 'view',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'LOW'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'roles.manage',
        displayName: 'Gestionar Roles',
        description: 'Permite gestionar roles y permisos',
        category: 'Roles',
        resource: 'roles',
        action: 'manage',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'CRITICAL',
        requiresMFA: true
      }
    }),

    // Backups
    prisma.permission.create({
      data: {
        name: 'backups.view',
        displayName: 'Ver Respaldos',
        description: 'Permite ver el estado de los respaldos',
        category: 'Backups',
        resource: 'backups',
        action: 'view',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'LOW'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'backups.manage',
        displayName: 'Gestionar Respaldos',
        description: 'Permite gestionar respaldos del sistema',
        category: 'Backups',
        resource: 'backups',
        action: 'manage',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'CRITICAL',
        requiresMFA: true
      }
    }),

    // Admin
    prisma.permission.create({
      data: {
        name: 'admin.access',
        displayName: 'Acceso Administrativo',
        description: 'Permite acceder al panel de administración',
        category: 'Admin',
        resource: 'admin',
        action: 'access',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'HIGH'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'system.config',
        displayName: 'Configuración del Sistema',
        description: 'Permite modificar la configuración del sistema',
        category: 'System',
        resource: 'system',
        action: 'config',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'CRITICAL',
        requiresMFA: true
      }
    }),
    prisma.permission.create({
      data: {
        name: 'audit.view',
        displayName: 'Ver Auditoría',
        description: 'Permite ver logs de auditoría',
        category: 'Audit',
        resource: 'audit',
        action: 'view',
        scope: 'ALL',
        isSystem: true,
        riskLevel: 'MEDIUM'
      }
    })
  ])

  console.log('👥 Creating roles...')

  // Crear roles estilo Discord
  const roles = await Promise.all([
    // SuperAdmin - Nivel más alto
    prisma.role.create({
      data: {
        name: 'SuperAdmin',
        displayName: 'Super Administrador',
        description: 'Control total del sistema con todos los permisos',
        color: '#FF0000',
        icon: '👑',
        isSystem: true,
        level: 100,
        priority: 100
      }
    }),

    // Admin
    prisma.role.create({
      data: {
        name: 'Admin',
        displayName: 'Administrador',
        description: 'Administrador del sistema con permisos elevados',
        color: '#E91E63',
        icon: '🛡️',
        isSystem: true,
        level: 90,
        priority: 200
      }
    }),

    // Manager
    prisma.role.create({
      data: {
        name: 'Manager',
        displayName: 'Gerente',
        description: 'Gerente con permisos de gestión',
        color: '#9C27B0',
        icon: '💼',
        isSystem: true,
        level: 70,
        priority: 300
      }
    }),

    // Technician
    prisma.role.create({
      data: {
        name: 'Technician',
        displayName: 'Técnico',
        description: 'Técnico de soporte con permisos operativos',
        color: '#2196F3',
        icon: '🔧',
        isSystem: true,
        level: 50,
        priority: 400
      }
    }),

    // User
    prisma.role.create({
      data: {
        name: 'User',
        displayName: 'Usuario',
        description: 'Usuario regular del sistema',
        color: '#4CAF50',
        icon: '👤',
        isSystem: true,
        level: 30,
        priority: 500
      }
    }),

    // Guest
    prisma.role.create({
      data: {
        name: 'Guest',
        displayName: 'Invitado',
        description: 'Acceso limitado de solo lectura',
        color: '#95A5A6',
        icon: '👁️',
        isSystem: true,
        level: 10,
        priority: 600
      }
    })
  ])

  console.log('🔗 Assigning permissions to roles...')

  // SuperAdmin - Todos los permisos
  const superAdminRole = roles.find(r => r.name === 'SuperAdmin')!
  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM'
      }
    })
  }

  // Admin - Casi todos los permisos (excepto system.config)
  const adminRole = roles.find(r => r.name === 'Admin')!
  const adminPermissions = permissions.filter(p => !['system.config'].includes(p.name))
  for (const permission of adminPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM'
      }
    })
  }

  // Manager - Permisos de gestión
  const managerRole = roles.find(r => r.name === 'Manager')!
  const managerPermissions = permissions.filter(p =>
    ['dashboard.view', 'equipment.view', 'equipment.create', 'equipment.edit',
     'tickets.view_all', 'tickets.assign', 'tickets.close',
     'inventory.view', 'inventory.manage',
     'employees.view', 'employees.manage'].includes(p.name)
  )
  for (const permission of managerPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: managerRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM'
      }
    })
  }

  // Technician - Permisos técnicos
  const technicianRole = roles.find(r => r.name === 'Technician')!
  const technicianPermissions = permissions.filter(p =>
    ['dashboard.view', 'equipment.view', 'equipment.edit',
     'tickets.view_all', 'tickets.create', 'tickets.assign', 'tickets.close',
     'inventory.view', 'employees.view'].includes(p.name)
  )
  for (const permission of technicianPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: technicianRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM'
      }
    })
  }

  // User - Permisos básicos
  const userRole = roles.find(r => r.name === 'User')!
  const userPermissions = permissions.filter(p =>
    ['dashboard.view', 'tickets.view_own', 'tickets.create'].includes(p.name)
  )
  for (const permission of userPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: userRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM'
      }
    })
  }

  // Guest - Solo lectura
  const guestRole = roles.find(r => r.name === 'Guest')!
  const guestPermissions = permissions.filter(p =>
    ['dashboard.view'].includes(p.name)
  )
  for (const permission of guestPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: guestRole.id,
        permissionId: permission.id,
        grantedBy: 'SYSTEM'
      }
    })
  }

  console.log('👤 Creating test users...')

  // Crear usuarios de prueba
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // SuperAdmin
  const superAdmin = await prisma.user.create({
    data: {
      username: 'superadmin',
      email: 'superadmin@sistema.com',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      firstName: 'Super',
      lastName: 'Admin',
      isEmailVerified: true
    }
  })

  await prisma.userRole.create({
    data: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
      isPrimary: true,
      assignedBy: 'SYSTEM'
    }
  })

  // Admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@sistema.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'User',
      isEmailVerified: true
    }
  })

  await prisma.userRole.create({
    data: {
      userId: admin.id,
      roleId: adminRole.id,
      isPrimary: true,
      assignedBy: 'SYSTEM'
    }
  })

  // Manager
  const managerPassword = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@sistema.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
      firstName: 'Manager',
      lastName: 'User',
      isEmailVerified: true
    }
  })

  await prisma.userRole.create({
    data: {
      userId: manager.id,
      roleId: managerRole.id,
      isPrimary: true,
      assignedBy: 'SYSTEM'
    }
  })

  // Technician
  const techPassword = await bcrypt.hash('tech123', 10)
  const technician = await prisma.user.create({
    data: {
      username: 'tech',
      email: 'tech@sistema.com',
      passwordHash: techPassword,
      role: 'TECHNICIAN',
      firstName: 'Tech',
      lastName: 'Support',
      isEmailVerified: true
    }
  })

  await prisma.userRole.create({
    data: {
      userId: technician.id,
      roleId: technicianRole.id,
      isPrimary: true,
      assignedBy: 'SYSTEM'
    }
  })

  // User
  const userPassword = await bcrypt.hash('user123', 10)
  const regularUser = await prisma.user.create({
    data: {
      username: 'user',
      email: 'user@sistema.com',
      passwordHash: userPassword,
      role: 'USER',
      firstName: 'Regular',
      lastName: 'User',
      isEmailVerified: true
    }
  })

  await prisma.userRole.create({
    data: {
      userId: regularUser.id,
      roleId: userRole.id,
      isPrimary: true,
      assignedBy: 'SYSTEM'
    }
  })

  console.log('✅ Database seed completed successfully!')
  console.log('')
  console.log('📋 Test Users Created:')
  console.log('  👑 SuperAdmin: superadmin / admin123')
  console.log('  🛡️ Admin: admin / admin123')
  console.log('  💼 Manager: manager / manager123')
  console.log('  🔧 Technician: tech / tech123')
  console.log('  👤 User: user / user123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })