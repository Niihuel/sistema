/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient()

async function main() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin1234"

  const existing = await prisma.user.findUnique({ where: { username: adminUsername } })
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    await prisma.user.create({ data: { username: adminUsername, passwordHash, role: "ADMIN" } })
    console.log(`✔ Usuario admin creado: ${adminUsername} / ${adminPassword} (cambia la contraseña luego)`) 
  } else {
    console.log("ℹ Usuario admin ya existe; se omite creación")
  }

  // Seed de áreas base
  const baseAreas = [
    "Sistemas",
    "Ventas",
    "Producción",
    "RRHH",
    "Administración",
    "Logística",
  ]
  for (const name of baseAreas) {
    await prisma.catalogArea.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log("✔ Áreas base cargadas")

  // Seed roles/permissions más completo
  const adminRole = await prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN" } })
  const techRole = await prisma.role.upsert({ where: { name: "TECHNICIAN" }, update: {}, create: { name: "TECHNICIAN" } })
  const managerRole = await prisma.role.upsert({ where: { name: "MANAGER" }, update: {}, create: { name: "MANAGER" } })
  const supervisorRole = await prisma.role.upsert({ where: { name: "SUPERVISOR" }, update: {}, create: { name: "SUPERVISOR" } })
  
  const perms = [
    // Admin permissions - full access
    { roleId: adminRole.id, resource: "*", level: "ADMIN" },
    
    // Technician permissions - can manage operational tasks
    { roleId: techRole.id, resource: "TICKETS", level: "WRITE" },
    { roleId: techRole.id, resource: "EQUIPMENT", level: "WRITE" },
    { roleId: techRole.id, resource: "INVENTORY", level: "WRITE" },
    { roleId: techRole.id, resource: "PRINTERS", level: "WRITE" },
    { roleId: techRole.id, resource: "CONSUMABLES", level: "WRITE" },
    { roleId: techRole.id, resource: "REPLACEMENTS", level: "WRITE" },
    { roleId: techRole.id, resource: "EMPLOYEES", level: "READ" },
    { roleId: techRole.id, resource: "BACKUPS", level: "READ" },
    { roleId: techRole.id, resource: "PURCHASE_REQUESTS", level: "WRITE" },
    
    // Manager permissions - can manage teams and requests
    { roleId: managerRole.id, resource: "EMPLOYEES", level: "WRITE" },
    { roleId: managerRole.id, resource: "PURCHASE_REQUESTS", level: "ADMIN" },
    { roleId: managerRole.id, resource: "TICKETS", level: "READ" },
    { roleId: managerRole.id, resource: "EQUIPMENT", level: "READ" },
    { roleId: managerRole.id, resource: "INVENTORY", level: "READ" },
    
    // Supervisor permissions - can oversee operations
    { roleId: supervisorRole.id, resource: "TICKETS", level: "WRITE" },
    { roleId: supervisorRole.id, resource: "EQUIPMENT", level: "READ" },
    { roleId: supervisorRole.id, resource: "INVENTORY", level: "READ" },
    { roleId: supervisorRole.id, resource: "EMPLOYEES", level: "READ" },
  ]
  
  for (const p of perms) {
    await prisma.permission.upsert({
      where: { roleId_resource_level: { roleId: p.roleId, resource: p.resource, level: p.level } },
      update: {},
      create: p,
    }).catch(() => {})
  }
  
  // Asignar roles a usuarios existentes
  const adminUser = await prisma.user.findUnique({ where: { username: adminUsername } })
  if (adminUser) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id }
    }).catch(() => {})
  }
  
  console.log("✔ Roles y permisos base cargados")

  // Crear notificaciones de ejemplo
  if (adminUser) {
    const sampleNotifications = [
      {
        userId: adminUser.id,
        type: "SYSTEM_UPDATE",
        title: "Bienvenido al Sistema IT",
        message: "El sistema de gestión IT está funcionando correctamente. Puedes comenzar a gestionar empleados, equipos e inventario.",
        priority: "NORMAL",
        isRead: false
      },
      {
        userId: adminUser.id,
        type: "STOCK_LOW",
        title: "Stock bajo: Toner HP",
        message: "Quedan solo 2 unidades de toner HP LaserJet. Considera hacer un pedido.",
        priority: "HIGH",
        isRead: false
      },
      {
        userId: adminUser.id,
        type: "EQUIPMENT_MAINTENANCE",
        title: "Mantenimiento requerido: Servidor Principal",
        message: "El servidor principal requiere mantenimiento preventivo programado.",
        priority: "NORMAL",
        isRead: true
      }
    ]

    for (const notification of sampleNotifications) {
      await prisma.notification.upsert({
        where: { 
          id: notification.userId + Math.random() // ID único temporal
        },
        update: {},
        create: notification
      }).catch(() => {}) // Ignorar errores de duplicados
    }
    console.log("✔ Notificaciones de ejemplo creadas")
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })


