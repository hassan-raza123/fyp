import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { transcript_status } from '@prisma/client';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const transcriptId = parseInt(id);

    const transcript = await prisma.transcripts.findUnique({
      where: { id: transcriptId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
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
    });

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'Transcript not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: transcript });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const transcriptId = parseInt(id);
    const body = await request.json();
    const { status, filePath, isOfficial } = body;

    const updateData: any = {};
    if (status) {
      updateData.status = status as transcript_status;
    }
    if (filePath !== undefined) {
      updateData.filePath = filePath;
    }
    if (isOfficial !== undefined) {
      updateData.isOfficial = isOfficial;
    }

    const transcript = await prisma.transcripts.update({
      where: { id: transcriptId },
      data: updateData,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
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

    return NextResponse.json({
      success: true,
      message: 'Transcript updated successfully',
      data: transcript,
    });
  } catch (error) {
    console.error('Error updating transcript:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transcript' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const transcriptId = parseInt(id);

    await prisma.transcripts.delete({
      where: { id: transcriptId },
    });

    return NextResponse.json({
      success: true,
      message: 'Transcript deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting transcript:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete transcript' },
      { status: 500 }
    );
  }
}

