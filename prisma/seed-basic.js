const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // 1. Insert all roles (only 3 roles now)
  const roles = [
    { name: 'admin', description: 'Admin' },
    { name: 'teacher', description: 'Teacher' },
    { name: 'student', description: 'Student' },
  ];

  for (const role of roles) {
    await prisma.roles.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
      },
    });
  }

  // 2. Create super admin user (if not exists)
  const email = 'itzhassanraza276@gmail.com';
  const password = '11223344'; // Change this if you want
  const password_hash = await bcrypt.hash(password, 10);

  let user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.users.create({
      data: {
        email,
        password_hash,
        first_name: 'Hassan',
        last_name: 'Raza',
        status: 'active',
        email_verified: true,
      },
    });
  }

  // 3. Assign admin role to user (if not already assigned)
  const adminRole = await prisma.roles.findUnique({
    where: { name: 'admin' },
  });
  if (user && adminRole) {
    const existingUserRole = await prisma.userroles.findFirst({
      where: { userId: user.id, roleId: adminRole.id },
    });
    if (!existingUserRole) {
      await prisma.userroles.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });
    }
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
