import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { getCurrentDepartmentId } from '@/lib/department-utils';

// GET /api/llo-plo-mappings
export async function GET(request: NextRequest) {
  try {
    const { success } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lloId = searchParams.get('lloId');
    const ploId = searchParams.get('ploId');

    // Get current department ID
    const departmentId = await getCurrentDepartmentId();
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not configured' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (lloId) where.lloId = parseInt(lloId);
    if (ploId) where.ploId = parseInt(ploId);

    const mappings = await prisma.lloplomappings.findMany({
      where,
      include: {
        llo: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                departmentId: true,
              },
            },
          },
        },
        plo: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
                code: true,
                departmentId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter by department
    const filteredMappings = mappings.filter(
      (mapping) =>
        mapping.llo.course.departmentId === departmentId &&
        mapping.plo.program.departmentId === departmentId
    );

    return NextResponse.json({ success: true, data: filteredMappings });
  } catch (error) {
    console.error('Error fetching LLO-PLO mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mappings' },
      { status: 500 }
    );
  }
}

// POST /api/llo-plo-mappings
export async function POST(request: NextRequest) {
  try {
    const { success, user } = requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lloId, ploId, weight } = body;

    // Validate required fields
    if (!lloId || !ploId || weight === undefined) {
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

    // Get current department ID
    const departmentId = await getCurrentDepartmentId();
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not configured' },
        { status: 400 }
      );
    }

    // Get LLO with its course
    const llo = await prisma.llos.findUnique({
      where: { id: parseInt(lloId) },
      include: {
        course: true,
      },
    });

    if (!llo) {
      return NextResponse.json(
        { success: false, error: 'LLO not found' },
        { status: 404 }
      );
    }

    if (llo.course.departmentId !== departmentId) {
      return NextResponse.json(
        { success: false, error: 'LLO does not belong to current department' },
        { status: 403 }
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

    if (plo.program.departmentId !== departmentId) {
      return NextResponse.json(
        { success: false, error: 'PLO does not belong to current department' },
        { status: 403 }
      );
    }

    // Check if mapping already exists
    const existingMapping = await prisma.lloplomappings.findUnique({
      where: {
        lloId_ploId: {
          lloId: parseInt(lloId),
          ploId: parseInt(ploId),
        },
      },
    });

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping already exists' },
        { status: 400 }
      );
    }

    // Create mapping
    const mapping = await prisma.lloplomappings.create({
      data: {
        lloId: parseInt(lloId),
        ploId: parseInt(ploId),
        weight: parseFloat(weight),
      },
      include: {
        llo: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
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
        },
      },
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error creating LLO-PLO mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mapping' },
      { status: 500 }
    );
  }
}

