/**
 * Backfill repeat-course grade attempts.
 *
 * Grade calculation now marks earlier attempts at a repeated course as
 * `superseded` so a course's credit hours are counted once. Rows written before
 * that change never went through the new logic, so any student who repeated a
 * course still has two live grade rows and an inflated credit total.
 *
 * This script finds those cases and fixes them: for each (student, course) with
 * more than one grade, the latest attempt stays active and every earlier one is
 * marked superseded with its attemptNumber set. GPA rows are then recomputed.
 *
 * Usage:
 *   node prisma/backfill-repeat-grades.js           # report only, no writes
 *   node prisma/backfill-repeat-grades.js --apply   # apply the fix
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function main() {
  console.log(
    APPLY
      ? '── Backfilling repeat grades (writes enabled) ──'
      : '── Dry run: no changes will be written. Pass --apply to write. ──'
  );

  const grades = await prisma.studentgrades.findMany({
    where: { status: { in: ['active', 'final'] } },
    select: {
      id: true,
      studentId: true,
      creditHours: true,
      calculatedAt: true,
      courseOffering: {
        select: {
          courseId: true,
          semesterId: true,
          course: { select: { code: true } },
          semester: { select: { name: true, startDate: true } },
        },
      },
    },
  });

  // Group by student + course; more than one row means the course was repeated
  const groups = new Map();
  for (const grade of grades) {
    const key = `${grade.studentId}:${grade.courseOffering.courseId}`;
    const list = groups.get(key) ?? [];
    list.push(grade);
    groups.set(key, list);
  }

  const repeated = [...groups.entries()].filter(([, list]) => list.length > 1);

  if (repeated.length === 0) {
    console.log('No repeated courses found. Nothing to do.');
    return;
  }

  console.log(`Found ${repeated.length} student-course pair(s) with repeats.\n`);

  const affectedStudents = new Set();
  let supersededCount = 0;

  for (const [key, list] of repeated) {
    // Latest attempt = latest semester start date, falling back to calculatedAt
    const ordered = [...list].sort((a, b) => {
      const aDate = a.courseOffering.semester.startDate?.getTime() ?? 0;
      const bDate = b.courseOffering.semester.startDate?.getTime() ?? 0;
      if (aDate !== bDate) return aDate - bDate;
      return a.calculatedAt.getTime() - b.calculatedAt.getTime();
    });

    const latest = ordered[ordered.length - 1];
    const earlier = ordered.slice(0, -1);
    const [studentId] = key.split(':');

    console.log(
      `Student ${studentId} — ${latest.courseOffering.course.code}: ` +
        `${ordered.length} attempts, keeping ${latest.courseOffering.semester.name}, ` +
        `superseding ${earlier.length}`
    );

    affectedStudents.add(Number(studentId));
    supersededCount += earlier.length;

    if (!APPLY) continue;

    for (let i = 0; i < earlier.length; i++) {
      await prisma.studentgrades.update({
        where: { id: earlier[i].id },
        data: { status: 'superseded', attemptNumber: i + 1 },
      });
    }

    await prisma.studentgrades.update({
      where: { id: latest.id },
      data: { attemptNumber: ordered.length, isRepeat: true },
    });
  }

  console.log(
    `\n${supersededCount} grade row(s) would be superseded across ` +
      `${affectedStudents.size} student(s).`
  );

  if (!APPLY) {
    console.log('Dry run complete. Re-run with --apply to write these changes.');
    return;
  }

  // Recompute GPA for everyone whose grade set changed
  console.log('\nRecomputing GPA for affected students...');
  for (const studentId of affectedStudents) {
    const countable = await prisma.studentgrades.findMany({
      where: { studentId, status: { in: ['active', 'final'] } },
      select: {
        creditHours: true,
        qualityPoints: true,
        courseOffering: { select: { semesterId: true } },
      },
    });

    const bySemester = new Map();
    for (const grade of countable) {
      const sid = grade.courseOffering.semesterId;
      const entry = bySemester.get(sid) ?? { credits: 0, points: 0 };
      entry.credits += grade.creditHours;
      entry.points += grade.qualityPoints;
      bySemester.set(sid, entry);
    }

    for (const [semesterId, totals] of bySemester) {
      const semesterGPA =
        totals.credits > 0
          ? Math.round((totals.points / totals.credits) * 100) / 100
          : 0;
      await prisma.semestergpa.upsert({
        where: { studentId_semesterId: { studentId, semesterId } },
        update: {
          totalQualityPoints: totals.points,
          totalCreditHours: totals.credits,
          semesterGPA,
          status: 'recalculated',
          calculatedAt: new Date(),
        },
        create: {
          studentId,
          semesterId,
          totalQualityPoints: totals.points,
          totalCreditHours: totals.credits,
          semesterGPA,
        },
      });
    }

    const totalCreditHours = countable.reduce((s, g) => s + g.creditHours, 0);
    const totalQualityPoints = countable.reduce((s, g) => s + g.qualityPoints, 0);
    const cumulativeGPA =
      totalCreditHours > 0
        ? Math.round((totalQualityPoints / totalCreditHours) * 100) / 100
        : 0;

    await prisma.cumulativegpa.upsert({
      where: { studentId },
      update: {
        totalQualityPoints,
        totalCreditHours,
        cumulativeGPA,
        completedSemesters: bySemester.size,
      },
      create: {
        studentId,
        totalQualityPoints,
        totalCreditHours,
        cumulativeGPA,
        completedSemesters: bySemester.size,
      },
    });

    console.log(`  Student ${studentId}: CGPA ${cumulativeGPA} (${totalCreditHours} cr)`);
  }

  console.log('\nBackfill complete.');
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
