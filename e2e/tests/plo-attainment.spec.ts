import { test, expect } from '@playwright/test';
import { testDb } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet, apiPost } from '../support/api-helper';
import {
  recordMarks,
  calculateCloAttainment,
  clearDerivedData,
} from '../support/obe-helper';

/**
 * PLO and PEO attainment.
 *
 * Two different measures roll up here and they must not be confused:
 *   - cohort attainment  — the share of students who achieved the outcome,
 *                          rolled up from CLO/LLO attainment by mapping weight
 *   - individual scores  — one student's weighted mark percentage, stored in
 *                          `ploscores` and used for graduation
 *
 * Each seeded CLO maps to exactly one PLO at weight 1, so a PLO's direct
 * attainment should equal its CLO's attainment.
 */

test.use({ storageState: statePath('admin') });

const ids = readSeededIds();

test.describe('PLO attainment', () => {
  test.beforeEach(async ({ browser }) => {
    await clearDerivedData();

    // One student clears everything, the other clears nothing
    await recordMarks(ids.studentId, [9, 9, 9]);
    await recordMarks(ids.otherStudentId, [2, 2, 2]);

    // CLO attainment has to exist before PLOs can roll up from it, and it is a
    // faculty-scoped endpoint — calling it as an admin returns 401 and leaves
    // the table empty, which would make the assertions below meaningless.
    await calculateCloAttainment(browser);
  });

  test('direct attainment mirrors the mapped CLO attainment', async ({ page }) => {
    await page.goto('/admin');

    const response = await apiPost(page, '/api/plo-attainments', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });
    expect(response.ok, JSON.stringify(response.body)).toBeTruthy();

    const plos = await testDb.ploattainments.findMany({
      where: { programId: ids.programId, semesterId: ids.semesterId },
      orderBy: { ploId: 'asc' },
    });

    expect(plos.length).toBeGreaterThan(0);

    // Each CLO sits at 50% (one of two students achieved it) and maps 1:1 at
    // weight 1, so every PLO's direct attainment is also 50%. Skipping zero
    // values here would let the assertion pass against an empty table.
    expect(plos).toHaveLength(3);
    for (const plo of plos) {
      expect(plo.directAttainment).toBeCloseTo(50, 1);
    }
  });

  test('the denominator counts students assessed for that PLO, not the whole cohort', async ({
    page,
  }) => {
    // Regression guard: totalStudents used to be every student in the program,
    // while studentsAchieved only counted those with a score for that PLO — so
    // a PLO covered by one course read as "40 of 500".
    await page.goto('/admin');

    await apiPost(page, '/api/plo-attainments', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });

    const plos = await testDb.ploattainments.findMany({
      where: { programId: ids.programId, semesterId: ids.semesterId },
    });

    for (const plo of plos) {
      expect(
        plo.studentsAchieved,
        'achieved can never exceed the number assessed'
      ).toBeLessThanOrEqual(plo.totalStudents);

      if (plo.totalStudents > 0) {
        expect(
          plo.totalStudents,
          'only the two enrolled students can be counted'
        ).toBeLessThanOrEqual(2);
      }
    }
  });

  test('per-student PLO scores are written and reflect the marks', async ({ page }) => {
    await page.goto('/admin');

    await apiPost(page, '/api/plo-attainments', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });

    const strong = await testDb.ploscores.findMany({
      where: { studentId: ids.studentId },
    });
    const weak = await testDb.ploscores.findMany({
      where: { studentId: ids.otherStudentId },
    });

    expect(strong.length, 'the strong student has PLO scores').toBeGreaterThan(0);
    expect(weak.length, 'the weak student has PLO scores').toBeGreaterThan(0);

    // 9/10 vs 2/10 on every item
    for (const score of strong) expect(score.percentage).toBeCloseTo(90, 0);
    for (const score of weak) expect(score.percentage).toBeCloseTo(20, 0);
  });

  test('a PLO score aggregates marks rather than taking the best course', async ({
    page,
  }) => {
    // Regression guard: graduation used to take a student's best offering per
    // PLO, letting one strong course mask weak performance everywhere else.
    await page.goto('/admin');

    await apiPost(page, '/api/plo-attainments', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });

    const status = await apiGet<{
      data?: { ploStatus?: Array<{ score: number | null; obtainedMarks: number | null }> };
    }>(page, `/api/students/${ids.studentId}/graduation-status`);

    expect(status.status).toBe(200);

    const ploStatus = status.body?.data?.ploStatus ?? [];
    const scored = ploStatus.filter((p) => p.score !== null);
    expect(scored.length).toBeGreaterThan(0);

    for (const entry of scored) {
      expect(entry.obtainedMarks, 'aggregated marks are reported').not.toBeNull();
      expect(entry.score).toBeCloseTo(90, 0);
    }
  });

  test('PEO attainment rolls up from its mapped PLOs', async ({ page }) => {
    await page.goto('/admin');

    await apiPost(page, '/api/plo-attainments', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });

    const peos = await apiGet<{
      data?: Array<{ code: string; avgAttainment: number | null; isAchieved: boolean | null }>;
    }>(
      page,
      `/api/peo-attainments?programId=${ids.programId}&semesterId=${ids.semesterId}`
    );

    expect(peos.status).toBe(200);

    const rows = peos.body?.data ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].code).toBe('PEO1');
    expect(rows[0].avgAttainment, 'PEO has a figure once PLOs do').not.toBeNull();
  });
});
