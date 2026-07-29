import { test, expect } from '@playwright/test';
import { testDb } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet, apiPost } from '../support/api-helper';

/**
 * Marks through to CLO attainment.
 *
 * This is the core of the system and the part whose numbers matter most, so the
 * assertions check arithmetic rather than just that a request succeeded.
 *
 * The seeded course offering has:
 *   - 3 CLOs, one assessment item each, 10 marks apiece
 *   - performance threshold 60%  (a student achieves a CLO at 60% of its marks)
 *   - target threshold      50%  (the CLO is attained when 50% of assessed
 *                                 students achieved it)
 *   - 2 enrolled students
 */

test.use({ storageState: statePath('faculty') });

const ids = readSeededIds();

/** Give one student a mark on every item of the seeded assessment. */
async function enterMarks(studentId: number, marksPerItem: number[]) {
  const result = await testDb.studentassessmentresults.upsert({
    where: {
      studentId_assessmentId: { studentId, assessmentId: ids.assessmentId },
    },
    update: {
      obtainedMarks: marksPerItem.reduce((a, b) => a + b, 0),
      totalMarks: 30,
      percentage: (marksPerItem.reduce((a, b) => a + b, 0) / 30) * 100,
      status: 'evaluated',
    },
    create: {
      studentId,
      assessmentId: ids.assessmentId,
      obtainedMarks: marksPerItem.reduce((a, b) => a + b, 0),
      totalMarks: 30,
      percentage: (marksPerItem.reduce((a, b) => a + b, 0) / 30) * 100,
      status: 'evaluated',
      remarks: '',
      updatedAt: new Date(),
    },
  });

  await testDb.studentassessmentitemresults.deleteMany({
    where: { studentAssessmentResultId: result.id },
  });

  for (let i = 0; i < ids.assessmentItemIds.length; i++) {
    await testDb.studentassessmentitemresults.create({
      data: {
        studentAssessmentResultId: result.id,
        assessmentItemId: ids.assessmentItemIds[i],
        obtainedMarks: marksPerItem[i],
        totalMarks: 10,
        isCorrect: marksPerItem[i] >= 5,
        updatedAt: new Date(),
      },
    });
  }
}

async function clearAttainments() {
  await testDb.closattainments.deleteMany({
    where: { courseOfferingId: ids.courseOfferingId },
  });
}

test.describe('CLO attainment', () => {
  test.beforeEach(async () => {
    await clearAttainments();
    await testDb.studentassessmentitemresults.deleteMany({});
    await testDb.studentassessmentresults.deleteMany({});
  });

  test('both students passing gives 100% attainment and an Attained verdict', async ({
    page,
  }) => {
    await page.goto('/faculty');

    // 8, 9, 10 out of 10 — every CLO clears the 60% performance threshold
    await enterMarks(ids.studentId, [8, 9, 10]);
    await enterMarks(ids.otherStudentId, [9, 8, 10]);

    const response = await apiPost(page, '/api/faculty/clo-attainments/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });
    expect(response.ok, JSON.stringify(response.body)).toBeTruthy();

    const rows = await testDb.closattainments.findMany({
      where: { courseOfferingId: ids.courseOfferingId },
      orderBy: { cloId: 'asc' },
    });

    expect(rows).toHaveLength(3);

    for (const row of rows) {
      expect(row.totalStudents, 'both students were assessed').toBe(2);
      expect(row.studentsAchieved, 'both cleared 60%').toBe(2);
      expect(row.unassessedStudents).toBe(0);
      expect(row.attainmentPercent).toBe(100);
      expect(row.threshold, 'performance threshold from pass/fail criteria').toBe(60);
      expect(row.targetThreshold, 'target threshold from pass/fail criteria').toBe(50);
      expect(row.isAchieved, '100% clears the 50% target').toBe(true);
    }
  });

  test('both students failing gives 0% and a Not Achieved verdict', async ({ page }) => {
    await page.goto('/faculty');

    // 3/10 on every item — nobody reaches 60%
    await enterMarks(ids.studentId, [3, 3, 3]);
    await enterMarks(ids.otherStudentId, [2, 4, 3]);

    const response = await apiPost(page, '/api/faculty/clo-attainments/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });
    expect(response.ok).toBeTruthy();

    const rows = await testDb.closattainments.findMany({
      where: { courseOfferingId: ids.courseOfferingId },
    });

    for (const row of rows) {
      expect(row.studentsAchieved).toBe(0);
      expect(row.attainmentPercent).toBe(0);
      expect(row.isAchieved).toBe(false);
    }
  });

  test('one of two passing is exactly 50% and still counts as attained', async ({
    page,
  }) => {
    // The boundary case: attainment 50% against a target of 50% must be
    // "achieved", because the rule is >= not >.
    await page.goto('/faculty');

    await enterMarks(ids.studentId, [9, 9, 9]); // clears every CLO
    await enterMarks(ids.otherStudentId, [2, 2, 2]); // clears none

    const response = await apiPost(page, '/api/faculty/clo-attainments/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });
    expect(response.ok).toBeTruthy();

    const rows = await testDb.closattainments.findMany({
      where: { courseOfferingId: ids.courseOfferingId },
    });

    for (const row of rows) {
      expect(row.studentsAchieved).toBe(1);
      expect(row.attainmentPercent).toBe(50);
      expect(row.isAchieved, '50% meets a 50% target').toBe(true);
    }
  });

  test('an unassessed student is excluded from the denominator, not failed', async ({
    page,
  }) => {
    // Regression guard: attainment used to divide by everyone enrolled, so a
    // half-finished marks entry silently reported a much lower figure.
    await page.goto('/faculty');

    await enterMarks(ids.studentId, [8, 8, 8]);
    // otherStudent deliberately has no result

    const response = await apiPost(page, '/api/faculty/clo-attainments/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });
    expect(response.ok).toBeTruthy();

    const rows = await testDb.closattainments.findMany({
      where: { courseOfferingId: ids.courseOfferingId },
    });

    for (const row of rows) {
      expect(row.totalStudents, 'only the assessed student counts').toBe(1);
      expect(row.studentsAchieved).toBe(1);
      expect(row.unassessedStudents, 'the other student is reported separately').toBe(1);
      expect(row.attainmentPercent, 'not 50% — the absentee is not a failure').toBe(100);
    }
  });

  test('nothing assessed reports no data rather than 0%', async ({ page }) => {
    await page.goto('/faculty');

    const response = await apiPost(page, '/api/faculty/clo-attainments/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });
    expect(response.ok).toBeTruthy();

    const rows = await testDb.closattainments.findMany({
      where: { courseOfferingId: ids.courseOfferingId },
    });

    for (const row of rows) {
      expect(row.totalStudents).toBe(0);
      expect(row.unassessedStudents).toBe(2);
      expect(
        row.isAchieved,
        'with nobody assessed there is no verdict to give'
      ).toBeNull();
    }
  });
});

test.describe('Attainment verdicts on read paths', () => {
  test.beforeEach(async () => {
    await clearAttainments();
    await testDb.studentassessmentitemresults.deleteMany({});
    await testDb.studentassessmentresults.deleteMany({});
    await enterMarks(ids.studentId, [9, 9, 9]);
    await enterMarks(ids.otherStudentId, [2, 2, 2]);
  });

  test('the API reports Attained for 50% against a 50% target', async ({ page }) => {
    // Regression guard: read paths used to compare attainmentPercent (share of
    // students) against threshold (marks a student needs). Those are different
    // units, so a 50% attainment against a 60% performance threshold was
    // wrongly reported as Not Attained.
    await page.goto('/faculty');

    await apiPost(page, '/api/faculty/clo-attainments/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });

    const listed = await apiGet<{ data?: unknown }>(
      page,
      `/api/faculty/clo-attainments?courseOfferingId=${ids.courseOfferingId}`
    );
    expect(listed.status).toBe(200);

    const stored = await testDb.closattainments.findFirst({
      where: { courseOfferingId: ids.courseOfferingId },
    });

    expect(stored?.attainmentPercent).toBe(50);
    expect(stored?.threshold, 'marks a student needs').toBe(60);
    expect(stored?.targetThreshold, 'share of students needed').toBe(50);
    expect(
      stored?.isAchieved,
      'the verdict follows the target, not the performance threshold'
    ).toBe(true);
  });

  test('the CLO details endpoint agrees with the stored verdict', async ({ page }) => {
    await page.goto('/faculty');

    await apiPost(page, '/api/faculty/clo-attainments/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });

    const details = await apiGet<{
      data?: { attainments?: Array<{ status: string; isAchieved: boolean | null }> };
    }>(page, `/api/faculty/clo-attainments/${ids.cloIds[0]}/details`);

    expect(details.status).toBe(200);

    const attainments = details.body?.data?.attainments ?? [];
    expect(attainments.length).toBeGreaterThan(0);
    expect(attainments[0].status).toBe('attained');
    expect(attainments[0].isAchieved).toBe(true);
  });
});
