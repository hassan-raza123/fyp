import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStudentIdFromRequest } from '@/lib/auth';
import { getStudentAttendance } from '@/lib/attendance';

/**
 * The signed-in student's own attendance.
 *
 * GET /api/student/attendance?semesterId=&sectionId=
 *
 * `sectionId` additionally returns the session-by-session history for that
 * course, so a student can see which specific classes they missed rather than
 * only a percentage they cannot check.
 */
export async function GET(request: NextRequest) {
  try {
    const studentId = await getStudentIdFromRequest(request);
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Student not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const semesterIdParam = searchParams.get('semesterId');
    const sectionIdParam = searchParams.get('sectionId');

    const semesterId = semesterIdParam
      ? parseInt(semesterIdParam, 10)
      : undefined;

    const courses = await getStudentAttendance(
      studentId,
      Number.isNaN(semesterId as number) ? undefined : semesterId
    );

    let history: Array<{
      date: Date;
      slot: number;
      topic: string | null;
      status: string;
      remarks: string | null;
    }> | null = null;

    if (sectionIdParam) {
      const sectionId = parseInt(sectionIdParam, 10);

      // A student may only see a section they are actually enrolled in.
      const enrolled = await prisma.studentsections.findFirst({
        where: { studentId, sectionId, status: 'active' },
        select: { id: true },
      });

      if (!enrolled) {
        return NextResponse.json(
          { success: false, error: 'You are not enrolled in this section' },
          { status: 403 }
        );
      }

      const sessions = await prisma.attendance_sessions.findMany({
        where: { sectionId, status: 'finalized' },
        select: {
          id: true,
          date: true,
          slot: true,
          topic: true,
          records: {
            where: { studentId },
            select: { status: true, remarks: true },
          },
        },
        orderBy: [{ date: 'desc' }, { slot: 'asc' }],
      });

      history = sessions.map((session) => ({
        date: session.date,
        slot: session.slot,
        topic: session.topic,
        // No row on a finalized session means the student was not present
        // when the roll was taken.
        status: session.records[0]?.status ?? 'absent',
        remarks: session.records[0]?.remarks ?? null,
      }));
    }

    const withData = courses.filter((c) => c.tally.hasData);
    const overall =
      withData.length > 0
        ? Math.round(
            (withData.reduce((sum, c) => sum + c.tally.attendancePercent, 0) /
              withData.length) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        courses,
        history,
        overallAttendance: overall,
        coursesAtRisk: courses.filter((c) => c.verdict === 'at_risk').length,
        coursesIneligible: courses.filter((c) => c.verdict === 'ineligible')
          .length,
      },
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}
