// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data in correct order (following foreign key dependencies)
    console.log('Clearing existing data...');

    // Delete dependent records first
    await prisma.userroles.deleteMany();
    await prisma.attendances.deleteMany();
    await prisma.studentsections.deleteMany();
    await prisma.sessions.deleteMany();
    await prisma.timetableslots.deleteMany();
    await prisma.sections.deleteMany();
    await prisma.faculties.deleteMany();
    await prisma.students.deleteMany();
    await prisma.batches.deleteMany();
    await prisma.courses.deleteMany();
    await prisma.programs.deleteMany();
    await prisma.departments.deleteMany();
    await prisma.users.deleteMany();
    await prisma.roles.deleteMany();
    await prisma.permissions.deleteMany();

    const defaultPassword = await bcrypt.hash('11223344', 10);

    console.log('Creating permissions...');

    // Create permissions
    const permissions = await Promise.all([
      prisma.permissions.create({
        data: {
          name: 'user_management',
          description: 'Manage users and roles',
        },
      }),
      prisma.permissions.create({
        data: {
          name: 'department_management',
          description: 'Manage departments',
        },
      }),
      prisma.permissions.create({
        data: {
          name: 'course_management',
          description: 'Manage courses',
        },
      }),
      prisma.permissions.create({
        data: {
          name: 'attendance_management',
          description: 'Manage attendance',
        },
      }),
      prisma.permissions.create({
        data: {
          name: 'student_management',
          description: 'Manage students',
        },
      }),
    ]);

    console.log('Creating roles...');

    // Create roles with permissions
    const superAdminRole = await prisma.roles.create({
      data: {
        name: 'super_admin',
        description: 'Super Admin Role',
        permissions: {
          connect: permissions.map((p) => ({ id: p.id })),
        },
      },
    });

    const subAdminRole = await prisma.roles.create({
      data: {
        name: 'sub_admin',
        description: 'Sub Admin Role',
        permissions: {
          connect: permissions.slice(1).map((p) => ({ id: p.id })),
        },
      },
    });

    const departmentAdminRole = await prisma.roles.create({
      data: {
        name: 'department_admin',
        description: 'Department Admin Role',
        permissions: {
          connect: permissions.slice(2).map((p) => ({ id: p.id })),
        },
      },
    });

    const childAdminRole = await prisma.roles.create({
      data: {
        name: 'child_admin',
        description: 'Child Admin Role',
        permissions: {
          connect: [permissions[3], permissions[4]].map((p) => ({ id: p.id })),
        },
      },
    });

    const teacherRole = await prisma.roles.create({
      data: {
        name: 'teacher',
        description: 'Teacher Role',
        permissions: {
          connect: [permissions[3]].map((p) => ({ id: p.id })),
        },
      },
    });

    const studentRole = await prisma.roles.create({
      data: {
        name: 'student',
        description: 'Student Role',
      },
    });

    console.log('Creating super admin users...');

    // Create super admin users with incrementing numbers
    const adminEmails = [
      'itzhassanraza276@gmail.com',
      'itzhassanraza276+1@gmail.com',
      'itzhassanraza276+2@gmail.com',
      'itzhassanraza276+3@gmail.com',
      'itzhassanraza276+4@gmail.com',
    ];

    for (let i = 0; i < adminEmails.length; i++) {
      const admin = await prisma.users.create({
        data: {
          email: adminEmails[i],
          username: `admin${i + 1}`,
          password_hash: defaultPassword,
          first_name: 'Super',
          last_name: `Admin ${i + 1}`,
          status: 'active',
          email_verified: true,
          userrole: {
            create: {
              roleId: superAdminRole.id,
            },
          },
        },
      });
      console.log(`Created super admin: ${admin.email}`);
    }

    console.log('Creating other admin users...');

    // Create sub admin
    const subAdmin = await prisma.users.create({
      data: {
        email: 'sub.admin@university.edu',
        username: 'subadmin',
        password_hash: defaultPassword,
        first_name: 'Sub',
        last_name: 'Admin',
        status: 'active',
        email_verified: true,
        userrole: {
          create: {
            roleId: subAdminRole.id,
          },
        },
      },
    });

    // Create department admin
    const deptAdmin = await prisma.users.create({
      data: {
        email: 'dept.admin@university.edu',
        username: 'deptadmin',
        password_hash: defaultPassword,
        first_name: 'Department',
        last_name: 'Admin',
        status: 'active',
        email_verified: true,
        userrole: {
          create: {
            roleId: departmentAdminRole.id,
          },
        },
      },
    });

    // Create child admin
    const childAdmin = await prisma.users.create({
      data: {
        email: 'child.admin@university.edu',
        username: 'childadmin',
        password_hash: defaultPassword,
        first_name: 'Child',
        last_name: 'Admin',
        status: 'active',
        email_verified: true,
        userrole: {
          create: {
            roleId: childAdminRole.id,
          },
        },
      },
    });

    // Create teacher
    const teacher = await prisma.users.create({
      data: {
        email: 'teacher@university.edu',
        username: 'teacher',
        password_hash: defaultPassword,
        first_name: 'John',
        last_name: 'Doe',
        status: 'active',
        email_verified: true,
        userrole: {
          create: {
            roleId: teacherRole.id,
          },
        },
      },
    });

    // Create student user
    const studentUser = await prisma.users.create({
      data: {
        email: 'student@university.edu',
        username: 'student',
        password_hash: defaultPassword,
        first_name: 'Jane',
        last_name: 'Smith',
        status: 'active',
        email_verified: true,
        userrole: {
          create: {
            roleId: studentRole.id,
          },
        },
      },
    });

    console.log('Creating departments...');

    // Create departments
    const csDepartment = await prisma.departments.create({
      data: {
        name: 'Computer Science',
        code: 'CS',
        status: 'active',
        adminId: deptAdmin.id,
        description: 'Department of Computer Science',
      },
    });

    const mathDepartment = await prisma.departments.create({
      data: {
        name: 'Mathematics',
        code: 'MATH',
        status: 'active',
        description: 'Department of Mathematics',
      },
    });

    console.log('Creating programs...');

    // Create programs
    const bscsProgram = await prisma.programs.create({
      data: {
        name: 'BS Computer Science',
        code: 'BSCS',
        departmentId: csDepartment.id,
        duration: 4,
        description: 'Bachelor of Science in Computer Science',
        status: 'active',
        totalCreditHours: 130,
      },
    });

    const mscsProgram = await prisma.programs.create({
      data: {
        name: 'MS Computer Science',
        code: 'MSCS',
        departmentId: csDepartment.id,
        duration: 2,
        description: 'Master of Science in Computer Science',
        status: 'active',
        totalCreditHours: 60,
      },
    });

    console.log('Creating batches...');

    // Create batches
    const batch2024 = await prisma.batches.create({
      data: {
        name: 'Fall 2024',
        code: 'F2024',
        startDate: new Date('2024-09-01T00:00:00.000Z'),
        endDate: new Date('2028-06-30T00:00:00.000Z'),
        maxStudents: 50,
        description: 'Fall 2024 intake',
        status: 'active',
        programId: bscsProgram.id,
      },
    });

    const batch2023 = await prisma.batches.create({
      data: {
        name: 'Fall 2023',
        code: 'F2023',
        startDate: new Date('2023-09-01T00:00:00.000Z'),
        endDate: new Date('2027-06-30T00:00:00.000Z'),
        maxStudents: 50,
        description: 'Fall 2023 intake',
        status: 'active',
        programId: bscsProgram.id,
      },
    });

    console.log('Creating courses...');

    // Create courses
    const programmingCourse = await prisma.courses.create({
      data: {
        code: 'CS101',
        name: 'Programming Fundamentals',
        description: 'Introduction to programming concepts',
        creditHours: 3,
        labHours: 2,
        theoryHours: 1,
        type: 'THEORY',
        status: 'active',
        departmentId: csDepartment.id,
      },
    });

    const dsCourse = await prisma.courses.create({
      data: {
        code: 'CS201',
        name: 'Data Structures',
        description: 'Fundamental data structures and algorithms',
        creditHours: 3,
        labHours: 2,
        theoryHours: 1,
        type: 'THEORY',
        status: 'active',
        departmentId: csDepartment.id,
        requiredBy: {
          connect: { id: programmingCourse.id },
        },
      },
    });

    // Connect courses to programs
    await prisma.programs.update({
      where: { id: bscsProgram.id },
      data: {
        courses: {
          connect: [{ id: programmingCourse.id }, { id: dsCourse.id }],
        },
      },
    });

    console.log('Creating faculty...');

    // Create faculty
    const faculty = await prisma.faculties.create({
      data: {
        userId: teacher.id,
        departmentId: csDepartment.id,
        designation: 'Assistant Professor',
        status: 'active',
        courses: {
          connect: [{ id: programmingCourse.id }, { id: dsCourse.id }],
        },
      },
    });

    console.log('Creating student...');

    // Create student
    const student = await prisma.students.create({
      data: {
        rollNumber: 'BSCS-2024-001',
        userId: studentUser.id,
        departmentId: csDepartment.id,
        programId: bscsProgram.id,
        batchId: batch2024.id,
        status: 'active',
      },
    });

    console.log('Creating a semester');

    // Create a semester
    const semester = await prisma.semesters.create({
      data: {
        name: 'Fall 2024',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-15'),
        status: 'active',
      },
    });

    // Create a course offering for programmingCourse
    const offering = await prisma.courseofferings.create({
      data: {
        courseId: programmingCourse.id,
        semesterId: semester.id,
        status: 'active',
      },
    });

    console.log('Creating sections...');

    // Create sections
    const section1 = await prisma.sections.create({
      data: {
        name: 'CS101-A',
        courseOfferingId: offering.id,
        facultyId: faculty.id,
        batchId: batch2024.id,
        maxStudents: 30,
        status: 'active',
      },
    });

    console.log('Creating student sections...');

    // Enroll student in section
    const studentSection = await prisma.studentsections.create({
      data: {
        studentId: student.id,
        sectionId: section1.id,
        status: 'active',
      },
    });

    console.log('Creating timetable slots...');

    // Create timetable slots
    await prisma.timetableslots.create({
      data: {
        sectionId: section1.id,
        dayOfWeek: 1, // Monday
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T10:30:00Z'),
        roomNumber: 'CS-Lab-1',
        status: 'active',
      },
    });

    console.log('Creating sessions...');

    // Create a session
    const session1 = await prisma.sessions.create({
      data: {
        sectionId: section1.id,
        date: new Date('2024-09-02'),
        startTime: new Date('2024-09-02T09:00:00Z'),
        endTime: new Date('2024-09-02T10:30:00Z'),
        topic: 'Introduction to Programming',
        status: 'completed',
      },
    });

    console.log('Creating attendance records...');

    // Create attendance record
    await prisma.attendances.create({
      data: {
        studentSectionId: studentSection.id, // Use the actual studentSection ID
        sessionId: session1.id,
        status: 'present',
        markedBy: teacher.id,
      },
    });

    console.log('Database seeded successfully!');
    console.log('\n=== Login Credentials ===');
    console.log('Super Admin: itzhassanraza276@gmail.com / 11223344');
    console.log('Sub Admin: sub.admin@university.edu / 11223344');
    console.log('Dept Admin: dept.admin@university.edu / 11223344');
    console.log('Child Admin: child.admin@university.edu / 11223344');
    console.log('Teacher: teacher@university.edu / 11223344');
    console.log('Student: student@university.edu / 11223344');
    console.log('========================\n');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
