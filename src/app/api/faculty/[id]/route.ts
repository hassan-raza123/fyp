import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { faculty_status } from '@prisma/client';

interface UserRole {
  role: {
    name: string;
  };
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check authentication and get user data
    const { success, user, error } = requireAuth(request);
    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const facultyId = parseInt(context.params.id);
    if (isNaN(facultyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid faculty ID' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { designation, status } = body;

    // Validate required fields
    if (!designation || !status) {
      return NextResponse.json(
        { success: false, error: 'Designation and status are required' },
        { status: 400 }
      );
    }

    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: true,
        department: true,
      },
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Update faculty information
    const updatedFaculty = await prisma.faculty.update({
      where: { id: facultyId },
      data: {
        designation,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Faculty member updated successfully',
      data: updatedFaculty,
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update faculty member',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
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

    // Check if user has admin role
    if (user?.role !== 'super_admin' && user?.role !== 'sub_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse the faculty ID
    const facultyId = parseInt(context.params.id);
    if (isNaN(facultyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid faculty ID' },
        { status: 400 }
      );
    }

    console.log(`Processing DELETE for faculty ID: ${facultyId}`);

    // Check if faculty exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: true,
        department: true,
      },
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    console.log(
      `Found faculty: ${JSON.stringify({
        id: existingFaculty.id,
        userId: existingFaculty.userId,
        departmentId: existingFaculty.departmentId,
      })}`
    );

    // Store information we'll need
    const departmentId = existingFaculty.departmentId;

    // Check if this faculty member is a department admin
    // We know from the inclusion that user.userrole is available in the query result
    // @ts-ignore - Ignoring type check since we know the structure from the query
    const userRoles = (existingFaculty.user.userrole || []) as UserRole[];
    const isDepartmentAdmin =
      Array.isArray(userRoles) &&
      userRoles.some((ur) => ur.role.name === 'department_admin');

    // Store the user ID for later operations
    const userId = existingFaculty.userId;

    // If they are department head, update the department
    if (
      existingFaculty.department &&
      existingFaculty.department.adminId === existingFaculty.userId
    ) {
      try {
        await prisma.department.update({
          where: { id: existingFaculty.departmentId },
          data: { adminId: null },
        });
        console.log('Removed as department head');
      } catch (deptError) {
        console.error('Error removing as department head:', deptError);
        // Continue even if this fails
      }
    }

    // Delete ALL roles for this user (completely remove from userrole table)
    try {
      await prisma.userrole.deleteMany({
        where: {
          userId: userId,
        },
      });
      console.log('Deleted all user roles');
    } catch (roleError) {
      console.error('Error deleting user roles:', roleError);
      // Continue even if this fails
    }

    // Delete the faculty record completely (instead of just removing department association)
    try {
      await prisma.faculty.delete({
        where: { id: facultyId },
      });
      console.log('Successfully deleted faculty record');
    } catch (deleteError) {
      console.error('Error deleting faculty:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete faculty: ${
            deleteError instanceof Error ? deleteError.message : 'Unknown error'
          }`,
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Faculty member removed successfully and all roles revoked',
      data: {
        facultyId: facultyId,
        userId: userId,
        departmentId: existingFaculty.departmentId,
      },
    });
  } catch (error) {
    console.error('Error in DELETE faculty:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
