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
  // Note: We create all roles (admin, faculty, student) even though we only create an admin user
  // because the admin will need these roles to exist when creating faculty and student users later
  console.log('📋 Creating roles...');
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

  // 2. Create Sample Departments
  console.log('🏢 Creating sample departments...');
  const departments = [
    {
      name: 'Computer Science',
      code: 'CS',
      description: 'Department of Computer Science',
    },
    {
      name: 'Electrical Engineering',
      code: 'EE',
      description: 'Department of Electrical Engineering',
    },
    {
      name: 'Mechanical Engineering',
      code: 'ME',
      description: 'Department of Mechanical Engineering',
    },
    {
      name: 'Civil Engineering',
      code: 'CE',
      description: 'Department of Civil Engineering',
    },
    {
      name: 'Software Engineering',
      code: 'SE',
      description: 'Department of Software Engineering',
    },
  ];

  for (const dept of departments) {
    await prisma.departments.upsert({
      where: { code: dept.code },
      update: {},
      create: {
        name: dept.name,
        code: dept.code,
        description: dept.description,
        status: 'active',
      },
    });
  }
  console.log(`✅ Created ${departments.length} departments`);

  // 3. Create Admin User
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.users.upsert({
    where: { email: 'hassan.officialmail00@gmail.com' },
    update: {},
    create: {
      email: 'hassan.officialmail00@gmail.com',
      password_hash: defaultPassword,
      first_name: 'Admin',
      last_name: 'User',
      status: 'active',
      email_verified: true,
    },
  });

  // Get admin role
  const adminRole = await prisma.roles.findUnique({
    where: { name: 'admin' },
  });

  // Assign admin role
  if (adminRole) {
    await prisma.userroles.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\n📝 Admin Login Credentials:');
  console.log('Email:    hassan.officialmail00@gmail.com');
  console.log('Password: 11223344');
  console.log(
    '\n💡 Note: Admin can now create departments, programs, users, etc.'
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
