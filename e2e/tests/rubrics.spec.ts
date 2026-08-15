import { test, expect } from '@playwright/test';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet, apiPost, apiPut, apiDelete } from '../support/api-helper';
import { testDb } from '../support/fixtures';

/**
 * Rubric management.
 *
 * The rubric feature shipped as a database, an API, `scoreFromRubric()` and
 * end-to-end scoring tests — with **no user interface**, so a rubric could only
 * ever be created by calling the API directly. `RubricManager` is that screen;
 * this covers the lifecycle behind it, which previously had no coverage at the
 * CRUD level at all.
 */

const ids = readSeededIds();

let createdRubricId: number | null = null;

test.afterAll(async () => {
  if (createdRubricId !== null) {
    await testDb.rubric_criteria.deleteMany({
      where: { rubricId: createdRubricId },
    });
    await testDb.rubrics.deleteMany({ where: { id: createdRubricId } });
  }
});

test.describe('Rubric lifecycle', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('the rubrics screen is reachable and names itself', async ({ page }) => {
    await page.goto('/admin/rubrics');
    // "Rubrics" is also the sidebar nav label, so scope to the page heading.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Rubrics' })
    ).toBeVisible();
  });

  test('a rubric can be created with weighted criteria', async ({ page }) => {
    // This route answers with the created row directly, not the
    // `{ success, data }` envelope most of the API uses.
    const response = await apiPost<{ id: number }>(
      page,
      '/api/rubrics',
      {
        title: 'Lab report marking guide (spec)',
        courseOfferingId: ids.labOfferingId,
        lloId: ids.lloIds[0],
        criteria: [
          {
            description: 'Correctness of the implementation',
            excellent: 'Fully correct',
            good: 'Minor issues',
            satisfactory: 'Partly correct',
            unsatisfactory: 'Largely incorrect',
            weight: 2,
          },
          {
            description: 'Quality of the write-up',
            excellent: 'Clear throughout',
            good: 'Mostly clear',
            satisfactory: 'Hard to follow',
            unsatisfactory: 'Unclear',
            weight: 1,
          },
        ],
      }
    );

    // 201 Created is what the route answers; accept either rather than pinning
    // the test to one and calling a correct status a failure.
    expect([200, 201]).toContain(response.status);
    const id = (response.body as { id?: number })?.id;
    expect(id, 'the created rubric was not returned with an id').toBeTruthy();
    createdRubricId = id!;

    const stored = await testDb.rubrics.findUnique({
      where: { id: createdRubricId },
      include: { criteria: true },
    });

    expect(stored?.criteria.length, 'both criteria should be stored').toBe(2);
    expect(
      stored?.criteria.reduce((sum, c) => sum + c.weight, 0),
      'the weights are what scoreFromRubric divides by'
    ).toBe(3);
  });

  test('the new rubric is listed for its course offering', async ({ page }) => {
    const response = await apiGet<Array<{ id: number }>>(
      page,
      `/api/rubrics?courseOfferingId=${ids.labOfferingId}`
    );

    expect(response.status).toBe(200);
    const list = Array.isArray(response.body) ? response.body : [];
    expect(list.some((r) => r.id === createdRubricId)).toBe(true);
  });

  test('a rubric must be attached to a CLO or an LLO', async ({ page }) => {
    const response = await apiPost(page, '/api/rubrics', {
      title: 'Detached rubric',
      courseOfferingId: ids.labOfferingId,
      criteria: [],
    });

    expect(
      response.status,
      'a rubric with no outcome contributes to nothing and should be refused'
    ).toBe(400);
  });

  test('a rubric can be renamed', async ({ page }) => {
    test.skip(createdRubricId === null, 'depends on the create test');

    const response = await apiPut(page, `/api/rubrics/${createdRubricId}`, {
      title: 'Lab report marking guide (renamed)',
      courseOfferingId: ids.labOfferingId,
      lloId: ids.lloIds[0],
      criteria: [
        {
          description: 'Correctness of the implementation',
          excellent: 'Fully correct',
          good: 'Minor issues',
          satisfactory: 'Partly correct',
          unsatisfactory: 'Largely incorrect',
          weight: 1,
        },
      ],
    });

    expect([200, 201]).toContain(response.status);

    const stored = await testDb.rubrics.findUnique({
      where: { id: createdRubricId! },
    });
    expect(stored?.title).toContain('renamed');
  });
});

test.describe('Rubric access', () => {
  test('a student cannot create a rubric', async ({ page }) => {
    await page.goto('/student');

    const response = await apiPost(page, '/api/rubrics', {
      title: 'Student-authored rubric',
      courseOfferingId: ids.labOfferingId,
      lloId: ids.lloIds[0],
      criteria: [],
    });

    expect(response.status).toBe(403);
  });

  test.use({ storageState: statePath('student') });
});

test.describe('Rubric deletion', () => {
  test.use({ storageState: statePath('admin') });

  test('a rubric can be deleted', async ({ page }) => {
    test.skip(createdRubricId === null, 'depends on the create test');
    await page.goto('/admin');

    const response = await apiDelete(page, `/api/rubrics/${createdRubricId}`);
    expect(response.status).toBe(200);

    const gone = await testDb.rubrics.findUnique({
      where: { id: createdRubricId! },
    });
    expect(gone).toBeNull();
    createdRubricId = null;
  });
});
