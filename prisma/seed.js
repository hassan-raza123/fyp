// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // bcryptjs use karein

const prisma = new PrismaClient();

async function main() {
  // Default admin user
  const hashedPassword = await bcrypt.hash('11223344', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password_hash: hashedPassword,
      role: 'super_admin',
    },
  });

  // Default department
  const department = await prisma.department.upsert({
    where: { code: 'CS' },
    update: {},
    create: {
      name: 'Computer Science',
      code: 'CS',
      adminId: adminUser.id,
    },
  });

  // Default program
  const program = await prisma.program.upsert({
    where: { code: 'BSCS' },
    update: {},
    create: {
      name: 'Bachelor of Science in Computer Science',
      code: 'BSCS',
      departmentId: department.id,
    },
  });

  // Default student
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@example.com',
      password_hash: hashedPassword,
      role: 'student',
    },
  });

  await prisma.student.create({
    data: {
      userId: studentUser.id,
      rollNumber: 'CS-001',
      departmentId: department.id,
      programId: program.id,
    },
  });

  console.log('Seeder script executed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
