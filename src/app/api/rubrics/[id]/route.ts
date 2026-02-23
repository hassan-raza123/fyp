import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/rubrics/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rubric = await prisma.rubrics.findUnique({
      where: { id: Number(params.id) },
      include: {
        clo: { select: { id: true, code: true, description: true } },
        llo: { select: { id: true, code: true, description: true } },
        criteria: { orderBy: { id: 'asc' } },
      },
    });

    if (!rubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
    }

    return NextResponse.json(rubric);
  } catch (error) {
    console.error('Error fetching rubric:', error);
    return NextResponse.json({ error: 'Failed to fetch rubric' }, { status: 500 });
  }
}

// PUT /api/rubrics/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'faculty'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, criteria } = body;

    const rubric = await prisma.rubrics.update({
      where: { id: Number(params.id) },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(criteria
          ? {
              criteria: {
                deleteMany: {},
                create: criteria.map(
                  (c: {
                    description: string;
                    excellent: string;
                    good: string;
                    satisfactory: string;
                    unsatisfactory: string;
                    weight?: number;
                  }) => ({
                    description: c.description,
                    excellent: c.excellent,
                    good: c.good,
                    satisfactory: c.satisfactory,
                    unsatisfactory: c.unsatisfactory,
                    weight: c.weight ?? 1,
                  })
                ),
              },
            }
          : {}),
      },
      include: {
        clo: { select: { id: true, code: true } },
        llo: { select: { id: true, code: true } },
        criteria: true,
      },
    });

    return NextResponse.json(rubric);
  } catch (error) {
    console.error('Error updating rubric:', error);
    return NextResponse.json({ error: 'Failed to update rubric' }, { status: 500 });
  }
}

// DELETE /api/rubrics/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'faculty'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.rubrics.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ success: true, message: 'Rubric deleted' });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json({ error: 'Failed to delete rubric' }, { status: 500 });
  }
}
