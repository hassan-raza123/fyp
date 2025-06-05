import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { session_status } from '@prisma/client';
import { isValid } from 'date-fns';

const createSessionSchema = z.object({
  sectionId: z.number(),
  date: z.string().min(1, 'Date is required'), // Expected format: YYYY-MM-DD
  startTime: z.string().optional(), // Expected format: HH:mm
  endTime: z.string().optional(), // Expected format: HH:mm
  topic: z.string().min(1, 'Topic is required'),
  remarks: z.string().optional(),
  status: z.nativeEnum(session_status).default(session_status.scheduled),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    const sessionDate = new Date(validatedData.date);
    if (!isValid(sessionDate)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Combine date and time strings and convert to Date objects
    const startTime = validatedData.startTime
      ? new Date(`${validatedData.date}T${validatedData.startTime}`)
      : undefined;
    const endTime = validatedData.endTime
      ? new Date(`${validatedData.date}T${validatedData.endTime}`)
      : undefined;

    // Validate time objects if provided
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

    // Only include startTime and endTime if they are provided
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
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }

    const sessions = await prisma.sessions.findMany({
      where: {
        sectionId: Number(sectionId),
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// You might want to add PUT/PATCH for updating and DELETE for deleting sessions later.
