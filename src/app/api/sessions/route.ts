import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { session_status } from '@prisma/client';
import { isValid } from 'date-fns';

const createSessionSchema = z.object({
  sectionId: z.number(),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  topic: z.string().min(1, 'Topic is required'),
  remarks: z.string().optional(),
  status: z.nativeEnum(session_status).default(session_status.scheduled),
});

export async function POST(request: NextRequest) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    const sessionDate = new Date(validatedData.date);
    if (!isValid(sessionDate)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const startTime = validatedData.startTime
      ? new Date(`${validatedData.date}T${validatedData.startTime}`)
      : undefined;
    const endTime = validatedData.endTime
      ? new Date(`${validatedData.date}T${validatedData.endTime}`)
      : undefined;

    if (startTime && !isValid(startTime)) {
      return NextResponse.json(
        { success: false, error: 'Invalid start time format' },
        { status: 400 }
      );
    }
    if (endTime && !isValid(endTime)) {
      return NextResponse.json(
        { success: false, error: 'Invalid end time format' },
        { status: 400 }
      );
    }

    const sessionData: any = {
      sectionId: validatedData.sectionId,
      date: sessionDate,
      topic: validatedData.topic,
      remarks: validatedData.remarks,
      status: validatedData.status,
    };
    if (startTime) sessionData.startTime = startTime;
    if (endTime) sessionData.endTime = endTime;

    const session = await prisma.sessions.create({
      data: sessionData,
    });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    const search = searchParams.get('search');
    const statusFilter = searchParams.get('statusFilter');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    
    // If user is faculty, filter by their sections
    if (user?.role === 'faculty') {
      const { getFacultyIdFromRequest } = await import('@/lib/auth');
      const facultyId = await getFacultyIdFromRequest(request);
      if (facultyId) {
        where.section = {
          facultyId: facultyId,
        };
      }
    }

    if (sectionId) {
      where.sectionId = Number(sectionId);
    }

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    if (search) {
      where.OR = [
        { topic: { contains: search, mode: 'insensitive' } },
        { section: { name: { contains: search, mode: 'insensitive' } } },
        { section: { courseOffering: { course: { code: { contains: search, mode: 'insensitive' } } } } },
        { section: { courseOffering: { course: { name: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      prisma.sessions.findMany({
        where,
        include: {
          section: {
            include: {
              courseOffering: {
                include: {
                  course: {
                    select: {
                      code: true,
                      name: true,
                    },
                  },
                  semester: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.sessions.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
