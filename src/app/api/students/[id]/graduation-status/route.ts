import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });

  const { id } = await params;
  const studentId = parseInt(id);

  // Only admin or the student themselves
  if (user?.role === 'student' && user.userId !== studentId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    select: { minPloAttainmentPercent: true, minCGPA: true },
  });
  const threshold = graduationCriteria?.minPloAttainmentPercent ?? 50;
  const minCGPA = graduationCriteria?.minCGPA ?? 2.0;

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

  // Group scores by PLO — pick the best score per PLO across all offerings
  const ploScoreMap = new Map<
    number,
    { bestScore: number; attempts: { courseCode: string; semesterName: string; percentage: number }[] }
  >();

  for (const score of ploScores) {
    const existing = ploScoreMap.get(score.ploId);
    const attempt = {
      courseCode: score.courseOffering.course.code,
      semesterName: score.courseOffering.semester.name,
      percentage: score.percentage,
    };
    if (!existing) {
      ploScoreMap.set(score.ploId, { bestScore: score.percentage, attempts: [attempt] });
    } else {
      existing.attempts.push(attempt);
      if (score.percentage > existing.bestScore) {
        existing.bestScore = score.percentage;
      }
    }
  }

  // Build PLO completion status using the program-specific threshold
  const ploStatus = plos.map((plo) => {
    const scoreData = ploScoreMap.get(plo.id);
    const bestScore = scoreData?.bestScore ?? null;
    const attained = bestScore !== null && bestScore >= threshold;

    return {
      ploId: plo.id,
      ploCode: plo.code,
      description: plo.description,
      bloomLevel: plo.bloomLevel,
      bestScore,
      attained,
      threshold,
      attempts: scoreData?.attempts ?? [],
    };
  });

  const totalPlos = plos.length;
  const attainedPlos = ploStatus.filter((p) => p.attained).length;
  const notAssessedPlos = ploStatus.filter((p) => p.bestScore === null).length;
  const completionPercent = totalPlos > 0 ? Math.round((attainedPlos / totalPlos) * 100) : 0;
  const cgpa = student.cumulativeGPA?.cumulativeGPA ?? null;
  const isEligible =
    totalPlos > 0 &&
    attainedPlos === totalPlos &&
    cgpa !== null &&
    cgpa >= minCGPA;

  // Count completed courses
  const completedGrades = await prisma.studentgrades.count({
    where: { studentId, status: { in: ['active', 'final'] } },
  });

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
      },
      ploStatus,
    },
  });
}
