import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessStudent, forbidden } from '@/lib/authz';
import { aggregatePloScores, recalculateStudentGpa } from '@/lib/obe';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, [
    'super_admin',
    'admin',
    'faculty',
    'student',
  ]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const studentId = parseInt(id);

  if (Number.isNaN(studentId)) {
    return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
  }

  // `userId` (users table) and `studentId` (students table) are different keys —
  // comparing them directly denied students their own record and could match an
  // unrelated one. canAccessStudent resolves the student row from the token.
  if (!(await canAccessStudent(request, auth.user, studentId))) {
    return forbidden('You do not have access to this student').response;
  }

  // Get student with program info
  const student = await prisma.students.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { first_name: true, last_name: true, email: true } },
      program: { select: { id: true, name: true, code: true, duration: true } },
      batch: { select: { name: true, code: true } },
      cumulativeGPA: true,
    },
  });

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  // Fetch program's graduation criteria for the threshold
  const graduationCriteria = await prisma.graduation_criteria.findUnique({
    where: { programId: student.programId },
    select: {
      minPloAttainmentPercent: true,
      minCGPA: true,
      requireAllCourses: true,
    },
  });
  const threshold = graduationCriteria?.minPloAttainmentPercent ?? 50;
  const minCGPA = graduationCriteria?.minCGPA ?? 2.0;
  const requireAllCourses = graduationCriteria?.requireAllCourses ?? true;

  // Get all active PLOs for this program
  const plos = await prisma.plos.findMany({
    where: { programId: student.programId, status: 'active' },
    select: { id: true, code: true, description: true, bloomLevel: true },
    orderBy: { code: 'asc' },
  });

  // Get all PLO scores for this student across all course offerings
  const ploScores = await prisma.ploscores.findMany({
    where: { studentId },
    include: {
      plo: { select: { code: true } },
      courseOffering: {
        include: {
          course: { select: { code: true, name: true } },
          semester: { select: { name: true } },
        },
      },
    },
    orderBy: { calculatedAt: 'desc' },
  });

  // Aggregate marks across every contributing offering rather than taking the
  // student's best one — a single strong course must not mask weak performance
  // in every other course that contributes to the same PLO.
  const aggregated = aggregatePloScores(ploScores);

  const attemptsByPlo = new Map<
    number,
    { courseCode: string; semesterName: string; percentage: number }[]
  >();
  for (const score of ploScores) {
    const list = attemptsByPlo.get(score.ploId) ?? [];
    list.push({
      courseCode: score.courseOffering.course.code,
      semesterName: score.courseOffering.semester.name,
      percentage: score.percentage,
    });
    attemptsByPlo.set(score.ploId, list);
  }

  // Build PLO completion status using the program-specific threshold
  const ploStatus = plos.map((plo) => {
    const agg = aggregated.get(plo.id);
    const score = agg?.percentage ?? null;
    const attained = score !== null && score >= threshold;

    return {
      ploId: plo.id,
      ploCode: plo.code,
      description: plo.description,
      bloomLevel: plo.bloomLevel,
      score,
      obtainedMarks: agg?.obtained ?? null,
      totalMarks: agg?.total ?? null,
      attained,
      threshold,
      attempts: attemptsByPlo.get(plo.id) ?? [],
    };
  });

  const totalPlos = plos.length;
  const attainedPlos = ploStatus.filter((p) => p.attained).length;
  const notAssessedPlos = ploStatus.filter((p) => p.score === null).length;
  const completionPercent = totalPlos > 0 ? Math.round((attainedPlos / totalPlos) * 100) : 0;

  // Recompute GPA from finalised grades rather than trusting a stale row.
  // Nothing else wrote `cumulativegpa`, so reading it alone left cgpa null and
  // made every student permanently ineligible.
  const { cumulativeGPA: cgpa } = await recalculateStudentGpa(studentId);

  // Courses the student has passed (an F carries no quality points but still
  // produces a grade row, so completion is judged on gpaPoints)
  const passedCourses = await prisma.studentgrades.count({
    where: {
      studentId,
      status: { in: ['active', 'final'] },
      gpaPoints: { gt: 0 },
    },
  });
  const completedGrades = await prisma.studentgrades.count({
    where: { studentId, status: { in: ['active', 'final'] } },
  });

  // Courses the curriculum requires. `program_curriculum` is the real
  // curriculum (it carries isRequired and semesterSlot); `programcourses` is a
  // plain junction that also contains electives, so counting it would demand
  // that a student pass every elective too. Fall back to it only when no
  // curriculum has been defined yet.
  let requiredCourses = await prisma.program_curriculum.count({
    where: { programId: student.programId, isRequired: true },
  });
  if (requiredCourses === 0) {
    requiredCourses = await prisma.programcourses.count({
      where: { A: student.programId },
    });
  }

  const allCoursesComplete =
    !requireAllCourses ||
    (requiredCourses > 0 && passedCourses >= requiredCourses);

  const isEligible =
    totalPlos > 0 &&
    attainedPlos === totalPlos &&
    cgpa >= minCGPA &&
    allCoursesComplete;

  return NextResponse.json({
    success: true,
    data: {
      student: {
        id: student.id,
        rollNumber: student.rollNumber,
        name: `${student.user.first_name} ${student.user.last_name}`,
        email: student.user.email,
        program: student.program,
        batch: student.batch,
        cumulativeGPA: cgpa,
        completedCourses: completedGrades,
      },
      summary: {
        totalPlos,
        attainedPlos,
        notAssessedPlos,
        completionPercent,
        isEligible,
        threshold,
        minCGPA,
        requireAllCourses,
        requiredCourses,
        passedCourses,
        allCoursesComplete,
      },
      ploStatus,
    },
  });
}
