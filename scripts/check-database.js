const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando base de datos "sistemas"...\n');

    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        userRoles: {
          include: {
            role: {
              select: {
                name: true,
                displayName: true,
                level: true
              }
            }
          }
        }
      }
    });

    console.log('👥 USUARIOS EN LA BASE DE DATOS:');
    console.log('════════════════════════════════════════');
    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios');
    } else {
      users.forEach(user => {
        const discordRole = user.userRoles.find(ur => ur.isPrimary)?.role;
        console.log(`ID: ${user.id}`);
        console.log(`Usuario: ${user.username}`);
        console.log(`Email: ${user.email || 'Sin email'}`);
        console.log(`Rol Legacy: ${user.role}`);
        console.log(`Rol Discord: ${discordRole ? discordRole.displayName + ' (Level ' + discordRole.level + ')' : 'Sin rol Discord'}`);
        console.log(`Activo: ${user.isActive ? 'Sí' : 'No'}`);
        console.log('────────────────────────────────────────');
      });
    }

    // Check roles
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        level: true,
        isActive: true,
        _count: {
          select: {
            userRoles: true
          }
        }
      },
      orderBy: {
        level: 'desc'
      }
    });

    console.log('\n🎭 ROLES DISCORD DISPONIBLES:');
    console.log('════════════════════════════════════════');
    roles.forEach(role => {
      console.log(`${role.displayName} (${role.name})`);
      console.log(`  Level: ${role.level} | Usuarios: ${role._count.userRoles} | Activo: ${role.isActive ? 'Sí' : 'No'}`);
    });

    // Check permissions count
    const permissionsCount = await prisma.permission.count();
    console.log(`\n🔐 Total de permisos: ${permissionsCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();