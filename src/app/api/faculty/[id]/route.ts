import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';
import { faculty_status } from '@prisma/client';
import { sendAdminAssignmentEmail } from '@/lib/email-utils';
import { getDefaultPasswordByRoleName } from '@/lib/password-utils';

interface UserRole {
  role: {
    name: string;
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params;
    const facultyId = parseInt(id);
    if (isNaN(facultyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid faculty ID' },
        { status: 400 }
      );
    }

    const faculty = await prisma.faculties.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
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

    if (!faculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Check department access if admin (skip for super_admin)
    if (user?.role === 'admin') {
      // For regular admins, we'd check department access here
      // Super admin can access all
    }

    return NextResponse.json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch faculty',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

    // Check if user has admin or super_admin role
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const facultyId = parseInt(id);
    if (isNaN(facultyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid faculty ID' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { designation, status, departmentId } = body;

    // Validate required fields
    if (!designation || !status) {
      return NextResponse.json(
        { success: false, error: 'Designation and status are required' },
        { status: 400 }
      );
    }
    
    // Validate departmentId if provided
    if (departmentId !== undefined && departmentId !== null) {
      const deptId = parseInt(departmentId);
      if (isNaN(deptId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid department ID' },
          { status: 400 }
        );
      }
      
      // Verify department exists
      const department = await prisma.departments.findUnique({
        where: { id: deptId },
      });
      
      if (!department) {
        return NextResponse.json(
          { success: false, error: 'Department not found' },
          { status: 404 }
        );
      }
    }

    // Check if faculty exists
    const existingFaculty = await prisma.faculties.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          include: {
            userrole: {
              include: {
                role: true,
              },
            },
          },
        },
        department: true,
      },
    });

    if (!existingFaculty) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found' },
        { status: 404 }
      );
    }

    // Check if this is an admin and department is being changed
    const isAdmin = existingFaculty.user.userrole?.role?.name === 'admin';
    const oldDepartmentId = existingFaculty.departmentId;
    const newDepartmentId = departmentId !== undefined && departmentId !== null ? parseInt(departmentId) : oldDepartmentId;
    const departmentChanged = isAdmin && newDepartmentId !== oldDepartmentId && newDepartmentId !== null;

    // Prepare update data
    const updateData: any = {
      designation,
      status,
    };
    
    // Add departmentId if provided
    if (departmentId !== undefined && departmentId !== null) {
      updateData.departmentId = parseInt(departmentId);
    }

    // Update faculty information
    const updatedFaculty = await prisma.faculties.update({
      where: { id: facultyId },
      data: updateData,
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

    // Send email if admin's department was changed
    if (departmentChanged && updatedFaculty.department) {
      try {
        const userRole = existingFaculty.user.userrole?.role?.name || 'admin';
        const rolePassword = getDefaultPasswordByRoleName(userRole);
        await sendAdminAssignmentEmail({
          email: updatedFaculty.user.email,
          firstName: updatedFaculty.user.first_name,
          lastName: updatedFaculty.user.last_name,
          departmentName: updatedFaculty.department.name,
          departmentCode: updatedFaculty.department.code,
          password: rolePassword,
          role: userRole as 'super_admin' | 'admin',
        });
      } catch (emailError) {
        console.error('Error sending admin assignment email:', emailError);
        // Don't fail the request if email fails
      }
    }

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
  context: { params: Promise<{ id: string }> }
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

    // Check if user has admin or super_admin role
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse the faculty ID
    const { id } = await context.params;
    const facultyId = parseInt(id);
    if (isNaN(facultyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid faculty ID' },
        { status: 400 }
      );
    }

    console.log(`Processing DELETE for faculty ID: ${facultyId}`);

    // Check if faculty exists
    const existingFaculty = await prisma.faculties.findUnique({
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
      userRoles.some((ur) => ur.role.name === 'admin');

    // Store the user ID for later operations
    const userId = existingFaculty.userId;

    // If they are department head, update the department
    if (
      existingFaculty.department &&
      existingFaculty.department.adminId === existingFaculty.userId
    ) {
      try {
        await prisma.departments.update({
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
      await prisma.userroles.deleteMany({
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
      await prisma.faculties.delete({
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
