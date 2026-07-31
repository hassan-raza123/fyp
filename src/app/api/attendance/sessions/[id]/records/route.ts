import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessSection } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';
import { attendance_status } from '@prisma/client';

/**
 * Bulk attendance marking.
 *
 * POST /api/attendance/sessions/[id]/records
 * Body: { records: [{ studentId, status, remarks? }] }
 *
 * Marking is bulk-only by design: a class is marked in one pass, and a
 * per-student endpoint invites a half-saved roll that looks identical to
 * genuine absences.
 */

const VALID_STATUSES: attendance_status[] = [
  'present',
  'absent',
  'late',
  'excused',
];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authorize(request, ['admin', 'super_admin', 'faculty']);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const sessionId = parseInt(id, 10);
    if (Number.isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session id' },
        { status: 400 }
      );
    }

    const session = await prisma.attendance_sessions.findUnique({
      where: { id: sessionId },
      select: { id: true, sectionId: true, status: true, date: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!(await canAccessSection(request, auth.user, session.sectionId))) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this section' },
        { status: 403 }
      );
    }

    // A finalized session is a closed record. Staff may still correct it —
    // mirroring how admins can amend locked results — but faculty cannot.
    if (session.status === 'finalized' && auth.user.role === 'faculty') {
      return NextResponse.json(
        {
          success: false,
          error:
            'This session is finalized. Contact your department admin to make a correction.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, error: 'records must be a non-empty array' },
        { status: 400 }
      );
    }

    // Only students actually enrolled in this section may be marked. Without
    // this check a stale roster in the browser could write records for students
    // who have since been moved, quietly corrupting their percentage.
    const enrolled = await prisma.studentsections.findMany({
      where: { sectionId: session.sectionId, status: 'active' },
      select: { studentId: true },
    });
    const enrolledIds = new Set(enrolled.map((e) => e.studentId));

    const valid: Array<{
      studentId: number;
      status: attendance_status;
      remarks: string | null;
    }> = [];
    const rejected: Array<{ studentId: unknown; reason: string }> = [];

    for (const record of records) {
      const studentId = parseInt(String(record?.studentId), 10);

      if (Number.isNaN(studentId)) {
        rejected.push({ studentId: record?.studentId, reason: 'Invalid studentId' });
        continue;
      }
      if (!enrolledIds.has(studentId)) {
        rejected.push({ studentId, reason: 'Not enrolled in this section' });
        continue;
      }
      if (!VALID_STATUSES.includes(record?.status)) {
        rejected.push({ studentId, reason: `Invalid status "${record?.status}"` });
        continue;
      }

      valid.push({
        studentId,
        status: record.status,
        remarks: record.remarks ?? null,
      });
    }

    if (valid.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid attendance records to save',
          rejected,
        },
        { status: 400 }
      );
    }

    // One transaction so a partially-saved roll cannot survive a failure.
    await prisma.$transaction(
      valid.map((record) =>
        prisma.attendance_records.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId: record.studentId },
          },
          update: { status: record.status, remarks: record.remarks },
          create: {
            sessionId,
            studentId: record.studentId,
            status: record.status,
            remarks: record.remarks,
          },
        })
      )
    );

    await writeAuditLog(request, auth.user, 'attendance.mark', {
      sessionId,
      sectionId: session.sectionId,
      date: session.date.toISOString(),
      saved: valid.length,
      rejected: rejected.length,
      wasFinalized: session.status === 'finalized',
    });

    return NextResponse.json({
      success: true,
      data: {
        saved: valid.length,
        rejected,
      },
    });
  } catch (error) {
    console.error('Error saving attendance records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save attendance records' },
      { status: 500 }
    );
  }
}
