import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorize, canAccessSection, forbidden } from '@/lib/authz';

export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params;
  try {
    const auth = await authorize(request, [
      'super_admin',
      'admin',
      'faculty',
      'student',
    ]);
    if (!auth.ok) return auth.response;

    const sectionId = parseInt(params.id);
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }

    if (!(await canAccessSection(request, auth.user, sectionId))) {
      return forbidden('You do not have access to this section').response;
    }

    const section = await prisma.sections.findUnique({
      where: { id: sectionId },
      select: { courseOfferingId: true },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const assessments = await prisma.assessments.findMany({
      where: {
        courseOfferingId: section.courseOfferingId,
        status: 'active',
      },
      include: {
        assessmentItems: {
          orderBy: {
            questionNo: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching section assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section assessments' },
      { status: 500 }
    );
  }
}
