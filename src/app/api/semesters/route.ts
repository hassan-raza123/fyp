import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma, semester_status } from '@prisma/client';
import { requireRole, requireAuth } from '@/lib/api-utils';
import { z } from 'zod';

const createSemesterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startDate: z.string(),
  endDate: z.string(),
  status: z
    .enum(['active', 'inactive', 'completed'] as const)
    .default('active'),
});

const updateSemesterSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'completed'] as const).optional(),
  description: z.string().optional(),
});

// Add this function before the route handlers
async function updateSemesterStatus(semesterId: number) {
  const semester = await prisma.semesters.findUnique({
    where: { id: semesterId },
  });

  if (!semester) return;

  const now = new Date();
  const endDate = new Date(semester.endDate);
  const startDate = new Date(semester.startDate);

  let newStatus = semester.status;

  if (now > endDate) {
    newStatus = semester_status.completed;
  } else if (now >= startDate && now <= endDate) {
    newStatus = semester_status.active;
  } else if (now < startDate) {
    newStatus = semester_status.inactive;
  }

  if (newStatus !== semester.status) {
    await prisma.semesters.update({
      where: { id: semesterId },
      data: { status: newStatus },
    });
  }
}

// Add this function for status transition validation
function validateStatusTransition(
  oldStatus: semester_status,
  newStatus: semester_status
) {
  const validTransitions: Record<semester_status, semester_status[]> = {
    [semester_status.inactive]: [semester_status.active],
    [semester_status.active]: [
      semester_status.completed,
      semester_status.inactive,
    ],
    [semester_status.completed]: [],
  };

  return validTransitions[oldStatus].includes(newStatus);
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (id) {
      // Fetch single semester by ID
      const semester = await prisma.semesters.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      });

      if (!semester) {
        return NextResponse.json(
          { success: false, error: 'Semester not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: semester });
    }

    // Fetch multiple semesters with pagination and filtering
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [{ name: { contains: search } }];
    }

    const [semesters, total] = await Promise.all([
      prisma.semesters.findMany({
        where,
        include: {
          _count: {
            select: {
              courseOfferings: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          startDate: 'desc',
        },
      }),
      prisma.semesters.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: semesters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch semesters',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, startDate, endDate, status = 'active' } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Semester name is required' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Create semester
    const semester = await prisma.semesters.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status as semester_status,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Semester created successfully',
      data: semester,
    });
  } catch (error) {
    console.error('Error creating semester:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Semester ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, startDate, endDate, status } = body;

    // Check if semester exists
    const existingSemester = await prisma.semesters.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingSemester) {
      return NextResponse.json(
        { success: false, error: 'Semester not found' },
        { status: 404 }
      );
    }

    // Update semester
    const updatedSemester = await prisma.semesters.update({
      where: { id: parseInt(id) },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status as semester_status,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Semester updated successfully',
      data: updatedSemester,
    });
  } catch (error) {
    console.error('Error updating semester:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Semester ID is required' },
        { status: 400 }
      );
    }

    // Check if semester exists
    const existingSemester = await prisma.semesters.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            courseOfferings: true,
          },
        },
      },
    });

    if (!existingSemester) {
      return NextResponse.json(
        { success: false, error: 'Semester not found' },
        { status: 404 }
      );
    }

    // Check if semester has any course offerings
    if (existingSemester._count.courseOfferings > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete semester with existing course offerings',
        },
        { status: 400 }
      );
    }

    // Delete semester
    await prisma.semesters.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Semester deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting semester:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Add a new endpoint to update all semester statuses
export async function PATCH(request: NextRequest) {
  try {
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    const semesters = await prisma.semesters.findMany();
    const updates = await Promise.all(
      semesters.map((semester) => updateSemesterStatus(semester.id))
    );

    return NextResponse.json({
      success: true,
      message: 'Semester statuses updated successfully',
      updatedCount: updates.length,
    });
  } catch (error) {
    console.error('Error updating semester statuses:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
