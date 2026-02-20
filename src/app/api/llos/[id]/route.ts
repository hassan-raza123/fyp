import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { getCurrentDepartmentId } from '@/lib/auth';

const updateLLOSchema = z.object({
  code: z.string().min(1, 'LLO code is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  courseId: z.number().min(1, 'Course is required').optional(),
  bloomLevel: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
});

// GET /api/llos/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success } = await requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const lloId = parseInt(id);

    if (isNaN(lloId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid LLO ID' },
        { status: 400 }
      );
    }

    const llo = await prisma.llos.findUnique({
      where: { id: lloId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!llo) {
      return NextResponse.json(
        { success: false, error: 'LLO not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: llo });
  } catch (error) {
    console.error('Error fetching LLO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch LLO' },
      { status: 500 }
    );
  }
}

// PUT /api/llos/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const lloId = parseInt(id);

    if (isNaN(lloId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid LLO ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateLLOSchema.parse(body);

    // Get current department ID from request
    const departmentId = await getCurrentDepartmentId(request);
    if (!departmentId) {
      return NextResponse.json(
        { success: false, error: 'Department not configured' },
        { status: 400 }
      );
    }

    // Check if LLO exists
    const existingLLO = await prisma.llos.findUnique({
      where: { id: lloId },
      include: {
        course: true,
      },
    });

    if (!existingLLO) {
      return NextResponse.json(
        { success: false, error: 'LLO not found' },
        { status: 404 }
      );
    }

    // If courseId is being updated, validate it
    if (validatedData.courseId) {
      const course = await prisma.courses.findUnique({
        where: { id: validatedData.courseId },
      });

      if (!course) {
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        );
      }

      if (course.departmentId !== departmentId) {
        return NextResponse.json(
          { success: false, error: 'Course does not belong to current department' },
          { status: 403 }
        );
      }

      // Check if LLO code already exists for the new course (excluding current LLO)
      if (validatedData.code) {
        const duplicateLLO = await prisma.llos.findFirst({
          where: {
            code: validatedData.code,
            courseId: validatedData.courseId,
            id: { not: lloId },
          },
        });

        if (duplicateLLO) {
          return NextResponse.json(
            { success: false, error: 'LLO code already exists for this course' },
            { status: 400 }
          );
        }
      }
    } else if (validatedData.code) {
      // Check if code already exists for the same course
      const duplicateLLO = await prisma.llos.findFirst({
        where: {
          code: validatedData.code,
          courseId: existingLLO.courseId,
          id: { not: lloId },
        },
      });

      if (duplicateLLO) {
        return NextResponse.json(
          { success: false, error: 'LLO code already exists for this course' },
          { status: 400 }
        );
      }
    }

    // Update LLO
    const updateData: any = {};
    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.courseId !== undefined) updateData.courseId = validatedData.courseId;
    if (validatedData.bloomLevel !== undefined) updateData.bloomLevel = validatedData.bloomLevel || null;
    if (validatedData.status !== undefined) updateData.status = validatedData.status as any;

    const updatedLLO = await prisma.llos.update({
      where: { id: lloId },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedLLO });
  } catch (error) {
    console.error('Error updating LLO:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update LLO' },
      { status: 500 }
    );
  }
}

// DELETE /api/llos/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { success, user } = await requireAuth(request);
    if (!success || user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const lloId = parseInt(id);

    if (isNaN(lloId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid LLO ID' },
        { status: 400 }
      );
    }

    // Check if LLO exists
    const existingLLO = await prisma.llos.findUnique({
      where: { id: lloId },
    });

    if (!existingLLO) {
      return NextResponse.json(
        { success: false, error: 'LLO not found' },
        { status: 404 }
      );
    }

    // Delete LLO (cascade will handle related records)
    await prisma.llos.delete({
      where: { id: lloId },
    });

    return NextResponse.json({
      success: true,
      message: 'LLO deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting LLO:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete LLO' },
      { status: 500 }
    );
  }
}

