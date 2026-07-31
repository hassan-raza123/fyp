import { test } from '@playwright/test';
import { statePath } from '../support/global-setup';
import { apiGet, apiPut, apiPatch, apiDelete } from '../support/api-helper';
import { testDb } from '../support/fixtures';
import { hash } from 'bcryptjs';

/** TEMPORARY probe — cross-department (multi-tenant) isolation for a dept admin. */

test.describe('cross-department probe as admin of CS', () => {
  test.use({ storageState: statePath('admin') });

  test('probe foreign department objects', async ({ page }) => {
    // Build a second department nobody in CS should be able to touch.
    const passwordHash = await hash('E2ePass@2026', 10);
    const studentRole = await testDb.roles.findFirst({ where: { name: 'student' } });

    const dept = await testDb.departments.create({
      data: { name: 'Electrical Engineering', code: 'EE-PROBE', status: 'active', updatedAt: new Date() },
    });
    const program = await testDb.programs.create({
      data: {
        name: 'BS Electrical', code: 'BSEE-PROBE', duration: 4, status: 'active',
        departmentId: dept.id, totalCreditHours: 130, updatedAt: new Date(),
      },
    });
    const course = await testDb.courses.create({
      data: {
        code: 'EE101-PROBE', name: 'Circuits', creditHours: 3, theoryHours: 3, labHours: 0,
        type: 'THEORY', status: 'active', departmentId: dept.id, updatedAt: new Date(),
      },
    });
    const user = await testDb.users.create({
      data: {
        email: 'probe.ee.student@test.local', username: 'probe.ee.student',
        password_hash: passwordHash, first_name: 'EE', last_name: 'Student',
        status: 'active', email_verified: true, must_change_password: false,
      },
    });
    await testDb.userroles.create({
      data: { userId: user.id, roleId: studentRole!.id, updatedAt: new Date() },
    });
    const batch = await testDb.batches.create({
      data: {
        name: 'EE Batch', code: 'EEB-PROBE', startDate: new Date('2026-09-01'),
        endDate: new Date('2030-06-30'), maxStudents: 60, status: 'active',
        programId: program.id, updatedAt: new Date(),
      },
    });
    const student = await testDb.students.create({
      data: {
        userId: user.id, rollNumber: 'EE-PROBE-001', departmentId: dept.id,
        programId: program.id, batchId: batch.id, status: 'active', updatedAt: new Date(),
      },
    });
    const plo = await testDb.plos.create({
      data: {
        code: 'PLO1-PROBE', description: 'EE outcome', programId: program.id,
        bloomLevel: 'Apply', bloomDomain: 'Cognitive', status: 'active', updatedAt: new Date(),
      },
    });

    await page.goto('/admin');

    const reads: [string, string][] = [
      ['GET', `/api/students/${student.id}`],
      ['GET', `/api/students`],
      ['GET', `/api/programs/${program.id}`],
      ['GET', `/api/programs/${program.id}/statistics`],
      ['GET', `/api/courses/${course.id}`],
      ['GET', `/api/batches/${batch.id}`],
      ['GET', `/api/departments/${dept.id}`],
      ['GET', `/api/departments`],
      ['GET', `/api/courses`],
      ['GET', `/api/programs`],
    ];

    const out: string[] = [];
    for (const [, path] of reads) {
      const r = await apiGet(page, path);
      const t = JSON.stringify(r.body);
      out.push(`READ   ${String(r.status).padEnd(4)} ${path}  ${t.includes('PROBE') ? '<<< FOREIGN DATA VISIBLE' : ''} len=${t.length}`);
    }

    // Writes against foreign-department objects
    const w1 = await apiPut(page, `/api/programs/${program.id}`, {
      name: 'HIJACKED', code: 'BSEE-PROBE', duration: 4, departmentId: dept.id, totalCreditHours: 130,
    });
    out.push(`WRITE  ${w1.status} PUT /api/programs/${program.id} (rename foreign program)`);

    const w2 = await apiPut(page, `/api/students/${student.id}`, {
      rollNumber: 'HIJACKED-001', status: 'inactive',
    });
    out.push(`WRITE  ${w2.status} PUT /api/students/${student.id} (edit foreign student)`);

    const w3 = await apiDelete(page, `/api/programs/${program.id}/plos/${plo.id}`);
    out.push(`WRITE  ${w3.status} DELETE foreign PLO`);

    const w4 = await apiPatch(page, `/api/users/${user.id}/status`, { status: 'inactive' });
    out.push(`WRITE  ${w4.status} PATCH /api/users/${user.id}/status (disable foreign user)`);

    const w5 = await apiPut(page, `/api/courses/${course.id}`, {
      code: 'HIJACKED', name: 'Hijacked', creditHours: 3, departmentId: dept.id,
    });
    out.push(`WRITE  ${w5.status} PUT /api/courses/${course.id} (rename foreign course)`);

    console.log('\n===XDEPT-PROBE===\n' + out.join('\n') + '\n===END===');

    // Report post-state
    const after = await testDb.programs.findUnique({ where: { id: program.id } });
    const afterStudent = await testDb.students.findUnique({ where: { id: student.id } });
    const afterUser = await testDb.users.findUnique({ where: { id: user.id } });
    console.log(
      `\n===XDEPT-EFFECT===\nprogram.name=${after?.name}\nstudent.rollNumber=${afterStudent?.rollNumber}\nuser.status=${afterUser?.status}\n===END===`
    );
  });
});
