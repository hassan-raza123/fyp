// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting database seeding...');

    // Clear existing data in correct order (following foreign key dependencies)
    console.log('🧹 Clearing existing data...');

    // Delete in reverse dependency order
    await prisma.obereports.deleteMany();
    await prisma.facultyfeedbacks.deleteMany();
    await prisma.coursefeedbacks.deleteMany();
    await prisma.examattendance.deleteMany();
    await prisma.datesheetentries.deleteMany();
    await prisma.examschedules.deleteMany();
    await prisma.datesheets.deleteMany();
    await prisma.transcripts.deleteMany();
    await prisma.attendances.deleteMany();
    await prisma.timetableslots.deleteMany();
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
    await prisma.closattainments.deleteMany();
    await prisma.cloplomappings.deleteMany();
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
    await prisma.userroles.deleteMany();
    await prisma.users.deleteMany();
    await prisma.roles.deleteMany();
    await prisma.permissions.deleteMany();
    await prisma.auditlogs.deleteMany();
    await prisma.notifications.deleteMany();
    await prisma.passwordresets.deleteMany();

    const defaultPassword = await bcrypt.hash('11223344', 10);

    console.log('👮 Creating permissions...');

    // Create comprehensive permissions
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
        data: { name: 'program_management', description: 'Manage programs' },
      }),
      prisma.permissions.create({
        data: { name: 'course_management', description: 'Manage courses' },
      }),
      prisma.permissions.create({
        data: { name: 'semester_management', description: 'Manage semesters' },
      }),
      prisma.permissions.create({
        data: { name: 'batch_management', description: 'Manage batches' },
      }),
      prisma.permissions.create({
        data: { name: 'student_management', description: 'Manage students' },
      }),
      prisma.permissions.create({
        data: { name: 'faculty_management', description: 'Manage faculty' },
      }),
      prisma.permissions.create({
        data: {
          name: 'attendance_management',
          description: 'Manage attendance',
        },
      }),
      prisma.permissions.create({
        data: {
          name: 'assessment_management',
          description: 'Manage assessments',
        },
      }),
      prisma.permissions.create({
        data: { name: 'grade_management', description: 'Manage grades' },
      }),
      prisma.permissions.create({
        data: { name: 'obe_management', description: 'Manage OBE system' },
      }),
      prisma.permissions.create({
        data: {
          name: 'timetable_management',
          description: 'Manage timetables',
        },
      }),
      prisma.permissions.create({
        data: {
          name: 'datesheet_management',
          description: 'Manage datesheets',
        },
      }),
      prisma.permissions.create({
        data: { name: 'report_management', description: 'Generate reports' },
      }),
    ]);

    console.log('🔐 Creating roles...');

    // Create roles with permissions
    const superAdminRole = await prisma.roles.create({
      data: {
        name: 'super_admin',
        description: 'Super Administrator with full access',
        permissions: { connect: permissions.map((p) => ({ id: p.id })) },
      },
    });

    const adminRole = await prisma.roles.create({
      data: {
        name: 'admin',
        description: 'System Administrator',
        permissions: {
          connect: permissions.slice(1).map((p) => ({ id: p.id })),
        },
      },
    });

    const deptAdminRole = await prisma.roles.create({
      data: {
        name: 'department_admin',
        description: 'Department Administrator',
        permissions: {
          connect: permissions.slice(2, 12).map((p) => ({ id: p.id })),
        },
      },
    });

    const facultyRole = await prisma.roles.create({
      data: {
        name: 'faculty',
        description: 'Faculty Member',
        permissions: {
          connect: permissions.slice(8, 14).map((p) => ({ id: p.id })),
        },
      },
    });

    const studentRole = await prisma.roles.create({
      data: { name: 'student', description: 'Student' },
    });

    console.log('👤 Creating users...');

    // Create Super Admin
    const superAdmin = await prisma.users.create({
      data: {
        email: 'itzhassanraza276@gmail.com',
        username: 'superadmin',
        password_hash: defaultPassword,
        first_name: 'Hassan',
        last_name: 'Raza',
        phone_number: '+92-300-1234567',
        status: 'active',
        email_verified: true,
        userrole: { create: { roleId: superAdminRole.id } },
      },
    });

    // Create Admin
    const admin = await prisma.users.create({
      data: {
        email: 'admin@university.edu',
        username: 'admin',
        password_hash: defaultPassword,
        first_name: 'System',
        last_name: 'Administrator',
        phone_number: '+92-300-2234567',
        status: 'active',
        email_verified: true,
        userrole: { create: { roleId: adminRole.id } },
      },
    });

    // Create Department Admin
    const deptAdmin = await prisma.users.create({
      data: {
        email: 'dept.admin@university.edu',
        username: 'deptadmin',
        password_hash: defaultPassword,
        first_name: 'Department',
        last_name: 'Head',
        phone_number: '+92-300-3234567',
        status: 'active',
        email_verified: true,
        userrole: { create: { roleId: deptAdminRole.id } },
      },
    });

    // Create Faculty Users
    const facultyUsers = [];
    const facultyData = [
      {
        email: 'dr.ahmed@university.edu',
        firstName: 'Dr. Ahmed',
        lastName: 'Khan',
      },
      {
        email: 'prof.fatima@university.edu',
        firstName: 'Prof. Fatima',
        lastName: 'Ali',
      },
      {
        email: 'dr.hassan@university.edu',
        firstName: 'Dr. Hassan',
        lastName: 'Sheikh',
      },
      {
        email: 'ms.sara@university.edu',
        firstName: 'Ms. Sara',
        lastName: 'Ahmad',
      },
      {
        email: 'dr.usman@university.edu',
        firstName: 'Dr. Usman',
        lastName: 'Malik',
      },
    ];

    for (const [index, data] of facultyData.entries()) {
      const user = await prisma.users.create({
        data: {
          email: data.email,
          username: `faculty${index + 1}`,
          password_hash: defaultPassword,
          first_name: data.firstName,
          last_name: data.lastName,
          phone_number: `+92-300-${4234567 + index}`,
          status: 'active',
          email_verified: true,
          userrole: { create: { roleId: facultyRole.id } },
        },
      });
      facultyUsers.push(user);
    }

    // Create Student Users
    const studentUsers = [];
    const studentData = [
      {
        email: 'ali.student@university.edu',
        firstName: 'Ali',
        lastName: 'Hassan',
      },
      {
        email: 'sara.student@university.edu',
        firstName: 'Sara',
        lastName: 'Khan',
      },
      {
        email: 'ahmed.student@university.edu',
        firstName: 'Ahmed',
        lastName: 'Ali',
      },
      {
        email: 'fatima.student@university.edu',
        firstName: 'Fatima',
        lastName: 'Sheikh',
      },
      {
        email: 'usman.student@university.edu',
        firstName: 'Usman',
        lastName: 'Ahmad',
      },
      {
        email: 'maria.student@university.edu',
        firstName: 'Maria',
        lastName: 'Khan',
      },
      {
        email: 'hassan.student@university.edu',
        firstName: 'Hassan',
        lastName: 'Ali',
      },
      {
        email: 'zara.student@university.edu',
        firstName: 'Zara',
        lastName: 'Ahmad',
      },
    ];

    for (const [index, data] of studentData.entries()) {
      const user = await prisma.users.create({
        data: {
          email: data.email,
          username: `student${index + 1}`,
          password_hash: defaultPassword,
          first_name: data.firstName,
          last_name: data.lastName,
          phone_number: `+92-300-${5234567 + index}`,
          status: 'active',
          email_verified: true,
          userrole: { create: { roleId: studentRole.id } },
        },
      });
      studentUsers.push(user);
    }

    console.log('🏢 Creating departments...');

    // Create Departments
    const departments = await Promise.all([
      prisma.departments.create({
        data: {
          name: 'Computer Science',
          code: 'CS',
          description: 'Department of Computer Science & Software Engineering',
          status: 'active',
          adminId: deptAdmin.id,
        },
      }),
      prisma.departments.create({
        data: {
          name: 'Information Technology',
          code: 'IT',
          description: 'Department of Information Technology',
          status: 'active',
        },
      }),
      prisma.departments.create({
        data: {
          name: 'Software Engineering',
          code: 'SE',
          description: 'Department of Software Engineering',
          status: 'active',
        },
      }),
      prisma.departments.create({
        data: {
          name: 'Mathematics',
          code: 'MATH',
          description: 'Department of Mathematics',
          status: 'active',
        },
      }),
      prisma.departments.create({
        data: {
          name: 'English',
          code: 'ENG',
          description: 'Department of English',
          status: 'active',
        },
      }),
    ]);

    console.log('🎓 Creating programs...');

    // Create Programs
    const programs = await Promise.all([
      prisma.programs.create({
        data: {
          name: 'BS Computer Science',
          code: 'BSCS',
          description: 'Bachelor of Science in Computer Science',
          duration: 8,
          departmentId: departments[0].id,
          totalCreditHours: 136,
          status: 'active',
        },
      }),
      prisma.programs.create({
        data: {
          name: 'BS Information Technology',
          code: 'BSIT',
          description: 'Bachelor of Science in Information Technology',
          duration: 8,
          departmentId: departments[1].id,
          totalCreditHours: 136,
          status: 'active',
        },
      }),
      prisma.programs.create({
        data: {
          name: 'BS Software Engineering',
          code: 'BSSE',
          description: 'Bachelor of Science in Software Engineering',
          duration: 8,
          departmentId: departments[2].id,
          totalCreditHours: 136,
          status: 'active',
        },
      }),
      prisma.programs.create({
        data: {
          name: 'MS Computer Science',
          code: 'MSCS',
          description: 'Master of Science in Computer Science',
          duration: 4,
          departmentId: departments[0].id,
          totalCreditHours: 60,
          status: 'active',
        },
      }),
    ]);

    console.log('📚 Creating courses...');

    // Create Courses
    const courses = await Promise.all([
      prisma.courses.create({
        data: {
          code: 'CS101',
          name: 'Programming Fundamentals',
          description: 'Introduction to programming concepts using C++',
          creditHours: 4,
          labHours: 3,
          theoryHours: 1,
          type: 'THEORY',
          departmentId: departments[0].id,
          status: 'active',
        },
      }),
      prisma.courses.create({
        data: {
          code: 'CS201',
          name: 'Data Structures & Algorithms',
          description: 'Fundamental data structures and algorithms',
          creditHours: 4,
          labHours: 3,
          theoryHours: 1,
          type: 'THEORY',
          departmentId: departments[0].id,
          status: 'active',
        },
      }),
      prisma.courses.create({
        data: {
          code: 'CS301',
          name: 'Database Systems',
          description: 'Database design and management systems',
          creditHours: 3,
          labHours: 2,
          theoryHours: 1,
          type: 'THEORY',
          departmentId: departments[0].id,
          status: 'active',
        },
      }),
      prisma.courses.create({
        data: {
          code: 'CS401',
          name: 'Software Engineering',
          description: 'Software development methodologies and practices',
          creditHours: 3,
          labHours: 1,
          theoryHours: 2,
          type: 'THEORY',
          departmentId: departments[0].id,
          status: 'active',
        },
      }),
      prisma.courses.create({
        data: {
          code: 'CS501',
          name: 'Operating Systems',
          description: 'Operating system concepts and implementation',
          creditHours: 3,
          labHours: 1,
          theoryHours: 2,
          type: 'THEORY',
          departmentId: departments[0].id,
          status: 'active',
        },
      }),
      prisma.courses.create({
        data: {
          code: 'MATH101',
          name: 'Calculus & Analytical Geometry',
          description: 'Fundamental mathematics for computer science',
          creditHours: 3,
          labHours: 0,
          theoryHours: 3,
          type: 'THEORY',
          departmentId: departments[3].id,
          status: 'active',
        },
      }),
      prisma.courses.create({
        data: {
          code: 'ENG101',
          name: 'Functional English',
          description: 'English language and communication skills',
          creditHours: 3,
          labHours: 0,
          theoryHours: 3,
          type: 'THEORY',
          departmentId: departments[4].id,
          status: 'active',
        },
      }),
    ]);

    // Connect courses to programs
    await prisma.programs.update({
      where: { id: programs[0].id },
      data: { courses: { connect: courses.map((c) => ({ id: c.id })) } },
    });

    console.log('📅 Creating semesters...');

    // Create Semesters
    const semesters = await Promise.all([
      prisma.semesters.create({
        data: {
          name: 'Fall 2024',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-31'),
          status: 'active',
        },
      }),
      prisma.semesters.create({
        data: {
          name: 'Spring 2024',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-05-31'),
          status: 'completed',
        },
      }),
      prisma.semesters.create({
        data: {
          name: 'Fall 2023',
          startDate: new Date('2023-09-01'),
          endDate: new Date('2023-12-31'),
          status: 'completed',
        },
      }),
      prisma.semesters.create({
        data: {
          name: 'Spring 2025',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-05-31'),
          status: 'inactive',
        },
      }),
    ]);

    console.log('👥 Creating batches...');

    // Create Batches
    const batches = await Promise.all([
      prisma.batches.create({
        data: {
          name: 'Fall 2024 - BSCS',
          code: 'F24-BSCS',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2028-06-30'),
          maxStudents: 40,
          description: 'Fall 2024 BSCS intake',
          programId: programs[0].id,
          status: 'active',
        },
      }),
      prisma.batches.create({
        data: {
          name: 'Fall 2024 - BSIT',
          code: 'F24-BSIT',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2028-06-30'),
          maxStudents: 35,
          description: 'Fall 2024 BSIT intake',
          programId: programs[1].id,
          status: 'active',
        },
      }),
      prisma.batches.create({
        data: {
          name: 'Spring 2024 - BSCS',
          code: 'S24-BSCS',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2027-12-31'),
          maxStudents: 40,
          description: 'Spring 2024 BSCS intake',
          programId: programs[0].id,
          status: 'active',
        },
      }),
    ]);

    console.log('🏫 Creating course offerings...');

    // Create Course Offerings
    const courseOfferings = [];
    for (const course of courses) {
      for (const semester of semesters.slice(0, 2)) {
        // Only active semesters
        const offering = await prisma.courseofferings.create({
          data: {
            courseId: course.id,
            semesterId: semester.id,
            status: 'active',
          },
        });
        courseOfferings.push(offering);
      }
    }

    console.log('👨‍🏫 Creating faculty members...');

    // Create Faculty
    const facultyMembers = [];
    for (const [index, user] of facultyUsers.entries()) {
      const faculty = await prisma.faculties.create({
        data: {
          userId: user.id,
          departmentId: departments[index % departments.length].id,
          designation: [
            'Professor',
            'Associate Professor',
            'Assistant Professor',
            'Lecturer',
            'Senior Lecturer',
          ][index],
          status: 'active',
        },
      });
      facultyMembers.push(faculty);
    }

    console.log('👨‍🎓 Creating students...');

    // Create Students
    const students = [];
    for (const [index, user] of studentUsers.entries()) {
      const student = await prisma.students.create({
        data: {
          rollNumber: `BSCS-2024-${String(index + 1).padStart(3, '0')}`,
          userId: user.id,
          departmentId: departments[0].id, // CS department
          programId: programs[0].id, // BSCS program
          batchId: batches[0].id, // Fall 2024 batch
          status: 'active',
        },
      });
      students.push(student);
    }

    console.log('🏛️ Creating sections...');

    // Create Sections
    const sections = [];
    for (const [index, offering] of courseOfferings.slice(0, 7).entries()) {
      const section = await prisma.sections.create({
        data: {
          name: `${courses[index % courses.length].code}-A`,
          courseOfferingId: offering.id,
          facultyId: facultyMembers[index % facultyMembers.length].id,
          batchId: batches[0].id,
          maxStudents: 30,
          status: 'active',
        },
      });
      sections.push(section);
    }

    console.log('📝 Creating student sections (enrollments)...');

    // Create Student Sections (Enrollments)
    const studentSections = [];
    for (const student of students) {
      for (const section of sections.slice(0, 5)) {
        // Enroll in 5 sections
        const studentSection = await prisma.studentsections.create({
          data: {
            studentId: student.id,
            sectionId: section.id,
            status: 'active',
          },
        });
        studentSections.push(studentSection);
      }
    }

    console.log('📊 Creating grade scales...');

    // Create Grade Scales for all programs
    const gradeData = [
      {
        grade: 'A+',
        minPercent: 95.0,
        maxPercent: 100.0,
        gpaValue: 4.0,
        description: 'Excellent',
      },
      {
        grade: 'A',
        minPercent: 90.0,
        maxPercent: 94.9,
        gpaValue: 4.0,
        description: 'Excellent',
      },
      {
        grade: 'A-',
        minPercent: 85.0,
        maxPercent: 89.9,
        gpaValue: 3.7,
        description: 'Very Good',
      },
      {
        grade: 'B+',
        minPercent: 80.0,
        maxPercent: 84.9,
        gpaValue: 3.3,
        description: 'Good',
      },
      {
        grade: 'B',
        minPercent: 75.0,
        maxPercent: 79.9,
        gpaValue: 3.0,
        description: 'Good',
      },
      {
        grade: 'B-',
        minPercent: 70.0,
        maxPercent: 74.9,
        gpaValue: 2.7,
        description: 'Satisfactory',
      },
      {
        grade: 'C+',
        minPercent: 65.0,
        maxPercent: 69.9,
        gpaValue: 2.3,
        description: 'Satisfactory',
      },
      {
        grade: 'C',
        minPercent: 60.0,
        maxPercent: 64.9,
        gpaValue: 2.0,
        description: 'Pass',
      },
      {
        grade: 'C-',
        minPercent: 55.0,
        maxPercent: 59.9,
        gpaValue: 1.7,
        description: 'Pass',
      },
      {
        grade: 'D+',
        minPercent: 50.0,
        maxPercent: 54.9,
        gpaValue: 1.3,
        description: 'Pass',
      },
      {
        grade: 'D',
        minPercent: 45.0,
        maxPercent: 49.9,
        gpaValue: 1.0,
        description: 'Pass',
      },
      {
        grade: 'F',
        minPercent: 0.0,
        maxPercent: 44.9,
        gpaValue: 0.0,
        description: 'Fail',
      },
    ];

    const gradeScales = [];
    for (const program of programs) {
      for (const gradeInfo of gradeData) {
        const gradeScale = await prisma.gradescales.create({
          data: {
            programId: program.id,
            ...gradeInfo,
          },
        });
        gradeScales.push(gradeScale);
      }
    }

    console.log('🎯 Creating PLOs...');

    // Create PLOs (Program Learning Outcomes) for each program
    const ploData = [
      {
        code: 'PLO1',
        description:
          'Apply knowledge of computing and mathematics appropriate to the program outcomes and to the discipline',
        bloomLevel: 'Apply',
      },
      {
        code: 'PLO2',
        description:
          'Analyze a problem, and identify and define the computing requirements appropriate to its solution',
        bloomLevel: 'Analyze',
      },
      {
        code: 'PLO3',
        description:
          'Design, implement, and evaluate a computer-based solution to meet a given set of computing requirements',
        bloomLevel: 'Create',
      },
      {
        code: 'PLO4',
        description:
          'Function effectively as a member of a team to accomplish a common goal',
        bloomLevel: 'Apply',
      },
      {
        code: 'PLO5',
        description:
          'Understand professional, ethical, legal, security and social issues and responsibilities',
        bloomLevel: 'Understand',
      },
    ];

    const plos = [];
    for (const program of programs) {
      for (const ploInfo of ploData) {
        const plo = await prisma.plos.create({
          data: {
            ...ploInfo,
            programId: program.id,
            status: 'active',
          },
        });
        plos.push(plo);
      }
    }

    console.log('🎯 Creating CLOs...');

    // Create CLOs (Course Learning Outcomes)
    const clos = [];
    for (const course of courses) {
      for (let i = 1; i <= 4; i++) {
        const clo = await prisma.clos.create({
          data: {
            code: `CLO${i}`,
            description: `Students will be able to ${
              i === 1
                ? 'understand basic concepts'
                : i === 2
                ? 'apply theoretical knowledge'
                : i === 3
                ? 'analyze complex problems'
                : 'evaluate and create solutions'
            } related to ${course.name}`,
            courseId: course.id,
            bloomLevel: ['Remember', 'Understand', 'Apply', 'Analyze'][i - 1],
            status: 'active',
          },
        });
        clos.push(clo);
      }
    }

    console.log('🔗 Creating CLO-PLO mappings...');

    // Create CLO-PLO Mappings
    const cloMappings = [];
    for (const [index, clo] of clos.entries()) {
      // Map each CLO to 1-2 PLOs
      const ploIndex =
        index % plos.filter((p) => p.programId === programs[0].id).length;
      const relevantPlos = plos.filter((p) => p.programId === programs[0].id);

      const mapping = await prisma.cloplomappings.create({
        data: {
          cloId: clo.id,
          ploId: relevantPlos[ploIndex].id,
          weight: 1.0,
        },
      });
      cloMappings.push(mapping);
    }

    console.log('📋 Creating assessments...');

    // Create Assessments
    const assessments = [];
    const assessmentTypes = [
      'quiz',
      'mid_exam',
      'final_exam',
      'assignment',
      'presentation',
      'lab_exam',
      'project',
    ];

    for (const [index, offering] of courseOfferings.slice(0, 10).entries()) {
      for (let i = 0; i < 3; i++) {
        // 3 assessments per course offering
        const assessment = await prisma.assessments.create({
          data: {
            title: `${assessmentTypes[(index + i) % assessmentTypes.length]} ${
              i + 1
            } - ${courses[index % courses.length].name}`,
            description: `${
              assessmentTypes[(index + i) % assessmentTypes.length]
            } for ${courses[index % courses.length].name}`,
            type: assessmentTypes[(index + i) % assessmentTypes.length],
            totalMarks: 100,
            weightage: [15, 35, 50][i], // Quiz, Mid, Final weightage
            courseOfferingId: offering.id,
            conductedBy: facultyMembers[index % facultyMembers.length].id,
            dueDate: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000), // 30, 60, 90 days from now
            instructions:
              'Complete all questions within the given time limit. Good luck!',
            status: 'active',
          },
        });
        assessments.push(assessment);
      }
    }

    console.log('❓ Creating assessment items...');

    // Create Assessment Items
    const assessmentItems = [];
    for (const [assessmentIndex, assessment] of assessments.entries()) {
      const numQuestions = Math.floor(Math.random() * 5) + 3; // 3-7 questions per assessment
      for (let i = 1; i <= numQuestions; i++) {
        const item = await prisma.assessmentitems.create({
          data: {
            assessmentId: assessment.id,
            questionNo: `Q${i}`,
            description: `Question ${i}: Solve the problem related to ${assessment.title}`,
            marks: Math.floor(assessment.totalMarks / numQuestions),
            cloId: clos[(assessmentIndex * 2 + (i - 1)) % clos.length].id,
          },
        });
        assessmentItems.push(item);
      }
    }

    console.log('📊 Creating student assessment results...');

    // Create Student Assessment Results
    const studentResults = [];
    for (const student of students) {
      for (const assessment of assessments.slice(0, 15)) {
        // First 15 assessments
        const obtainedMarks = Math.floor(Math.random() * 40) + 60; // 60-100 marks
        const result = await prisma.studentassessmentresults.create({
          data: {
            studentId: student.id,
            assessmentId: assessment.id,
            totalMarks: assessment.totalMarks,
            obtainedMarks: obtainedMarks,
            percentage: (obtainedMarks / assessment.totalMarks) * 100,
            submittedAt: new Date(
              Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
            ),
            evaluatedAt: new Date(
              Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000
            ),
            evaluatedBy:
              facultyMembers[Math.floor(Math.random() * facultyMembers.length)]
                .id,
            status: 'evaluated',
            remarks:
              obtainedMarks > 85
                ? 'Excellent work!'
                : obtainedMarks > 70
                ? 'Good performance'
                : 'Needs improvement',
          },
        });
        studentResults.push(result);
      }
    }

    console.log('📝 Creating student assessment item results...');

    // Create Student Assessment Item Results
    for (const result of studentResults.slice(0, 50)) {
      // First 50 results
      const items = assessmentItems.filter(
        (item) => item.assessmentId === result.assessmentId
      );
      for (const item of items) {
        const obtainedMarks =
          Math.floor(Math.random() * item.marks * 0.4) + item.marks * 0.6; // 60-100% of item marks
        await prisma.studentassessmentitemresults.create({
          data: {
            studentAssessmentResultId: result.id,
            assessmentItemId: item.id,
            obtainedMarks: obtainedMarks,
            totalMarks: item.marks,
            isCorrect: obtainedMarks >= item.marks * 0.5,
          },
        });
      }
    }

    console.log('📝 Creating detailed results...');

    // Create Detailed Results
    for (const student of students) {
      for (const assessment of assessments.slice(0, 8)) {
        // First 8 assessments
        const quiz1 = Math.floor(Math.random() * 20) + 15;
        const quiz2 = Math.floor(Math.random() * 20) + 15;
        const midterm = Math.floor(Math.random() * 40) + 20;
        const final = Math.floor(Math.random() * 60) + 30;
        const assignment = Math.floor(Math.random() * 20) + 15;
        const participation = Math.floor(Math.random() * 10) + 8;

        const totalObtained =
          quiz1 + quiz2 + midterm + final + assignment + participation;
        const totalPossible = 20 + 20 + 40 + 60 + 20 + 10; // 170
        const percentage = (totalObtained / totalPossible) * 100;

        const grade =
          percentage >= 95
            ? 'A+'
            : percentage >= 90
            ? 'A'
            : percentage >= 85
            ? 'A-'
            : percentage >= 80
            ? 'B+'
            : percentage >= 75
            ? 'B'
            : percentage >= 70
            ? 'B-'
            : percentage >= 65
            ? 'C+'
            : percentage >= 60
            ? 'C'
            : percentage >= 55
            ? 'C-'
            : percentage >= 50
            ? 'D+'
            : percentage >= 45
            ? 'D'
            : 'F';

        await prisma.detailedresults.create({
          data: {
            studentId: student.id,
            assessmentId: assessment.id,
            quiz1Marks: quiz1,
            quiz2Marks: quiz2,
            midtermMarks: midterm,
            finalMarks: final,
            assignmentMarks: assignment,
            classParticipation: participation,
            totalObtained: totalObtained,
            totalPossible: totalPossible,
            percentage: percentage,
            grade: grade,
            isPassed: percentage >= 50,
          },
        });
      }
    }

    console.log('🏆 Creating student grades...');

    // Create Student Grades
    const studentGrades = [];
    for (const student of students) {
      for (const offering of courseOfferings.slice(0, 5)) {
        // First 5 offerings per student
        const percentage = Math.floor(Math.random() * 40) + 60; // 60-100%
        const grade =
          percentage >= 95
            ? 'A+'
            : percentage >= 90
            ? 'A'
            : percentage >= 85
            ? 'A-'
            : percentage >= 80
            ? 'B+'
            : percentage >= 75
            ? 'B'
            : percentage >= 70
            ? 'B-'
            : percentage >= 65
            ? 'C+'
            : percentage >= 60
            ? 'C'
            : percentage >= 55
            ? 'C-'
            : percentage >= 50
            ? 'D+'
            : percentage >= 45
            ? 'D'
            : 'F';

        const gpaPoints =
          percentage >= 95
            ? 4.0
            : percentage >= 90
            ? 4.0
            : percentage >= 85
            ? 3.7
            : percentage >= 80
            ? 3.3
            : percentage >= 75
            ? 3.0
            : percentage >= 70
            ? 2.7
            : percentage >= 65
            ? 2.3
            : percentage >= 60
            ? 2.0
            : percentage >= 55
            ? 1.7
            : percentage >= 50
            ? 1.3
            : percentage >= 45
            ? 1.0
            : 0.0;

        const course = courses.find((c) => offering.courseId === c.id);
        const creditHours = course ? course.creditHours : 3;

        const studentGrade = await prisma.studentgrades.create({
          data: {
            studentId: student.id,
            courseOfferingId: offering.id,
            totalMarks: 100,
            obtainedMarks: percentage,
            percentage: percentage,
            grade: grade,
            gpaPoints: gpaPoints,
            creditHours: creditHours,
            qualityPoints: gpaPoints * creditHours,
            calculatedAt: new Date(),
            calculatedBy:
              facultyMembers[Math.floor(Math.random() * facultyMembers.length)]
                .id,
            status: 'active',
          },
        });
        studentGrades.push(studentGrade);
      }
    }

    console.log('📈 Creating semester GPA...');

    // Create Semester GPA
    for (const student of students) {
      for (const semester of semesters.slice(0, 2)) {
        // First 2 semesters
        const relevantGrades = studentGrades.filter(
          (g) => g.studentId === student.id
        );
        const totalQualityPoints = relevantGrades.reduce(
          (sum, grade) => sum + grade.qualityPoints,
          0
        );
        const totalCreditHours = relevantGrades.reduce(
          (sum, grade) => sum + grade.creditHours,
          0
        );
        const semesterGPA =
          totalCreditHours > 0 ? totalQualityPoints / totalCreditHours : 0;

        await prisma.semestergpa.create({
          data: {
            studentId: student.id,
            semesterId: semester.id,
            totalQualityPoints: totalQualityPoints,
            totalCreditHours: totalCreditHours,
            semesterGPA: Math.round(semesterGPA * 100) / 100,
            status: 'active',
          },
        });
      }
    }

    console.log('📊 Creating cumulative GPA...');

    // Create Cumulative GPA
    for (const student of students) {
      const relevantGrades = studentGrades.filter(
        (g) => g.studentId === student.id
      );
      const totalQualityPoints = relevantGrades.reduce(
        (sum, grade) => sum + grade.qualityPoints,
        0
      );
      const totalCreditHours = relevantGrades.reduce(
        (sum, grade) => sum + grade.creditHours,
        0
      );
      const cumulativeGPA =
        totalCreditHours > 0 ? totalQualityPoints / totalCreditHours : 0;

      await prisma.cumulativegpa.create({
        data: {
          studentId: student.id,
          totalQualityPoints: totalQualityPoints,
          totalCreditHours: totalCreditHours,
          cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
          completedSemesters: 2,
        },
      });
    }

    console.log('✅ Creating pass/fail criteria...');

    // Create Pass/Fail Criteria
    for (const offering of courseOfferings.slice(0, 10)) {
      await prisma.passfailcriteria.create({
        data: {
          courseOfferingId: offering.id,
          minPassPercent: 50.0,
          minAttendance: 75.0,
          status: 'active',
          updatedAt: new Date(),
        },
      });
    }

    console.log('🎯 Creating CLO attainments...');

    // Create CLO Attainments
    for (const [index, clo] of clos.slice(0, 15).entries()) {
      const relevantOffering = courseOfferings.find(
        (co) => co.courseId === clo.courseId
      );
      if (relevantOffering) {
        const totalStudents = students.length;
        const studentsAchieved = Math.floor(
          totalStudents * (0.7 + Math.random() * 0.3)
        ); // 70-100% achieved

        await prisma.closattainments.create({
          data: {
            cloId: clo.id,
            courseOfferingId: relevantOffering.id,
            totalStudents: totalStudents,
            studentsAchieved: studentsAchieved,
            threshold: 60.0,
            attainmentPercent: (studentsAchieved / totalStudents) * 100,
            calculatedBy: facultyMembers[index % facultyMembers.length].id,
            status: 'active',
          },
        });
      }
    }

    console.log('🎯 Creating PLO attainments...');

    // Create PLO Attainments
    for (const plo of plos.slice(0, 10)) {
      // First 10 PLOs
      const totalStudents = students.length;
      const studentsAchieved = Math.floor(
        totalStudents * (0.65 + Math.random() * 0.35)
      ); // 65-100% achieved

      await prisma.ploattainments.create({
        data: {
          ploId: plo.id,
          programId: plo.programId,
          semesterId: semesters[0].id,
          totalStudents: totalStudents,
          studentsAchieved: studentsAchieved,
          threshold: 60.0,
          attainmentPercent: (studentsAchieved / totalStudents) * 100,
          calculatedBy: superAdmin.id,
          status: 'active',
        },
      });
    }

    console.log('📊 Creating PLO scores...');

    // Create PLO Scores
    for (const student of students) {
      for (const plo of plos.slice(0, 8)) {
        // First 8 PLOs per student
        const relevantOffering = courseOfferings.find((co) => {
          const course = courses.find((c) => c.id === co.courseId);
          return course && course.departmentId === departments[0].id; // CS courses only
        });

        if (relevantOffering) {
          const obtainedMarks = Math.floor(Math.random() * 40) + 60; // 60-100
          await prisma.ploscores.create({
            data: {
              studentId: student.id,
              courseOfferingId: relevantOffering.id,
              ploId: plo.id,
              totalMarks: 100,
              obtainedMarks: obtainedMarks,
              percentage: obtainedMarks,
              semesterName: 'Fall 2024',
            },
          });
        }
      }
    }

    console.log('🕐 Creating sessions...');

    // Create Sessions
    const sessions = [];
    for (const section of sections.slice(0, 5)) {
      for (let i = 0; i < 10; i++) {
        // 10 sessions per section
        const sessionDate = new Date('2024-09-01');
        sessionDate.setDate(sessionDate.getDate() + i * 3); // Every 3 days

        const session = await prisma.sessions.create({
          data: {
            sectionId: section.id,
            date: sessionDate,
            startTime: new Date(
              `${sessionDate.toISOString().split('T')[0]}T09:00:00Z`
            ),
            endTime: new Date(
              `${sessionDate.toISOString().split('T')[0]}T10:30:00Z`
            ),
            topic: `Lecture ${i + 1} - Introduction to fundamental concepts`,
            remarks: `Covered topics ${i + 1}-${
              i + 2
            }. Students showed good engagement.`,
            status: i < 8 ? 'completed' : 'scheduled',
          },
        });
        sessions.push(session);
      }
    }

    console.log('✅ Creating attendance records...');

    // Create Attendance Records
    for (const session of sessions) {
      const relevantStudentSections = studentSections.filter(
        (ss) => ss.sectionId === session.sectionId
      );
      for (const studentSection of relevantStudentSections) {
        const attendanceStatus =
          Math.random() > 0.15
            ? 'present'
            : Math.random() > 0.7
            ? 'late'
            : 'absent'; // 85% present, 10% late, 5% absent

        await prisma.attendances.create({
          data: {
            studentSectionId: studentSection.id,
            sessionId: session.id,
            status: attendanceStatus,
            markedBy:
              facultyMembers[Math.floor(Math.random() * facultyMembers.length)]
                .id,
            remarks:
              attendanceStatus === 'late'
                ? 'Arrived 10 minutes late'
                : attendanceStatus === 'absent'
                ? 'No notification provided'
                : null,
          },
        });
      }
    }

    console.log('📅 Creating timetable slots...');

    // Create Timetable Slots
    for (const [index, section] of sections.slice(0, 5).entries()) {
      // Create 3 slots per section (Mon, Wed, Fri)
      const days = [1, 3, 5]; // Monday, Wednesday, Friday
      for (const [dayIndex, day] of days.entries()) {
        const startHour = 9 + (index % 3) * 2; // 9AM, 11AM, 1PM slots
        await prisma.timetableslots.create({
          data: {
            sectionId: section.id,
            dayOfWeek: day,
            startTime: new Date(
              `1970-01-01T${String(startHour).padStart(2, '0')}:00:00Z`
            ),
            endTime: new Date(
              `1970-01-01T${String(startHour + 1).padStart(2, '0')}:30:00Z`
            ),
            roomNumber: `Room-${101 + index}-${dayIndex}`,
            status: 'active',
          },
        });
      }
    }

    console.log('📋 Creating datesheets...');

    // Create Datesheets
    const datesheets = [];
    for (const [index, semester] of semesters.slice(0, 2).entries()) {
      const periods = ['mid_term', 'final_term'];
      for (const period of periods) {
        const datesheet = await prisma.datesheets.create({
          data: {
            semesterId: semester.id,
            title: `${period
              .replace('_', ' ')
              .toUpperCase()} Examination Schedule - ${semester.name}`,
            description: `${period.replace(
              '_',
              ' '
            )} examination schedule for ${semester.name} semester`,
            examPeriod: period,
            startDate: new Date(
              period === 'mid_term' ? '2024-10-15' : '2024-12-01'
            ),
            endDate: new Date(
              period === 'mid_term' ? '2024-10-25' : '2024-12-15'
            ),
            publishDate: new Date(
              period === 'mid_term' ? '2024-10-01' : '2024-11-15'
            ),
            isPublished: true,
            isFinalized: index === 0, // Only finalize first one
            createdBy: admin.id,
            approvedBy: superAdmin.id,
            approvedAt: new Date(),
            status: 'published',
          },
        });
        datesheets.push(datesheet);
      }
    }

    console.log('📝 Creating exam schedules...');

    // Create Exam Schedules
    const examSchedules = [];
    for (const [index, offering] of courseOfferings.slice(0, 10).entries()) {
      const examTypes = ['mid_term', 'final_term'];
      for (const [typeIndex, examType] of examTypes.entries()) {
        const examDate = new Date(
          examType === 'mid_term' ? '2024-10-16' : '2024-12-02'
        );
        examDate.setDate(examDate.getDate() + index);

        const examSchedule = await prisma.examschedules.create({
          data: {
            semesterId: semesters[0].id,
            courseOfferingId: offering.id,
            examType: examType,
            examDate: examDate,
            startTime: new Date('1970-01-01T09:00:00Z'),
            endTime: new Date('1970-01-01T12:00:00Z'),
            roomNumber: `Exam-Hall-${(index % 5) + 1}`,
            duration: 180,
            instructions:
              'Bring your student ID card, calculator, and required stationery. Mobile phones are strictly prohibited.',
            status: 'scheduled',
          },
        });
        examSchedules.push(examSchedule);
      }
    }

    console.log('📄 Creating datesheet entries...');

    // Create Datesheet Entries
    for (const [index, examSchedule] of examSchedules.slice(0, 10).entries()) {
      const relevantDatesheet = datesheets.find(
        (d) =>
          d.examPeriod === examSchedule.examType &&
          d.semesterId === examSchedule.semesterId
      );
      if (relevantDatesheet) {
        const course = courses.find(
          (c) =>
            courseOfferings.find(
              (co) => co.id === examSchedule.courseOfferingId
            )?.courseId === c.id
        );
        if (course) {
          await prisma.datesheetentries.create({
            data: {
              datesheetId: relevantDatesheet.id,
              examScheduleId: examSchedule.id,
              dayOfExam: (index % 10) + 1,
              timeSlot: index % 2 === 0 ? 'morning' : 'afternoon',
              paperCode: course.code,
              paperTitle: course.name,
              duration: 180,
              totalMarks: 100,
              passingMarks: 50,
              notes:
                'Closed book examination. Calculators allowed for mathematical computations.',
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    console.log('📋 Creating exam attendance...');

    // Create Exam Attendance
    for (const examSchedule of examSchedules.slice(0, 5)) {
      for (const student of students.slice(0, 6)) {
        // First 6 students
        const attendanceStatus =
          Math.random() > 0.1
            ? 'present'
            : Math.random() > 0.5
            ? 'absent'
            : 'late';

        const arrivalTime =
          attendanceStatus === 'present'
            ? examSchedule.examDate
            : attendanceStatus === 'late'
            ? new Date(examSchedule.examDate.getTime() + 15 * 60000)
            : null;

        await prisma.examattendance.create({
          data: {
            examScheduleId: examSchedule.id,
            studentId: student.id,
            attendanceStatus: attendanceStatus,
            arrivalTime: arrivalTime,
            departureTime:
              attendanceStatus === 'present' || attendanceStatus === 'late'
                ? new Date(examSchedule.examDate.getTime() + 2.5 * 60 * 60000)
                : null, // 2.5 hours later
            remarks:
              attendanceStatus === 'absent'
                ? 'Did not appear for exam'
                : attendanceStatus === 'late'
                ? 'Arrived 15 minutes late'
                : 'On time',
            updatedAt: new Date(),
          },
        });
      }
    }

    console.log('🎓 Creating transcripts...');

    // Create Transcripts
    for (const student of students.slice(0, 4)) {
      // First 4 students
      const transcriptTypes = ['semester', 'complete'];
      for (const [index, transcriptType] of transcriptTypes.entries()) {
        await prisma.transcripts.create({
          data: {
            studentId: student.id,
            semesterId: transcriptType === 'semester' ? semesters[1].id : null, // Completed semester for semester transcript
            transcriptType: transcriptType,
            totalCGPA: 3.2 + Math.random() * 0.8, // 3.2 - 4.0 CGPA
            totalCreditHours: transcriptType === 'semester' ? 18 : 72,
            isOfficial: index === 0, // First one is official
            generatedBy: admin.id,
            filePath: `/transcripts/${
              student.rollNumber
            }_${transcriptType}_${Date.now()}.pdf`,
            status: index === 0 ? 'issued' : 'generated',
          },
        });
      }
    }

    console.log('💬 Creating course feedbacks...');

    // Create Course Feedbacks
    for (const student of students.slice(0, 5)) {
      for (const offering of courseOfferings.slice(0, 3)) {
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 rating
        await prisma.coursefeedbacks.create({
          data: {
            studentId: student.id,
            courseOfferingId: offering.id,
            rating: rating,
            comments:
              rating === 5
                ? 'Excellent course content and teaching methodology'
                : 'Good course overall, instructor was helpful',
            suggestions:
              'More practical examples and hands-on exercises would be beneficial',
            isAnonymous: Math.random() > 0.6,
          },
        });
      }
    }

    console.log('👨‍🏫 Creating faculty feedbacks...');

    // Create Faculty Feedbacks
    for (const faculty of facultyMembers.slice(0, 3)) {
      for (const offering of courseOfferings.slice(0, 3)) {
        await prisma.facultyfeedbacks.create({
          data: {
            facultyId: faculty.id,
            courseOfferingId: offering.id,
            studentEngagement: Math.floor(Math.random() * 2) + 4, // 4-5 rating
            infrastructureRating: Math.floor(Math.random() * 2) + 3, // 3-4 rating
            suggestions:
              'Need better projector and sound system in the classroom',
            challenges:
              'Large class size makes individual attention difficult. More TAs needed.',
          },
        });
      }
    }

    console.log('📊 Creating OBE reports...');

    // Create OBE Reports
    const obeReports = await Promise.all([
      prisma.obereports.create({
        data: {
          reportType: 'clo_attainment',
          programId: programs[0].id,
          semesterId: semesters[0].id,
          title: 'CLO Attainment Report - Fall 2024',
          description:
            'Course Learning Outcomes attainment analysis for Fall 2024 semester',
          generatedBy: admin.id,
          filePath: '/reports/clo_attainment_fall2024.pdf',
          status: 'generated',
        },
      }),
      prisma.obereports.create({
        data: {
          reportType: 'plo_attainment',
          programId: programs[0].id,
          semesterId: semesters[0].id,
          title: 'PLO Attainment Report - Fall 2024',
          description:
            'Program Learning Outcomes attainment analysis for Fall 2024 semester',
          generatedBy: admin.id,
          filePath: '/reports/plo_attainment_fall2024.pdf',
          status: 'published',
        },
      }),
      prisma.obereports.create({
        data: {
          reportType: 'program_assessment',
          programId: programs[0].id,
          title: 'BSCS Program Assessment Report 2024',
          description:
            'Comprehensive program assessment report for BSCS program',
          generatedBy: superAdmin.id,
          filePath: '/reports/program_assessment_bscs_2024.pdf',
          status: 'published',
        },
      }),
      prisma.obereports.create({
        data: {
          reportType: 'semester_summary',
          programId: programs[1].id,
          semesterId: semesters[0].id,
          title: 'Semester Summary Report - BSIT Fall 2024',
          description: 'Complete semester summary for BSIT Fall 2024',
          generatedBy: admin.id,
          filePath: '/reports/semester_summary_bsit_fall2024.pdf',
          status: 'generated',
        },
      }),
      prisma.obereports.create({
        data: {
          reportType: 'course_wise',
          programId: programs[0].id,
          semesterId: semesters[0].id,
          title: 'Course-wise Performance Report - Fall 2024',
          description: 'Individual course performance analysis for Fall 2024',
          generatedBy: deptAdmin.id,
          filePath: '/reports/course_wise_fall2024.pdf',
          status: 'archived',
        },
      }),
    ]);

    console.log('🔔 Creating notifications...');

    // Create Notifications
    const notificationUsers = [
      superAdmin,
      admin,
      deptAdmin,
      ...facultyUsers.slice(0, 2),
      ...studentUsers.slice(0, 3),
    ];
    const notificationTypes = [
      'system',
      'attendance',
      'course',
      'announcement',
      'alert',
      'grade',
    ];
    const notificationMessages = [
      'System maintenance scheduled for this weekend',
      'Your attendance is below the required threshold',
      'New course material has been uploaded',
      'Important: Exam schedule has been published',
      'Fee payment deadline approaching',
      'Your grades have been updated',
    ];

    for (const [index, user] of notificationUsers.entries()) {
      await prisma.notifications.create({
        data: {
          userId: user.id,
          title: `${notificationTypes[
            index % notificationTypes.length
          ].toUpperCase()} Notification`,
          message: notificationMessages[index % notificationMessages.length],
          type: notificationTypes[index % notificationTypes.length],
          isRead: Math.random() > 0.4, // 60% read rate
        },
      });
    }

    console.log('🔍 Creating audit logs...');

    // Create Audit Logs
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT'];
    const entities = [
      'users',
      'courses',
      'students',
      'grades',
      'attendance',
      'assessments',
      'departments',
    ];

    for (let i = 0; i < 20; i++) {
      const user = [superAdmin, admin, deptAdmin, ...facultyUsers.slice(0, 2)][
        i % 5
      ];
      await prisma.auditlogs.create({
        data: {
          userId: user.id,
          action: actions[i % actions.length],
          details: {
            entity: entities[i % entities.length],
            entityId: i + 1,
            changes: {
              field: ['status', 'grade', 'attendance', 'name'][i % 4],
              oldValue: 'inactive',
              newValue: 'active',
            },
            timestamp: new Date().toISOString(),
            userRole: user.userrole ? 'admin' : 'user',
          },
          ipAddress: `192.168.1.${100 + (i % 50)}`,
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
    }

    console.log('🔐 Creating password resets...');

    // Create Password Reset Records
    for (const [index, user] of studentUsers.slice(0, 3).entries()) {
      await prisma.passwordresets.create({
        data: {
          userId: user.id,
          token: `sample-reset-token-${Date.now()}-${index}`,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        },
      });
    }

    console.log('✅ Database seeded successfully!');

    // Print final summary and login credentials
    console.log('\n🔑 =============== LOGIN CREDENTIALS ===============');
    console.log('Super Admin:');
    console.log('  Email: itzhassanraza276@gmail.com');
    console.log('  Username: superadmin');
    console.log('  Password: 11223344');
    console.log('');
    console.log('System Admin:');
    console.log('  Email: admin@university.edu');
    console.log('  Username: admin');
    console.log('  Password: 11223344');
    console.log('');
    console.log('Department Admin:');
    console.log('  Email: dept.admin@university.edu');
    console.log('  Username: deptadmin');
    console.log('  Password: 11223344');
    console.log('');
    console.log('Faculty (Sample):');
    console.log('  Email: dr.ahmed@university.edu');
    console.log('  Username: faculty1');
    console.log('  Password: 11223344');
    console.log('');
    console.log('Student (Sample):');
    console.log('  Email: ali.student@university.edu');
    console.log('  Username: student1');
    console.log('  Password: 11223344');
    console.log('');
    console.log('📊 =============== SEEDED DATA SUMMARY ===============');
    console.log(`👤 Users: ${await prisma.users.count()}`);
    console.log(`🔐 Roles: ${await prisma.roles.count()}`);
    console.log(`🏢 Departments: ${await prisma.departments.count()}`);
    console.log(`🎓 Programs: ${await prisma.programs.count()}`);
    console.log(`📚 Courses: ${await prisma.courses.count()}`);
    console.log(`📅 Semesters: ${await prisma.semesters.count()}`);
    console.log(`👥 Batches: ${await prisma.batches.count()}`);
    console.log(`🏫 Course Offerings: ${await prisma.courseofferings.count()}`);
    console.log(`🏛️ Sections: ${await prisma.sections.count()}`);
    console.log(`📝 Student Sections: ${await prisma.studentsections.count()}`);
    console.log(`📊 Grades: ${await prisma.studentgrades.count()}`);
    console.log(`📈 Semester GPA: ${await prisma.semestergpa.count()}`);
    console.log(`📊 Cumulative GPA: ${await prisma.cumulativegpa.count()}`);
    console.log(
      `✅ Pass/Fail Criteria: ${await prisma.passfailcriteria.count()}`
    );
    console.log(`🎯 PLOs: ${await prisma.plos.count()}`);
    console.log(`🎯 CLOs: ${await prisma.clos.count()}`);
    console.log(`🔗 CLO-PLO Mappings: ${await prisma.cloplomappings.count()}`);
    console.log(`📋 Assessments: ${await prisma.assessments.count()}`);
    console.log(`❓ Assessment Items: ${await prisma.assessmentitems.count()}`);
    console.log(
      `📊 Student Assessment Results: ${await prisma.studentassessmentresults.count()}`
    );
    console.log(
      `📝 Student Assessment Item Results: ${await prisma.studentassessmentitemresults.count()}`
    );
    console.log(`📝 Detailed Results: ${await prisma.detailedresults.count()}`);
    console.log(`🏆 Student Grades: ${await prisma.studentgrades.count()}`);
    console.log(`📋 Datesheets: ${await prisma.datesheets.count()}`);
    console.log(`📝 Exam Schedules: ${await prisma.examschedules.count()}`);
    console.log(
      `📄 Datesheet Entries: ${await prisma.datesheetentries.count()}`
    );
    console.log(`📋 Exam Attendance: ${await prisma.examattendance.count()}`);
    console.log(`🎓 Transcripts: ${await prisma.transcripts.count()}`);
    console.log(`💬 Course Feedbacks: ${await prisma.coursefeedbacks.count()}`);
    console.log(
      `👨‍🏫 Faculty Feedbacks: ${await prisma.facultyfeedbacks.count()}`
    );
    console.log(`📊 OBE Reports: ${await prisma.obereports.count()}`);
    console.log(`🔔 Notifications: ${await prisma.notifications.count()}`);
    console.log(`🔍 Audit Logs: ${await prisma.auditlogs.count()}`);
    console.log(`🔐 Password Resets: ${await prisma.passwordresets.count()}`);
    console.log('================================================');
    console.log('');
    console.log('🎉 Your OBE (Outcome-Based Education) system is ready!');
    console.log(
      '💡 The database has been populated with comprehensive dummy data including:'
    );
    console.log(
      '   • Complete user management system with roles & permissions'
    );
    console.log(
      '   • Academic structure (departments, programs, courses, semesters)'
    );
    console.log('   • Student and faculty management');
    console.log('   • Course offerings, sections, and enrollments');
    console.log('   • Assessment system with CLOs and PLOs');
    console.log('   • Grading system with GPA calculations');
    console.log('   • Attendance tracking and timetable management');
    console.log('   • Examination scheduling and datesheets');
    console.log('   • OBE reports and analytics');
    console.log('   • Feedback systems and audit trails');
    console.log('');
    console.log('🚀 You can now start your application and begin testing!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
