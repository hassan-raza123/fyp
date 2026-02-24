import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { success, user, error } = await requireAuth(request);
  if (!success) return NextResponse.json({ error }, { status: 401 });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const programId = searchParams.get('programId');
  const batchId = searchParams.get('batchId');
  const search = searchParams.get('search') ?? '';

  // Get students with filters
  const students = await prisma.students.findMany({
    where: {
      ...(programId && { programId: parseInt(programId) }),
      ...(batchId && { batchId }),
      status: 'active',
      ...(search && {
        OR: [
          { rollNumber: { contains: search } },
          { user: { first_name: { contains: search } } },
          { user: { last_name: { contains: search } } },
        ],
      }),
    },
    include: {
      user: { select: { first_name: true, last_name: true } },
      program: { select: { id: true, name: true, code: true } },
      batch: { select: { name: true, code: true } },
      cumulativeGPA: { select: { cumulativeGPA: true } },
    },
    orderBy: [{ program: { code: 'asc' } }, { rollNumber: 'asc' }],
  });

  if (students.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Gather all unique program IDs
  const programIds = [...new Set(students.map((s) => s.programId))];

  // Fetch per-program graduation thresholds (minPloAttainmentPercent)
  const graduationCriteriaList = await prisma.graduation_criteria.findMany({
    where: { programId: { in: programIds } },
    select: { programId: true, minPloAttainmentPercent: true, minCGPA: true },
  });
  const thresholdByProgram = new Map<number, number>();
  const minCGPAByProgram = new Map<number, number>();
  for (const gc of graduationCriteriaList) {
    thresholdByProgram.set(gc.programId, gc.minPloAttainmentPercent);
    minCGPAByProgram.set(gc.programId, gc.minCGPA);
  }

  // Get PLOs per program
  const plosByProgram = new Map<number, { id: number; code: string }[]>();
  const allPlos = await prisma.plos.findMany({
    where: { programId: { in: programIds }, status: 'active' },
    select: { id: true, code: true, programId: true },
  });
  for (const plo of allPlos) {
    const arr = plosByProgram.get(plo.programId) ?? [];
    arr.push(plo);
    plosByProgram.set(plo.programId, arr);
  }

  // Get all PLO scores for these students
  const studentIds = students.map((s) => s.id);
  const allScores = await prisma.ploscores.findMany({
    where: { studentId: { in: studentIds } },
    select: { studentId: true, ploId: true, percentage: true },
  });

  // Group best score per student per PLO
  const bestScoreMap = new Map<string, number>(); // key: `${studentId}_${ploId}`
  for (const score of allScores) {
    const key = `${score.studentId}_${score.ploId}`;
    const existing = bestScoreMap.get(key) ?? -1;
    if (score.percentage > existing) {
      bestScoreMap.set(key, score.percentage);
    }
  }

  // Build result for each student using their program's threshold
  const result = students.map((student) => {
    const threshold = thresholdByProgram.get(student.programId) ?? 50;
    const minCGPA = minCGPAByProgram.get(student.programId) ?? 2.0;
    const plos = plosByProgram.get(student.programId) ?? [];
    const totalPlos = plos.length;
    const attainedPlos = plos.filter((plo) => {
      const best = bestScoreMap.get(`${student.id}_${plo.id}`) ?? -1;
      return best >= threshold;
    }).length;
    const assessedPlos = plos.filter((plo) => bestScoreMap.has(`${student.id}_${plo.id}`)).length;
    const completionPercent = totalPlos > 0 ? Math.round((attainedPlos / totalPlos) * 100) : 0;
    const cgpa = student.cumulativeGPA?.cumulativeGPA ?? null;
    const isEligible =
      totalPlos > 0 &&
      attainedPlos === totalPlos &&
      (cgpa === null || cgpa >= minCGPA);

    return {
      studentId: student.id,
      rollNumber: student.rollNumber,
      name: `${student.user.first_name} ${student.user.last_name}`,
      program: student.program,
      batch: student.batch,
      cgpa,
      totalPlos,
      attainedPlos,
      assessedPlos,
      completionPercent,
      isEligible,
      threshold,
      minCGPA,
    };
  });

  return NextResponse.json({ success: true, data: result });
}
