import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { session_status } from '@prisma/client';
import { isValid } from 'date-fns';

const updateSessionSchema = z.object({
  date: z.string().min(1, 'Date is required').optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  topic: z.string().min(1, 'Topic is required').optional(),
  remarks: z.string().optional(),
  status: z.nativeEnum(session_status).optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const sessionId = Number(resolvedParams.id);
    
    if (!sessionId || isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    const session = await prisma.sessions.findUnique({
      where: { id: sessionId },
      include: {
        section: {
          include: {
            courseOffering: {
              include: {
                course: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
                semester: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            faculty: {
              select: {
                id: true,
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                  },
                },
              },
            },
            batch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const sessionId = Number(resolvedParams.id);
    
    if (!sessionId || isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }

    // Get existing session
    const existingSession = await prisma.sessions.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateSessionSchema.parse(body);

    const updateData: any = {};

    if (validatedData.date) {
      const sessionDate = new Date(validatedData.date);
      if (!isValid(sessionDate)) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        );
      }
      updateData.date = sessionDate;
    }

    if (validatedData.startTime) {
      const dateStr = validatedData.date || existingSession.date.toISOString().split('T')[0];
      const startTime = new Date(`${dateStr}T${validatedData.startTime}`);
      if (!isValid(startTime)) {
        return NextResponse.json(
          { success: false, error: 'Invalid start time format' },
          { status: 400 }
        );
      }
      updateData.startTime = startTime;
    }

    if (validatedData.endTime) {
      const dateStr = validatedData.date || existingSession.date.toISOString().split('T')[0];
      const endTime = new Date(`${dateStr}T${validatedData.endTime}`);
      if (!isValid(endTime)) {
        return NextResponse.json(
          { success: false, error: 'Invalid end time format' },
          { status: 400 }
        );
      }
      updateData.endTime = endTime;
    }

    if (validatedData.topic !== undefined) {
      updateData.topic = validatedData.topic;
    }

    if (validatedData.remarks !== undefined) {
      updateData.remarks = validatedData.remarks;
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }

    const updated = await prisma.sessions.update({
      where: { id: sessionId },
      data: updateData,
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
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const sessionId = Number(resolvedParams.id);
    
    if (!sessionId || isNaN(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
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
