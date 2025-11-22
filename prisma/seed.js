const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');

  // Delete in reverse dependency order to avoid foreign key constraints
  await prisma.obereports.deleteMany();
  await prisma.transcripts.deleteMany();
  await prisma.notifications.deleteMany();
  await prisma.sessions.deleteMany();
  await prisma.detailedresults.deleteMany();
  await prisma.studentassessmentitemresults.deleteMany();
  await prisma.studentassessmentresults.deleteMany();
  await prisma.assessmentitems.deleteMany();
  await prisma.assessments.deleteMany();
  await prisma.cumulativegpa.deleteMany();
  await prisma.semestergpa.deleteMany();
  await prisma.studentgrades.deleteMany();
  await prisma.passfailcriteria.deleteMany();
  await prisma.ploscores.deleteMany();
  await prisma.ploattainments.deleteMany();
  await prisma.llosattainments.deleteMany();
  await prisma.closattainments.deleteMany();
  await prisma.lloplomappings.deleteMany();
  await prisma.cloplomappings.deleteMany();
  await prisma.llos.deleteMany();
  await prisma.clos.deleteMany();
  await prisma.plos.deleteMany();
  await prisma.studentsections.deleteMany();
  await prisma.sections.deleteMany();
  await prisma.courseofferings.deleteMany();
  await prisma.faculties.deleteMany();
  await prisma.students.deleteMany();
  await prisma.batches.deleteMany();
  await prisma.semesters.deleteMany();
  await prisma.courses.deleteMany();
  await prisma.programs.deleteMany();
  await prisma.gradescales.deleteMany();
  await prisma.departments.deleteMany();
  await prisma.passwordresets.deleteMany();
  await prisma.auditlogs.deleteMany();
  await prisma.userroles.deleteMany();
  await prisma.users.deleteMany();
  await prisma.permissions.deleteMany();
  await prisma.roles.deleteMany();

  console.log('✅ Database cleared successfully!');
}

async function seedDatabase() {
  console.log('🌱 Seeding basic data...');

  const defaultPassword = await bcrypt.hash('11223344', 10);

  // 1. Create Roles
  // Note: We create all roles (super_admin, admin, faculty, student) even though we only create an admin user
  // because the admin will need these roles to exist when creating faculty and student users later
  console.log('📋 Creating roles...');
  await prisma.roles.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: {
      name: 'super_admin',
      description: 'Super Admin - Can create departments and assign admins',
    },
  });

  await prisma.roles.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Department Admin',
    },
  });

  await prisma.roles.upsert({
    where: { name: 'faculty' },
    update: {},
    create: {
      name: 'faculty',
      description: 'Faculty',
    },
  });

  await prisma.roles.upsert({
    where: { name: 'student' },
    update: {},
    create: {
      name: 'student',
      description: 'Student',
    },
  });

  // 2. Create Super Admin User (Hassan)
  console.log('👤 Creating super admin user...');
  const superAdminUser = await prisma.users.upsert({
    where: { email: 'hassan.officialmail00@gmail.com' },
    update: {},
    create: {
      email: 'hassan.officialmail00@gmail.com',
      username: 'hassan.officialmail00',
      password_hash: defaultPassword,
      first_name: 'Hassan',
      last_name: 'Admin',
      status: 'active',
      email_verified: true,
    },
  });

  // Get super_admin role
  const superAdminRole = await prisma.roles.findUnique({
    where: { name: 'super_admin' },
  });

  // Assign super_admin role
  if (superAdminRole) {
    await prisma.userroles.upsert({
      where: { userId: superAdminUser.id },
      update: {
        roleId: superAdminRole.id,
      },
      create: {
        userId: superAdminUser.id,
        roleId: superAdminRole.id,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📝 Super Admin Login Credentials:');
  console.log('Email:    hassan.officialmail00@gmail.com');
  console.log('Password: 11223344');
  console.log('Role:     super_admin');
  console.log(
    '\n💡 Note: Super Admin can create departments and assign admins to departments.'
  );
}

async function main() {
  try {
    await clearDatabase();
    await seedDatabase();
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
