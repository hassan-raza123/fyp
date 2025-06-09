import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = await Promise.resolve(parseInt(params.id));

    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const clos = await prisma.clos.findMany({
      where: {
        courseId: courseId,
        status: 'active',
      },
      orderBy: {
        code: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: clos });
  } catch (error) {
    console.error('Error fetching CLOs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLOs' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = await Promise.resolve(parseInt(params.id));
    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course id' },
        { status: 400 }
      );
    }

    const { code, description, bloomLevel, status } = await req.json();

    if (!code || !description) {
      return NextResponse.json(
        { success: false, error: 'Code and description are required' },
        { status: 400 }
      );
    }

    const clo = await prisma.clos.create({
      data: { code, description, bloomLevel, status, courseId },
    });

    return NextResponse.json({ success: true, data: clo });
  } catch (error) {
    console.error('Error creating CLO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create CLO' },
      { status: 500 }
    );
  }
}
