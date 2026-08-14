import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { faculty_status } from '@prisma/client';
import { sendAdminAssignmentEmail } from '@/lib/email-utils';
import { hash } from 'bcryptjs';
import { generateTemporaryPassword } from '@/lib/password-utils';

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
    const { success, user, error } = await requireAuth(request);
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

    // Check department access if admin (super_admin can access all)
    if (user?.role === 'admin') {
      const { getDepartmentIdFromRequest } = await import('@/lib/auth');
      const adminDepartmentId = await getDepartmentIdFromRequest(request);
      
      if (!adminDepartmentId) {
        return NextResponse.json(
          { success: false, error: 'Department not assigned. Please contact super admin to assign a department to your account.' },
          { status: 400 }
        );
      }
      
      if (faculty.departmentId !== adminDepartmentId) {
        return NextResponse.json(
          { success: false, error: 'You can only view faculty members from your own department' },
          { status: 403 }
        );
      }
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
          'Failed to fetch faculty',
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
    const { success, user, error } = await requireAuth(request);
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

    // For admin, get their department ID to ensure they can only update their own department's faculty
    let adminDepartmentId: number | null = null;
    if (user?.role === 'admin') {
      const { getDepartmentIdFromRequest } = await import('@/lib/auth');
      adminDepartmentId = await getDepartmentIdFromRequest(request);
      if (!adminDepartmentId) {
        return NextResponse.json(
          { success: false, error: 'Department not assigned. Please contact super admin to assign a department to your account.' },
          { status: 400 }
        );
      }
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
    const { 
      designation, 
      status, 
      departmentId,
      first_name,
      last_name,
      email,
      phone_number,
    } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
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

    // Check if faculty exists and get role information
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

    // Check department access for admin (super_admin can access all)
    if (user?.role === 'admin' && adminDepartmentId !== null) {
      if (existingFaculty.departmentId !== adminDepartmentId) {
        return NextResponse.json(
          { success: false, error: 'You can only update faculty members from your own department' },
          { status: 403 }
        );
      }
    }

    // Check if this is an admin or faculty
    const userRole = existingFaculty.user.userrole?.role?.name;
    const isAdmin = userRole === 'admin';
    const isFaculty = userRole === 'faculty';
    
    // For admin, designation is always "Admin"
    // For faculty, designation is always "Faculty" (fixed)
    const finalDesignation = isAdmin ? 'Admin' : (isFaculty ? 'Faculty' : (designation || existingFaculty.designation || 'Faculty'));
    
    // Prevent department change for admin users (only super_admin can change)
    if (isAdmin && user?.role === 'admin' && departmentId !== undefined && departmentId !== null) {
      const newDeptId = parseInt(departmentId);
      if (newDeptId !== existingFaculty.departmentId) {
        return NextResponse.json(
          { success: false, error: 'You cannot change the department of admin users' },
          { status: 403 }
        );
      }
    }

    // Check if department is being changed
    const oldDepartmentId = existingFaculty.departmentId;
    const newDepartmentId = departmentId !== undefined && departmentId !== null ? parseInt(departmentId) : oldDepartmentId;
    const departmentChanged = isAdmin && newDepartmentId !== oldDepartmentId && newDepartmentId !== null;

    // Check if email is being changed and if it's already taken
    if (email && email !== existingFaculty.user.email) {
      const emailExists = await prisma.users.findUnique({
        where: { email },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already taken' },
          { status: 400 }
        );
      }
    }

    const userChanged =
      Boolean(first_name) ||
      Boolean(last_name) ||
      Boolean(email) ||
      phone_number !== undefined ||
      Boolean(status);

    // Prepare update data
    const updateData: any = {
      designation: finalDesignation,
      status,
    };
    
    // Add departmentId if provided
    if (departmentId !== undefined && departmentId !== null) {
      updateData.departmentId = parseInt(departmentId);
    }

    // The account row and the faculty row describe one person. Updated
    // separately, a failure between them left the two disagreeing — a renamed
    // user still carrying the old designation, or vice versa.
    const updatedFaculty = await prisma.$transaction(async (tx) => {
      if (userChanged) {
        await tx.users.update({
          where: { id: existingFaculty.userId },
          data: {
            ...(first_name && { first_name }),
            ...(last_name && { last_name }),
            ...(email && { email }),
            ...(phone_number !== undefined && {
              phone_number: phone_number || null,
            }),
            ...(status && { status }),
            updatedAt: new Date(),
          },
        });
      }

      return tx.faculties.update({
        where: { id: facultyId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone_number: true,
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
    });

    // Send email if admin's department was changed
    if (departmentChanged && updatedFaculty.department) {
      try {
        const userRole = existingFaculty.user.userrole?.role?.name || 'admin';

        // Actually set the credential we are about to email. This previously
        // sent the role's shared default, which happened to match the stored
        // password; with per-user passwords the email would otherwise quote a
        // password the account does not have.
        const rolePassword = generateTemporaryPassword();
        await prisma.users.update({
          where: { id: updatedFaculty.user.id },
          data: {
            password_hash: await hash(rolePassword, 12),
            must_change_password: true,
          },
        });

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
    const { success, user, error } = await requireAuth(request);
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

    // For admin, get their department ID to ensure they can only delete their own department's faculty
    let adminDepartmentId: number | null = null;
    if (user?.role === 'admin') {
      const { getDepartmentIdFromRequest } = await import('@/lib/auth');
      adminDepartmentId = await getDepartmentIdFromRequest(request);
      if (!adminDepartmentId) {
        return NextResponse.json(
          { success: false, error: 'Department not assigned. Please contact super admin to assign a department to your account.' },
          { status: 400 }
        );
      }
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

    // Check department access for admin (super_admin can access all)
    if (user?.role === 'admin' && adminDepartmentId !== null) {
      if (existingFaculty.departmentId !== adminDepartmentId) {
        return NextResponse.json(
          { success: false, error: 'You can only delete faculty members from your own department' },
          { status: 403 }
        );
      }
    }

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

    // If they are department head, the department must lose its head too
    const clearDepartmentHead =
      existingFaculty.department != null &&
      existingFaculty.department.adminId === existingFaculty.userId;

    /**
     * All three writes in one transaction.
     *
     * Each step used to run in its own `try` that logged and carried on, so a
     * failed role delete followed by a successful faculty delete left the user
     * still holding a faculty role with no faculty row behind it — an account
     * that lists as staff and resolves to nothing. Either the whole removal
     * lands or none of it does.
     */
    try {
      await prisma.$transaction(async (tx) => {
        if (clearDepartmentHead && existingFaculty.departmentId) {
          await tx.departments.update({
            where: { id: existingFaculty.departmentId },
            data: { adminId: null },
          });
        }

        await tx.userroles.deleteMany({ where: { userId } });
        await tx.faculties.delete({ where: { id: facultyId } });
      });
    } catch (deleteError) {
      console.error('Faculty delete rolled back:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error:
            'This faculty member still has records attached (sections, marks or attendance) and cannot be removed. Deactivate the account instead.',
        },
        { status: 409 }
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
        error: 'Unknown error',
      },
      { status: 500 }
    );
  }
}
