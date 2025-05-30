import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const courseId = Number(params.id);
  if (isNaN(courseId))
    return NextResponse.json(
      { success: false, error: 'Invalid course id' },
      { status: 400 }
    );

  const clos = await prisma.clos.findMany({
    where: { courseId },
    include: { course: { select: { id: true, name: true, code: true } } },
    orderBy: { code: 'asc' },
  });

  return NextResponse.json({ success: true, data: clos });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const courseId = Number(params.id);
  if (isNaN(courseId))
    return NextResponse.json(
      { success: false, error: 'Invalid course id' },
      { status: 400 }
    );

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
}
