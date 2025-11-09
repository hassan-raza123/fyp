import { prisma } from './prisma';

/**
 * Get current department ID from settings
 * Returns the department ID based on department code in settings
 */
export async function getCurrentDepartmentId(): Promise<number | null> {
  try {
    // Get settings
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return null;
    }

    // Parse system settings
    const systemSettings =
      typeof settings.system === 'string'
        ? JSON.parse(settings.system)
        : settings.system;

    const departmentCode = systemSettings?.departmentCode;
    if (!departmentCode) {
      return null;
    }

    // Find department by code
    const department = await prisma.departments.findUnique({
      where: { code: departmentCode },
      select: { id: true },
    });

    return department?.id || null;
  } catch (error) {
    console.error('Error getting current department ID:', error);
    return null;
  }
}

/**
 * Get current department info from settings
 */
export async function getCurrentDepartment() {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return null;
    }

    const systemSettings =
      typeof settings.system === 'string'
        ? JSON.parse(settings.system)
        : settings.system;

    const departmentCode = systemSettings?.departmentCode;
    const departmentName = systemSettings?.departmentName;

    if (!departmentCode) {
      return null;
    }

    const department = await prisma.departments.findUnique({
      where: { code: departmentCode },
      include: {
        _count: {
          select: {
            programs: true,
            faculties: true,
            students: true,
            courses: true,
          },
        },
      },
    });

    return department;
  } catch (error) {
    console.error('Error getting current department:', error);
    return null;
  }
}

/**
 * Create or update department based on settings
 * This is called when settings are saved
 */
export async function syncDepartmentFromSettings() {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return null;
    }

    const systemSettings =
      typeof settings.system === 'string'
        ? JSON.parse(settings.system)
        : settings.system;

    const departmentCode = systemSettings?.departmentCode;
    const departmentName = systemSettings?.departmentName;

    if (!departmentCode || !departmentName) {
      return null;
    }

    // Create or update department
    const department = await prisma.departments.upsert({
      where: { code: departmentCode },
      update: {
        name: departmentName,
        code: departmentCode,
        status: 'active',
        updatedAt: new Date(),
      },
      create: {
        name: departmentName,
        code: departmentCode,
        status: 'active',
      },
    });

    return department;
  } catch (error) {
    console.error('Error syncing department from settings:', error);
    return null;
  }
}
