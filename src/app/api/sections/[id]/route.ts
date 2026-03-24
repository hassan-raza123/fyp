import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';

const updateSectionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  courseOfferingId: z.number().optional(),
  facultyId: z.number().nullable().optional(),
  batchId: z.string().optional(),
  maxStudents: z.number().min(1, 'Max students must be at least 1').optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'deleted']).optional(),
});

// GET /api/sections/[id] - Get section details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const sectionId = parseInt(resolvedParams.id);

    if (!resolvedParams?.id || isNaN(sectionId)) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required or invalid' },
        { status: 400 }
      );
    }

    const section = await prisma.sections.findUnique({
      where: { id: sectionId },
      include: {
        courseOffering: {
          include: {
            course: true,
            semester: true,
          },
        },
        faculty: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        batch: true,
        studentsections: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                  },
                },
              },
            },
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

// PUT /api/sections/[id] - Update section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['admin', 'super_admin'].includes(user?.role ?? '')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const sectionId = parseInt(resolvedParams.id);

    if (!resolvedParams?.id || isNaN(sectionId)) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required or invalid' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = updateSectionSchema.parse(body);

    // Check if section exists
    const existingSection = await prisma.sections.findUnique({
      where: { id: sectionId },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    // Check if course offering exists (if being updated)
    if (validatedData.courseOfferingId) {
      const courseOffering = await prisma.courseofferings.findUnique({
        where: { id: validatedData.courseOfferingId },
      });
      if (!courseOffering) {
        return NextResponse.json(
          { success: false, error: 'Course offering not found' },
          { status: 404 }
        );
      }
    }

    // Check if batch exists (if being updated)
    if (validatedData.batchId) {
      const batch = await prisma.batches.findUnique({
        where: { id: validatedData.batchId },
      });
      if (!batch) {
        return NextResponse.json(
          { success: false, error: 'Batch not found' },
          { status: 404 }
        );
      }
    }

    // Check if faculty exists (if being updated)
    if (validatedData.facultyId !== undefined && validatedData.facultyId !== null) {
      const faculty = await prisma.faculties.findUnique({
        where: { id: validatedData.facultyId },
      });
      if (!faculty) {
        return NextResponse.json(
          { success: false, error: 'Faculty not found' },
          { status: 404 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.courseOfferingId !== undefined) updateData.courseOfferingId = validatedData.courseOfferingId;
    if (validatedData.facultyId !== undefined) updateData.facultyId = validatedData.facultyId;
    if (validatedData.batchId !== undefined) updateData.batchId = validatedData.batchId;
    if (validatedData.maxStudents !== undefined) updateData.maxStudents = validatedData.maxStudents;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;

    // Update section
    const updatedSection = await prisma.sections.update({
      where: { id: sectionId },
      data: updateData,
      include: {
        courseOffering: {
          include: {
            course: true,
            semester: true,
          },
        },
        faculty: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        batch: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSection,
    });
  } catch (error) {
    console.error('Error updating section:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id] - Delete section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['admin', 'super_admin'].includes(user?.role ?? '')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const sectionId = parseInt(resolvedParams.id);

    if (!resolvedParams?.id || isNaN(sectionId)) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required or invalid' },
        { status: 400 }
      );
    }

    // Check if section exists
    const existingSection = await prisma.sections.findUnique({
      where: { id: sectionId },
    });

    if (!existingSection) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    // Delete section
    await prisma.sections.delete({
      where: { id: sectionId },
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
