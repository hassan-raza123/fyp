// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    await prisma.userrole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    const defaultPassword = await bcrypt.hash('11223344', 10);

    // Create Roles
    const roles = await Promise.all([
      prisma.role.create({
        data: {
          name: 'super_admin',
          description: 'Super Administrator with full access',
          updatedAt: new Date(),
        },
      }),
      prisma.role.create({
        data: {
          name: 'sub_admin',
          description: 'Sub Administrator with restricted access',
          updatedAt: new Date(),
        },
      }),
      prisma.role.create({
        data: {
          name: 'department_admin',
          description: 'Department Administrator',
          updatedAt: new Date(),
        },
      }),
      prisma.role.create({
        data: {
          name: 'child_admin',
          description: 'Sub-Department Administrator',
          updatedAt: new Date(),
        },
      }),
      prisma.role.create({
        data: {
          name: 'teacher',
          description: 'Faculty Member',
          updatedAt: new Date(),
        },
      }),
      prisma.role.create({
        data: {
          name: 'student',
          description: 'Student',
          updatedAt: new Date(),
        },
      }),
    ]);

    // Create Super Admin User
    const superAdmin = await prisma.user.create({
      data: {
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
    await prisma.userrole.create({
      data: {
        userId: superAdmin.id,
        roleId: roles[0].id,
        updatedAt: new Date(),
      },
    });

    // Create Sub Admin User
    const subAdmin = await prisma.user.create({
      data: {
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
    await prisma.userrole.create({
      data: {
        userId: subAdmin.id,
        roleId: roles[1].id,
        updatedAt: new Date(),
      },
    });

    // Create Department Admin User
    const deptAdmin = await prisma.user.create({
      data: {
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
    await prisma.userrole.create({
      data: {
        userId: deptAdmin.id,
        roleId: roles[2].id,
        updatedAt: new Date(),
      },
    });

    // Create Child Admin User
    const childAdmin = await prisma.user.create({
      data: {
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
    await prisma.userrole.create({
      data: {
        userId: childAdmin.id,
        roleId: roles[3].id,
        updatedAt: new Date(),
      },
    });

    // Create Teacher User
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@university.edu',
        username: 'teacher',
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
    await prisma.userrole.create({
      data: {
        userId: teacher.id,
        roleId: roles[4].id,
        updatedAt: new Date(),
      },
    });

    // Create Student User
    const student = await prisma.user.create({
      data: {
        email: 'student@university.edu',
        username: 'student',
        password_hash: defaultPassword,
        first_name: 'Jane',
        last_name: 'Smith',
        phone_number: '0300-5678901',
        email_verified: true,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    // Assign Student Role
    await prisma.userrole.create({
      data: {
        userId: student.id,
        roleId: roles[5].id,
        updatedAt: new Date(),
      },
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
