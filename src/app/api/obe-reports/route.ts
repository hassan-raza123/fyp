import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { obe_report_type, report_status } from '@prisma/client';
import { z } from 'zod';

const createReportSchema = z.object({
  reportType: z.nativeEnum(obe_report_type),
  programId: z.number().optional(),
  semesterId: z.number().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const semesterId = searchParams.get('semesterId');
    const reportType = searchParams.get('reportType');
    const status = searchParams.get('status');

    const where: any = {};
    if (programId) where.programId = parseInt(programId);
    if (semesterId) where.semesterId = parseInt(semesterId);
    if (reportType) where.reportType = reportType;
    if (status) where.status = status;

    const reports = await prisma.obereports.findMany({
      where,
      include: {
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
        generator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching OBE reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    // Validate program and semester if provided
    if (validatedData.programId) {
      const program = await prisma.programs.findUnique({
        where: { id: validatedData.programId },
      });
      if (!program) {
        return NextResponse.json(
          { success: false, error: 'Program not found' },
          { status: 404 }
        );
      }
    }

    if (validatedData.semesterId) {
      const semester = await prisma.semesters.findUnique({
        where: { id: validatedData.semesterId },
      });
      if (!semester) {
        return NextResponse.json(
          { success: false, error: 'Semester not found' },
          { status: 404 }
        );
      }
    }

    const report = await prisma.obereports.create({
      data: {
        reportType: validatedData.reportType,
        programId: validatedData.programId,
        semesterId: validatedData.semesterId,
        title: validatedData.title,
        description: validatedData.description,
        generatedBy: user.userId,
        status: report_status.generated,
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
          },
        },
        generator: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // Send notification to the user who generated the report
    const { notifyReportGenerated } = await import('@/lib/notification-utils');
    // Get faculty ID if user is a faculty member
    const faculty = await prisma.faculties.findFirst({
      where: { userId: user.userId },
    });
    if (faculty) {
      await notifyReportGenerated(validatedData.reportType, faculty.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Report generated successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error creating OBE report:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
