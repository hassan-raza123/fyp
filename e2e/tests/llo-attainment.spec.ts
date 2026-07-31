import { test, expect } from '@playwright/test';
import { testDb } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiPost } from '../support/api-helper';

/**
 * LLO attainment — the lab half of the outcome chain.
 *
 * LLOs behave like CLOs but only lab assessment types contribute, which is a
 * separate code path with its own thresholds. It had no coverage at all.
 */

test.use({ storageState: statePath('faculty') });

const ids = readSeededIds();

/**
 * The seeded lab offering has no assessment, so build one: a lab exam with an
 * item per LLO. Returns the item ids.
 */
async function seedLabAssessment(): Promise<number[]> {
  // Items reference the assessment, so they have to go first or the delete
  // trips a foreign key and the whole beforeEach throws.
  await testDb.assessmentitems.deleteMany({
    where: { assessment: { courseOfferingId: ids.labOfferingId } },
  });
  await testDb.assessments.deleteMany({
    where: { courseOfferingId: ids.labOfferingId },
  });

  // The lab offering needs a section with students, or there is nobody to assess
  let section = await testDb.sections.findFirst({
    where: { courseOfferingId: ids.labOfferingId },
  });

  if (!section) {
    section = await testDb.sections.create({
      data: {
        name: 'Lab Section A',
        courseOfferingId: ids.labOfferingId,
        facultyId: ids.facultyId,
        batchId: ids.batchId,
        maxStudents: 40,
        sessionType: 'morning',
        status: 'active',
        updatedAt: new Date(),
      },
    });

    for (const studentId of [ids.studentId, ids.otherStudentId]) {
      await testDb.studentsections.create({
        data: {
          studentId,
          sectionId: section.id,
          status: 'active',
          updatedAt: new Date(),
        },
      });
    }
  }

  const assessment = await testDb.assessments.create({
    data: {
      title: 'Lab Exam',
      // Only lab types feed LLO attainment
      type: 'lab_exam',
      courseOfferingId: ids.labOfferingId,
      conductedBy: ids.facultyId,
      totalMarks: 20,
      weightage: 100,
      status: 'active',
      dueDate: new Date('2026-11-20'),
      updatedAt: new Date(),
    },
  });

  const itemIds: number[] = [];
  for (let i = 0; i < ids.lloIds.length; i++) {
    const item = await testDb.assessmentitems.create({
      data: {
        assessmentId: assessment.id,
        questionNo: `L${i + 1}`,
        description: `Lab task ${i + 1}`,
        marks: 10,
        lloId: ids.lloIds[i],
        updatedAt: new Date(),
      },
    });
    itemIds.push(item.id);
  }

  return itemIds;
}

async function recordLabMarks(
  studentId: number,
  itemIds: number[],
  marks: number[]
) {
  const assessment = await testDb.assessments.findFirst({
    where: { courseOfferingId: ids.labOfferingId },
  });
  const total = marks.reduce((a, b) => a + b, 0);

  const result = await testDb.studentassessmentresults.upsert({
    where: {
      studentId_assessmentId: { studentId, assessmentId: assessment!.id },
    },
    update: {
      obtainedMarks: total,
      totalMarks: 20,
      percentage: (total / 20) * 100,
      status: 'evaluated',
    },
    create: {
      studentId,
      assessmentId: assessment!.id,
      obtainedMarks: total,
      totalMarks: 20,
      percentage: (total / 20) * 100,
      status: 'evaluated',
      remarks: '',
      updatedAt: new Date(),
    },
  });

  await testDb.studentassessmentitemresults.deleteMany({
    where: { studentAssessmentResultId: result.id },
  });

  for (let i = 0; i < itemIds.length; i++) {
    await testDb.studentassessmentitemresults.create({
      data: {
        studentAssessmentResultId: result.id,
        assessmentItemId: itemIds[i],
        obtainedMarks: marks[i],
        totalMarks: 10,
        isCorrect: marks[i] >= 5,
        updatedAt: new Date(),
      },
    });
  }
}

test.describe('LLO attainment', () => {
  let itemIds: number[] = [];

  test.beforeEach(async () => {
    await testDb.llosattainments.deleteMany({});
    await testDb.studentassessmentitemresults.deleteMany({});
    await testDb.studentassessmentresults.deleteMany({});
    itemIds = await seedLabAssessment();
  });

  test('both students passing gives 100% and an Attained verdict', async ({ page }) => {
    await page.goto('/faculty');

    await recordLabMarks(ids.studentId, itemIds, [9, 9]);
    await recordLabMarks(ids.otherStudentId, itemIds, [8, 8]);

    const response = await apiPost(page, '/api/faculty/llo-attainments/calculate', {
      courseOfferingId: ids.labOfferingId,
    });
    expect(response.ok, JSON.stringify(response.body)).toBeTruthy();

    const rows = await testDb.llosattainments.findMany({
      where: { courseOfferingId: ids.labOfferingId },
    });

    expect(rows.length, 'one row per LLO').toBe(ids.lloIds.length);

    for (const row of rows) {
      expect(row.totalStudents).toBe(2);
      expect(row.studentsAchieved).toBe(2);
      expect(row.attainmentPercent).toBe(100);
      expect(row.threshold, 'performance threshold from criteria').toBe(60);
      expect(row.targetThreshold, 'target threshold from criteria').toBe(50);
      expect(row.isAchieved).toBe(true);
    }
  });

  test('one of two passing is 50% and still attained', async ({ page }) => {
    await page.goto('/faculty');

    await recordLabMarks(ids.studentId, itemIds, [9, 9]);
    await recordLabMarks(ids.otherStudentId, itemIds, [2, 2]);

    await apiPost(page, '/api/faculty/llo-attainments/calculate', {
      courseOfferingId: ids.labOfferingId,
    });

    const rows = await testDb.llosattainments.findMany({
      where: { courseOfferingId: ids.labOfferingId },
    });

    for (const row of rows) {
      expect(row.attainmentPercent).toBe(50);
      expect(row.isAchieved, '50% meets a 50% target').toBe(true);
    }
  });

  test('an unassessed student is excluded from the denominator', async ({ page }) => {
    await page.goto('/faculty');

    await recordLabMarks(ids.studentId, itemIds, [8, 8]);
    // otherStudent has no lab result

    await apiPost(page, '/api/faculty/llo-attainments/calculate', {
      courseOfferingId: ids.labOfferingId,
    });

    const rows = await testDb.llosattainments.findMany({
      where: { courseOfferingId: ids.labOfferingId },
    });

    for (const row of rows) {
      expect(row.totalStudents).toBe(1);
      expect(row.unassessedStudents).toBe(1);
      expect(row.attainmentPercent, 'the absentee is not counted as a failure').toBe(
        100
      );
    }
  });

  test('a theory assessment does not feed LLO attainment', async ({ page }) => {
    // Only lab assessment types may contribute; a midterm must be ignored even
    // if its items are mapped to LLOs.
    await page.goto('/faculty');

    await testDb.assessments.updateMany({
      where: { courseOfferingId: ids.labOfferingId },
      data: { type: 'mid_exam' },
    });

    await recordLabMarks(ids.studentId, itemIds, [9, 9]);
    await recordLabMarks(ids.otherStudentId, itemIds, [9, 9]);

    await apiPost(page, '/api/faculty/llo-attainments/calculate', {
      courseOfferingId: ids.labOfferingId,
    });

    const rows = await testDb.llosattainments.findMany({
      where: { courseOfferingId: ids.labOfferingId },
    });

    // Either no rows at all, or rows with nothing assessed
    for (const row of rows) {
      expect(
        row.totalStudents,
        'marks from a non-lab assessment must not count'
      ).toBe(0);
    }
  });
});
