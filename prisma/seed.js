// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const defaultPassword = await bcrypt.hash('11223344', 10);

    // Create Roles using upsert
    const roles = await Promise.all([
      prisma.role.upsert({
        where: { name: 'super_admin' },
        update: {},
        create: {
          name: 'super_admin',
          description: 'Super Administrator with full access',
        },
      }),
      prisma.role.upsert({
        where: { name: 'department_admin' },
        update: {},
        create: {
          name: 'department_admin',
          description: 'Department Administrator',
        },
      }),
      prisma.role.upsert({
        where: { name: 'child_admin' },
        update: {},
        create: {
          name: 'child_admin',
          description: 'Sub-Department Administrator',
        },
      }),
      prisma.role.upsert({
        where: { name: 'teacher' },
        update: {},
        create: {
          name: 'teacher',
          description: 'Faculty Member',
        },
      }),
      prisma.role.upsert({
        where: { name: 'student' },
        update: {},
        create: {
          name: 'student',
          description: 'Student',
        },
      }),
    ]);

    // Create Super Admin
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
        roles: {
          create: {
            roleId: roles[0].id,
          },
        },
      },
    });

    // Create CS Department
    const csDepartment = await prisma.department.upsert({
      where: { code: 'CS' },
      update: {
        adminId: superAdmin.id,
      },
      create: {
        name: 'Computer Science',
        code: 'CS',
        description: 'Department of Computer Science',
        adminId: superAdmin.id,
        status: 'active',
      },
    });

    // Create Department Admin
    const deptAdmin = await prisma.user.upsert({
      where: { email: 'cs.admin@university.edu' },
      update: {},
      create: {
        email: 'cs.admin@university.edu',
        username: 'csadmin',
        password_hash: defaultPassword,
        first_name: 'Department',
        last_name: 'Admin',
        phone_number: '0300-2345678',
        email_verified: true,
        roles: {
          create: {
            roleId: roles[1].id,
          },
        },
      },
    });

    // Create BSCS Program
    const bscsProgram = await prisma.program.upsert({
      where: { code: 'BSCS' },
      update: {},
      create: {
        name: 'Bachelor of Science in Computer Science',
        code: 'BSCS',
        description: '4 Years BS Computer Science Program',
        duration: 8,
        totalCredit: 136,
        departmentId: csDepartment.id,
        status: 'active',
      },
    });

    // Create a Course
    const programmingCourse = await prisma.course.upsert({
      where: { code: 'CS101' },
      update: {},
      create: {
        code: 'CS101',
        name: 'Programming Fundamentals',
        description: 'Introduction to Programming',
        creditHours: 3,
        programId: bscsProgram.id,
        semester: 1,
        status: 'active',
      },
    });

    // Create Teacher
    const teacherUser = await prisma.user.upsert({
      where: { email: 'teacher@university.edu' },
      update: {},
      create: {
        email: 'teacher@university.edu',
        username: 'teacher1',
        password_hash: defaultPassword,
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '0300-3456789',
        email_verified: true,
        roles: {
          create: {
            roleId: roles[3].id,
          },
        },
      },
    });

    // Create Faculty Member
    const facultyMember = await prisma.faculty.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        employeeId: 'EMP001',
        departmentId: csDepartment.id,
        designation: 'Assistant Professor',
        joiningDate: new Date(),
        status: 'active',
      },
    });

    // Create Section
    // Since section might not have a unique constraint, we'll use create after deleting existing
    await prisma.section.deleteMany({
      where: {
        courseId: programmingCourse.id,
        name: 'A',
      },
    });

    const section = await prisma.section.create({
      data: {
        name: 'A',
        courseId: programmingCourse.id,
        facultyId: facultyMember.id,
        semester: 1,
        maxStudents: 50,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      },
    });

    // Create 5 Students
    for (let i = 0; i < 5; i++) {
      const email = `student${i + 1}@university.edu`;
      const studentUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          username: `student${i + 1}`,
          password_hash: defaultPassword,
          first_name: `Student${i + 1}`,
          last_name: 'Doe',
          phone_number: `0300-${1000000 + i}`,
          email_verified: true,
          roles: {
            create: {
              roleId: roles[4].id,
            },
          },
        },
      });

      // Create Student
      const rollNumber = `CS-2024-${(i + 1).toString().padStart(3, '0')}`;
      const student = await prisma.student.upsert({
        where: { rollNumber },
        update: {},
        create: {
          userId: studentUser.id,
          rollNumber,
          batch: '2024',
          admissionDate: new Date(),
          departmentId: csDepartment.id,
          programId: bscsProgram.id,
          status: 'active',
        },
      });

      // Delete existing enrollment if any
      await prisma.studentSection.deleteMany({
        where: {
          studentId: student.id,
          sectionId: section.id,
        },
      });

      // Create new enrollment
      await prisma.studentSection.create({
        data: {
          studentId: student.id,
          sectionId: section.id,
          status: 'active',
        },
      });
    }

    // Clear existing sessions and attendance
    await prisma.attendance.deleteMany({});
    await prisma.session.deleteMany({});

    // Create Sessions for the last week
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() - i);

      if (sessionDate.getDay() !== 0 && sessionDate.getDay() !== 6) {
        // Skip weekends
        const session = await prisma.session.create({
          data: {
            sectionId: section.id,
            date: sessionDate,
            startTime: new Date(sessionDate.setHours(9, 0, 0)),
            endTime: new Date(sessionDate.setHours(10, 30, 0)),
            topic: `Lecture ${i + 1}`,
            status: 'completed',
          },
        });

        // Get all students in the section
        const enrollments = await prisma.studentSection.findMany({
          where: { sectionId: section.id },
        });

        // Create attendance for each student
        for (const enrollment of enrollments) {
          await prisma.attendance.create({
            data: {
              studentSectionId: enrollment.id,
              sessionId: session.id,
              status: Math.random() > 0.2 ? 'present' : 'absent',
              markedBy: teacherUser.id,
              remarks: 'Regular class',
            },
          });
        }
      }
    }

    // Clear existing timetable slots
    await prisma.timetableSlot.deleteMany({});

    // Create Timetable Slots
    const slots = [
      { day: 1, startHour: 9, startMin: 0, endHour: 10, endMin: 30 }, // Monday
      { day: 3, startHour: 9, startMin: 0, endHour: 10, endMin: 30 }, // Wednesday
      { day: 5, startHour: 9, startMin: 0, endHour: 10, endMin: 30 }, // Friday
    ];

    for (const slot of slots) {
      const startTime = new Date();
      startTime.setHours(slot.startHour, slot.startMin, 0);

      const endTime = new Date();
      endTime.setHours(slot.endHour, slot.endMin, 0);

      await prisma.timetableSlot.create({
        data: {
          sectionId: section.id,
          dayOfWeek: slot.day,
          startTime,
          endTime,
          roomNumber: 'CS-01',
          status: 'active',
        },
      });
    }

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
