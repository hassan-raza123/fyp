// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const defaultPassword = await bcrypt.hash('11223344', 10);

    // Create Roles
    const roles = await Promise.all([
      prisma.role.upsert({
        where: { name: 'super_admin' },
        update: {},
        create: {
          name: 'super_admin',
          description: 'Super Administrator with full access',
          updatedAt: new Date(),
        },
      }),
      prisma.role.upsert({
        where: { name: 'sub_admin' },
        update: {},
        create: {
          name: 'sub_admin',
          description: 'Sub Administrator with restricted access',
          updatedAt: new Date(),
        },
      }),
      prisma.role.upsert({
        where: { name: 'department_admin' },
        update: {},
        create: {
          name: 'department_admin',
          description: 'Department Administrator',
          updatedAt: new Date(),
        },
      }),
      prisma.role.upsert({
        where: { name: 'child_admin' },
        update: {},
        create: {
          name: 'child_admin',
          description: 'Sub-Department Administrator',
          updatedAt: new Date(),
        },
      }),
      prisma.role.upsert({
        where: { name: 'teacher' },
        update: {},
        create: {
          name: 'teacher',
          description: 'Faculty Member',
          updatedAt: new Date(),
        },
      }),
      prisma.role.upsert({
        where: { name: 'student' },
        update: {},
        create: {
          name: 'student',
          description: 'Student',
          updatedAt: new Date(),
        },
      }),
    ]);

    // Create Super Admin User
    const superAdmin = await prisma.user.upsert({
      where: { email: 'super.admin@university.edu' },
      update: {},
      create: {
        email: 'super.admin@university.edu',
        username: 'superadmin',
        password_hash: defaultPassword,
        first_name: 'Super',
        last_name: 'Admin',
        phone_number: '0300-1234567',
        email_verified: true,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Assign Super Admin Role
    await prisma.userrole.upsert({
      where: {
        userId_roleId: {
          userId: superAdmin.id,
          roleId: roles[0].id, // super_admin role
        },
      },
      update: {},
      create: {
        userId: superAdmin.id,
        roleId: roles[0].id,
        updatedAt: new Date(),
      },
    });

    // Create Sub Admin User
    const subAdmin = await prisma.user.upsert({
      where: { email: 'sub.admin@university.edu' },
      update: {},
      create: {
        email: 'sub.admin@university.edu',
        username: 'subadmin',
        password_hash: defaultPassword,
        first_name: 'Sub',
        last_name: 'Admin',
        phone_number: '0300-1234568',
        email_verified: true,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Assign Sub Admin Role
    await prisma.userrole.upsert({
      where: {
        userId_roleId: {
          userId: subAdmin.id,
          roleId: roles[1].id, // sub_admin role
        },
      },
      update: {},
      create: {
        userId: subAdmin.id,
        roleId: roles[1].id,
        updatedAt: new Date(),
      },
    });

    // Create Department Admin User
    const deptAdmin = await prisma.user.upsert({
      where: { email: 'dept.admin@university.edu' },
      update: {},
      create: {
        email: 'dept.admin@university.edu',
        username: 'deptadmin',
        password_hash: defaultPassword,
        first_name: 'Department',
        last_name: 'Admin',
        phone_number: '0300-2345678',
        email_verified: true,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Assign Department Admin Role
    await prisma.userrole.upsert({
      where: {
        userId_roleId: {
          userId: deptAdmin.id,
          roleId: roles[2].id, // department_admin role
        },
      },
      update: {},
      create: {
        userId: deptAdmin.id,
        roleId: roles[2].id,
        updatedAt: new Date(),
      },
    });

    // Create Child Admin User
    const childAdmin = await prisma.user.upsert({
      where: { email: 'child.admin@university.edu' },
      update: {},
      create: {
        email: 'child.admin@university.edu',
        username: 'childadmin',
        password_hash: defaultPassword,
        first_name: 'Child',
        last_name: 'Admin',
        phone_number: '0300-3456789',
        email_verified: true,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Assign Child Admin Role
    await prisma.userrole.upsert({
      where: {
        userId_roleId: {
          userId: childAdmin.id,
          roleId: roles[3].id, // child_admin role
        },
      },
      update: {},
      create: {
        userId: childAdmin.id,
        roleId: roles[3].id,
        updatedAt: new Date(),
      },
    });

    // Create Teacher User
    const teacher = await prisma.user.upsert({
      where: { email: 'teacher@university.edu' },
      update: {},
      create: {
        email: 'teacher@university.edu',
        username: 'teacher1',
        password_hash: defaultPassword,
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '0300-4567890',
        email_verified: true,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Assign Teacher Role
    await prisma.userrole.upsert({
      where: {
        userId_roleId: {
          userId: teacher.id,
          roleId: roles[4].id, // teacher role
        },
      },
      update: {},
      create: {
        userId: teacher.id,
        roleId: roles[4].id,
        updatedAt: new Date(),
      },
    });

    // Create Student User
    const student = await prisma.user.upsert({
      where: { email: 'student@university.edu' },
      update: {},
      create: {
        email: 'student@university.edu',
        username: 'student1',
        password_hash: defaultPassword,
        first_name: 'Student',
        last_name: 'One',
        phone_number: '0300-5678901',
        email_verified: true,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Assign Student Role
    await prisma.userrole.upsert({
      where: {
        userId_roleId: {
          userId: student.id,
          roleId: roles[5].id, // student role
        },
      },
      update: {},
      create: {
        userId: student.id,
        roleId: roles[5].id,
        updatedAt: new Date(),
      },
    });

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
