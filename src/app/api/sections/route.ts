import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createSectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  courseOfferingId: z.number(),
  facultyId: z.number().nullable(),
  batchId: z.string(),
  maxStudents: z.number().min(1, 'Max students must be at least 1'),
});

export async function GET() {
  try {
    const sections = await prisma.sections.findMany({
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
        batch: true,
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    // Transform the data to include currentStudents count
    const transformedSections = sections.map((section) => ({
      ...section,
      currentStudents: section._count.studentsections,
    }));

    return NextResponse.json({
      success: true,
      data: transformedSections,
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createSectionSchema.parse(body);

    // Check if course offering exists
    const courseOffering = await prisma.courseofferings.findUnique({
      where: { id: validatedData.courseOfferingId },
    });

    if (!courseOffering) {
      return NextResponse.json(
        { success: false, error: 'Course offering not found' },
        { status: 404 }
      );
    }

    // Check if batch exists
    const batch = await prisma.batches.findUnique({
      where: { id: validatedData.batchId },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if faculty exists if provided
    if (validatedData.facultyId) {
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

    // Create section
    const section = await prisma.sections.create({
      data: {
        name: validatedData.name,
        courseOfferingId: validatedData.courseOfferingId,
        facultyId: validatedData.facultyId,
        batchId: validatedData.batchId,
        maxStudents: validatedData.maxStudents,
        status: 'active',
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
        batch: true,
        _count: {
          select: {
            studentsections: true,
          },
        },
      },
    });

    // Transform the data to include currentStudents count
    const transformedSection = {
      ...section,
      currentStudents: section._count.studentsections,
    };

    return NextResponse.json({
      success: true,
      data: transformedSection,
    });
  } catch (error) {
    console.error('Error creating section:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create section' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Section ID is required' },
        { status: 400 }
      );
    }

    // Check if section exists
    const section = await prisma.sections.findUnique({
      where: { id: parseInt(id) },
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

    // Delete section
    await prisma.sections.delete({
      where: { id: parseInt(id) },
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
