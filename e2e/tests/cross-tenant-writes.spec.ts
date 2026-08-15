import { test, expect } from '@playwright/test';
import { statePath } from '../support/global-setup';
import { apiDelete, apiPatch, apiPost, apiPut } from '../support/api-helper';
import { testDb } from '../support/fixtures';

/**
 * Cross-tenant *writes*.
 *
 * `cross-tenant-reads.spec.ts` covers the read side, and the read side was the
 * half that got fixed. Every one of these endpoints answered a foreign
 * department admin with `403` on `GET` and `200` on the write against the same
 * row, because the remediation that closed the read holes added
 * `canAccessX(...)` to the `GET` handler and left `PUT`, `PATCH`, `POST` and
 * `DELETE` with a bare role check.
 *
 * `authorize(request, ['super_admin','admin'])` answers "are you an admin".
 * It never answers "are you *this* department's admin", so it passed.
 *
 * Verified live against a production build before the fix — a department admin
 * of the seeded CS department:
 *
 *   GET    /api/peos/{foreign}                → 403   (guarded)
 *   PUT    /api/peos/{foreign}                → 200   description overwritten
 *   DELETE /api/peos/{foreign}                → 200   archived
 *   PUT    /api/graduation-criteria/{foreign} → 200   minCGPA 2.5 → 0.1
 *   PUT    /api/courses/{foreign}             → 200   renamed
 *   DELETE /api/sections/{foreign}            → 200   deleted
 *
 * Each assertion below is `not 2xx` rather than exactly 403, because a handler
 * that rejects at the row lookup with 404 is also refusing the write. What must
 * never happen is a success.
 */

interface ForeignTenant {
  departmentId: number;
  programId: number;
  peoId: number;
  ploId: number;
  peoMappingId: number;
  courseId: number;
  cloId: number;
  curriculumId: number;
  criteriaId: number;
  offeringId: number;
  batchId: string;
  sectionId: number;
  rubricId: number;
  transcriptId: number;
  reportId: number;
  studentId: number;
  surveyId: number;
}

let foreign: ForeignTenant;

/** A write that succeeded is the defect; anything refusing it is acceptable. */
function expectRefused(status: number, what: string) {
  expect(
    status,
    `${what} succeeded — a foreign department admin wrote to another tenant`
  ).toBeGreaterThanOrEqual(400);
}

test.beforeAll(async () => {
  const semester = await testDb.semesters.findFirstOrThrow();
  const generator = await testDb.users.findFirstOrThrow();

  const department = await testDb.departments.create({
    data: {
      name: 'Civil Engineering (foreign-write)',
      code: 'CE-XWRITE',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const program = await testDb.programs.create({
    data: {
      name: 'BS Civil Engineering',
      code: 'BSCE-XWRITE',
      duration: 4,
      status: 'active',
      departmentId: department.id,
      totalCreditHours: 136,
      updatedAt: new Date(),
    },
  });

  const peo = await testDb.peos.create({
    data: {
      code: 'PEO1-XWRITE',
      description: 'Foreign objective that must survive this spec unchanged.',
      programId: program.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const plo = await testDb.plos.create({
    data: {
      code: 'PLO1-XWRITE',
      description: 'Foreign programme outcome',
      programId: program.id,
      bloomLevel: 'Apply',
      bloomDomain: 'Cognitive',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const peoMapping = await testDb.peoplomappings.create({
    data: { peoId: peo.id, ploId: plo.id, weight: 1 },
  });

  const course = await testDb.courses.create({
    data: {
      code: 'CE101-XWRITE',
      name: 'Statics',
      creditHours: 3,
      theoryHours: 3,
      labHours: 0,
      type: 'THEORY',
      status: 'active',
      departmentId: department.id,
      updatedAt: new Date(),
    },
  });

  const clo = await testDb.clos.create({
    data: {
      code: 'CLO1',
      description: 'Foreign course outcome',
      courseId: course.id,
      bloomLevel: 'Apply',
      bloomDomain: 'Cognitive',
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const curriculum = await testDb.program_curriculum.create({
    data: {
      programId: program.id,
      courseId: course.id,
      semesterSlot: 1,
      courseCategory: 'core',
      isRequired: true,
      updatedAt: new Date(),
    },
  });

  const criteria = await testDb.graduation_criteria.create({
    data: {
      programId: program.id,
      minCGPA: 2.5,
      minPloAttainmentPercent: 60,
      requireAllCourses: true,
      directWeight: 0.7,
      indirectWeight: 0.3,
      minSurveyResponseRate: 0,
      updatedAt: new Date(),
    },
  });

  const offering = await testDb.courseofferings.create({
    data: {
      courseId: course.id,
      semesterId: semester.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const batch = await testDb.batches.create({
    data: {
      name: 'CE Batch 2026',
      code: 'CEB-XWRITE',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2030-06-30'),
      maxStudents: 60,
      status: 'active',
      programId: program.id,
      updatedAt: new Date(),
    },
  });

  const section = await testDb.sections.create({
    data: {
      name: 'CE-A',
      courseOfferingId: offering.id,
      batchId: batch.id,
      maxStudents: 40,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const rubric = await testDb.rubrics.create({
    data: {
      title: 'Foreign rubric',
      courseOfferingId: offering.id,
      cloId: clo.id,
      updatedAt: new Date(),
    },
  });

  const studentUser = await testDb.users.create({
    data: {
      email: 'e2e.foreign.student@test.local',
      username: 'e2e.foreign.student',
      password_hash: 'not-used-in-this-spec',
      first_name: 'Foreign',
      last_name: 'Student',
      status: 'active',
      email_verified: true,
      must_change_password: false,
    },
  });

  const student = await testDb.students.create({
    data: {
      userId: studentUser.id,
      rollNumber: 'CE-2026-001',
      departmentId: department.id,
      programId: program.id,
      batchId: batch.id,
      status: 'active',
      updatedAt: new Date(),
    },
  });

  const transcript = await testDb.transcripts.create({
    data: {
      studentId: student.id,
      semesterId: semester.id,
      transcriptType: 'semester',
      totalCGPA: 3.5,
      isOfficial: true,
      generatedBy: generator.id,
      status: 'generated',
    },
  });

  const report = await testDb.obereports.create({
    data: {
      reportType: 'plo_attainment',
      programId: program.id,
      semesterId: semester.id,
      title: 'Foreign accreditation report',
      generatedBy: generator.id,
      status: 'generated',
    },
  });

  const survey = await testDb.surveys.create({
    data: {
      title: 'Foreign course exit survey',
      type: 'course_exit',
      courseOfferingId: offering.id,
      createdBy: generator.id,
      status: 'draft',
      updatedAt: new Date(),
    },
  });

  foreign = {
    departmentId: department.id,
    programId: program.id,
    peoId: peo.id,
    ploId: plo.id,
    peoMappingId: peoMapping.id,
    courseId: course.id,
    cloId: clo.id,
    curriculumId: curriculum.id,
    criteriaId: criteria.id,
    offeringId: offering.id,
    batchId: batch.id,
    sectionId: section.id,
    rubricId: rubric.id,
    transcriptId: transcript.id,
    reportId: report.id,
    studentId: student.id,
    surveyId: survey.id,
  };
});

test.afterAll(async () => {
  if (!foreign) return;
  // Children before parents. The listing specs assert on row counts, so
  // leaving this tenant behind would change their expectations.
  await testDb.survey_answers.deleteMany({
    where: { response: { surveyId: foreign.surveyId } },
  });
  await testDb.survey_responses.deleteMany({ where: { surveyId: foreign.surveyId } });
  await testDb.survey_questions.deleteMany({ where: { surveyId: foreign.surveyId } });
  await testDb.surveys.deleteMany({ where: { id: foreign.surveyId } });
  await testDb.obereports.deleteMany({ where: { id: foreign.reportId } });
  await testDb.transcripts.deleteMany({ where: { studentId: foreign.studentId } });
  await testDb.rubric_criteria.deleteMany({ where: { rubricId: foreign.rubricId } });
  await testDb.rubrics.deleteMany({ where: { id: foreign.rubricId } });
  await testDb.studentsections.deleteMany({ where: { studentId: foreign.studentId } });
  await testDb.sections.deleteMany({ where: { id: foreign.sectionId } });
  await testDb.courseofferings.deleteMany({ where: { id: foreign.offeringId } });
  await testDb.students.deleteMany({ where: { id: foreign.studentId } });
  await testDb.users.deleteMany({ where: { email: 'e2e.foreign.student@test.local' } });
  await testDb.batches.deleteMany({ where: { programId: foreign.programId } });
  await testDb.graduation_criteria.deleteMany({ where: { programId: foreign.programId } });
  await testDb.program_curriculum.deleteMany({ where: { programId: foreign.programId } });
  await testDb.peoplomappings.deleteMany({ where: { peo: { programId: foreign.programId } } });
  await testDb.peos.deleteMany({ where: { programId: foreign.programId } });
  await testDb.clos.deleteMany({ where: { courseId: foreign.courseId } });
  await testDb.plos.deleteMany({ where: { programId: foreign.programId } });
  await testDb.courses.deleteMany({ where: { departmentId: foreign.departmentId } });
  await testDb.programs.deleteMany({ where: { id: foreign.programId } });
  await testDb.departments.deleteMany({ where: { id: foreign.departmentId } });
});

test.describe('A department admin writing into another department', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  // ── The accreditation chain ────────────────────────────────────────────────

  test('cannot rewrite a foreign programme educational objective', async ({ page }) => {
    const response = await apiPut(page, `/api/peos/${foreign.peoId}`, {
      code: 'PEO1-XWRITE',
      description: 'OVERWRITTEN',
      status: 'active',
    });
    expectRefused(response.status, 'PUT /api/peos/[id]');

    const peo = await testDb.peos.findUnique({ where: { id: foreign.peoId } });
    expect(peo?.description).not.toContain('OVERWRITTEN');
  });

  test('cannot archive a foreign programme educational objective', async ({ page }) => {
    const response = await apiDelete(page, `/api/peos/${foreign.peoId}`);
    expectRefused(response.status, 'DELETE /api/peos/[id]');

    const peo = await testDb.peos.findUnique({ where: { id: foreign.peoId } });
    expect(peo?.status).toBe('active');
  });

  test('cannot plant a PEO in a foreign programme', async ({ page }) => {
    const response = await apiPost(page, '/api/peos', {
      code: 'PEO-INJECTED',
      description: 'Injected from another department',
      programId: foreign.programId,
    });
    expectRefused(response.status, 'POST /api/peos');

    const count = await testDb.peos.count({
      where: { programId: foreign.programId, code: 'PEO-INJECTED' },
    });
    expect(count).toBe(0);
  });

  test('cannot delete a foreign PEO-PLO mapping', async ({ page }) => {
    const response = await apiDelete(
      page,
      `/api/peo-plo-mappings/${foreign.peoMappingId}`
    );
    expectRefused(response.status, 'DELETE /api/peo-plo-mappings/[id]');

    const mapping = await testDb.peoplomappings.findUnique({
      where: { id: foreign.peoMappingId },
    });
    expect(mapping, 'the foreign PEO-PLO mapping was deleted').not.toBeNull();
  });

  // ── The rules that decide passing and graduating ───────────────────────────

  test('cannot lower the graduation bar of a foreign programme', async ({ page }) => {
    const response = await apiPut(
      page,
      `/api/graduation-criteria/${foreign.criteriaId}`,
      {
        minCGPA: 0.1,
        minPloAttainmentPercent: 1,
        requireAllCourses: false,
        directWeight: 0.7,
        indirectWeight: 0.3,
      }
    );
    expectRefused(response.status, 'PUT /api/graduation-criteria/[id]');

    const criteria = await testDb.graduation_criteria.findUnique({
      where: { id: foreign.criteriaId },
    });
    expect(
      criteria?.minCGPA,
      'the foreign programme’s minimum CGPA was lowered'
    ).toBe(2.5);
    expect(criteria?.minPloAttainmentPercent).toBe(60);
  });

  test('cannot set pass/fail criteria on a foreign course offering', async ({ page }) => {
    const response = await apiPost(page, '/api/pass-fail-criteria', {
      courseOfferingId: foreign.offeringId,
      minPassPercent: 1,
    });
    expectRefused(response.status, 'POST /api/pass-fail-criteria');

    const criteria = await testDb.passfailcriteria.findFirst({
      where: { courseOfferingId: foreign.offeringId },
    });
    expect(criteria).toBeNull();
  });

  // ── Curriculum ─────────────────────────────────────────────────────────────

  test('cannot restructure a foreign programme curriculum', async ({ page }) => {
    const response = await apiPut(
      page,
      `/api/program-curriculum/${foreign.curriculumId}`,
      { semesterSlot: 8, courseCategory: 'elective', isRequired: false }
    );
    expectRefused(response.status, 'PUT /api/program-curriculum/[id]');

    const entry = await testDb.program_curriculum.findUnique({
      where: { id: foreign.curriculumId },
    });
    expect(entry?.isRequired).toBe(true);
    expect(entry?.semesterSlot).toBe(1);
  });

  test('cannot remove a course from a foreign programme curriculum', async ({ page }) => {
    const response = await apiDelete(
      page,
      `/api/program-curriculum/${foreign.curriculumId}`
    );
    expectRefused(response.status, 'DELETE /api/program-curriculum/[id]');

    const entry = await testDb.program_curriculum.findUnique({
      where: { id: foreign.curriculumId },
    });
    expect(entry, 'the foreign curriculum entry was deleted').not.toBeNull();
  });

  test('cannot add a course to a foreign programme', async ({ page }) => {
    const response = await apiPost(page, `/api/programs/${foreign.programId}/courses`, {
      courseId: foreign.courseId,
      semester: 2,
      isCore: false,
      creditHours: 3,
    });
    expectRefused(response.status, 'POST /api/programs/[id]/courses');
  });

  // ── Courses, sections, batches ─────────────────────────────────────────────

  test('cannot rename a foreign course', async ({ page }) => {
    const response = await apiPut(page, `/api/courses/${foreign.courseId}`, {
      code: 'CE101-XWRITE',
      name: 'HIJACKED',
      creditHours: 3,
      theoryHours: 3,
      labHours: 0,
      type: 'THEORY',
      status: 'active',
    });
    expectRefused(response.status, 'PUT /api/courses/[id]');

    const course = await testDb.courses.findUnique({
      where: { id: foreign.courseId },
    });
    expect(course?.name).toBe('Statics');
  });

  test('cannot delete a foreign section', async ({ page }) => {
    const response = await apiDelete(page, `/api/sections/${foreign.sectionId}`);
    expectRefused(response.status, 'DELETE /api/sections/[id]');

    const section = await testDb.sections.findUnique({
      where: { id: foreign.sectionId },
    });
    expect(section, 'the foreign section was deleted').not.toBeNull();
  });

  test('cannot rename a foreign batch', async ({ page }) => {
    const response = await apiPut(page, `/api/batches/${foreign.batchId}`, {
      name: 'HIJACKED BATCH',
    });
    expectRefused(response.status, 'PUT /api/batches/[id]');

    const batch = await testDb.batches.findUnique({
      where: { id: foreign.batchId },
    });
    expect(batch?.name).toBe('CE Batch 2026');
  });

  test('cannot lock results on a foreign course offering', async ({ page }) => {
    const response = await apiPatch(
      page,
      `/api/course-offerings/${foreign.offeringId}/lock`
    );
    expectRefused(response.status, 'PATCH /api/course-offerings/[id]/lock');

    const offering = await testDb.courseofferings.findUnique({
      where: { id: foreign.offeringId },
    });
    expect(offering?.isResultsLocked).toBe(false);
  });

  // ── Student records ────────────────────────────────────────────────────────

  test('cannot delete a foreign student transcript', async ({ page }) => {
    const response = await apiDelete(page, `/api/transcripts/${foreign.transcriptId}`);
    expectRefused(response.status, 'DELETE /api/transcripts/[id]');

    const transcript = await testDb.transcripts.findUnique({
      where: { id: foreign.transcriptId },
    });
    expect(transcript, 'a foreign student’s transcript was deleted').not.toBeNull();
  });

  test('cannot read a foreign student transcript', async ({ page }) => {
    // The read side of this route was never guarded either — unlike the rest of
    // this file, where only the write half was missing.
    const response = await apiPatch(page, `/api/transcripts/${foreign.transcriptId}`, {
      status: 'draft',
    });
    expectRefused(response.status, 'PATCH /api/transcripts/[id]');
  });

  test('cannot delete a foreign accreditation report', async ({ page }) => {
    const response = await apiDelete(page, `/api/obe-reports/${foreign.reportId}`);
    expectRefused(response.status, 'DELETE /api/obe-reports/[id]');

    const report = await testDb.obereports.findUnique({
      where: { id: foreign.reportId },
    });
    expect(report, 'a foreign accreditation report was deleted').not.toBeNull();
  });

  // ── Grading instruments ────────────────────────────────────────────────────

  test('cannot delete a foreign rubric', async ({ page }) => {
    const response = await apiDelete(page, `/api/rubrics/${foreign.rubricId}`);
    expectRefused(response.status, 'DELETE /api/rubrics/[id]');

    const rubric = await testDb.rubrics.findUnique({
      where: { id: foreign.rubricId },
    });
    expect(rubric, 'the foreign rubric was deleted').not.toBeNull();
  });

  test('cannot create a rubric on a foreign course offering', async ({ page }) => {
    const response = await apiPost(page, '/api/rubrics', {
      title: 'Injected rubric',
      courseOfferingId: foreign.offeringId,
      cloId: foreign.cloId,
      criteria: [],
    });
    expectRefused(response.status, 'POST /api/rubrics');

    const count = await testDb.rubrics.count({
      where: { courseOfferingId: foreign.offeringId, title: 'Injected rubric' },
    });
    expect(count).toBe(0);
  });

  // ── Surveys: indirect attainment ───────────────────────────────────────────

  test('cannot mint the public link token of a foreign survey', async ({ page }) => {
    const response = await apiPost(page, `/api/surveys/${foreign.surveyId}/public`);
    expectRefused(response.status, 'POST /api/surveys/[id]/public');

    const survey = await testDb.surveys.findUnique({
      where: { id: foreign.surveyId },
    });
    expect(
      survey?.publicToken,
      'a public response token was minted for a foreign survey'
    ).toBeNull();
  });

  test('cannot add a question to a foreign survey', async ({ page }) => {
    const response = await apiPost(page, `/api/surveys/${foreign.surveyId}/questions`, {
      question: 'Injected question',
      questionType: 'rating',
      ploId: foreign.ploId,
    });
    expectRefused(response.status, 'POST /api/surveys/[id]/questions');

    const count = await testDb.survey_questions.count({
      where: { surveyId: foreign.surveyId },
    });
    expect(count).toBe(0);
  });

  test('cannot delete a foreign survey', async ({ page }) => {
    const response = await apiDelete(page, `/api/surveys/${foreign.surveyId}`);
    expectRefused(response.status, 'DELETE /api/surveys/[id]');

    const survey = await testDb.surveys.findUnique({
      where: { id: foreign.surveyId },
    });
    expect(survey, 'the foreign survey was deleted').not.toBeNull();
  });

  // ── Outcome mappings ───────────────────────────────────────────────────────

  test('cannot map a foreign CLO to a PLO', async ({ page }) => {
    const response = await apiPost(page, '/api/clo-plo-mappings', {
      cloId: foreign.cloId,
      ploId: foreign.ploId,
      weight: 1,
    });
    expectRefused(response.status, 'POST /api/clo-plo-mappings');

    const count = await testDb.cloplomappings.count({
      where: { cloId: foreign.cloId },
    });
    expect(count).toBe(0);
  });

  test('cannot create a CLO on a foreign course', async ({ page }) => {
    const response = await apiPost(page, '/api/clos', {
      code: 'CLO9',
      description: 'Injected outcome',
      courseId: foreign.courseId,
    });
    expectRefused(response.status, 'POST /api/clos');

    const count = await testDb.clos.count({
      where: { courseId: foreign.courseId, code: 'CLO9' },
    });
    expect(count).toBe(0);
  });

  // ── Creating inside another department ─────────────────────────────────────

  test('cannot create a batch under a foreign programme', async ({ page }) => {
    const response = await apiPost(page, '/api/batches', {
      name: 'Injected batch',
      code: 'INJ-XWRITE',
      programId: foreign.programId,
      startDate: '2026-09-01',
      endDate: '2030-06-30',
      maxStudents: 10,
    });
    expectRefused(response.status, 'POST /api/batches');

    const count = await testDb.batches.count({ where: { code: 'INJ-XWRITE' } });
    expect(count).toBe(0);
  });

  test('cannot create a section on a foreign course offering', async ({ page }) => {
    // `facultyId` is required by the schema and must be sent, otherwise the
    // request is rejected at validation and the test passes without ever
    // reaching the authorization check it exists to cover.
    const response = await apiPost(page, '/api/sections', {
      name: 'Injected section',
      courseOfferingId: foreign.offeringId,
      facultyId: null,
      batchId: foreign.batchId,
      maxStudents: 10,
    });
    expectRefused(response.status, 'POST /api/sections');
    expect(
      response.status,
      'rejected at validation rather than authorization — the test is not exercising the guard'
    ).not.toBe(400);

    const count = await testDb.sections.count({
      where: { name: 'Injected section' },
    });
    expect(count).toBe(0);
  });

  test('cannot create a programme inside another department', async ({ page }) => {
    const response = await apiPost(page, '/api/programs', {
      name: 'Injected programme',
      code: 'INJ-PROG-XWRITE',
      departmentId: foreign.departmentId,
      totalCreditHours: 130,
      duration: 4,
    });
    expectRefused(response.status, 'POST /api/programs');

    const count = await testDb.programs.count({
      where: { code: 'INJ-PROG-XWRITE' },
    });
    expect(count).toBe(0);
  });
});
