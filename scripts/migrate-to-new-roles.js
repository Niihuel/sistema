const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

// Definir todos los permisos del sistema
const SYSTEM_PERMISSIONS = [
  // Dashboard
  { name: "dashboard.view", displayName: "Ver Dashboard", category: "Dashboard" },

  // Empleados
  { name: "employees.view", displayName: "Ver Empleados", category: "Empleados" },
  { name: "employees.create", displayName: "Crear Empleados", category: "Empleados" },
  { name: "employees.edit", displayName: "Editar Empleados", category: "Empleados" },
  { name: "employees.delete", displayName: "Eliminar Empleados", category: "Empleados" },

  // Equipos
  { name: "equipment.view", displayName: "Ver Equipos", category: "Equipos" },
  { name: "equipment.create", displayName: "Crear Equipos", category: "Equipos" },
  { name: "equipment.edit", displayName: "Editar Equipos", category: "Equipos" },
  { name: "equipment.delete", displayName: "Eliminar Equipos", category: "Equipos" },
  { name: "equipment.assign", displayName: "Asignar Equipos", category: "Equipos" },

  // Inventario
  { name: "inventory.view", displayName: "Ver Inventario", category: "Inventario" },
  { name: "inventory.create", displayName: "Agregar Inventario", category: "Inventario" },
  { name: "inventory.edit", displayName: "Editar Inventario", category: "Inventario" },
  { name: "inventory.delete", displayName: "Eliminar Inventario", category: "Inventario" },

  // Tickets
  { name: "tickets.view", displayName: "Ver Tickets", category: "Tickets" },
  { name: "tickets.create", displayName: "Crear Tickets", category: "Tickets" },
  { name: "tickets.edit", displayName: "Editar Tickets", category: "Tickets" },
  { name: "tickets.delete", displayName: "Eliminar Tickets", category: "Tickets" },
  { name: "tickets.assign", displayName: "Asignar Tickets", category: "Tickets" },
  { name: "tickets.resolve", displayName: "Resolver Tickets", category: "Tickets" },

  // Impresoras
  { name: "printers.view", displayName: "Ver Impresoras", category: "Impresoras" },
  { name: "printers.create", displayName: "Crear Impresoras", category: "Impresoras" },
  { name: "printers.edit", displayName: "Editar Impresoras", category: "Impresoras" },
  { name: "printers.delete", displayName: "Eliminar Impresoras", category: "Impresoras" },

  // Consumibles
  { name: "consumables.view", displayName: "Ver Consumibles", category: "Consumibles" },
  { name: "consumables.manage", displayName: "Gestionar Consumibles", category: "Consumibles" },

  // Compras
  { name: "purchases.view", displayName: "Ver Compras", category: "Compras" },
  { name: "purchases.create", displayName: "Crear Compras", category: "Compras" },
  { name: "purchases.approve", displayName: "Aprobar Compras", category: "Compras" },
  { name: "purchases.cancel", displayName: "Cancelar Compras", category: "Compras" },

  // Backups
  { name: "backups.view", displayName: "Ver Backups", category: "Backups" },
  { name: "backups.create", displayName: "Crear Backups", category: "Backups" },
  { name: "backups.restore", displayName: "Restaurar Backups", category: "Backups" },

  // Usuarios
  { name: "users.view", displayName: "Ver Usuarios", category: "Usuarios" },
  { name: "users.create", displayName: "Crear Usuarios", category: "Usuarios" },
  { name: "users.edit", displayName: "Editar Usuarios", category: "Usuarios" },
  { name: "users.delete", displayName: "Eliminar Usuarios", category: "Usuarios" },
  { name: "users.reset_password", displayName: "Resetear Contraseñas", category: "Usuarios" },

  // Roles
  { name: "roles.view", displayName: "Ver Roles", category: "Roles" },
  { name: "roles.create", displayName: "Crear Roles", category: "Roles" },
  { name: "roles.edit", displayName: "Editar Roles", category: "Roles" },
  { name: "roles.delete", displayName: "Eliminar Roles", category: "Roles" },
  { name: "roles.assign", displayName: "Asignar Roles", category: "Roles" },

  // Sistema
  { name: "system.audit", displayName: "Ver Auditoría", category: "Sistema" },
  { name: "system.settings", displayName: "Configuración del Sistema", category: "Sistema" },
  { name: "system.database", displayName: "Configurar Base de Datos", category: "Sistema" },
  { name: "system.maintenance", displayName: "Modo Mantenimiento", category: "Sistema" },
]

// Mapeo de roles antiguos a nuevos con sus permisos
const ROLE_MAPPINGS = {
  ADMIN: {
    displayName: "Administrador",
    description: "Acceso completo al sistema",
    color: "#FF5733",
    position: 100,
    permissions: SYSTEM_PERMISSIONS.map(p => p.name) // Todos los permisos
  },
  TECHNICIAN: {
    displayName: "Técnico",
    description: "Gestión de equipos, tickets e inventario",
    color: "#3498DB",
    position: 50,
    permissions: [
      // Dashboard
      "dashboard.view",
      // Empleados (solo ver)
      "employees.view",
      // Equipos (gestión completa)
      "equipment.view", "equipment.create", "equipment.edit", "equipment.assign",
      // Inventario
      "inventory.view", "inventory.create", "inventory.edit",
      // Tickets
      "tickets.view", "tickets.create", "tickets.edit", "tickets.assign", "tickets.resolve",
      // Impresoras
      "printers.view", "printers.create", "printers.edit",
      // Consumibles
      "consumables.view", "consumables.manage",
      // Compras (crear y ver)
      "purchases.view", "purchases.create",
      // Backups (solo ver)
      "backups.view",
    ]
  },
  MANAGER: {
    displayName: "Gerente",
    description: "Gestión de personal y aprobaciones",
    color: "#27AE60",
    position: 70,
    permissions: [
      "dashboard.view",
      "employees.view", "employees.create", "employees.edit",
      "equipment.view",
      "inventory.view",
      "tickets.view",
      "purchases.view", "purchases.approve",
      "users.view",
      "system.audit",
    ]
  },
  SUPERVISOR: {
    displayName: "Supervisor",
    description: "Supervisión de operaciones",
    color: "#F39C12",
    position: 40,
    permissions: [
      "dashboard.view",
      "employees.view",
      "equipment.view",
      "inventory.view",
      "tickets.view", "tickets.create", "tickets.edit",
      "printers.view",
      "purchases.view",
    ]
  },
  VIEWER: {
    displayName: "Visualizador",
    description: "Solo lectura del sistema",
    color: "#95A5A6",
    position: 10,
    permissions: [
      "dashboard.view",
      "employees.view",
      "equipment.view",
      "inventory.view",
      "tickets.view",
      "printers.view",
      "consumables.view",
      "purchases.view",
    ]
  }
}

async function migrateToNewRoleSystem() {
  console.log("🚀 Iniciando migración al nuevo sistema de roles...")

  try {
    // 1. Crear todos los permisos del sistema
    console.log("\n📝 Creando permisos del sistema...")
    for (const perm of SYSTEM_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {
          displayName: perm.displayName,
          category: perm.category
        },
        create: {
          name: perm.name,
          displayName: perm.displayName,
          category: perm.category,
          description: perm.description || `Permiso para ${perm.displayName}`,
          isSystem: true
        }
      })
    }
    console.log(`✅ ${SYSTEM_PERMISSIONS.length} permisos creados/actualizados`)

    // 2. Crear roles basados en el mapeo
    console.log("\n👥 Creando roles del sistema...")
    const createdRoles = {}

    for (const [oldRole, config] of Object.entries(ROLE_MAPPINGS)) {
      const role = await prisma.role.upsert({
        where: { name: oldRole },
        update: {
          displayName: config.displayName,
          description: config.description,
          color: config.color,
          position: config.position
        },
        create: {
          name: oldRole,
          displayName: config.displayName,
          description: config.description,
          color: config.color,
          position: config.position,
          isSystem: true
        }
      })

      createdRoles[oldRole] = role
      console.log(`✅ Rol ${config.displayName} creado/actualizado`)

      // Asignar permisos al rol
      for (const permName of config.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permName }
        })

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id
              }
            },
            update: { granted: true },
            create: {
              roleId: role.id,
              permissionId: permission.id,
              granted: true
            }
          })
        }
      }
    }

    // 3. Migrar usuarios existentes
    console.log("\n👤 Migrando usuarios existentes...")
    const users = await prisma.user.findMany()

    for (const user of users) {
      // Si el usuario tiene el campo role antiguo
      if (user.role) {
        const newRole = createdRoles[user.role]

        if (newRole) {
          // Verificar si ya tiene el rol asignado
          const existingUserRole = await prisma.userRole.findUnique({
            where: {
              userId_roleId: {
                userId: user.id,
                roleId: newRole.id
              }
            }
          })

          if (!existingUserRole) {
            await prisma.userRole.create({
              data: {
                userId: user.id,
                roleId: newRole.id
              }
            })
            console.log(`✅ Usuario ${user.username} asignado al rol ${newRole.displayName}`)
          } else {
            console.log(`ℹ️ Usuario ${user.username} ya tiene el rol ${newRole.displayName}`)
          }
        }
      } else {
        // Si no tiene rol, asignar VIEWER por defecto
        const viewerRole = createdRoles.VIEWER

        const existingUserRole = await prisma.userRole.findFirst({
          where: { userId: user.id }
        })

        if (!existingUserRole && viewerRole) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: viewerRole.id
            }
          })
          console.log(`⚠️ Usuario ${user.username} sin rol - asignado como Visualizador`)
        }
      }
    }

    // 4. Crear algunos roles personalizables de ejemplo
    console.log("\n🎨 Creando roles personalizables de ejemplo...")

    const customRoles = [
      {
        name: "SUPPORT",
        displayName: "Soporte",
        description: "Personal de soporte técnico",
        color: "#9B59B6",
        position: 30,
        permissions: [
          "dashboard.view",
          "tickets.view", "tickets.create", "tickets.edit",
          "equipment.view",
          "inventory.view"
        ]
      },
      {
        name: "AUDITOR",
        displayName: "Auditor",
        description: "Auditoría y reportes",
        color: "#E74C3C",
        position: 60,
        permissions: [
          "dashboard.view",
          "employees.view",
          "equipment.view",
          "inventory.view",
          "tickets.view",
          "purchases.view",
          "backups.view",
          "system.audit"
        ]
      }
    ]

    for (const roleConfig of customRoles) {
      const role = await prisma.role.create({
        data: {
          name: roleConfig.name,
          displayName: roleConfig.displayName,
          description: roleConfig.description,
          color: roleConfig.color,
          position: roleConfig.position,
          isSystem: false
        }
      })

      for (const permName of roleConfig.permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permName }
        })

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
              granted: true
            }
          })
        }
      }

      console.log(`✅ Rol personalizable ${roleConfig.displayName} creado`)
    }

    // 5. Mostrar resumen
    console.log("\n📊 RESUMEN DE LA MIGRACIÓN")
    console.log("="*50)

    const totalRoles = await prisma.role.count()
    const totalPermissions = await prisma.permission.count()
    const totalUserRoles = await prisma.userRole.count()

    console.log(`📌 Roles creados: ${totalRoles}`)
    console.log(`🔐 Permisos creados: ${totalPermissions}`)
    console.log(`👥 Asignaciones de roles: ${totalUserRoles}`)

    // Mostrar usuarios y sus roles
    console.log("\n👤 Usuarios y sus roles:")
    const usersWithRoles = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    for (const user of usersWithRoles) {
      const roles = user.userRoles.map(ur => ur.role.displayName).join(", ")
      console.log(`   ${user.username}: ${roles || "Sin roles"}`)
    }

    console.log("\n✨ Migración completada exitosamente!")
    console.log("🔄 Próximo paso: Actualizar el código para usar el nuevo sistema de roles")

  } catch (error) {
    console.error("❌ Error durante la migración:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar la migración
migrateToNewRoleSystem().catch(console.error)