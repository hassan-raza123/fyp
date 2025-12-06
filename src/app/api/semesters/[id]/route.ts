import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { semester_status } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

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
    
    if (!resolvedParams?.id) {
      return NextResponse.json(
        { success: false, error: 'Semester ID is required' },
        { status: 400 }
      );
    }

    const semesterId = parseInt(resolvedParams.id);
    if (isNaN(semesterId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid semester ID' },
        { status: 400 }
      );
    }

    const semester = await prisma.semesters.findUnique({
      where: { id: semesterId },
      include: {
        _count: {
          select: {
            courseOfferings: true,
          },
        },
      },
    });

    if (!semester) {
      return NextResponse.json(
        {
          success: false,
          error: 'Semester not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: semester.id,
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate,
        status: semester.status,
        stats: {
          courseOfferings: semester._count.courseOfferings,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching semester:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch semester',
      },
      { status: 500 }
    );
  }
}

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

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    
    if (!resolvedParams?.id) {
      return NextResponse.json(
        { success: false, error: 'Semester ID is required' },
        { status: 400 }
      );
    }

    const semesterId = parseInt(resolvedParams.id);
    if (isNaN(semesterId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid semester ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, startDate, endDate, status } = body;

    // Check if semester exists
    const existingSemester = await prisma.semesters.findUnique({
      where: { id: semesterId },
    });

    if (!existingSemester) {
      return NextResponse.json(
        {
          success: false,
          error: 'Semester not found',
        },
        { status: 404 }
      );
    }

    // Check if new name is unique
    if (name && name !== existingSemester.name) {
      const nameExists = await prisma.semesters.findUnique({
        where: { name },
      });

      if (nameExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'Semester name already exists',
          },
          { status: 400 }
        );
      }
    }

    // Validate dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return NextResponse.json(
          {
            success: false,
            error: 'End date must be after start date',
          },
          { status: 400 }
        );
      }
    }

    const semester = await prisma.semesters.update({
      where: { id: semesterId },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status as semester_status,
      },
      include: {
        _count: {
          select: {
            courseOfferings: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: semester.id,
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate,
        status: semester.status,
        stats: {
          courseOfferings: semester._count.courseOfferings,
        },
      },
    });
  } catch (error) {
    console.error('Error updating semester:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update semester',
      },
      { status: 500 }
    );
  }
}

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

    // Handle both sync and async params
    const resolvedParams = params instanceof Promise ? await params : params;
    
    if (!resolvedParams?.id) {
      return NextResponse.json(
        { success: false, error: 'Semester ID is required' },
        { status: 400 }
      );
    }

    const semesterId = parseInt(resolvedParams.id);
    if (isNaN(semesterId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid semester ID' },
        { status: 400 }
      );
    }

    // Check if semester exists
    const semester = await prisma.semesters.findUnique({
      where: { id: semesterId },
      include: {
        _count: {
          select: {
            courseOfferings: true,
          },
        },
      },
    });

    if (!semester) {
      return NextResponse.json(
        {
          success: false,
          error: 'Semester not found',
        },
        { status: 404 }
      );
    }

    // Check for dependencies
    if (semester._count.courseOfferings > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete semester with existing course offerings',
          details: {
            courseOfferings: semester._count.courseOfferings,
          },
        },
        { status: 400 }
      );
    }

    // Delete semester
    await prisma.semesters.delete({
      where: { id: semesterId },
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
        error:
          error instanceof Error ? error.message : 'Failed to delete semester',
      },
      { status: 500 }
    );
  }
}

