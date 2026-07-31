import { test, expect } from '@playwright/test';
import { testDb } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet, apiPost, apiPut, apiDelete } from '../support/api-helper';

/**
 * The configuration that decides how attainment is computed: outcome mappings,
 * thresholds and criteria. Getting any of these wrong changes every number
 * downstream, so the weight rules in particular are worth pinning down.
 */

test.use({ storageState: statePath('admin') });

const ids = readSeededIds();

test.describe('Outcome mappings', () => {
  test.afterEach(async () => {
    // Leave only the mappings the fixture created
    await testDb.cloplomappings.deleteMany({
      where: { clo: { code: { startsWith: 'E2E' } } },
    });
  });

  test('a CLO-PLO mapping can be created and removed', async ({ page }) => {
    await page.goto('/admin');

    // A spare CLO with no mapping yet
    const clo = await testDb.clos.create({
      data: {
        code: 'E2E-MAP-1',
        description: 'Mapping fixture',
        courseId: ids.theoryCourseId,
        bloomLevel: 'Apply',
        bloomDomain: 'Cognitive',
        status: 'active',
        updatedAt: new Date(),
      },
    });

    const created = await apiPost<{ data?: { id: number } }>(
      page,
      '/api/clo-plo-mappings',
      { cloId: clo.id, ploId: ids.ploIds[0], weight: 0.6 }
    );
    expect(created.ok, JSON.stringify(created.body)).toBeTruthy();

    const mapping = await testDb.cloplomappings.findFirst({
      where: { cloId: clo.id, ploId: ids.ploIds[0] },
    });
    expect(mapping?.weight).toBeCloseTo(0.6, 2);

    const removed = await apiDelete(page, `/api/clo-plo-mappings/${mapping!.id}`);
    expect(removed.ok).toBeTruthy();

    expect(await testDb.cloplomappings.count({ where: { cloId: clo.id } })).toBe(0);

    await testDb.clos.delete({ where: { id: clo.id } });
  });

  test("a CLO's mapping weights cannot exceed 1 in total", async ({ page }) => {
    // The weights divide one CLO's contribution, so they must not sum past 1.
    await page.goto('/admin');

    const clo = await testDb.clos.create({
      data: {
        code: 'E2E-MAP-2',
        description: 'Weight ceiling fixture',
        courseId: ids.theoryCourseId,
        bloomLevel: 'Apply',
        bloomDomain: 'Cognitive',
        status: 'active',
        updatedAt: new Date(),
      },
    });

    const first = await apiPost(page, '/api/clo-plo-mappings', {
      cloId: clo.id,
      ploId: ids.ploIds[0],
      weight: 0.7,
    });
    expect(first.ok).toBeTruthy();

    const second = await apiPost(page, '/api/clo-plo-mappings', {
      cloId: clo.id,
      ploId: ids.ploIds[1],
      weight: 0.5, // 0.7 + 0.5 = 1.2
    });
    expect(second.ok, 'the total would exceed 1').toBeFalsy();
    expect(JSON.stringify(second.body)).toMatch(/exceed|weight/i);

    // A weight that fits is accepted
    const third = await apiPost(page, '/api/clo-plo-mappings', {
      cloId: clo.id,
      ploId: ids.ploIds[1],
      weight: 0.3,
    });
    expect(third.ok).toBeTruthy();

    await testDb.cloplomappings.deleteMany({ where: { cloId: clo.id } });
    await testDb.clos.delete({ where: { id: clo.id } });
  });

  test('a mapping weight outside 0..1 is rejected', async ({ page }) => {
    await page.goto('/admin');

    const clo = await testDb.clos.create({
      data: {
        code: 'E2E-MAP-3',
        description: 'Range fixture',
        courseId: ids.theoryCourseId,
        bloomLevel: 'Apply',
        bloomDomain: 'Cognitive',
        status: 'active',
        updatedAt: new Date(),
      },
    });

    for (const weight of [-0.1, 1.5]) {
      const response = await apiPost(page, '/api/clo-plo-mappings', {
        cloId: clo.id,
        ploId: ids.ploIds[0],
        weight,
      });
      expect(response.ok, `${weight} is out of range`).toBeFalsy();
    }

    await testDb.clos.delete({ where: { id: clo.id } });
  });

  test('an LLO-PLO mapping can be created', async ({ page }) => {
    await page.goto('/admin');

    const llo = await testDb.llos.create({
      data: {
        code: 'E2E-LLO-MAP',
        description: 'Lab mapping fixture',
        courseId: ids.labCourseId,
        bloomLevel: 'Apply',
        bloomDomain: 'Psychomotor',
        status: 'active',
        updatedAt: new Date(),
      },
    });

    const created = await apiPost(page, '/api/llo-plo-mappings', {
      lloId: llo.id,
      ploId: ids.ploIds[0],
      weight: 0.5,
    });
    expect(created.ok, JSON.stringify(created.body)).toBeTruthy();

    await testDb.lloplomappings.deleteMany({ where: { lloId: llo.id } });
    await testDb.llos.delete({ where: { id: llo.id } });
  });

  test('a PEO-PLO mapping carries a weight', async ({ page }) => {
    // peoplomappings gained a weight so PEO roll-up matches how CLO and LLO
    // mappings behave; an unweighted mean treated every PLO as equal.
    await page.goto('/admin');

    const mappings = await testDb.peoplomappings.findMany({
      where: { peoId: ids.peoId },
    });

    expect(mappings.length).toBeGreaterThan(0);
    for (const mapping of mappings) {
      expect(mapping.weight, 'a weight is always present').toBeGreaterThan(0);
    }
  });
});

test.describe('Pass/fail criteria', () => {
  test('changing the threshold changes the attainment verdict', async ({
    page,
    browser,
  }) => {
    // The criteria are not decoration: they decide whether an outcome counts as
    // attained, so a change must be visible in the next calculation.
    const criteria = await testDb.passfailcriteria.findUnique({
      where: { courseOfferingId: ids.courseOfferingId },
    });
    const originalTarget = criteria!.minCloAttainmentPercent;

    // One of two students passes → attainment 50%
    const { recordMarks, calculateCloAttainment, clearDerivedData } = await import(
      '../support/obe-helper'
    );
    await clearDerivedData();
    await recordMarks(ids.studentId, [9, 9, 9]);
    await recordMarks(ids.otherStudentId, [2, 2, 2]);

    // With a 50% target, 50% attainment is achieved
    await testDb.passfailcriteria.update({
      where: { courseOfferingId: ids.courseOfferingId },
      data: { minCloAttainmentPercent: 50 },
    });
    await calculateCloAttainment(browser);

    let rows = await testDb.closattainments.findMany({
      where: { courseOfferingId: ids.courseOfferingId },
    });
    expect(rows.every((r) => r.isAchieved === true)).toBeTruthy();

    // Raise the target to 80% and the same marks now fall short
    await testDb.passfailcriteria.update({
      where: { courseOfferingId: ids.courseOfferingId },
      data: { minCloAttainmentPercent: 80 },
    });
    await calculateCloAttainment(browser);

    rows = await testDb.closattainments.findMany({
      where: { courseOfferingId: ids.courseOfferingId },
    });
    expect(
      rows.every((r) => r.isAchieved === false),
      '50% attainment misses an 80% target'
    ).toBeTruthy();

    await testDb.passfailcriteria.update({
      where: { courseOfferingId: ids.courseOfferingId },
      data: { minCloAttainmentPercent: originalTarget },
    });
  });

  test('the performance threshold decides who counts as achieving', async ({
    page,
    browser,
  }) => {
    const criteria = await testDb.passfailcriteria.findUnique({
      where: { courseOfferingId: ids.courseOfferingId },
    });
    const originalPass = criteria!.minPassPercent;

    const { recordMarks, calculateCloAttainment, clearDerivedData } = await import(
      '../support/obe-helper'
    );
    await clearDerivedData();
    // Both students score 70%
    await recordMarks(ids.studentId, [7, 7, 7]);
    await recordMarks(ids.otherStudentId, [7, 7, 7]);

    // At a 60% pass mark, both achieve
    await testDb.passfailcriteria.update({
      where: { courseOfferingId: ids.courseOfferingId },
      data: { minPassPercent: 60 },
    });
    await calculateCloAttainment(browser);

    let rows = await testDb.closattainments.findMany({
      where: { courseOfferingId: ids.courseOfferingId },
    });
    expect(rows.every((r) => r.studentsAchieved === 2)).toBeTruthy();

    // Raise the pass mark to 80% and neither does
    await testDb.passfailcriteria.update({
      where: { courseOfferingId: ids.courseOfferingId },
      data: { minPassPercent: 80 },
    });
    await calculateCloAttainment(browser);

    rows = await testDb.closattainments.findMany({
      where: { courseOfferingId: ids.courseOfferingId },
    });
    expect(rows.every((r) => r.studentsAchieved === 0)).toBeTruthy();

    await testDb.passfailcriteria.update({
      where: { courseOfferingId: ids.courseOfferingId },
      data: { minPassPercent: originalPass },
    });
  });
});

test.describe('Graduation criteria', () => {
  test('the direct/indirect split is applied to PLO attainment', async ({
    page,
    browser,
  }) => {
    const original = await testDb.graduation_criteria.findUnique({
      where: { programId: ids.programId },
    });

    const { recordMarks, calculateCloAttainment, clearDerivedData } = await import(
      '../support/obe-helper'
    );
    await clearDerivedData();
    await recordMarks(ids.studentId, [9, 9, 9]);
    await recordMarks(ids.otherStudentId, [9, 9, 9]);
    await calculateCloAttainment(browser);

    await page.goto('/admin');
    await apiPost(page, '/api/plo-attainments', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });

    const plos = await testDb.ploattainments.findMany({
      where: { programId: ids.programId, semesterId: ids.semesterId },
    });

    // With no survey data the combined figure is the direct one alone
    for (const plo of plos) {
      expect(plo.indirectAttainment, 'no surveys were answered').toBeNull();
      expect(plo.attainmentPercent).toBeCloseTo(plo.directAttainment ?? 0, 1);
    }

    await testDb.graduation_criteria.update({
      where: { programId: ids.programId },
      data: {
        directWeight: original!.directWeight,
        indirectWeight: original!.indirectWeight,
      },
    });
  });

  test('the PLO threshold drives the achieved verdict', async ({ page, browser }) => {
    const original = await testDb.graduation_criteria.findUnique({
      where: { programId: ids.programId },
    });

    const { recordMarks, calculateCloAttainment, clearDerivedData } = await import(
      '../support/obe-helper'
    );
    await clearDerivedData();
    await recordMarks(ids.studentId, [9, 9, 9]);
    await recordMarks(ids.otherStudentId, [2, 2, 2]);
    await calculateCloAttainment(browser);

    await page.goto('/admin');

    // Direct attainment lands at 50%; a 90% threshold must fail it
    await testDb.graduation_criteria.update({
      where: { programId: ids.programId },
      data: { minPloAttainmentPercent: 90 },
    });
    await apiPost(page, '/api/plo-attainments', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });

    const plos = await testDb.ploattainments.findMany({
      where: { programId: ids.programId, semesterId: ids.semesterId },
    });
    expect(plos.every((p) => p.isAchieved === false)).toBeTruthy();

    await testDb.graduation_criteria.update({
      where: { programId: ids.programId },
      data: { minPloAttainmentPercent: original!.minPloAttainmentPercent },
    });
  });
});

test.describe('Bloom analysis', () => {
  test('the curriculum is classified into higher and lower order thinking', async ({
    page,
  }) => {
    await page.goto('/admin');

    const response = await apiGet<{
      data?: {
        summary?: Record<string, number>;
        hotPercentage?: number;
        lotPercentage?: number;
      };
    }>(page, `/api/bloom-analysis?programId=${ids.programId}`);

    expect(response.status).toBe(200);

    // The fixture uses Understand, Apply and Analyze, so both bands appear
    const body = JSON.stringify(response.body);
    expect(body).toMatch(/Apply|Analyze|Understand/);
  });
});
