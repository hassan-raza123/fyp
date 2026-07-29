import { test, expect } from '@playwright/test';
import { testDb } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet, apiPost } from '../support/api-helper';
import {
  recordMarks,
  calculateCloAttainment,
  calculateGrades,
  clearDerivedData,
} from '../support/obe-helper';

/**
 * Grades, GPA, transcripts and graduation.
 *
 * These sit downstream of marks and were the parts most likely to be silently
 * broken: nothing used to write the GPA tables at all, so graduation always
 * read a null CGPA and reported every student ineligible.
 */

const ids = readSeededIds();

test.describe('Grade calculation', () => {
  test.use({ storageState: statePath('faculty') });

  test.beforeEach(async () => {
    await clearDerivedData();
  });

  test('grades are calculated and GPA tables are written', async ({ page }) => {
    // Regression guard: semestergpa and cumulativegpa were read by the
    // graduation tracker but nothing ever wrote them.
    await page.goto('/faculty');

    await recordMarks(ids.studentId, [9, 9, 9]); // 27/30 = 90% -> A
    await recordMarks(ids.otherStudentId, [6, 6, 6]); // 18/30 = 60% -> C

    const response = await apiPost(page, '/api/faculty/grades/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });
    expect(response.ok, JSON.stringify(response.body)).toBeTruthy();

    const strongGrade = await testDb.studentgrades.findFirst({
      where: { studentId: ids.studentId, courseOfferingId: ids.courseOfferingId },
    });
    expect(strongGrade?.percentage).toBeCloseTo(90, 0);
    expect(strongGrade?.grade).toBe('A');
    expect(strongGrade?.gpaPoints).toBe(4);

    const weakGrade = await testDb.studentgrades.findFirst({
      where: { studentId: ids.otherStudentId, courseOfferingId: ids.courseOfferingId },
    });
    expect(weakGrade?.grade).toBe('C');
    expect(weakGrade?.gpaPoints).toBe(2);

    const cgpa = await testDb.cumulativegpa.findUnique({
      where: { studentId: ids.studentId },
    });
    expect(cgpa, 'cumulative GPA row must exist').not.toBeNull();
    expect(cgpa?.cumulativeGPA).toBeCloseTo(4, 1);

    const semesterGpa = await testDb.semestergpa.findFirst({
      where: { studentId: ids.studentId, semesterId: ids.semesterId },
    });
    expect(semesterGpa, 'semester GPA row must exist').not.toBeNull();
    expect(semesterGpa?.semesterGPA).toBeCloseTo(4, 1);
  });

  test('calculation is refused when assessment weightages do not total 100', async ({
    page,
  }) => {
    // A course graded on only part of its assessments produces inflated marks,
    // so the calculation should stop rather than quietly normalise.
    await page.goto('/faculty');
    await recordMarks(ids.studentId, [8, 8, 8]);

    await testDb.assessments.update({
      where: { id: ids.assessmentId },
      data: { weightage: 70 },
    });

    const response = await apiPost(page, '/api/faculty/grades/calculate', {
      courseOfferingId: ids.courseOfferingId,
    });

    expect(response.ok).toBeFalsy();
    expect(JSON.stringify(response.body)).toMatch(/70%|not 100/i);

    await testDb.assessments.update({
      where: { id: ids.assessmentId },
      data: { weightage: 100 },
    });
  });
});

test.describe('Graduation status', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page, browser }) => {
    await clearDerivedData();

    await recordMarks(ids.studentId, [9, 9, 9]);
    await recordMarks(ids.otherStudentId, [3, 3, 3]);

    await calculateCloAttainment(browser);

    await page.goto('/admin');
    await apiPost(page, '/api/plo-attainments', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });
  });

  test('a student with real marks gets a real CGPA, not null', async ({ page, browser }) => {
    await calculateGrades(browser);
    await page.goto('/admin');

    const status = await apiGet<{
      data?: {
        student?: { cumulativeGPA: number | null };
        summary?: { totalPlos: number; attainedPlos: number; isEligible: boolean };
      };
    }>(page, `/api/students/${ids.studentId}/graduation-status`);

    expect(status.status).toBe(200);
    expect(
      status.body?.data?.student?.cumulativeGPA,
      'CGPA must be derived, not left null'
    ).not.toBeNull();
    expect(status.body?.data?.summary?.totalPlos).toBeGreaterThan(0);
  });

  test('a student can read their own graduation status', async ({ browser }) => {
    // The route once compared a users-table id against a students-table id, so
    // students were denied their own record.
    const context = await browser.newContext({ storageState: statePath('student') });
    const page = await context.newPage();
    await page.goto('/student');

    const own = await apiGet(page, `/api/students/${ids.studentId}/graduation-status`);
    expect(own.status, 'a student may read their own record').toBe(200);

    const other = await apiGet(
      page,
      `/api/students/${ids.otherStudentId}/graduation-status`
    );
    expect(other.status, "and not another student's").toBe(403);

    await context.close();
  });
});

test.describe('Transcripts', () => {
  test.use({ storageState: statePath('admin') });

  test('a generated transcript stores its own contents', async ({ page, browser }) => {
    // An official transcript must be a fixed record; storing only a CGPA meant
    // a later grade correction silently rewrote an issued document.
    await clearDerivedData();
    await recordMarks(ids.studentId, [9, 9, 9]);
    await calculateGrades(browser);

    await page.goto('/admin');

    const created = await apiPost<{ data?: { id: number } }>(page, '/api/transcripts', {
      studentId: ids.studentId,
      transcriptType: 'official',
      isOfficial: true,
    });

    expect(created.ok, JSON.stringify(created.body)).toBeTruthy();

    const row = await testDb.transcripts.findFirst({
      where: { studentId: ids.studentId },
      orderBy: { generatedAt: 'desc' },
    });

    expect(row?.data, 'the transcript body is snapshotted').not.toBeNull();

    const snapshot = row!.data as unknown as {
      semesters: Array<{ courses: unknown[] }>;
      cgpa: number;
      totalCreditHours: number;
    };

    expect(snapshot.semesters.length).toBeGreaterThan(0);
    expect(snapshot.semesters[0].courses.length).toBeGreaterThan(0);
    expect(snapshot.cgpa).toBeGreaterThan(0);
    expect(snapshot.totalCreditHours).toBeGreaterThan(0);
  });
});

test.describe('OBE reports', () => {
  test.use({ storageState: statePath('admin') });

  test('a generated report contains attainment tables, not just a title', async ({
    page,
    browser,
  }) => {
    // Report generation used to insert a metadata row and nothing else.
    await clearDerivedData();
    await recordMarks(ids.studentId, [9, 9, 9]);
    await recordMarks(ids.otherStudentId, [8, 8, 8]);

    await calculateCloAttainment(browser);

    await page.goto('/admin');
    await apiPost(page, '/api/plo-attainments', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });

    const created = await apiPost<{ data?: { id: number } }>(page, '/api/obe-reports', {
      reportType: 'program_assessment',
      programId: ids.programId,
      semesterId: ids.semesterId,
      title: 'E2E Program Assessment',
    });

    expect(created.ok, JSON.stringify(created.body)).toBeTruthy();

    const row = await testDb.obereports.findFirst({
      orderBy: { generatedAt: 'desc' },
    });

    expect(row?.data, 'the report body is stored').not.toBeNull();

    const payload = row!.data as unknown as {
      sections: Array<{ heading: string; rows: unknown[] }>;
      summary: Record<string, unknown>;
    };

    const headings = payload.sections.map((s) => s.heading);
    expect(headings).toContain('PLO Attainment');
    expect(headings).toContain('CLO Attainment');
    expect(headings).toContain('PEO Attainment');

    const cloSection = payload.sections.find((s) => s.heading === 'CLO Attainment');
    expect(cloSection!.rows.length, 'the CLO table has rows').toBeGreaterThan(0);
    expect(Object.keys(payload.summary).length).toBeGreaterThan(0);
  });
});
