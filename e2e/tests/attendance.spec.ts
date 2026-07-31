import { test, expect, type Page } from '@playwright/test';
import { testDb } from '../support/fixtures';
import { statePath, readSeededIds } from '../support/global-setup';
import { apiGet, apiPost, apiPatch } from '../support/api-helper';

/**
 * Attendance, from marking a class through to exam eligibility.
 *
 * The assertions check the arithmetic and the exclusion rules rather than only
 * that requests succeed, because the percentage decides whether a student may
 * sit their exam.
 *
 * The seeded section has 2 enrolled students.
 */

const ids = readSeededIds();

/** Remove every session for the seeded section so each test starts clean. */
async function clearAttendance() {
  await testDb.attendance_records.deleteMany({
    where: { session: { sectionId: ids.sectionId } },
  });
  await testDb.attendance_sessions.deleteMany({
    where: { sectionId: ids.sectionId },
  });
  await testDb.studentsections.updateMany({
    where: { sectionId: ids.sectionId },
    data: {
      eligibilityOverride: 'none',
      eligibilityRemarks: null,
      eligibilitySetBy: null,
      eligibilitySetAt: null,
    },
  });
}

/** A date inside the seeded semester. */
async function semesterDate(dayOffset = 0): Promise<string> {
  const semester = await testDb.semesters.findUniqueOrThrow({
    where: { id: ids.semesterId },
    select: { startDate: true },
  });
  const date = new Date(semester.startDate);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

test.describe('attendance marking', () => {
  test.use({ storageState: statePath('faculty') });

  test.beforeEach(async () => {
    await clearAttendance();
  });

  test('faculty creates a session, marks the roll and finalizes it', async ({
    page,
  }) => {
    await page.goto('/faculty');

    const date = await semesterDate(1);

    const created = await apiPost<{ success: boolean; data: { id: number } }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date, slot: 1, topic: 'Introduction' }
    );
    expect(created.body.success).toBe(true);
    const sessionId = created.body.data.id;

    // The roster comes back with every enrolled student, unmarked.
    const detail = await apiGet<{
      success: boolean;
      data: { roster: Array<{ studentId: number; status: string | null }> };
    }>(page, `/api/attendance/sessions/${sessionId}`);
    expect(detail.body.success).toBe(true);
    expect(detail.body.data.roster.length).toBe(2);
    expect(detail.body.data.roster.every((r) => r.status === null)).toBe(true);

    const marked = await apiPost<{ success: boolean; data: { saved: number } }>(
      page,
      `/api/attendance/sessions/${sessionId}/records`,
      {
        records: [
          { studentId: ids.studentId, status: 'present' },
          { studentId: ids.otherStudentId, status: 'absent' },
        ],
      }
    );
    expect(marked.body.data.saved).toBe(2);

    const finalized = await apiPatch<{ success: boolean }>(
      page,
      `/api/attendance/sessions/${sessionId}`,
      { status: 'finalized' }
    );
    expect(finalized.body.success).toBe(true);

    const summary = await apiGet<{
      success: boolean;
      data: {
        finalizedSessions: number;
        students: Array<{
          studentId: number;
          tally: { attendancePercent: number };
        }>;
      };
    }>(page, `/api/attendance/summary?sectionId=${ids.sectionId}`);

    expect(summary.body.data.finalizedSessions).toBe(1);

    const present = summary.body.data.students.find(
      (s) => s.studentId === ids.studentId
    );
    const absent = summary.body.data.students.find(
      (s) => s.studentId === ids.otherStudentId
    );
    expect(present?.tally.attendancePercent).toBe(100);
    expect(absent?.tally.attendancePercent).toBe(0);
  });

  test('an open session does not count towards attendance', async ({ page }) => {
    await page.goto('/faculty');

    const created = await apiPost<{ data: { id: number } }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date: await semesterDate(2), slot: 1 }
    );

    await apiPost(page, `/api/attendance/sessions/${created.body.data.id}/records`, {
      records: [{ studentId: ids.studentId, status: 'absent' }],
    });

    // Left open deliberately — marking still in progress must not manufacture
    // an absence record in the percentage.
    const summary = await apiGet<{
      data: {
        finalizedSessions: number;
        students: Array<{ tally: { hasData: boolean } }>;
      };
    }>(page, `/api/attendance/summary?sectionId=${ids.sectionId}`);

    expect(summary.body.data.finalizedSessions).toBe(0);
    expect(summary.body.data.students.every((s) => !s.tally.hasData)).toBe(true);
  });

  test('excused absence is excluded from the denominator', async ({ page }) => {
    await page.goto('/faculty');

    // Two sessions: student is present in one, excused in the other. An
    // excused absence must leave attendance at 100%, not 50%.
    for (const [index, status] of [['0', 'present'], ['1', 'excused']] as const) {
      const created = await apiPost<{ data: { id: number } }>(
        page,
        '/api/attendance/sessions',
        {
          sectionId: ids.sectionId,
          date: await semesterDate(10 + Number(index)),
          slot: 1,
        }
      );
      const sessionId = created.body.data.id;

      await apiPost(page, `/api/attendance/sessions/${sessionId}/records`, {
        records: [
          { studentId: ids.studentId, status },
          { studentId: ids.otherStudentId, status: 'present' },
        ],
      });
      await apiPatch(page, `/api/attendance/sessions/${sessionId}`, {
        status: 'finalized',
      });
    }

    const summary = await apiGet<{
      data: {
        students: Array<{
          studentId: number;
          tally: {
            attendancePercent: number;
            countedSessions: number;
            excused: number;
          };
        }>;
      };
    }>(page, `/api/attendance/summary?sectionId=${ids.sectionId}`);

    const student = summary.body.data.students.find(
      (s) => s.studentId === ids.studentId
    );
    expect(student?.tally.excused).toBe(1);
    expect(student?.tally.countedSessions).toBe(1);
    expect(student?.tally.attendancePercent).toBe(100);
  });

  test('late counts as attended', async ({ page }) => {
    await page.goto('/faculty');

    const created = await apiPost<{ data: { id: number } }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date: await semesterDate(15), slot: 1 }
    );
    const sessionId = created.body.data.id;

    await apiPost(page, `/api/attendance/sessions/${sessionId}/records`, {
      records: [
        { studentId: ids.studentId, status: 'late' },
        { studentId: ids.otherStudentId, status: 'present' },
      ],
    });
    await apiPatch(page, `/api/attendance/sessions/${sessionId}`, {
      status: 'finalized',
    });

    const summary = await apiGet<{
      data: {
        students: Array<{
          studentId: number;
          tally: { attendancePercent: number; late: number };
        }>;
      };
    }>(page, `/api/attendance/summary?sectionId=${ids.sectionId}`);

    const student = summary.body.data.students.find(
      (s) => s.studentId === ids.studentId
    );
    expect(student?.tally.late).toBe(1);
    expect(student?.tally.attendancePercent).toBe(100);
  });

  test('a duplicate session for the same date and slot is refused', async ({
    page,
  }) => {
    await page.goto('/faculty');
    const date = await semesterDate(20);

    const first = await apiPost<{ success: boolean }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date, slot: 1 }
    );
    expect(first.body.success).toBe(true);

    const second = await apiPost<{ success: boolean; code: string }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date, slot: 1 }
    );
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('SESSION_EXISTS');

    // A different slot on the same day is a different class and is allowed.
    const lab = await apiPost<{ success: boolean }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date, slot: 2 }
    );
    expect(lab.body.success).toBe(true);
  });

  test('a session outside the semester dates is refused', async ({ page }) => {
    await page.goto('/faculty');

    const response = await apiPost<{ success: boolean; error: string }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date: '2001-01-15', slot: 1 }
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('outside');
  });

  test('finalizing with nothing marked is refused', async ({ page }) => {
    await page.goto('/faculty');

    const created = await apiPost<{ data: { id: number } }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date: await semesterDate(25), slot: 1 }
    );

    const response = await apiPatch<{ success: boolean; error: string }>(
      page,
      `/api/attendance/sessions/${created.body.data.id}`,
      { status: 'finalized' }
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('counted absent');
  });

  test('faculty cannot amend a finalized session', async ({ page }) => {
    await page.goto('/faculty');

    const created = await apiPost<{ data: { id: number } }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date: await semesterDate(30), slot: 1 }
    );
    const sessionId = created.body.data.id;

    await apiPost(page, `/api/attendance/sessions/${sessionId}/records`, {
      records: [{ studentId: ids.studentId, status: 'present' }],
    });
    await apiPatch(page, `/api/attendance/sessions/${sessionId}`, {
      status: 'finalized',
    });

    const amend = await apiPost<{ success: boolean }>(
      page,
      `/api/attendance/sessions/${sessionId}/records`,
      { records: [{ studentId: ids.studentId, status: 'absent' }] }
    );
    expect(amend.status).toBe(403);

    const reopen = await apiPatch<{ success: boolean }>(
      page,
      `/api/attendance/sessions/${sessionId}`,
      { status: 'open' }
    );
    expect(reopen.status).toBe(403);
  });

  test('a student not enrolled in the section is rejected', async ({ page }) => {
    await page.goto('/faculty');

    const created = await apiPost<{ data: { id: number } }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date: await semesterDate(35), slot: 1 }
    );

    const response = await apiPost<{
      success: boolean;
      data: { saved: number; rejected: Array<{ reason: string }> };
    }>(page, `/api/attendance/sessions/${created.body.data.id}/records`, {
      records: [
        { studentId: ids.studentId, status: 'present' },
        { studentId: 999999, status: 'present' },
      ],
    });

    expect(response.body.data.saved).toBe(1);
    expect(response.body.data.rejected).toHaveLength(1);
    expect(response.body.data.rejected[0].reason).toContain('Not enrolled');
  });
});

test.describe('exam eligibility', () => {
  test.use({ storageState: statePath('admin') });

  test.beforeEach(async () => {
    await clearAttendance();
  });

  /**
   * Finalize `total` sessions, marking the seeded student present for the
   * first `present` of them.
   */
  async function buildAttendance(page: Page, present: number, total: number) {
    for (let index = 0; index < total; index++) {
      const created = await apiPost<{ data: { id: number } }>(
        page,
        '/api/attendance/sessions',
        {
          sectionId: ids.sectionId,
          date: await semesterDate(40 + index),
          slot: 1,
        }
      );
      const sessionId = created.body.data.id;

      await apiPost(page, `/api/attendance/sessions/${sessionId}/records`, {
        records: [
          {
            studentId: ids.studentId,
            status: index < present ? 'present' : 'absent',
          },
          { studentId: ids.otherStudentId, status: 'present' },
        ],
      });
      await apiPatch(page, `/api/attendance/sessions/${sessionId}`, {
        status: 'finalized',
      });
    }
  }

  test('a student below the threshold is flagged ineligible', async ({
    page,
  }) => {
    await page.goto('/admin');

    // 2 of 10 → 20%, well below the 75% default.
    await buildAttendance(page, 2, 10);

    const eligibility = await apiGet<{
      data: {
        students: Array<{ studentId: number; verdict: string }>;
        counts: { ineligible: number };
      };
    }>(page, `/api/attendance/eligibility?courseOfferingId=${ids.courseOfferingId}`);

    const student = eligibility.body.data.students.find(
      (s) => s.studentId === ids.studentId
    );
    expect(student?.verdict).toBe('ineligible');
    expect(eligibility.body.data.counts.ineligible).toBe(1);
  });

  test('an admin condonation overrides the shortfall', async ({ page }) => {
    await page.goto('/admin');
    await buildAttendance(page, 2, 10);

    const override = await apiPatch<{ success: boolean }>(
      page,
      '/api/attendance/eligibility',
      {
        studentId: ids.studentId,
        sectionId: ids.sectionId,
        override: 'eligible',
        remarks: 'Hospitalised, medical certificate on file',
      }
    );
    expect(override.body.success).toBe(true);

    const eligibility = await apiGet<{
      data: { students: Array<{ studentId: number; verdict: string }> };
    }>(page, `/api/attendance/eligibility?courseOfferingId=${ids.courseOfferingId}`);

    const student = eligibility.body.data.students.find(
      (s) => s.studentId === ids.studentId
    );
    expect(student?.verdict).toBe('condoned');
  });

  test('a condonation without a reason is refused', async ({ page }) => {
    await page.goto('/admin');

    const response = await apiPatch<{ success: boolean; error: string }>(
      page,
      '/api/attendance/eligibility',
      {
        studentId: ids.studentId,
        sectionId: ids.sectionId,
        override: 'eligible',
        remarks: '   ',
      }
    );

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('reason is required');
  });

  test('defaulters are listed for the semester', async ({ page }) => {
    await page.goto('/admin');
    await buildAttendance(page, 2, 10);

    const response = await apiGet<{
      data: {
        defaulters: Array<{ studentId: number; attendancePercent: number }>;
        uniqueStudents: number;
      };
    }>(page, `/api/attendance/defaulters?semesterId=${ids.semesterId}`);

    const entry = response.body.data.defaulters.find(
      (d) => d.studentId === ids.studentId
    );
    expect(entry).toBeTruthy();
    expect(entry?.attendancePercent).toBe(20);
    expect(response.body.data.uniqueStudents).toBeGreaterThanOrEqual(1);
  });
});

test.describe('student attendance view', () => {
  test.use({ storageState: statePath('student') });

  test('a student sees their own attendance and class history', async ({
    page,
  }) => {
    await page.goto('/student');

    const response = await apiGet<{
      success: boolean;
      data: {
        courses: Array<{ sectionId: number; courseCode: string }>;
        overallAttendance: number;
      };
    }>(page, '/api/student/attendance');

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.courses)).toBe(true);

    const course = response.body.data.courses.find(
      (c) => c.sectionId === ids.sectionId
    );
    expect(course).toBeTruthy();

    const history = await apiGet<{
      success: boolean;
      data: { history: Array<{ date: string; status: string }> | null };
    }>(page, `/api/student/attendance?sectionId=${ids.sectionId}`);

    expect(history.body.success).toBe(true);
    expect(Array.isArray(history.body.data.history)).toBe(true);
  });

  test('a student cannot read a section they are not enrolled in', async ({
    page,
  }) => {
    await page.goto('/student');

    const response = await apiGet<{ success: boolean }>(
      page,
      '/api/student/attendance?sectionId=999999'
    );
    expect(response.status).toBe(403);
  });

  test('a student cannot mark attendance', async ({ page }) => {
    await page.goto('/student');

    const response = await apiPost<{ success: boolean }>(
      page,
      '/api/attendance/sessions',
      { sectionId: ids.sectionId, date: '2030-01-01', slot: 1 }
    );
    expect(response.status).toBe(403);
  });
});
