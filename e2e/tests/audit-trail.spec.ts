import { test, expect } from '@playwright/test';
import { statePath } from '../support/global-setup';
import { apiDelete, apiPost, apiPut } from '../support/api-helper';
import { testDb } from '../support/fixtures';

/**
 * The audit trail for structural configuration.
 *
 * The seventh pass closed a cross-tenant hole on every write in the
 * accreditation chain — objectives, curriculum, graduation thresholds, rubrics,
 * surveys, transcripts. Refusing the *foreign* write was half the answer. The
 * other half is that the *legitimate* write leaves a record, because these are
 * the figures an accreditation body asks about, and "who lowered the minimum
 * CGPA, and when" has to be answerable.
 *
 * Before this spec, `AuditAction` covered marks, attendance and account
 * administration, and nothing else. A department admin could rewrite their own
 * programme's degree requirements and the system kept no record at all.
 *
 * Each test drives a real write through the API as the department admin who
 * legitimately owns the row, then asserts the matching `auditlogs` row exists
 * and carries enough detail to reconstruct what changed.
 */

let owned: {
  programId: number;
  peoId: number;
  ploId: number;
  criteriaId: number;
  curriculumId: number;
  courseId: number;
  offeringId: number;
};

/** The most recent audit row for an action, or null. */
async function latestAudit(action: string) {
  return testDb.auditlogs.findFirst({
    where: { action },
    orderBy: { id: 'desc' },
  });
}

test.beforeAll(async () => {
  // The admin's own department — these writes are meant to succeed.
  const program = await testDb.programs.findFirstOrThrow({
    where: { code: 'BSCS' },
  });
  const peo = await testDb.peos.findFirstOrThrow({
    where: { programId: program.id },
  });
  const plo = await testDb.plos.findFirstOrThrow({
    where: { programId: program.id },
  });
  const criteria = await testDb.graduation_criteria.findFirstOrThrow({
    where: { programId: program.id },
  });
  const curriculum = await testDb.program_curriculum.findFirstOrThrow({
    where: { programId: program.id },
  });
  const offering = await testDb.courseofferings.findFirstOrThrow();
  const course = await testDb.courses.findFirstOrThrow({
    where: { code: 'CS101' },
  });

  owned = {
    programId: program.id,
    peoId: peo.id,
    ploId: plo.id,
    criteriaId: criteria.id,
    curriculumId: curriculum.id,
    courseId: course.id,
    offeringId: offering.id,
  };
});

test.describe('Structural writes leave an audit trail', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('editing graduation criteria records the before and after', async ({
    page,
  }) => {
    const before = await testDb.graduation_criteria.findUniqueOrThrow({
      where: { id: owned.criteriaId },
    });

    const response = await apiPut(
      page,
      `/api/graduation-criteria/${owned.criteriaId}`,
      {
        minCGPA: 2.25,
        minPloAttainmentPercent: 55,
        requireAllCourses: before.requireAllCourses,
        directWeight: 0.7,
        indirectWeight: 0.3,
      }
    );
    expect(response.status, JSON.stringify(response.body)).toBe(200);

    const entry = await latestAudit('graduation_criteria.update');
    expect(entry, 'no audit row was written for a graduation-criteria change')
      .not.toBeNull();

    const details = entry!.details as Record<string, any>;
    expect(details.criteriaId).toBe(owned.criteriaId);
    // The before/after pair is the point of the record: without it the row
    // says something changed but not what the threshold used to be.
    expect(details.before.minCGPA).toBe(before.minCGPA);
    expect(details.after.minCGPA).toBe(2.25);
    expect(entry!.userId, 'the change is not attributed to anyone').toBeTruthy();

    // Put it back so later specs see the seeded thresholds.
    await testDb.graduation_criteria.update({
      where: { id: owned.criteriaId },
      data: {
        minCGPA: before.minCGPA,
        minPloAttainmentPercent: before.minPloAttainmentPercent,
      },
    });
  });

  test('editing a PEO records the before and after', async ({ page }) => {
    const before = await testDb.peos.findUniqueOrThrow({
      where: { id: owned.peoId },
    });

    const response = await apiPut(page, `/api/peos/${owned.peoId}`, {
      code: before.code,
      description: 'Amended objective for the audit-trail spec.',
      status: 'active',
    });
    expect(response.status, JSON.stringify(response.body)).toBe(200);

    const entry = await latestAudit('peo.update');
    expect(entry, 'no audit row was written for a PEO change').not.toBeNull();

    const details = entry!.details as Record<string, any>;
    expect(details.peoId).toBe(owned.peoId);
    expect(details.before.description).toBe(before.description);
    expect(details.after.description).toContain('Amended objective');

    await testDb.peos.update({
      where: { id: owned.peoId },
      data: { description: before.description },
    });
  });

  test('changing the curriculum records which course moved', async ({ page }) => {
    const before = await testDb.program_curriculum.findUniqueOrThrow({
      where: { id: owned.curriculumId },
    });

    const response = await apiPut(
      page,
      `/api/program-curriculum/${owned.curriculumId}`,
      { semesterSlot: 3, isRequired: before.isRequired }
    );
    expect(response.status, JSON.stringify(response.body)).toBe(200);

    const entry = await latestAudit('curriculum.update');
    expect(entry, 'no audit row was written for a curriculum change').not.toBeNull();

    const details = entry!.details as Record<string, any>;
    expect(details.courseId).toBe(before.courseId);
    expect(details.before.semesterSlot).toBe(before.semesterSlot);
    expect(details.after.semesterSlot).toBe(3);

    await testDb.program_curriculum.update({
      where: { id: owned.curriculumId },
      data: { semesterSlot: before.semesterSlot },
    });
  });

  test('creating and deleting a PEO-PLO mapping is recorded both ways', async ({
    page,
  }) => {
    // The seed maps every PLO to this PEO already, so the create would collide
    // on the unique constraint. Make a PLO of our own rather than skipping —
    // a skipped test is not coverage.
    const spare = await testDb.plos.create({
      data: {
        code: 'PLO-AUDITTRAIL',
        description: 'Spare outcome for the audit-trail spec',
        programId: owned.programId,
        bloomLevel: 'Apply',
        bloomDomain: 'Cognitive',
        status: 'active',
        updatedAt: new Date(),
      },
    });

    const created = await apiPost(page, '/api/peo-plo-mappings', {
      peoId: owned.peoId,
      ploId: spare.id,
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);

    const createEntry = await latestAudit('peo_plo_mapping.create');
    expect(createEntry).not.toBeNull();
    expect((createEntry!.details as Record<string, any>).ploId).toBe(spare.id);

    const mappingId = (created.body as Record<string, any>).id as number;
    const removed = await apiDelete(page, `/api/peo-plo-mappings/${mappingId}`);
    expect(removed.status).toBe(200);

    const deleteEntry = await latestAudit('peo_plo_mapping.delete');
    expect(deleteEntry, 'deleting a mapping left no record').not.toBeNull();
    expect((deleteEntry!.details as Record<string, any>).mappingId).toBe(mappingId);

    // The listing specs assert on row counts; leave the seed as we found it.
    await testDb.plos.delete({ where: { id: spare.id } });
  });

  test('a rubric records its creation and its deletion', async ({ page }) => {
    const clo = await testDb.clos.findFirstOrThrow({
      where: { courseId: owned.courseId },
    });

    const created = await apiPost(page, '/api/rubrics', {
      title: 'Audit-trail rubric',
      courseOfferingId: owned.offeringId,
      cloId: clo.id,
      criteria: [],
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    const rubricId = (created.body as Record<string, any>).id as number;

    const createEntry = await latestAudit('rubric.create');
    expect(createEntry).not.toBeNull();
    expect((createEntry!.details as Record<string, any>).rubricId).toBe(rubricId);

    const removed = await apiDelete(page, `/api/rubrics/${rubricId}`);
    expect(removed.status).toBe(200);

    const deleteEntry = await latestAudit('rubric.delete');
    expect(deleteEntry, 'deleting a rubric left no record').not.toBeNull();
    expect((deleteEntry!.details as Record<string, any>).rubricId).toBe(rubricId);
  });

  test('a refused cross-tenant write writes no audit row', async ({ page }) => {
    // The trail must record what happened, not what was attempted and denied —
    // otherwise a rejected probe is indistinguishable from a real change.
    const foreignDept = await testDb.departments.create({
      data: {
        name: 'Audit-trail foreign dept',
        code: 'FRN-AUDITTRAIL',
        status: 'active',
        updatedAt: new Date(),
      },
    });
    const foreignProgram = await testDb.programs.create({
      data: {
        name: 'BS Foreign (audit trail)',
        code: 'BSFRN-AUDITTRAIL',
        duration: 4,
        status: 'active',
        departmentId: foreignDept.id,
        totalCreditHours: 130,
        updatedAt: new Date(),
      },
    });
    const foreignPeo = await testDb.peos.create({
      data: {
        code: 'PEO-FRN-AT',
        description: 'Foreign objective',
        programId: foreignProgram.id,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    const countBefore = await testDb.auditlogs.count({
      where: { action: 'peo.update' },
    });

    const response = await apiPut(page, `/api/peos/${foreignPeo.id}`, {
      code: 'PEO-FRN-AT',
      description: 'SHOULD NOT BE WRITTEN',
      status: 'active',
    });
    expect(response.status).toBe(403);

    const countAfter = await testDb.auditlogs.count({
      where: { action: 'peo.update' },
    });
    expect(
      countAfter,
      'a refused write produced an audit row, which would read as a real change'
    ).toBe(countBefore);

    await testDb.peos.deleteMany({ where: { programId: foreignProgram.id } });
    await testDb.programs.delete({ where: { id: foreignProgram.id } });
    await testDb.departments.delete({ where: { id: foreignDept.id } });
  });
});
