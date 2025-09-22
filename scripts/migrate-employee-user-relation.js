/**
 * Migration script to establish Employee-User relationship
 * Run this after applying the schema changes
 */

const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function migrateEmployeeUserRelation() {
  console.log('🔄 Starting Employee-User relationship migration...')
  
  try {
    // Get all users
    const users = await prisma.user.findMany()
    console.log(`Found ${users.length} users`)
    
    // Get all employees
    const employees = await prisma.employee.findMany()
    console.log(`Found ${employees.length} employees`)
    
    let linkedCount = 0
    let createdCount = 0
    
    // Strategy 1: Try to match existing users with employees
    for (const user of users) {
      // Try to find a matching employee
      const matchingEmployee = employees.find(emp => {
        const normalizedUsername = user.username.toLowerCase()
        
        // Match by email if it contains username
        if (emp.email && emp.email.toLowerCase().includes(normalizedUsername)) {
          return true
        }
        
        // Match by name patterns
        const fullName = `${emp.firstName}.${emp.lastName}`.toLowerCase()
        if (fullName === normalizedUsername) {
          return true
        }
        
        // Match by first name
        if (emp.firstName.toLowerCase() === normalizedUsername) {
          return true
        }
        
        return false
      })
      
      if (matchingEmployee) {
        // Link existing user to employee
        await prisma.user.update({
          where: { id: user.id },
          data: { employeeId: matchingEmployee.id }
        })
        
        console.log(`✅ Linked user "${user.username}" to employee "${matchingEmployee.firstName} ${matchingEmployee.lastName}"`)
        linkedCount++
      }
    }
    
    // Strategy 2: Create employees for users without matches (if they don't exist)
    const unlinkedUsers = await prisma.user.findMany({
      where: { employeeId: null }
    })
    
    for (const user of unlinkedUsers) {
      // Create a basic employee record for this user
      const newEmployee = await prisma.employee.create({
        data: {
          firstName: user.username,
          lastName: `(${user.role})`,
          email: `${user.username}@company.local`,
          status: 'ACTIVE',
          area: user.role === 'ADMIN' ? 'Sistemas' : 'IT',
          position: user.role === 'ADMIN' ? 'Administrador' : 'Técnico'
        }
      })
      
      // Link user to new employee
      await prisma.user.update({
        where: { id: user.id },
        data: { employeeId: newEmployee.id }
      })
      
      console.log(`✅ Created employee and linked user "${user.username}"`)
      createdCount++
    }
    
    // Strategy 3: Create user accounts for employees without users (technicians/admins)
    const employeesWithoutUsers = await prisma.employee.findMany({
      where: {
        user: null,
        OR: [
          { area: 'Sistemas' },
          { area: 'IT' },
          { position: { contains: 'Técnico' } },
          { position: { contains: 'Admin' } }
        ]
      }
    })
    
    for (const employee of employeesWithoutUsers) {
      // Create username from name
      const username = `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}`
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '')
      
      // Check if username exists
      const existingUser = await prisma.user.findUnique({
        where: { username }
      })
      
      if (!existingUser) {
        // Create user account for employee
        const hashedPassword = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // "password"
        
        const newUser = await prisma.user.create({
          data: {
            username,
            passwordHash: hashedPassword,
            role: employee.area === 'Sistemas' ? 'ADMIN' : 'TECHNICIAN',
            employeeId: employee.id
          }
        })
        
        console.log(`✅ Created user account "${username}" for employee "${employee.firstName} ${employee.lastName}"`)
        createdCount++
      }
    }
    
    // Final verification
    const totalLinked = await prisma.user.count({
      where: { employeeId: { not: null } }
    })
    
    console.log('\n📊 Migration Results:')
    console.log(`✅ Users linked to existing employees: ${linkedCount}`)
    console.log(`✅ New employees created: ${createdCount}`)
    console.log(`✅ Total users with employee relationship: ${totalLinked}`)
    console.log('\n🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
if (require.main === module) {
  migrateEmployeeUserRelation().catch(console.error)
}

module.exports = { migrateEmployeeUserRelation }
