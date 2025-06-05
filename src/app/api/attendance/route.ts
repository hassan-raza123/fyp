import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const attendanceStatusEnum = ['present', 'absent', 'late'] as const;

const markAttendanceSchema = z.object({
  sessionId: z.number(),
  records: z.array(
    z.object({
      studentSectionId: z.number(),
      status: z.enum(attendanceStatusEnum),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = markAttendanceSchema.parse(body);

    // Remove previous attendance for this session
    await prisma.attendances.deleteMany({
      where: { sessionId: validated.sessionId },
    });

    // Create new attendance records (use markedBy: 1 as placeholder)
    const created = await prisma.attendances.createMany({
      data: validated.records.map((rec) => ({
        sessionId: validated.sessionId,
        studentSectionId: rec.studentSectionId,
        status: rec.status,
        markedBy: 1,
      })),
    });
    return NextResponse.json({ success: true, count: created.count });
  } catch (error) {
    console.error('Error marking attendance:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to mark attendance' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const sectionId = searchParams.get('sectionId');
    const report = searchParams.get('report');

    if (sessionId) {
      // Get attendance for a session
      const records = await prisma.attendances.findMany({
        where: { sessionId: Number(sessionId) },
        include: {
          studentsection: {
            include: {
              student: { include: { user: true } },
            },
          },
        },
      });
      return NextResponse.json({ success: true, data: records });
    }

    if (report && sectionId) {
      // Attendance report for a section
      // For each student in the section, count present/absent/late
      const students = await prisma.studentsections.findMany({
        where: { sectionId: Number(sectionId) },
        include: { student: { include: { user: true } } },
      });
      const sessions = await prisma.sessions.findMany({
        where: { sectionId: Number(sectionId) },
      });
      const attendance = await prisma.attendances.findMany({
        where: { sessionId: { in: sessions.map((s) => s.id) } },
      });
      const reportData = students.map((ss) => {
        const studentAttendance = attendance.filter(
          (a) => a.studentSectionId === ss.id
        );
        const present = studentAttendance.filter(
          (a) => a.status === 'present'
        ).length;
        const absent = studentAttendance.filter(
          (a) => a.status === 'absent'
        ).length;
        const late = studentAttendance.filter(
          (a) => a.status === 'late'
        ).length;
        return {
          studentSectionId: ss.id,
          studentId: ss.studentId,
          name: ss.student.user.first_name + ' ' + ss.student.user.last_name,
          present,
          absent,
          late,
          total: sessions.length,
        };
      });
      return NextResponse.json({ success: true, data: reportData });
    }

    return NextResponse.json(
      { success: false, error: 'Missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
      { status: 500 }
    );
  }
}
