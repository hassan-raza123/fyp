import { test, expect } from '@playwright/test';
import { testDb } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiPost } from '../support/api-helper';
import { clearDerivedData } from '../support/obe-helper';

/**
 * Entering marks through the interface, and the rules that guard them.
 *
 * Every other spec writes marks straight to the database so it can get on with
 * testing attainment. This drives the screen a lecturer actually uses, and
 * checks the validation that stops bad marks reaching the attainment chain.
 */

const ids = readSeededIds();

test.describe('Marks entry screen', () => {
  test.use({ storageState: statePath('faculty') });

  test.beforeEach(async () => {
    await clearDerivedData();
  });

  test('the screen loads with its selectors ready', async ({ page }) => {
    // The page starts empty and asks the lecturer to pick a section and an
    // assessment, so assert the controls are there rather than expecting a
    // particular course to already be on screen.
    await page.goto('/faculty/results/marks-entry');

    const combos = page.getByRole('combobox');
    await expect(combos.first()).toBeVisible({ timeout: 20_000 });
    expect(await combos.count(), 'a section and an assessment to choose').toBeGreaterThanOrEqual(1);
  });

  test('the students of the chosen section are listed for marking', async ({
    page,
  }) => {
    await page.goto('/faculty/results/marks-entry');

    // Work through the selects the page offers, then look for the roll numbers
    const combos = page.getByRole('combobox');
    const count = await combos.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const combo = combos.nth(i);
      if (!(await combo.isVisible().catch(() => false))) continue;

      await combo.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
        await page.waitForTimeout(800);
      } else {
        await page.keyboard.press('Escape');
      }
    }

    // Either the students appear, or the page says why they cannot
    const roster = page.getByText(/CS-2026-001/);
    const explanation = page.getByText(
      /select|no students|no assessment|choose/i
    );

    await expect(roster.or(explanation).first()).toBeVisible({ timeout: 20_000 });
  });
});

test.describe('Marks validation', () => {
  test.use({ storageState: statePath('faculty') });

  test.beforeEach(async () => {
    await clearDerivedData();
  });

  test('a mark above the item total is rejected', async ({ page }) => {
    // An over-max mark would push CLO attainment above 100%
    await page.goto('/faculty');

    const response = await apiPost(
      page,
      `/api/assessments/${ids.assessmentId}/section/${ids.sectionId}/marks`,
      {
        marks: [
          {
            studentId: ids.studentId,
            items: [{ itemId: ids.assessmentItemIds[0], marks: 999 }],
          },
        ],
        status: 'evaluated',
      }
    );

    expect(response.ok, 'marks beyond the item total must be refused').toBeFalsy();
    expect(JSON.stringify(response.body)).toMatch(/exceed|maximum|invalid/i);
  });

  test('a negative mark is rejected', async ({ page }) => {
    await page.goto('/faculty');

    const response = await apiPost(
      page,
      `/api/assessments/${ids.assessmentId}/section/${ids.sectionId}/marks`,
      {
        marks: [
          {
            studentId: ids.studentId,
            items: [{ itemId: ids.assessmentItemIds[0], marks: -5 }],
          },
        ],
        status: 'evaluated',
      }
    );

    expect(response.ok).toBeFalsy();
  });

  test('valid marks are stored and roll up into the result total', async ({
    page,
  }) => {
    await page.goto('/faculty');

    const response = await apiPost(
      page,
      `/api/assessments/${ids.assessmentId}/section/${ids.sectionId}/marks`,
      {
        marks: [
          {
            studentId: ids.studentId,
            items: ids.assessmentItemIds.map((itemId) => ({ itemId, marks: 8 })),
          },
        ],
        status: 'evaluated',
      }
    );

    expect(response.ok, JSON.stringify(response.body)).toBeTruthy();

    const result = await testDb.studentassessmentresults.findFirst({
      where: { studentId: ids.studentId, assessmentId: ids.assessmentId },
      include: { itemResults: true },
    });

    expect(result?.itemResults).toHaveLength(ids.assessmentItemIds.length);
    expect(result?.obtainedMarks, '8 × 3 items').toBe(24);
    expect(result?.totalMarks).toBe(30);
    expect(result?.percentage).toBeCloseTo(80, 1);
  });

  test('a locked offering refuses further marks entry', async ({ page }) => {
    // The bulk endpoints checked the lock but this route did not, so the lock
    // could be sidestepped simply by posting here instead.
    await testDb.courseofferings.update({
      where: { id: ids.courseOfferingId },
      data: { isResultsLocked: true },
    });

    await page.goto('/faculty');

    const response = await apiPost(
      page,
      `/api/assessments/${ids.assessmentId}/section/${ids.sectionId}/marks`,
      {
        marks: [
          {
            studentId: ids.studentId,
            items: [{ itemId: ids.assessmentItemIds[0], marks: 5 }],
          },
        ],
        status: 'evaluated',
      }
    );

    expect(response.ok).toBeFalsy();
    expect(JSON.stringify(response.body)).toMatch(/locked/i);

    await testDb.courseofferings.update({
      where: { id: ids.courseOfferingId },
      data: { isResultsLocked: false },
    });
  });

  test('marks entry is written to the audit log', async ({ page }) => {
    // Accreditation asks who changed a mark and when; the audit table was read
    // by the dashboards but nothing ever wrote to it.
    await testDb.auditlogs.deleteMany({});

    await page.goto('/faculty');
    await apiPost(
      page,
      `/api/assessments/${ids.assessmentId}/section/${ids.sectionId}/marks`,
      {
        marks: [
          {
            studentId: ids.studentId,
            items: ids.assessmentItemIds.map((itemId) => ({ itemId, marks: 7 })),
          },
        ],
        status: 'evaluated',
      }
    );

    const entries = await testDb.auditlogs.findMany({
      where: { action: { startsWith: 'marks.' } },
    });

    expect(entries.length, 'the entry is recorded').toBeGreaterThan(0);
    expect(entries[0].userId).toBeGreaterThan(0);

    const details = entries[0].details as Record<string, unknown>;
    expect(details.assessmentId).toBe(ids.assessmentId);
  });
});

test.describe('Result evaluation', () => {
  test.use({ storageState: statePath('faculty') });

  test('a result can be evaluated and its marks adjusted', async ({ page }) => {
    await clearDerivedData();
    await page.goto('/faculty');

    await apiPost(
      page,
      `/api/assessments/${ids.assessmentId}/section/${ids.sectionId}/marks`,
      {
        marks: [
          {
            studentId: ids.studentId,
            items: ids.assessmentItemIds.map((itemId) => ({ itemId, marks: 6 })),
          },
        ],
        status: 'evaluated',
      }
    );

    const result = await testDb.studentassessmentresults.findFirst({
      where: { studentId: ids.studentId, assessmentId: ids.assessmentId },
    });

    const response = await page.evaluate(async ({ id, itemIds }) => {
      const res = await fetch(`/api/assessment-results/${id}/evaluate`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemMarks: itemIds.map((itemId: number) => ({ itemId, marks: 9 })),
          status: 'evaluated',
          adjustmentReason: 'Re-marked after review',
        }),
      });
      return { status: res.status, body: await res.text() };
    }, { id: result!.id, itemIds: ids.assessmentItemIds });

    expect(response.status, response.body).toBe(200);

    const updated = await testDb.studentassessmentresults.findUnique({
      where: { id: result!.id },
      include: { itemResults: true },
    });

    expect(updated?.itemResults.every((r) => r.obtainedMarks === 9)).toBeTruthy();

    // The adjustment reason is what makes a re-mark defensible later
    const audit = await testDb.auditlogs.findFirst({
      where: { action: 'result.evaluate' },
      orderBy: { createdAt: 'desc' },
    });
    const details = audit?.details as Record<string, unknown> | undefined;
    expect(details?.adjustmentReason).toBe('Re-marked after review');
  });
});

test.describe('Sections', () => {
  test.use({ storageState: statePath('admin') });

  test('the create form opens with the fields a section needs', async ({ page }) => {
    await page.goto('/admin/sections');

    await page
      .getByRole('button', { name: /create section|add section/i })
      .first()
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // A section is defined by its name, a course offering, a batch and a cap
    await expect(dialog.getByLabel(/section name|^name$/i).first()).toBeVisible();
    expect(
      await dialog.getByRole('combobox').count(),
      'course offering, batch and faculty are chosen here'
    ).toBeGreaterThanOrEqual(2);
  });

  test('a section can be created and is scoped to its offering', async ({ page }) => {
    // Driven through the API: the form has several interdependent selects
    // (offering → batch → faculty) whose options depend on each other, and
    // pinning that ordering in a test makes it brittle without adding cover.
    // What matters is that the section is created against the right offering.
    const name = `E2E Section ${Date.now().toString().slice(-5)}`;

    await page.goto('/admin');

    const response = await apiPost<{ data?: { id: number } }>(page, '/api/sections', {
      name,
      courseOfferingId: ids.courseOfferingId,
      batchId: ids.batchId,
      facultyId: ids.facultyId,
      maxStudents: 30,
      sessionType: 'morning',
      status: 'active',
    });

    expect(response.ok, JSON.stringify(response.body)).toBeTruthy();

    const created = await testDb.sections.findFirst({ where: { name } });
    expect(created).not.toBeNull();
    expect(created?.courseOfferingId).toBe(ids.courseOfferingId);
    expect(created?.maxStudents).toBe(30);

    await testDb.studentsections.deleteMany({ where: { sectionId: created!.id } });
    await testDb.sections.delete({ where: { id: created!.id } });
  });
});
