const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking existing users...');
    const users = await prisma.user.findMany({ 
      select: { id: true, username: true, role: true, createdAt: true } 
    });
    
    console.log('Current users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });
    
    // Check if there's an admin
    const admins = users.filter(u => u.role === 'ADMIN');
    console.log(`\nFound ${admins.length} admin user(s)`);
    
    if (admins.length === 0) {
      console.log('\nNo admin users found. Creating one...');
      const passwordHash = await bcrypt.hash('sistemas123', 10);
      const admin = await prisma.user.create({
        data: { 
          username: 'sistemas', 
          passwordHash, 
          role: 'ADMIN' 
        }
      });
      console.log(`Created admin user: ${admin.username} with password: sistemas123`);
    } else {
      console.log('\nExisting admin users:');
      admins.forEach(admin => {
        console.log(`- ${admin.username} (try password: admin1234 or the default)`);
      });
    }
  } catch (error) {
    console.error('Error checking users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();