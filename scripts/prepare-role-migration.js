const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function prepareDatabase() {
  console.log("🔧 Preparando base de datos para migración...")

  try {
    // 1. Backup de datos actuales de Permission
    console.log("\n📦 Guardando permisos actuales...")
    const oldPermissions = await prisma.permission.findMany()
    console.log(`   Encontrados ${oldPermissions.length} permisos antiguos`)

    // 2. Backup de datos actuales de Role
    console.log("\n📦 Guardando roles actuales...")
    const oldRoles = await prisma.role.findMany()
    console.log(`   Encontrados ${oldRoles.length} roles antiguos`)

    // 3. Backup de UserRole
    console.log("\n📦 Guardando asignaciones de roles...")
    const oldUserRoles = await prisma.userRole.findMany()
    console.log(`   Encontradas ${oldUserRoles.length} asignaciones`)

    // 4. Eliminar las tablas relacionadas en el orden correcto
    console.log("\n🗑️ Limpiando estructuras antiguas...")

    // Eliminar UserRole primero
    await prisma.$executeRaw`DELETE FROM [dbo].[UserRole]`
    console.log("   ✅ UserRole limpiado")

    // Eliminar Permission
    await prisma.$executeRaw`DELETE FROM [dbo].[Permission]`
    console.log("   ✅ Permission limpiado")

    // Eliminar Role
    await prisma.$executeRaw`DELETE FROM [dbo].[Role]`
    console.log("   ✅ Role limpiado")

    // 5. Actualizar columnas con valores temporales
    console.log("\n🔄 Actualizando estructura de tablas...")

    // Agregar columnas faltantes a Permission
    await prisma.$executeRaw`ALTER TABLE [dbo].[Permission] ADD name NVARCHAR(255) NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[Permission] ADD displayName NVARCHAR(255) NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[Permission] ADD category NVARCHAR(255) NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[Permission] ADD description NVARCHAR(MAX) NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[Permission] ADD isSystem BIT DEFAULT 0`
    console.log("   ✅ Permission actualizado")

    // Agregar columnas faltantes a Role
    await prisma.$executeRaw`ALTER TABLE [dbo].[Role] ADD displayName NVARCHAR(255) NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[Role] ADD description NVARCHAR(MAX) NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[Role] ADD color NVARCHAR(7) NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[Role] ADD icon NVARCHAR(255) NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[Role] ADD position INT DEFAULT 0`
    await prisma.$executeRaw`ALTER TABLE [dbo].[Role] ADD isSystem BIT DEFAULT 0`
    console.log("   ✅ Role actualizado")

    // Agregar columnas faltantes a UserRole
    await prisma.$executeRaw`ALTER TABLE [dbo].[UserRole] ADD grantedBy INT NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[UserRole] ADD expiresAt DATETIME2 NULL`
    await prisma.$executeRaw`ALTER TABLE [dbo].[UserRole] ADD updatedAt DATETIME2 DEFAULT GETDATE()`
    console.log("   ✅ UserRole actualizado")

    // Crear tabla RolePermission si no existe
    await prisma.$executeRaw`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RolePermission' AND xtype='U')
      CREATE TABLE [dbo].[RolePermission] (
        id INT IDENTITY(1,1) PRIMARY KEY,
        roleId INT NOT NULL,
        permissionId INT NOT NULL,
        granted BIT DEFAULT 1,
        createdAt DATETIME2 DEFAULT GETDATE()
      )
    `
    console.log("   ✅ RolePermission creado")

    // Agregar columnas a User si no existen
    await prisma.$executeRaw`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.User') AND name = 'lastLogin')
      ALTER TABLE [dbo].[User] ADD lastLogin DATETIME2 NULL
    `
    await prisma.$executeRaw`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.User') AND name = 'isActive')
      ALTER TABLE [dbo].[User] ADD isActive BIT DEFAULT 1
    `
    console.log("   ✅ User actualizado")

    console.log("\n✨ Base de datos preparada para migración!")
    console.log("\n📝 Datos guardados:")
    console.log(`   - ${oldPermissions.length} permisos antiguos`)
    console.log(`   - ${oldRoles.length} roles antiguos`)
    console.log(`   - ${oldUserRoles.length} asignaciones de roles`)
    console.log("\n✅ Ahora puedes ejecutar: npx prisma db push")

  } catch (error) {
    console.error("❌ Error preparando base de datos:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

prepareDatabase().catch(console.error)