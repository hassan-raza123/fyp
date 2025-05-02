// prisma/seed.js
const { PrismaClient, user_status } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data in correct order
    await prisma.userrole.deleteMany();
    await prisma.faculty.deleteMany();
    await prisma.student.deleteMany();
    await prisma.program.deleteMany();
    await prisma.department.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    const defaultPassword = await bcrypt.hash('11223344', 10);

    // Create roles
    const superAdminRole = await prisma.role.create({
      data: {
        name: 'super_admin',
        description: 'Super Admin Role',
      },
    });

    const subAdminRole = await prisma.role.create({
      data: {
        name: 'sub_admin',
        description: 'Sub Admin Role',
      },
    });

    const departmentAdminRole = await prisma.role.create({
      data: {
        name: 'department_admin',
        description: 'Department Admin Role',
      },
    });

    const childAdminRole = await prisma.role.create({
      data: {
        name: 'child_admin',
        description: 'Child Admin Role',
      },
    });

    const teacherRole = await prisma.role.create({
      data: {
        name: 'teacher',
        description: 'Teacher Role',
      },
    });

    const studentRole = await prisma.role.create({
      data: {
        name: 'student',
        description: 'Student Role',
      },
    });

    // Create super admin users with incrementing numbers
    const adminEmails = [
      'itzhassanraza276@gmail.com',
      'itzhassanraza276+1@gmail.com',
      'itzhassanraza276+2@gmail.com',
      'itzhassanraza276+3@gmail.com',
      'itzhassanraza276+4@gmail.com',
    ];

    for (let i = 0; i < adminEmails.length; i++) {
      const admin = await prisma.user.create({
        data: {
          email: adminEmails[i],
          username: `admin${i + 1}`,
          password_hash: defaultPassword,
          first_name: 'Super',
          last_name: `Admin ${i + 1}`,
          status: user_status.active,
          email_verified: true,
          userrole: {
            create: {
              roleId: superAdminRole.id,
            },
          },
        },
      });
    }

    // Create sub admin
    const subAdmin = await prisma.user.create({
      data: {
        email: 'sub.admin@university.edu',
        username: 'subadmin',
        password_hash: defaultPassword,
        first_name: 'Sub',
        last_name: 'Admin',
        status: user_status.active,
        email_verified: true,
        userrole: {
          create: {
            roleId: subAdminRole.id,
          },
        },
      },
    });

    // Create department admin
    const deptAdmin = await prisma.user.create({
      data: {
        email: 'dept.admin@university.edu',
        username: 'deptadmin',
        password_hash: defaultPassword,
        first_name: 'Department',
        last_name: 'Admin',
        status: user_status.active,
        email_verified: true,
        userrole: {
          create: {
            roleId: departmentAdminRole.id,
          },
        },
      },
    });

    // Create child admin
    const childAdmin = await prisma.user.create({
      data: {
        email: 'child.admin@university.edu',
        username: 'childadmin',
        password_hash: defaultPassword,
        first_name: 'Child',
        last_name: 'Admin',
        status: user_status.active,
        email_verified: true,
        userrole: {
          create: {
            roleId: childAdminRole.id,
          },
        },
      },
    });

    // Create teacher
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@university.edu',
        username: 'teacher',
        password_hash: defaultPassword,
        first_name: 'John',
        last_name: 'Doe',
        status: user_status.active,
        email_verified: true,
        userrole: {
          create: {
            roleId: teacherRole.id,
          },
        },
      },
    });

    // Create student
    const student = await prisma.user.create({
      data: {
        email: 'student@university.edu',
        username: 'student',
        password_hash: defaultPassword,
        first_name: 'Jane',
        last_name: 'Smith',
        status: user_status.active,
        email_verified: true,
        userrole: {
          create: {
            roleId: studentRole.id,
          },
        },
      },
    });

    // Create a department
    const department = await prisma.department.create({
      data: {
        name: 'Computer Science',
        code: 'CS',
        status: 'active',
        adminId: subAdmin.id,
      },
    });

    // Create a program
    const program = await prisma.program.create({
      data: {
        name: 'BS Computer Science',
        code: 'BSCS',
        departmentId: department.id,
        duration: 4,
        description: 'Bachelor of Science in Computer Science',
        status: 'active',
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
