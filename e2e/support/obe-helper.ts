import { expect, type Browser } from '@playwright/test';
import { testDb } from './fixtures';
import { statePath, readSeededIds } from './global-setup';
import { apiPost } from './api-helper';

/**
 * Shared OBE actions for specs.
 *
 * CLO and LLO attainment are calculated through faculty-scoped endpoints —
 * `getFacultyIdFromRequest` returns null for anyone else — so a spec running as
 * an admin has to borrow a faculty session to trigger them. Doing that here
 * keeps specs from silently calling the endpoint as the wrong role and then
 * asserting against an empty table.
 */

const ids = readSeededIds();

/** Record one student's marks on every item of the seeded assessment. */
export async function recordMarks(
  studentId: number,
  marksPerItem: number[]
): Promise<void> {
  const total = marksPerItem.reduce((a, b) => a + b, 0);

  const result = await testDb.studentassessmentresults.upsert({
    where: {
      studentId_assessmentId: { studentId, assessmentId: ids.assessmentId },
    },
    update: {
      obtainedMarks: total,
      totalMarks: 30,
      percentage: (total / 30) * 100,
      status: 'evaluated',
    },
    create: {
      studentId,
      assessmentId: ids.assessmentId,
      obtainedMarks: total,
      totalMarks: 30,
      percentage: (total / 30) * 100,
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

/**
 * Calculate CLO attainment using a faculty session, and assert it produced
 * rows — an empty table would otherwise make downstream assertions pass
 * vacuously.
 */
export async function calculateCloAttainment(browser: Browser): Promise<void> {
  const context = await browser.newContext({ storageState: statePath('faculty') });
  const page = await context.newPage();

  try {
    await page.goto('/faculty');
    const response = await apiPost(page, '/api/faculty/clo-attainments/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });
    expect(
      response.ok,
      `CLO attainment calculation failed: ${JSON.stringify(response.body)}`
    ).toBeTruthy();
  } finally {
    await context.close();
  }

  const rows = await testDb.closattainments.count({
    where: { courseOfferingId: ids.courseOfferingId },
  });
  expect(rows, 'CLO attainment produced no rows').toBeGreaterThan(0);
}

/** Calculate grades using a faculty session. */
export async function calculateGrades(browser: Browser): Promise<void> {
  const context = await browser.newContext({ storageState: statePath('faculty') });
  const page = await context.newPage();

  try {
    await page.goto('/faculty');
    const response = await apiPost(page, '/api/faculty/grades/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });
    expect(
      response.ok,
      `Grade calculation failed: ${JSON.stringify(response.body)}`
    ).toBeTruthy();
  } finally {
    await context.close();
  }
}

/** Remove every derived record so a spec starts from marks only. */
export async function clearDerivedData(): Promise<void> {
  await testDb.ploscores.deleteMany({});
  await testDb.ploattainments.deleteMany({});
  await testDb.closattainments.deleteMany({});
  await testDb.llosattainments.deleteMany({});
  await testDb.semestergpa.deleteMany({});
  await testDb.cumulativegpa.deleteMany({});
  await testDb.studentgrades.deleteMany({});
  await testDb.transcripts.deleteMany({});
  await testDb.obereports.deleteMany({});
  await testDb.studentassessmentitemresults.deleteMany({});
  await testDb.studentassessmentresults.deleteMany({});
}
