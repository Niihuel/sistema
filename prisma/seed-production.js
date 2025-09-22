/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting production-ready seed...')
  
  try {
    // Create essential users for production
    const adminPassword = 'AuxSist24'
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    // Check if admin user exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'auxsistemas' }
    })

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: 'auxsistemas',
          passwordHash,
          role: 'ADMIN'
        }
      })
      console.log('✅ Admin user created: auxsistemas')
    } else {
      await prisma.user.update({
        where: { username: 'auxsistemas' },
        data: {
          passwordHash,
          role: 'ADMIN'
        }
      })
      console.log('✅ Admin user updated: auxsistemas')
    }

    // Check if tech user exists
    const existingTech = await prisma.user.findUnique({
      where: { username: 'sistemas' }
    })

    if (!existingTech) {
      try {
        await prisma.user.create({
          data: {
            username: 'sistemas',
            passwordHash,
            role: 'ADMIN'
          }
        })
        console.log('✅ Tech user created: sistemas')
      } catch (error) {
        console.log('ℹ️ Tech user may already exist, skipping creation')
      }
    } else {
      await prisma.user.update({
        where: { username: 'sistemas' },
        data: {
          passwordHash,
          role: 'ADMIN'
        }
      })
      console.log('✅ Tech user updated: sistemas')
    }

    console.log('✅ Production users ready!')
    console.log(`👤 Admin user: auxsistemas / ${adminPassword}`)
    console.log(`👤 Tech user: sistemas / ${adminPassword}`)
    console.log('🔐 Remember to change passwords after first login!')

    // Create basic catalog areas if the table exists
    try {
      const baseAreas = [
        "Sistemas",
        "Ventas", 
        "Producción",
        "RRHH",
        "Administración",
        "Logística"
      ]
      
      for (const name of baseAreas) {
        await prisma.catalogArea.upsert({ 
          where: { name }, 
          update: {}, 
          create: { name } 
        })
      }
      console.log('✅ Basic areas created')
    } catch (error) {
      console.log('ℹ️ CatalogArea table not available, skipping areas')
    }

    console.log('🎉 Production seed completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during production seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Production seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })