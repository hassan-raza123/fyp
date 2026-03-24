import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/rubrics?courseOfferingId=1  OR  ?cloId=1
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseOfferingId = searchParams.get('courseOfferingId');
    const cloId = searchParams.get('cloId');
    const lloId = searchParams.get('lloId');

    const rubrics = await prisma.rubrics.findMany({
      where: {
        ...(courseOfferingId ? { courseOfferingId: Number(courseOfferingId) } : {}),
        ...(cloId ? { cloId: Number(cloId) } : {}),
        ...(lloId ? { lloId: Number(lloId) } : {}),
      },
      include: {
        clo: { select: { id: true, code: true, description: true } },
        llo: { select: { id: true, code: true, description: true } },
        criteria: { orderBy: { id: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rubrics);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return NextResponse.json({ error: 'Failed to fetch rubrics' }, { status: 500 });
  }
}

// POST /api/rubrics
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'faculty'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, courseOfferingId, cloId, lloId, criteria } = body;

    if (!title || !courseOfferingId) {
      return NextResponse.json(
        { error: 'title and courseOfferingId are required' },
        { status: 400 }
      );
    }
    if (!cloId && !lloId) {
      return NextResponse.json(
        { error: 'A rubric must be linked to a CLO or LLO' },
        { status: 400 }
      );
    }

    const rubric = await prisma.rubrics.create({
      data: {
        title: title.trim(),
        courseOfferingId: Number(courseOfferingId),
        cloId: cloId ? Number(cloId) : null,
        lloId: lloId ? Number(lloId) : null,
        criteria: {
          create: (criteria ?? []).map(
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
      },
      include: {
        clo: { select: { id: true, code: true } },
        llo: { select: { id: true, code: true } },
        criteria: true,
      },
    });

    return NextResponse.json(rubric, { status: 201 });
  } catch (error) {
    console.error('Error creating rubric:', error);
    return NextResponse.json({ error: 'Failed to create rubric' }, { status: 500 });
  }
}
