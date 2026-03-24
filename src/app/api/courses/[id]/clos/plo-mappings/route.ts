import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const courseId = await Promise.resolve(parseInt(params.id));

    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid course ID' },
        { status: 400 }
      );
    }

    // Get all CLOs for this course
    const clos = await prisma.clos.findMany({
      where: {
        courseId: courseId,
        status: 'active',
      },
      select: {
        id: true,
        code: true,
        description: true,
      },
    });

    const cloIds = clos.map((c) => c.id);

    // Get CLO-PLO mappings for these CLOs
    const mappings = await prisma.cloplomappings.findMany({
      where: {
        cloId: {
          in: cloIds,
        },
      },
      include: {
        clo: {
          select: {
            id: true,
            code: true,
            description: true,
          },
        },
        plo: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          select: {
            id: true,
            code: true,
            description: true,
            program: true,
          },
        },
      },
      orderBy: {
        weight: 'desc',
      },
    });

    // Group mappings by CLO
    const cloMappingMap = new Map<
      number,
      Array<{
        ploId: number;
        ploCode: string;
        ploDescription: string;
        programName: string;
        programCode: string;
        weight: number;
      }>
    >();

    clos.forEach((clo) => {
      cloMappingMap.set(clo.id, []);
    });

    mappings.forEach((mapping) => {
      const existing = cloMappingMap.get(mapping.cloId);
      if (existing) {
        existing.push({
          ploId: mapping.ploId,
          ploCode: mapping.plo.code,
          ploDescription: mapping.plo.description,
          programName: mapping.plo.program.name,
          programCode: mapping.plo.program.code,
          weight: mapping.weight,
        });
      }
    });

    // Format response
    const result = clos.map((clo) => ({
      clo: {
        id: clo.id,
        code: clo.code,
        description: clo.description,
      },
      ploMappings: cloMappingMap.get(clo.id) || [],
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching CLO-PLO mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CLO-PLO mappings' },
      { status: 500 }
    );
  }
}

