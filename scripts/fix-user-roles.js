const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function fixUserRoles() {
  try {
    console.log("🔍 Verificando usuarios y roles...")

    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    console.log(`\n📊 Usuarios encontrados: ${users.length}`)

    for (const user of users) {
      console.log(`\n👤 Usuario: ${user.username} (ID: ${user.id})`)
      console.log(`   Rol legacy: ${user.role}`)
      console.log(`   Roles asignados: ${user.roles.length}`)

      if (user.roles.length === 0) {
        console.log(`   ⚠️ Usuario sin roles asignados!`)

        // Buscar el rol correspondiente
        const roleName = user.role || 'TECHNICIAN' // usar TECHNICIAN como default
        const role = await prisma.role.findUnique({
          where: { name: roleName }
        })

        if (role) {
          // Asignar el rol al usuario
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id
            }
          })
          console.log(`   ✅ Rol ${roleName} asignado exitosamente`)
        } else {
          console.log(`   ❌ No se encontró el rol ${roleName}`)
        }
      } else {
        console.log(`   ✅ Roles: ${user.roles.map(r => r.role.name).join(', ')}`)
      }
    }

    console.log("\n✨ Verificación completada")

    // Mostrar resumen de roles
    const rolesCount = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    console.log("\n📈 Resumen de Roles:")
    for (const role of rolesCount) {
      console.log(`   ${role.name}: ${role._count.users} usuarios`)
    }

  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserRoles()