import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { requireAuth } from './api-utils';

/**
 * Get the faculty ID for the logged-in user
 * @param request - NextRequest object
 * @returns Faculty ID or null if not found or not a faculty member
 */
export async function getFacultyIdFromRequest(
  request: NextRequest
): Promise<number | null> {
  try {
    const { success, user } = requireAuth(request);
    if (!success || !user) {
      return null;
    }

    // Check if user is a faculty member
    if (user.role !== 'faculty') {
      return null;
    }

    // Get faculty record
    const faculty = await prisma.faculties.findFirst({
      where: {
        userId: user.userId,
      },
      select: {
        id: true,
      },
    });

    return faculty?.id || null;
  } catch (error) {
    console.error('Error getting faculty ID:', error);
    return null;
  }
}

/**
 * Get the full faculty record for the logged-in user
 * @param request - NextRequest object
 * @returns Faculty record or null
 */
export async function getFacultyFromRequest(request: NextRequest) {
  try {
    const { success, user } = requireAuth(request);
    if (!success || !user) {
      return null;
    }

    // Check if user is a faculty member
    if (user.role !== 'faculty') {
      return null;
    }

    // Get faculty record with relations
    const faculty = await prisma.faculties.findFirst({
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
      },
    });

    return faculty;
  } catch (error) {
    console.error('Error getting faculty:', error);
    return null;
  }
}

