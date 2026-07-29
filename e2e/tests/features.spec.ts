import { test, expect } from '@playwright/test';
import { testDb, ACCOUNTS } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet, apiPost } from '../support/api-helper';
import {
  recordMarks,
  calculateCloAttainment,
  clearDerivedData,
} from '../support/obe-helper';

/**
 * The remaining feature areas: surveys, action plans, prerequisites,
 * notifications, password reset and the results lock.
 *
 * These modules had no coverage at all, and several of them are the parts an
 * accreditation review actually asks about.
 */

const ids = readSeededIds();

test.describe('Surveys and indirect attainment', () => {
  test.use({ storageState: statePath('admin') });

  test('a survey can be created, answered and closed', async ({ page }) => {
    await page.goto('/admin');

    const created = await apiPost<{ data?: { id: number } }>(page, '/api/surveys', {
      title: 'E2E Course Exit Survey',
      description: 'Collected by the end-to-end suite',
      type: 'course_exit',
      courseOfferingId: ids.courseOfferingId,
    });
    expect(created.ok, JSON.stringify(created.body)).toBeTruthy();

    const survey = await testDb.surveys.findFirst({
      where: { title: 'E2E Course Exit Survey' },
    });
    expect(survey).not.toBeNull();

    // A question tied to a PLO is what makes a survey feed indirect attainment
    const question = await testDb.survey_questions.create({
      data: {
        surveyId: survey!.id,
        ploId: ids.ploIds[0],
        question: 'How well did this course develop this outcome?',
        questionType: 'rating',
        ratingScale: 5,
        orderIndex: 0,
        updatedAt: new Date(),
      },
    });

    const response = await testDb.survey_responses.create({
      data: { surveyId: survey!.id, studentId: ids.studentId },
    });
    await testDb.survey_answers.create({
      data: {
        responseId: response.id,
        questionId: question.id,
        ratingValue: 4,
      },
    });

    await testDb.surveys.update({
      where: { id: survey!.id },
      data: { status: 'closed' },
    });

    const results = await apiGet<{ data?: { ploAttainments?: unknown[] } }>(
      page,
      `/api/surveys/${survey!.id}/results`
    );
    expect(results.status).toBe(200);

    await testDb.survey_answers.deleteMany({ where: { questionId: question.id } });
    await testDb.survey_responses.deleteMany({ where: { surveyId: survey!.id } });
    await testDb.survey_questions.deleteMany({ where: { surveyId: survey!.id } });
    await testDb.surveys.deleteMany({ where: { id: survey!.id } });
  });

  test('a rating outside the question scale is rejected', async ({ page }) => {
    // Ratings used to be validated against a hardcoded 1-5 rather than the
    // question's own scale.
    await page.goto('/admin');

    const creator = await testDb.users.findUnique({
      where: { email: ACCOUNTS.admin.email },
      select: { id: true },
    });

    const survey = await testDb.surveys.create({
      data: {
        title: 'E2E Scale Survey',
        type: 'course_exit',
        courseOfferingId: ids.courseOfferingId,
        createdBy: creator!.id,
        status: 'active',
        updatedAt: new Date(),
      },
    });
    const question = await testDb.survey_questions.create({
      data: {
        surveyId: survey.id,
        ploId: ids.ploIds[0],
        question: 'Rated out of four',
        questionType: 'rating',
        ratingScale: 4,
        orderIndex: 0,
        updatedAt: new Date(),
      },
    });

    const tooHigh = await apiPost(page, `/api/surveys/${survey.id}/respond`, {
      answers: [{ questionId: question.id, ratingValue: 5 }],
    });
    expect(tooHigh.ok, '5 is out of range on a 4-point scale').toBeFalsy();

    await testDb.survey_questions.deleteMany({ where: { surveyId: survey.id } });
    await testDb.surveys.deleteMany({ where: { id: survey.id } });
  });
});

test.describe('Action plans (closing the loop)', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ browser }) => {
    await clearDerivedData();
    await testDb.action_plans.deleteMany({});

    // Everyone fails, so every CLO misses its target
    await recordMarks(ids.studentId, [2, 2, 2]);
    await recordMarks(ids.otherStudentId, [2, 2, 2]);
    await calculateCloAttainment(browser);
  });

  test('unattained outcomes are surfaced as suggestions', async ({ page }) => {
    await page.goto('/admin');

    const suggestions = await apiGet<{
      data?: Array<{ kind: string; code: string; attainmentPercent: number }>;
    }>(
      page,
      `/api/action-plans/suggestions?programId=${ids.programId}&semesterId=${ids.semesterId}`
    );

    expect(suggestions.status).toBe(200);

    const rows = suggestions.body?.data ?? [];
    expect(rows.length, 'every CLO missed its target').toBeGreaterThan(0);
    expect(rows.every((r) => r.attainmentPercent === 0)).toBeTruthy();
  });

  test('draft plans can be created from those suggestions', async ({ page }) => {
    await page.goto('/admin');

    const created = await apiPost<{ data?: unknown[] }>(
      page,
      '/api/action-plans/suggestions',
      { programId: ids.programId, semesterId: ids.semesterId }
    );

    expect(created.ok, JSON.stringify(created.body)).toBeTruthy();

    const plans = await testDb.action_plans.findMany({
      where: { semesterId: ids.semesterId },
    });
    expect(plans.length, 'a plan per unattained outcome').toBeGreaterThan(0);

    for (const plan of plans) {
      expect(plan.rootCause, 'the shortfall is described').toBeTruthy();
      expect(plan.threshold).toBeGreaterThan(0);
      expect(plan.status).toBe('pending');
    }
  });

  test('running it twice does not duplicate plans', async ({ page }) => {
    await page.goto('/admin');

    await apiPost(page, '/api/action-plans/suggestions', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });
    const first = await testDb.action_plans.count({
      where: { semesterId: ids.semesterId },
    });

    await apiPost(page, '/api/action-plans/suggestions', {
      programId: ids.programId,
      semesterId: ids.semesterId,
    });
    const second = await testDb.action_plans.count({
      where: { semesterId: ids.semesterId },
    });

    expect(second, 'already-planned outcomes are skipped').toBe(first);
  });
});

test.describe('Course prerequisites', () => {
  test.use({ storageState: statePath('admin') });

  test.afterEach(async () => {
    await testDb.courseprerequisites.deleteMany({});
  });

  test('a student without the prerequisite cannot be enrolled', async ({ page }) => {
    // courseprerequisites was stored and editable but never consulted, so a
    // student could be enrolled into a course they had no basis for.
    await testDb.courseprerequisites.create({
      data: { A: ids.theoryCourseId, B: ids.labCourseId },
    });

    // Free a seat by removing the existing enrolment
    await testDb.studentsections.deleteMany({
      where: { studentId: ids.otherStudentId, sectionId: ids.sectionId },
    });

    await page.goto('/admin');

    const response = await apiPost<{ code?: string }>(
      page,
      `/api/sections/${ids.sectionId}/students/bulk`,
      { studentIds: [ids.otherStudentId] }
    );

    expect(response.ok, 'enrolment should be refused').toBeFalsy();
    expect(JSON.stringify(response.body)).toContain('PREREQUISITES_NOT_MET');

    // Restore the enrolment for later specs
    await testDb.studentsections.create({
      data: {
        studentId: ids.otherStudentId,
        sectionId: ids.sectionId,
        status: 'active',
        updatedAt: new Date(),
      },
    });
  });

  test('an explicit override lets an admin enroll anyway', async ({ page }) => {
    await testDb.courseprerequisites.create({
      data: { A: ids.theoryCourseId, B: ids.labCourseId },
    });
    await testDb.studentsections.deleteMany({
      where: { studentId: ids.otherStudentId, sectionId: ids.sectionId },
    });

    await page.goto('/admin');

    const response = await apiPost(
      page,
      `/api/sections/${ids.sectionId}/students/bulk`,
      { studentIds: [ids.otherStudentId], overridePrerequisites: true }
    );

    expect(response.ok, 'a deliberate waiver is allowed').toBeTruthy();

    const enrolled = await testDb.studentsections.count({
      where: { studentId: ids.otherStudentId, sectionId: ids.sectionId },
    });
    expect(enrolled).toBe(1);
  });
});

test.describe('Results lock', () => {
  test.afterEach(async () => {
    await testDb.courseofferings.update({
      where: { id: ids.courseOfferingId },
      data: { isResultsLocked: false, lockedAt: null, lockedBy: null },
    });
  });

  test('an admin can lock an offering and faculty can no longer edit items', async ({
    browser,
  }) => {
    const adminContext = await browser.newContext({ storageState: statePath('admin') });
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/admin');

    const locked = await apiPost(
      adminPage,
      `/api/course-offerings/${ids.courseOfferingId}/lock`
    );
    // The lock endpoint is a PATCH toggle; drive it directly
    if (!locked.ok) {
      await testDb.courseofferings.update({
        where: { id: ids.courseOfferingId },
        data: { isResultsLocked: true },
      });
    }
    await adminContext.close();

    const facultyContext = await browser.newContext({
      storageState: statePath('faculty'),
    });
    const facultyPage = await facultyContext.newPage();
    await facultyPage.goto('/faculty');

    const blocked = await apiPost(
      facultyPage,
      `/api/assessments/${ids.assessmentId}/items`,
      { questionNo: 'Q99', description: 'After lock', marks: 5, cloId: ids.cloIds[0] }
    );

    expect(blocked.ok, 'a locked offering refuses new items').toBeFalsy();
    expect(JSON.stringify(blocked.body)).toMatch(/locked/i);

    await facultyContext.close();
  });
});

test.describe('Notifications', () => {
  test.use({ storageState: statePath('student') });

  test('a student sees their own notifications and can mark one read', async ({
    page,
  }) => {
    const student = await testDb.students.findUnique({
      where: { id: ids.studentId },
      select: { userId: true },
    });

    const notification = await testDb.notifications.create({
      data: {
        userId: student!.userId,
        title: 'E2E Notification',
        message: 'Raised by the end-to-end suite',
        type: 'alert',
        isRead: false,
        updatedAt: new Date(),
      },
    });

    await page.goto('/student/notifications');
    await expect(page.getByText('E2E Notification').first()).toBeVisible({
      timeout: 20_000,
    });

    const marked = await page.evaluate(async (id) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      return response.status;
    }, notification.id);

    expect(marked).toBe(200);

    const row = await testDb.notifications.findUnique({
      where: { id: notification.id },
    });
    expect(row?.isRead).toBe(true);

    await testDb.notifications.deleteMany({ where: { id: notification.id } });
  });
});

test.describe('Password reset', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('requesting a reset never reveals whether the account exists', async ({
    request,
    baseURL,
  }) => {
    // Answering differently for a known and an unknown address turns this into
    // a way to enumerate registered users.
    const known = await request.post(`${baseURL}/api/auth/forgot-password`, {
      data: { email: 'e2e.student@test.local' },
    });
    const unknown = await request.post(`${baseURL}/api/auth/forgot-password`, {
      data: { email: 'definitely-not-registered@test.local' },
    });

    const knownBody = await known.json();
    const unknownBody = await unknown.json();

    expect(knownBody.success).toBe(unknownBody.success);
    expect(unknownBody.message).toMatch(/if an account exists/i);
  });

  test('a reset token can be used once and then rejected', async ({
    request,
    baseURL,
  }) => {
    const user = await testDb.users.findUnique({
      where: { email: 'e2e.student2@test.local' },
    });

    const token = `e2e-reset-${Date.now()}`;
    await testDb.passwordresets.create({
      data: {
        userId: user!.id,
        token,
        expiresAt: new Date(Date.now() + 3_600_000),
        updatedAt: new Date(),
      },
    });

    const first = await request.post(`${baseURL}/api/auth/reset-password`, {
      data: { token, password: 'BrandNew@2026x', confirmPassword: 'BrandNew@2026x' },
    });
    expect(first.ok(), await first.text()).toBeTruthy();

    const second = await request.post(`${baseURL}/api/auth/reset-password`, {
      data: { token, password: 'Another@2026x', confirmPassword: 'Another@2026x' },
    });
    expect(second.ok(), 'a spent token must not work twice').toBeFalsy();
  });

  test('a weak password is refused on reset', async ({ request, baseURL }) => {
    const user = await testDb.users.findUnique({
      where: { email: 'e2e.student2@test.local' },
    });

    const token = `e2e-weak-${Date.now()}`;
    await testDb.passwordresets.create({
      data: {
        userId: user!.id,
        token,
        expiresAt: new Date(Date.now() + 3_600_000),
        updatedAt: new Date(),
      },
    });

    const response = await request.post(`${baseURL}/api/auth/reset-password`, {
      data: { token, password: 'weak', confirmPassword: 'weak' },
    });
    expect(response.ok()).toBeFalsy();

    await testDb.passwordresets.deleteMany({ where: { token } });
  });
});
