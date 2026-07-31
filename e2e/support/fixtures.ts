import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

/**
 * Test dataset.
 *
 * Journey specs build their own data through the UI — that is the point of
 * those tests. Everything else needs a populated system to look at, and paying
 * a full setup journey per spec would make the suite unusable. This inserts a
 * coherent OBE dataset directly.
 *
 * Every account uses the same password so specs do not have to track
 * credentials, and `must_change_password` is off so sign-in lands on the
 * dashboard rather than the forced-change screen. The forced-change flow has
 * its own spec that creates a flagged account on purpose.
 */

export const TEST_PASSWORD = 'E2ePass@2026';

export const ACCOUNTS = {
  superAdmin: { email: 'e2e.superadmin@test.local', role: 'super_admin' as const },
  admin: { email: 'e2e.admin@test.local', role: 'admin' as const },
  faculty: { email: 'e2e.faculty@test.local', role: 'faculty' as const },
  student: { email: 'e2e.student@test.local', role: 'student' as const },
  // A second student, used to prove one student cannot read another's records
  otherStudent: { email: 'e2e.student2@test.local', role: 'student' as const },
};

export interface SeededIds {
  departmentId: number;
  programId: number;
  semesterId: number;
  batchId: string;
  theoryCourseId: number;
  labCourseId: number;
  courseOfferingId: number;
  labOfferingId: number;
  sectionId: number;
  facultyId: number;
  studentId: number;
  otherStudentId: number;
  cloIds: number[];
  lloIds: number[];
  ploIds: number[];
  peoId: number;
  assessmentId: number;
  assessmentItemIds: number[];
}

const prisma = new PrismaClient();

/** Delete everything, honouring foreign keys. */
export async function resetDatabase(): Promise<void> {
  // Order matters: children before parents
  const tables = [
    'attendance_records',
    'attendance_sessions',
    'rubric_scores',
    'rubric_criteria',
    'rubrics',
    'survey_answers',
    'survey_responses',
    'survey_questions',
    'surveys',
    'action_plans',
    'studentassessmentitemresults',
    'studentassessmentresults',
    'assessmentitems',
    'assessments',
    'closattainments',
    'llosattainments',
    'ploscores',
    'ploattainments',
    'semestergpa',
    'cumulativegpa',
    'studentgrades',
    'gradescales',
    'transcripts',
    'obereports',
    'auditlogs',
    'notifications',
    'passwordresets',
    'otps',
    'rate_limits',
    'passfailcriteria',
    'graduation_criteria',
    'program_curriculum',
    'peoplomappings',
    'peos',
    'cloplomappings',
    'lloplomappings',
    'clos',
    'llos',
    'plos',
    'studentsections',
    'sections',
    'courseofferings',
    'courseprerequisites',
    '_programtocourse',
    'students',
    'faculties',
    'courses',
    'batches',
    'programs',
    'semesters',
    'departments',
    'userroles',
    'users',
    'roles',
    'permissions',
    'Settings',
    'faculty_preferences',
    'student_preferences',
  ];

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\``);
    } catch {
      // A table that does not exist in this schema version is not an error here
    }
  }
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
}

/** Insert the full dataset and return the ids specs need. */
export async function seedTestData(): Promise<SeededIds> {
  const passwordHash = await hash(TEST_PASSWORD, 10);

  // ── Roles ────────────────────────────────────────────────────────────────
  const roleNames = ['super_admin', 'admin', 'faculty', 'student'] as const;
  const roles: Record<string, number> = {};
  for (const name of roleNames) {
    const role = await prisma.roles.create({
      data: { name, description: `${name} role`, updatedAt: new Date() },
    });
    roles[name] = role.id;
  }

  const makeUser = async (
    email: string,
    firstName: string,
    lastName: string,
    roleName: keyof typeof roles
  ) => {
    const user = await prisma.users.create({
      data: {
        email,
        username: email.split('@')[0],
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        status: 'active',
        email_verified: true,
        // Off: specs want the dashboard, not the forced-change screen
        must_change_password: false,
      },
    });
    await prisma.userroles.create({
      data: { userId: user.id, roleId: roles[roleName], updatedAt: new Date() },
    });
    return user;
  };

  const superAdminUser = await makeUser(
    ACCOUNTS.superAdmin.email, 'Super', 'Admin', 'super_admin'
  );
  const adminUser = await makeUser(ACCOUNTS.admin.email, 'Dept', 'Admin', 'admin');
  const facultyUser = await makeUser(ACCOUNTS.faculty.email, 'Test', 'Faculty', 'faculty');
  const studentUser = await makeUser(ACCOUNTS.student.email, 'Test', 'Student', 'student');
  const otherStudentUser = await makeUser(
    ACCOUNTS.otherStudent.email, 'Other', 'Student', 'student'
  );

  // ── Department, program, semester, batch ─────────────────────────────────
  const department = await prisma.departments.create({
    data: {
      name: 'Computer Science',
      code: 'CS',
      description: 'E2E test department',
      status: 'active',
      adminId: adminUser.id,
      updatedAt: new Date(),
    },
  });

  const program = await prisma.programs.create({
    data: {
      name: 'BS Computer Science',
      code: 'BSCS',
      duration: 4,
      status: 'active',
      departmentId: department.id,
      totalCreditHours: 130,
      updatedAt: new Date(),
    },
  });

  const semester = await prisma.semesters.create({
    data: {
      name: 'Fall 2026',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-01-31'),
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const batch = await prisma.batches.create({
    data: {
      name: 'Batch 2026',
      code: 'B2026',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2030-06-30'),
      maxStudents: 60,
      status: 'active',
      programId: program.id,
      updatedAt: new Date(),
    },
  });

  // ── Faculty and students ─────────────────────────────────────────────────
  const faculty = await prisma.faculties.create({
    data: {
      userId: facultyUser.id,
      departmentId: department.id,
      designation: 'Assistant Professor',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  // The department admin also needs a faculty row — that is where
  // getDepartmentIdFromRequest resolves an admin's department from.
  await prisma.faculties.create({
    data: {
      userId: adminUser.id,
      departmentId: department.id,
      designation: 'Department Admin',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const student = await prisma.students.create({
    data: {
      userId: studentUser.id,
      rollNumber: 'CS-2026-001',
      departmentId: department.id,
      programId: program.id,
      batchId: batch.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const otherStudent = await prisma.students.create({
    data: {
      userId: otherStudentUser.id,
      rollNumber: 'CS-2026-002',
      departmentId: department.id,
      programId: program.id,
      batchId: batch.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  // ── Courses ──────────────────────────────────────────────────────────────
  const theoryCourse = await prisma.courses.create({
    data: {
      code: 'CS101',
      name: 'Programming Fundamentals',
      creditHours: 3,
      theoryHours: 3,
      labHours: 0,
      type: 'THEORY',
      status: 'active',
      departmentId: department.id,
      updatedAt: new Date(),
    },
  });

  const labCourse = await prisma.courses.create({
    data: {
      code: 'CS102',
      name: 'Programming Lab',
      creditHours: 1,
      theoryHours: 0,
      labHours: 3,
      type: 'LAB',
      status: 'active',
      departmentId: department.id,
      updatedAt: new Date(),
    },
  });

  // Map both into the program (this junction is what attainment queries use)
  await prisma.programcourses.createMany({
    data: [
      { A: program.id, B: theoryCourse.id },
      { A: program.id, B: labCourse.id },
    ],
  });

  await prisma.program_curriculum.createMany({
    data: [
      {
        programId: program.id,
        courseId: theoryCourse.id,
        semesterSlot: 1,
        courseCategory: 'core',
        isRequired: true,
        updatedAt: new Date(),
      },
      {
        programId: program.id,
        courseId: labCourse.id,
        semesterSlot: 1,
        courseCategory: 'core',
        isRequired: true,
        updatedAt: new Date(),
      },
    ],
  });

  // ── PEOs and PLOs ────────────────────────────────────────────────────────
  const peo = await prisma.peos.create({
    data: {
      code: 'PEO1',
      description: 'Graduates will apply computing knowledge in practice.',
      programId: program.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const ploDefs = [
    { code: 'PLO1', description: 'Engineering Knowledge' },
    { code: 'PLO2', description: 'Problem Analysis' },
    { code: 'PLO3', description: 'Design and Development of Solutions' },
  ];
  const ploIds: number[] = [];
  for (const def of ploDefs) {
    const plo = await prisma.plos.create({
      data: {
        code: def.code,
        description: def.description,
        programId: program.id,
        bloomLevel: 'Apply',
        bloomDomain: 'Cognitive',
        status: 'active',
        updatedAt: new Date(),
      },
    });
    ploIds.push(plo.id);
  }

  await prisma.peoplomappings.createMany({
    data: ploIds.map((ploId) => ({ peoId: peo.id, ploId, weight: 1 })),
  });

  // ── CLOs and LLOs ────────────────────────────────────────────────────────
  const cloDefs = [
    { code: 'CLO1', description: 'Explain programming constructs', bloom: 'Understand' as const },
    { code: 'CLO2', description: 'Apply control structures to problems', bloom: 'Apply' as const },
    { code: 'CLO3', description: 'Analyse algorithmic complexity', bloom: 'Analyze' as const },
  ];
  const cloIds: number[] = [];
  for (const def of cloDefs) {
    const clo = await prisma.clos.create({
      data: {
        code: def.code,
        description: def.description,
        courseId: theoryCourse.id,
        bloomLevel: def.bloom,
        bloomDomain: 'Cognitive',
        status: 'active',
        updatedAt: new Date(),
      },
    });
    cloIds.push(clo.id);
  }

  const lloIds: number[] = [];
  for (const def of [
    { code: 'LLO1', description: 'Implement working programs in the lab' },
    { code: 'LLO2', description: 'Debug and test lab exercises' },
  ]) {
    const llo = await prisma.llos.create({
      data: {
        code: def.code,
        description: def.description,
        courseId: labCourse.id,
        bloomLevel: 'Apply',
        bloomDomain: 'Psychomotor',
        status: 'active',
        updatedAt: new Date(),
      },
    });
    lloIds.push(llo.id);
  }

  // Each CLO maps to one PLO at full weight — keeps expected values easy to
  // reason about in assertions.
  await prisma.cloplomappings.createMany({
    data: cloIds.map((cloId, i) => ({
      cloId,
      ploId: ploIds[i % ploIds.length],
      weight: 1,
      updatedAt: new Date(),
    })),
  });

  await prisma.lloplomappings.createMany({
    data: lloIds.map((lloId, i) => ({
      lloId,
      ploId: ploIds[i % ploIds.length],
      weight: 1,
      updatedAt: new Date(),
    })),
  });

  // ── Offerings, sections, enrolment ───────────────────────────────────────
  const courseOffering = await prisma.courseofferings.create({
    data: {
      courseId: theoryCourse.id,
      semesterId: semester.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const labOffering = await prisma.courseofferings.create({
    data: {
      courseId: labCourse.id,
      semesterId: semester.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  // Thresholds: a student needs 60% to achieve a CLO; the CLO itself counts as
  // attained when 50% of assessed students reach that.
  for (const offeringId of [courseOffering.id, labOffering.id]) {
    await prisma.passfailcriteria.create({
      data: {
        courseOfferingId: offeringId,
        minPassPercent: 60,
        minCloAttainmentPercent: 50,
        minLloAttainmentPercent: 50,
        status: 'active',
        updatedAt: new Date(),
      },
    });
  }

  const section = await prisma.sections.create({
    data: {
      name: 'Section A',
      courseOfferingId: courseOffering.id,
      facultyId: faculty.id,
      batchId: batch.id,
      maxStudents: 40,
      sessionType: 'morning',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  await prisma.studentsections.createMany({
    data: [student.id, otherStudent.id].map((studentId) => ({
      studentId,
      sectionId: section.id,
      status: 'active' as const,
      updatedAt: new Date(),
    })),
  });

  // ── Grade scale ──────────────────────────────────────────────────────────
  await prisma.gradescales.createMany({
    data: [
      { programId: program.id, grade: 'A', minPercent: 85, maxPercent: 100, gpaValue: 4.0, updatedAt: new Date() },
      { programId: program.id, grade: 'B', minPercent: 70, maxPercent: 84.99, gpaValue: 3.0, updatedAt: new Date() },
      { programId: program.id, grade: 'C', minPercent: 60, maxPercent: 69.99, gpaValue: 2.0, updatedAt: new Date() },
      { programId: program.id, grade: 'D', minPercent: 50, maxPercent: 59.99, gpaValue: 1.0, updatedAt: new Date() },
      { programId: program.id, grade: 'F', minPercent: 0, maxPercent: 49.99, gpaValue: 0.0, updatedAt: new Date() },
    ],
  });

  await prisma.graduation_criteria.create({
    data: {
      programId: program.id,
      minCGPA: 2.0,
      minPloAttainmentPercent: 50,
      requireAllCourses: false,
      directWeight: 0.7,
      indirectWeight: 0.3,
      minSurveyResponseRate: 0,
      updatedAt: new Date(),
    },
  });

  // ── An assessment worth the whole course, with items on each CLO ─────────
  const assessment = await prisma.assessments.create({
    data: {
      title: 'Midterm Exam',
      type: 'mid_exam',
      courseOfferingId: courseOffering.id,
      conductedBy: faculty.id,
      totalMarks: 30,
      weightage: 100,
      status: 'active',
      dueDate: new Date('2026-11-15'),
      updatedAt: new Date(),
    },
  });

  const assessmentItemIds: number[] = [];
  for (let i = 0; i < cloIds.length; i++) {
    const item = await prisma.assessmentitems.create({
      data: {
        assessmentId: assessment.id,
        questionNo: `Q${i + 1}`,
        description: `Question ${i + 1}`,
        marks: 10,
        cloId: cloIds[i],
        updatedAt: new Date(),
      },
    });
    assessmentItemIds.push(item.id);
  }

  await prisma.settings.create({
    data: {
      id: 1,
      system: {
        applicationName: 'EduTrack',
        academicYear: '2026',
        currentSemester: 'Fall',
        defaultLanguage: 'en',
        timeZone: 'UTC',
        departmentCode: 'CS',
        departmentName: 'Computer Science',
      },
      email: {
        smtpHost: '',
        smtpPort: '',
        smtpUsername: '',
        smtpPassword: '',
        fromEmail: '',
        fromName: '',
      },
      notifications: {
        enabled: true,
        channels: { email: true, push: false, sms: false },
      },
      obe: {
        cloAttainmentThreshold: 50,
        ploAttainmentThreshold: 50,
        defaultGradingScale: 'percentage',
        assessmentWeightageSum: 100,
        mappingStrengthWeights: { high: 1.0, medium: 0.7, low: 0.4 },
      },
      updatedAt: new Date(),
    },
  });

  return {
    departmentId: department.id,
    programId: program.id,
    semesterId: semester.id,
    batchId: batch.id,
    theoryCourseId: theoryCourse.id,
    labCourseId: labCourse.id,
    courseOfferingId: courseOffering.id,
    labOfferingId: labOffering.id,
    sectionId: section.id,
    facultyId: faculty.id,
    studentId: student.id,
    otherStudentId: otherStudent.id,
    cloIds,
    lloIds,
    ploIds,
    peoId: peo.id,
    assessmentId: assessment.id,
    assessmentItemIds,
  };
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma as testDb };
