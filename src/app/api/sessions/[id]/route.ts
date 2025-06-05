import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { session_status } from '@prisma/client';
import { isValid } from 'date-fns';

const updateSessionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  topic: z.string().min(1, 'Topic is required'),
  remarks: z.string().optional(),
  status: z.nativeEnum(session_status),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = Number(params.id);
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = updateSessionSchema.parse(body);

    const sessionDate = new Date(validatedData.date);
    if (!isValid(sessionDate)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }
    const startTime = new Date(
      `${validatedData.date}T${validatedData.startTime}`
    );
    const endTime = new Date(`${validatedData.date}T${validatedData.endTime}`);
    if (!isValid(startTime) || !isValid(endTime)) {
      return NextResponse.json(
        { success: false, error: 'Invalid start or end time format' },
        { status: 400 }
      );
    }

    const updated = await prisma.sessions.update({
      where: { id: sessionId },
      data: {
        date: sessionDate,
        startTime,
        endTime,
        topic: validatedData.topic,
        remarks: validatedData.remarks,
        status: validatedData.status,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating session:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = Number(params.id);
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }
    await prisma.sessions.delete({ where: { id: sessionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
