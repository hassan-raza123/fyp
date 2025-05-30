import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cloId = searchParams.get('cloId');
    const ploId = searchParams.get('ploId');

    const where: any = {};
    if (cloId) where.cloId = parseInt(cloId);
    if (ploId) where.ploId = parseInt(ploId);

    const mappings = await prisma.cloplomappings.findMany({
      where,
      include: {
        clo: {
          include: {
            course: {
              include: {
                programs: true,
              },
            },
          },
        },
        plo: {
          include: {
            program: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: mappings });
  } catch (error) {
    console.error('Error fetching CLO-PLO mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mappings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cloId, ploId, weight } = body;

    // Validate required fields
    if (!cloId || !ploId || weight === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate weight
    if (weight < 0 || weight > 1) {
      return NextResponse.json(
        { success: false, error: 'Weight must be between 0 and 1' },
        { status: 400 }
      );
    }

    // Get CLO with its course and programs
    const clo = await prisma.clos.findUnique({
      where: { id: parseInt(cloId) },
      include: {
        course: {
          include: {
            programs: true,
          },
        },
      },
    });

    if (!clo) {
      return NextResponse.json(
        { success: false, error: 'CLO not found' },
        { status: 404 }
      );
    }

    // Get PLO with its program
    const plo = await prisma.plos.findUnique({
      where: { id: parseInt(ploId) },
      include: {
        program: true,
      },
    });

    if (!plo) {
      return NextResponse.json(
        { success: false, error: 'PLO not found' },
        { status: 404 }
      );
    }

    // Check if the course belongs to the same program as the PLO
    const courseProgramIds = clo.course.programs.map((p) => p.id);
    if (!courseProgramIds.includes(plo.program.id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot map CLO to PLO from a different program',
          details: {
            coursePrograms: clo.course.programs.map((p) => ({
              id: p.id,
              name: p.name,
            })),
            ploProgram: { id: plo.program.id, name: plo.program.name },
          },
        },
        { status: 400 }
      );
    }

    // Check if mapping already exists
    const existingMapping = await prisma.cloplomappings.findFirst({
      where: {
        cloId: parseInt(cloId),
        ploId: parseInt(ploId),
      },
    });

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping already exists' },
        { status: 400 }
      );
    }

    // Create mapping
    const mapping = await prisma.cloplomappings.create({
      data: {
        cloId: parseInt(cloId),
        ploId: parseInt(ploId),
        weight: parseFloat(weight),
      },
      include: {
        clo: {
          include: {
            course: true,
          },
        },
        plo: {
          include: {
            program: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error creating CLO-PLO mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mapping' },
      { status: 500 }
    );
  }
}
