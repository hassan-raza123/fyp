import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessSection } from '@/lib/authz';
import { writeAuditLog } from '@/lib/audit-log';

/**
 * Attendance sessions — one row per class meeting.
 *
 * GET  /api/attendance/sessions?sectionId=&from=&to=
 * POST /api/attendance/sessions
 */

/** Normalise a date to midnight UTC so `@db.Date` comparisons are stable. */
function toDateOnly(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
  );
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, [
      'admin',
      'super_admin',
      'faculty',
    ]);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const sectionIdParam = searchParams.get('sectionId');

    if (!sectionIdParam) {
      return NextResponse.json(
        { success: false, error: 'sectionId is required' },
        { status: 400 }
      );
    }

    const sectionId = parseInt(sectionIdParam, 10);
    if (Number.isNaN(sectionId)) {
      return NextResponse.json(
        { success: false, error: 'sectionId must be a number' },
        { status: 400 }
      );
    }

    if (!(await canAccessSection(request, auth.user, sectionId))) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this section' },
        { status: 403 }
      );
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) {
      const parsed = toDateOnly(from);
      if (parsed) dateFilter.gte = parsed;
    }
    if (to) {
      const parsed = toDateOnly(to);
      if (parsed) dateFilter.lte = parsed;
    }

    const sessions = await prisma.attendance_sessions.findMany({
      where: {
        sectionId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      select: {
        id: true,
        date: true,
        slot: true,
        topic: true,
        durationMinutes: true,
        status: true,
        finalizedAt: true,
        createdAt: true,
        marker: {
          select: {
            id: true,
            user: { select: { first_name: true, last_name: true } },
          },
        },
        _count: { select: { records: true } },
      },
      orderBy: [{ date: 'desc' }, { slot: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: sessions.map((session) => ({
        id: session.id,
        date: session.date,
        slot: session.slot,
        topic: session.topic,
        durationMinutes: session.durationMinutes,
        status: session.status,
        finalizedAt: session.finalizedAt,
        markedBy: `${session.marker.user.first_name} ${session.marker.user.last_name}`,
        recordCount: session._count.records,
      })),
    });
  } catch (error) {
    console.error('Error fetching attendance sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, [
      'admin',
      'super_admin',
      'faculty',
    ]);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { sectionId, date, slot, topic, durationMinutes } = body;

    if (!sectionId || !date) {
      return NextResponse.json(
        { success: false, error: 'sectionId and date are required' },
        { status: 400 }
      );
    }

    const parsedSectionId = parseInt(String(sectionId), 10);
    if (Number.isNaN(parsedSectionId)) {
      return NextResponse.json(
        { success: false, error: 'sectionId must be a number' },
        { status: 400 }
      );
    }

    if (!(await canAccessSection(request, auth.user, parsedSectionId))) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this section' },
        { status: 403 }
      );
    }

    const sessionDate = toDateOnly(String(date));
    if (!sessionDate) {
      return NextResponse.json(
        { success: false, error: 'date is not a valid date' },
        { status: 400 }
      );
    }

    const section = await prisma.sections.findUnique({
      where: { id: parsedSectionId },
      select: {
        facultyId: true,
        courseOffering: {
          select: {
            semester: { select: { startDate: true, endDate: true, name: true } },
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    // A class cannot be held outside its own semester. Without this a typo in
    // the year silently creates a session that no attendance view will ever
    // show, and the student's denominator is wrong with no visible cause.
    const { startDate, endDate, name } = section.courseOffering.semester;
    if (sessionDate < toDateOnly(startDate.toISOString())! ||
        sessionDate > toDateOnly(endDate.toISOString())!) {
      return NextResponse.json(
        {
          success: false,
          error: `That date falls outside the ${name} semester.`,
        },
        { status: 400 }
      );
    }

    // The session is attributed to the section's assigned faculty. An admin
    // marking on their behalf does not rewrite who teaches the section.
    const markedBy = section.facultyId;
    if (!markedBy) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This section has no faculty assigned. Assign one before taking attendance.',
        },
        { status: 400 }
      );
    }

    const parsedSlot = slot === undefined ? 1 : parseInt(String(slot), 10);
    if (Number.isNaN(parsedSlot) || parsedSlot < 1) {
      return NextResponse.json(
        { success: false, error: 'slot must be a positive number' },
        { status: 400 }
      );
    }

    const existing = await prisma.attendance_sessions.findUnique({
      where: {
        sectionId_date_slot: {
          sectionId: parsedSectionId,
          date: sessionDate,
          slot: parsedSlot,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            'A session already exists for this section, date and slot. Open it to continue marking.',
          code: 'SESSION_EXISTS',
          sessionId: existing.id,
        },
        { status: 409 }
      );
    }

    const session = await prisma.attendance_sessions.create({
      data: {
        sectionId: parsedSectionId,
        date: sessionDate,
        slot: parsedSlot,
        topic: topic ?? null,
        durationMinutes:
          durationMinutes === undefined
            ? 60
            : parseInt(String(durationMinutes), 10) || 60,
        markedBy,
      },
    });

    await writeAuditLog(request, auth.user, 'attendance.session_create', {
      sessionId: session.id,
      sectionId: parsedSectionId,
      date: sessionDate.toISOString(),
      slot: parsedSlot,
    });

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Error creating attendance session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create attendance session' },
      { status: 500 }
    );
  }
}
