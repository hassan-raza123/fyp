import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessSection } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

/**
 * A single attendance session.
 *
 * GET    — the session plus the full roster, so the marking screen can render
 *          every enrolled student whether or not they already have a record.
 * PATCH  — edit details, finalize, or reopen.
 * DELETE — remove a session recorded by mistake.
 */

async function loadSession(sessionId: number) {
  return prisma.attendance_sessions.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      sectionId: true,
      date: true,
      slot: true,
      topic: true,
      durationMinutes: true,
      status: true,
      finalizedAt: true,
      section: {
        select: {
          name: true,
          courseOffering: {
            select: { course: { select: { code: true, name: true } } },
          },
        },
      },
    },
  });
}

export async function GET(
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

    const session = await loadSession(sessionId);
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

    // The roster drives the screen, not the existing records: a student
    // enrolled after the session was created must still appear to be marked.
    const enrollments = await prisma.studentsections.findMany({
      where: { sectionId: session.sectionId, status: 'active' },
      select: {
        studentId: true,
        student: {
          select: {
            rollNumber: true,
            user: { select: { first_name: true, last_name: true } },
          },
        },
      },
      orderBy: { student: { rollNumber: 'asc' } },
    });

    const records = await prisma.attendance_records.findMany({
      where: { sessionId },
      select: { studentId: true, status: true, remarks: true },
    });

    const recordByStudent = new Map(records.map((r) => [r.studentId, r]));

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          sectionId: session.sectionId,
          sectionName: session.section.name,
          courseCode: session.section.courseOffering.course.code,
          courseName: session.section.courseOffering.course.name,
          date: session.date,
          slot: session.slot,
          topic: session.topic,
          durationMinutes: session.durationMinutes,
          status: session.status,
          finalizedAt: session.finalizedAt,
        },
        roster: enrollments.map((enrollment) => {
          const record = recordByStudent.get(enrollment.studentId);
          return {
            studentId: enrollment.studentId,
            rollNumber: enrollment.student.rollNumber,
            name: `${enrollment.student.user.first_name} ${enrollment.student.user.last_name}`,
            // Null distinguishes "not yet marked" from a deliberate status.
            status: record?.status ?? null,
            remarks: record?.remarks ?? null,
          };
        }),
      },
    });
  } catch (error) {
    console.error('Error fetching attendance session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const session = await loadSession(sessionId);
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

    const body = await request.json();
    const { topic, durationMinutes, status } = body;

    // Reopening a finalized session changes every student's percentage, so it
    // is restricted to staff — the same reasoning as unlocking results.
    if (
      status === 'open' &&
      session.status === 'finalized' &&
      auth.user.role === 'faculty'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This session is finalized. Contact your department admin to reopen it.',
        },
        { status: 403 }
      );
    }

    if (status !== undefined && !['open', 'finalized'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'status must be "open" or "finalized"' },
        { status: 400 }
      );
    }

    // Finalizing with nobody marked would count the whole section absent.
    if (status === 'finalized' && session.status === 'open') {
      const recordCount = await prisma.attendance_records.count({
        where: { sessionId },
      });
      if (recordCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Cannot finalize a session with no attendance marked — every student would be counted absent.',
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.attendance_sessions.update({
      where: { id: sessionId },
      data: {
        ...(topic !== undefined ? { topic } : {}),
        ...(durationMinutes !== undefined
          ? { durationMinutes: parseInt(String(durationMinutes), 10) || 60 }
          : {}),
        ...(status !== undefined
          ? {
              status,
              finalizedAt: status === 'finalized' ? new Date() : null,
            }
          : {}),
      },
    });

    if (status !== undefined && status !== session.status) {
      await writeAuditLog(
        request,
        auth.user,
        status === 'finalized' ? 'attendance.finalize' : 'attendance.reopen',
        { sessionId, sectionId: session.sectionId, date: session.date.toISOString() }
      );

      // Finalizing is the moment a student's percentage actually moves, so it
      // is the moment to warn anyone who has fallen short. A failure to notify
      // must not fail the finalize itself.
      if (status === 'finalized') {
        try {
          const { notifyAttendanceShortfall } = await import(
            '@/lib/notification-utils'
          );
          await notifyAttendanceShortfall(session.sectionId);
        } catch (notifyError) {
          console.error(
            'Failed to send attendance shortfall notifications:',
            notifyError
          );
        }
      }
    } else {
      await writeAuditLog(request, auth.user, 'attendance.session_update', {
        sessionId,
        sectionId: session.sectionId,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating attendance session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attendance session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const session = await loadSession(sessionId);
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

    if (session.status === 'finalized' && auth.user.role === 'faculty') {
      return NextResponse.json(
        {
          success: false,
          error:
            'This session is finalized. Contact your department admin to delete it.',
        },
        { status: 403 }
      );
    }

    // Records cascade with the session.
    await prisma.attendance_sessions.delete({ where: { id: sessionId } });

    await writeAuditLog(request, auth.user, 'attendance.session_delete', {
      sessionId,
      sectionId: session.sectionId,
      date: session.date.toISOString(),
      slot: session.slot,
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance session deleted',
    });
  } catch (error) {
    console.error('Error deleting attendance session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete attendance session' },
      { status: 500 }
    );
  }
}
