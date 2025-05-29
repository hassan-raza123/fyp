import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const section = await prisma.sections.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        courseOffering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            semester: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        faculty: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch section' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { name, maxStudents, status, courseOfferingId, facultyId, batchId } =
      body;

    // Validate required fields
    if (!name || !maxStudents || !status || !courseOfferingId || !batchId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Check if section exists
    const existingSection = await prisma.sections.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    // Check if new maxStudents is less than current students
    if (maxStudents < existingSection._count.studentsections) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Maximum students cannot be less than current enrolled students',
        },
        { status: 400 }
      );
    }

    // Check if course offering exists
    const courseOffering = await prisma.courseofferings.findUnique({
      where: { id: courseOfferingId },
    });

    if (!courseOffering) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found' },
        { status: 404 }
      );
    }

    // Check if faculty exists if provided
    if (facultyId) {
      const faculty = await prisma.faculties.findUnique({
        where: { id: facultyId },
      });

      if (!faculty) {
        return NextResponse.json(
          { success: false, error: 'Faculty not found' },
          { status: 404 }
        );
      }
    }

    // Check if batch exists
    const batch = await prisma.batches.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Update section
    const updatedSection = await prisma.sections.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        maxStudents,
        status,
        courseOfferingId,
        facultyId,
        batchId,
      },
      include: {
        courseOffering: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            semester: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        faculty: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSection,
    });
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if section exists and get current student count
    const section = await prisma.sections.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    // Check if section has enrolled students
    if (section._count.studentsections > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete section with enrolled students',
        },
        { status: 400 }
      );
    }

    // Delete the section
    await prisma.sections.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
