import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { requireAuth } from './api-utils';

/**
 * Get the student ID for the logged-in user
 * @param request - NextRequest object
 * @returns Student ID or null if not found or not a student
 */
export async function getStudentIdFromRequest(
  request: NextRequest
): Promise<number | null> {
  try {
    const { success, user } = requireAuth(request);
    if (!success || !user) {
      return null;
    }

    // Check if user is a student
    if (user.role !== 'student') {
      return null;
    }

    // Get student record
    const student = await prisma.students.findFirst({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
      },
    });

    return student?.id || null;
  } catch (error) {
    console.error('Error getting student ID:', error);
    return null;
  }
}

/**
 * Get the full student record for the logged-in user
 * @param request - NextRequest object
 * @returns Student record or null
 */
export async function getStudentFromRequest(request: NextRequest) {
  try {
    const { success, user } = requireAuth(request);
    if (!success || !user) {
      return null;
    }

    // Check if user is a student
    if (user.role !== 'student') {
      return null;
    }

    // Get student record with relations
    const student = await prisma.students.findFirst({
      where: {
        userId: user.userId,
      },
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
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return student;
  } catch (error) {
    console.error('Error getting student:', error);
    return null;
  }
}

