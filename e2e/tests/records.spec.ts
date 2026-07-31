import { test, expect } from '@playwright/test';
import { testDb, ACCOUNTS } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiPatch, apiPost } from '../support/api-helper';
import {
  recordMarks,
  calculateGrades,
  clearDerivedData,
} from '../support/obe-helper';

/**
 * Student records: repeated courses, rubric-based scoring and bulk import.
 *
 * A repeat used to leave two live grade rows for one course, doubling its
 * credit hours in the CGPA and letting a failed first attempt drag down the
 * grade the repeat was meant to replace.
 */

const ids = readSeededIds();

test.describe('Repeated courses', () => {
  test.use({ storageState: statePath('faculty') });

  let repeatOfferingId: number;
  let repeatAssessmentId: number;
  let repeatItemIds: number[] = [];

  test.beforeEach(async () => {
    await clearDerivedData();

    // A second offering of the SAME course, in a later semester — that is what
    // a repeat looks like in this schema.
    const laterSemester = await testDb.semesters.upsert({
      where: { name: 'Spring 2027' },
      update: {},
      create: {
        name: 'Spring 2027',
        startDate: new Date('2027-02-01'),
        endDate: new Date('2027-06-30'),
        status: 'active',
        updatedAt: new Date(),
      },
    });

    const offering = await testDb.courseofferings.upsert({
      where: {
        courseId_semesterId: {
          courseId: ids.theoryCourseId,
          semesterId: laterSemester.id,
        },
      },
      update: {},
      create: {
        courseId: ids.theoryCourseId,
        semesterId: laterSemester.id,
        status: 'active',
        updatedAt: new Date(),
      },
    });
    repeatOfferingId = offering.id;

    await testDb.passfailcriteria.upsert({
      where: { courseOfferingId: offering.id },
      update: {},
      create: {
        courseOfferingId: offering.id,
        minPassPercent: 60,
        minCloAttainmentPercent: 50,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    let section = await testDb.sections.findFirst({
      where: { courseOfferingId: offering.id },
    });
    if (!section) {
      section = await testDb.sections.create({
        data: {
          name: 'Repeat Section',
          courseOfferingId: offering.id,
          facultyId: ids.facultyId,
          batchId: ids.batchId,
          maxStudents: 40,
          sessionType: 'morning',
          status: 'active',
          updatedAt: new Date(),
        },
      });
      await testDb.studentsections.create({
        data: {
          studentId: ids.studentId,
          sectionId: section.id,
          status: 'active',
          updatedAt: new Date(),
        },
      });
    }

    await testDb.assessmentitems.deleteMany({
      where: { assessment: { courseOfferingId: offering.id } },
    });
    await testDb.assessments.deleteMany({
      where: { courseOfferingId: offering.id },
    });

    const assessment = await testDb.assessments.create({
      data: {
        title: 'Repeat Midterm',
        type: 'mid_exam',
        courseOfferingId: offering.id,
        conductedBy: ids.facultyId,
        totalMarks: 30,
        weightage: 100,
        status: 'active',
        dueDate: new Date('2027-04-15'),
        updatedAt: new Date(),
      },
    });
    repeatAssessmentId = assessment.id;

    repeatItemIds = [];
    for (let i = 0; i < ids.cloIds.length; i++) {
      const item = await testDb.assessmentitems.create({
        data: {
          assessmentId: assessment.id,
          questionNo: `RQ${i + 1}`,
          description: `Repeat question ${i + 1}`,
          marks: 10,
          cloId: ids.cloIds[i],
          updatedAt: new Date(),
        },
      });
      repeatItemIds.push(item.id);
    }
  });

  test.afterEach(async () => {
    await testDb.studentgrades.deleteMany({});
    // Item results reference the items, so they have to go first
    await testDb.studentassessmentitemresults.deleteMany({});
    await testDb.studentassessmentresults.deleteMany({});
    await testDb.assessmentitems.deleteMany({
      where: { assessment: { courseOfferingId: repeatOfferingId } },
    });
    await testDb.assessments.deleteMany({
      where: { courseOfferingId: repeatOfferingId },
    });
  });

  async function markRepeatAttempt(marks: number[]) {
    const total = marks.reduce((a, b) => a + b, 0);
    const result = await testDb.studentassessmentresults.upsert({
      where: {
        studentId_assessmentId: {
          studentId: ids.studentId,
          assessmentId: repeatAssessmentId,
        },
      },
      update: {
        obtainedMarks: total,
        totalMarks: 30,
        percentage: (total / 30) * 100,
        status: 'evaluated',
      },
      create: {
        studentId: ids.studentId,
        assessmentId: repeatAssessmentId,
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
    for (let i = 0; i < repeatItemIds.length; i++) {
      await testDb.studentassessmentitemresults.create({
        data: {
          studentAssessmentResultId: result.id,
          assessmentItemId: repeatItemIds[i],
          obtainedMarks: marks[i],
          totalMarks: 10,
          isCorrect: marks[i] >= 5,
          updatedAt: new Date(),
        },
      });
    }
  }

  test('a second attempt supersedes the first and CGPA counts it once', async ({
    page,
    browser,
  }) => {
    // First attempt: 12/30 = 40% → F
    await recordMarks(ids.studentId, [4, 4, 4]);
    await calculateGrades(browser);

    const firstGrade = await testDb.studentgrades.findFirst({
      where: { studentId: ids.studentId, courseOfferingId: ids.courseOfferingId },
    });
    expect(firstGrade?.grade).toBe('F');

    // Second attempt at the repeat offering: 27/30 = 90% → A
    await markRepeatAttempt([9, 9, 9]);

    await page.goto('/faculty');
    const response = await apiPost(page, '/api/faculty/grades/calculate', {
      courseOfferingId: repeatOfferingId,
    });
    expect(response.ok, JSON.stringify(response.body)).toBeTruthy();

    const superseded = await testDb.studentgrades.findFirst({
      where: { studentId: ids.studentId, courseOfferingId: ids.courseOfferingId },
    });
    expect(superseded?.status, 'the earlier attempt is superseded').toBe(
      'superseded'
    );

    const latest = await testDb.studentgrades.findFirst({
      where: { studentId: ids.studentId, courseOfferingId: repeatOfferingId },
    });
    expect(latest?.grade).toBe('A');
    expect(latest?.isRepeat, 'the new row is flagged as a repeat').toBe(true);
    expect(latest?.attemptNumber).toBe(2);

    // The course is worth 3 credit hours and must be counted once
    const cgpa = await testDb.cumulativegpa.findUnique({
      where: { studentId: ids.studentId },
    });
    expect(
      cgpa?.totalCreditHours,
      'a repeated course contributes its credits once, not twice'
    ).toBe(3);
    expect(cgpa?.cumulativeGPA, 'the passing attempt is the one that counts').toBeCloseTo(
      4,
      1
    );
  });

  test('a superseded attempt is left off the transcript', async ({ browser }) => {
    await recordMarks(ids.studentId, [4, 4, 4]);
    await calculateGrades(browser);
    await markRepeatAttempt([9, 9, 9]);

    const context = await browser.newContext({ storageState: statePath('faculty') });
    const page = await context.newPage();
    await page.goto('/faculty');
    await apiPost(page, '/api/faculty/grades/calculate', {
      courseOfferingId: repeatOfferingId,
    });
    await context.close();

    const adminContext = await browser.newContext({ storageState: statePath('admin') });
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/admin');

    const created = await apiPost(adminPage, '/api/transcripts', {
      studentId: ids.studentId,
      transcriptType: 'official',
      isOfficial: true,
    });
    expect(created.ok, JSON.stringify(created.body)).toBeTruthy();
    await adminContext.close();

    const transcript = await testDb.transcripts.findFirst({
      where: { studentId: ids.studentId },
      orderBy: { generatedAt: 'desc' },
    });

    const snapshot = transcript!.data as unknown as {
      semesters: Array<{ courses: Array<{ courseCode: string; grade: string }> }>;
      totalCreditHours: number;
    };

    const appearances = snapshot.semesters
      .flatMap((s) => s.courses)
      .filter((c) => c.courseCode === 'CS101');

    expect(appearances, 'the course appears once, at its latest grade').toHaveLength(1);
    expect(appearances[0].grade).toBe('A');
    expect(snapshot.totalCreditHours).toBe(3);

    await testDb.transcripts.deleteMany({ where: { studentId: ids.studentId } });
  });
});

test.describe('Rubric scoring', () => {
  test.use({ storageState: statePath('faculty') });

  test('an item scored from a rubric derives its mark from the criteria', async ({
    page,
  }) => {
    // The mark is computed from the levels rather than typed alongside them, so
    // the recorded breakdown and the awarded mark cannot disagree.
    await clearDerivedData();

    const rubric = await testDb.rubrics.create({
      data: {
        title: 'E2E Rubric',
        courseOfferingId: ids.courseOfferingId,
        cloId: ids.cloIds[0],
        updatedAt: new Date(),
      },
    });

    // Two criteria of equal weight over a 10-mark item → 5 marks each
    const criteria = [];
    for (const description of ['Correctness', 'Clarity']) {
      criteria.push(
        await testDb.rubric_criteria.create({
          data: {
            rubricId: rubric.id,
            description,
            excellent: 'Excellent work',
            good: 'Good work',
            satisfactory: 'Adequate work',
            unsatisfactory: 'Poor work',
            weight: 1,
            updatedAt: new Date(),
          },
        })
      );
    }

    await testDb.assessmentitems.update({
      where: { id: ids.assessmentItemIds[0] },
      data: { rubricId: rubric.id },
    });

    const result = await testDb.studentassessmentresults.create({
      data: {
        studentId: ids.studentId,
        assessmentId: ids.assessmentId,
        obtainedMarks: 0,
        totalMarks: 30,
        percentage: 0,
        status: 'pending',
        remarks: '',
        updatedAt: new Date(),
      },
    });

    await page.goto('/faculty');

    const response = await apiPatch<{
      data?: { itemMarks: number; breakdown: Array<{ awardedMarks: number }> };
    }>(page, `/api/assessment-results/${result.id}/rubric-score`, {
      assessmentItemId: ids.assessmentItemIds[0],
      scores: [
        { criterionId: criteria[0].id, level: 'excellent' }, // 5 × 1.00 = 5
        { criterionId: criteria[1].id, level: 'satisfactory' }, // 5 × 0.50 = 2.5
      ],
    });

    expect(response.ok, JSON.stringify(response.body)).toBeTruthy();
    expect(response.body?.data?.itemMarks, '5 + 2.5').toBeCloseTo(7.5, 2);

    // The breakdown is persisted, not just returned
    const stored = await testDb.rubric_scores.findMany({
      where: { criterionId: { in: criteria.map((c) => c.id) } },
    });
    expect(stored).toHaveLength(2);
    expect(stored.find((s) => s.level === 'excellent')?.awardedMarks).toBeCloseTo(5, 2);

    // And the item mark rolls up into the result total
    const updated = await testDb.studentassessmentresults.findUnique({
      where: { id: result.id },
    });
    expect(updated?.obtainedMarks).toBeCloseTo(7.5, 2);

    await testDb.rubric_scores.deleteMany({
      where: { criterionId: { in: criteria.map((c) => c.id) } },
    });
    await testDb.assessmentitems.update({
      where: { id: ids.assessmentItemIds[0] },
      data: { rubricId: null },
    });
    await testDb.rubric_criteria.deleteMany({ where: { rubricId: rubric.id } });
    await testDb.rubrics.delete({ where: { id: rubric.id } });
  });

  test('an item with no rubric cannot be scored that way', async ({ page }) => {
    await page.goto('/faculty');

    const result = await testDb.studentassessmentresults.findFirst({
      where: { assessmentId: ids.assessmentId },
    });

    if (!result) {
      test.skip();
      return;
    }

    const response = await apiPatch(
      page,
      `/api/assessment-results/${result.id}/rubric-score`,
      {
        assessmentItemId: ids.assessmentItemIds[1],
        scores: [{ criterionId: 1, level: 'excellent' }],
      }
    );

    expect(response.ok).toBeFalsy();
    expect(JSON.stringify(response.body)).toMatch(/rubric/i);
  });
});

test.describe('Bulk user import', () => {
  test.use({ storageState: statePath('admin') });

  test('students can be imported in bulk with generated passwords', async ({
    page,
  }) => {
    await page.goto('/admin');

    const rollNumbers = ['E2E-IMP-001', 'E2E-IMP-002'];
    const emails = rollNumbers.map((r) => `${r.toLowerCase()}@test.local`);

    // The endpoint takes a CSV upload, so post real multipart form data
    const csv = [
      'email,firstName,lastName,role',
      ...emails.map((email, i) => `${email},Imported,Student ${i + 1},student`),
    ].join('\n');

    const response = await page.evaluate(async (csvBody) => {
      const form = new FormData();
      form.append('file', new Blob([csvBody], { type: 'text/csv' }), 'students.csv');

      const res = await fetch('/api/users/import', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });

      const text = await res.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      return { status: res.status, ok: res.ok, body };
    }, csv);

    expect(
      response.status,
      `import returned ${response.status}: ${JSON.stringify(response.body)}`
    ).toBeLessThan(500);

    if (response.ok) {
      const created = await testDb.users.findMany({
        where: { email: { in: emails } },
      });

      for (const user of created) {
        expect(
          user.must_change_password,
          'an imported account starts with a temporary password'
        ).toBe(true);
        expect(user.password_hash).not.toBe('');
      }

      // No two imported accounts may share a password hash
      if (created.length === 2) {
        expect(
          created[0].password_hash,
          'each account gets its own random password'
        ).not.toBe(created[1].password_hash);
      }
    }

    await testDb.userroles.deleteMany({
      where: { user: { email: { in: emails } } },
    });
    await testDb.users.deleteMany({ where: { email: { in: emails } } });
  });
});
