import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { parse } from 'csv-parse/sync';
import { hash } from 'bcryptjs';
import { getDefaultPasswordByRoleName } from '@/lib/password-utils';

// Helper function to resolve department name to ID
async function resolveDepartmentId(nameOrId: string): Promise<number> {
  // If it's a number, return it directly
  const numericId = Number(nameOrId);
  if (!isNaN(numericId) && numericId > 0) {
    return numericId;
  }
  
  // Otherwise, search by name (case-insensitive)
  const searchTerm = nameOrId.trim();
  
  // Get all departments and filter in memory for case-insensitive match
  const allDepartments = await prisma.departments.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
  });
  
  // Find exact match first (case-insensitive)
  let department = allDepartments.find(
    (d) => d.name.toLowerCase() === searchTerm.toLowerCase() || 
           d.code.toLowerCase() === searchTerm.toLowerCase()
  );
  
  // If no exact match, try contains match
  if (!department) {
    department = allDepartments.find(
      (d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             d.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (!department) {
    throw new Error(`Department not found: "${nameOrId}"`);
  }
  
  return department.id;
}

// Helper function to resolve program name to ID
async function resolveProgramId(nameOrId: string): Promise<number> {
  // If it's a number, return it directly
  const numericId = Number(nameOrId);
  if (!isNaN(numericId) && numericId > 0) {
    return numericId;
  }
  
  // Otherwise, search by name or code (case-insensitive)
  const searchTerm = nameOrId.trim();
  
  // First, try to get all programs and filter in memory for case-insensitive match
  const allPrograms = await prisma.programs.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
  });
  
  // Find exact match first (case-insensitive, trim whitespace)
  let program = allPrograms.find(
    (p) => p.name.toLowerCase().trim() === searchTerm.toLowerCase().trim() || 
           p.code.toLowerCase().trim() === searchTerm.toLowerCase().trim()
  );
  
  // If no exact match, try contains match (prioritize name)
  if (!program) {
    program = allPrograms.find(
      (p) => p.name.toLowerCase().trim().includes(searchTerm.toLowerCase().trim())
    );
    
    // Then try code contains
    if (!program) {
      program = allPrograms.find(
        (p) => p.code.toLowerCase().trim().includes(searchTerm.toLowerCase().trim())
      );
    }
  }
  
  if (!program) {
    // Provide helpful error with available programs (show first 10 with both name and code)
    const availablePrograms = allPrograms.slice(0, 10).map(p => `"${p.name}" or "${p.code}"`).join(', ');
    throw new Error(`Program not found: "${nameOrId}". Available: ${availablePrograms}${allPrograms.length > 10 ? ` (and ${allPrograms.length - 10} more)` : ''}`);
  }
  
  return program.id;
}

// Helper function to resolve batch name to ID
async function resolveBatchId(nameOrId: string): Promise<string | null> {
  if (!nameOrId) return null;
  
  // If it's a number, convert to string (batchId is string in schema)
  const numericId = Number(nameOrId);
  if (!isNaN(numericId) && numericId > 0) {
    return numericId.toString();
  }
  
  // Otherwise, search by name or code (case-insensitive)
  const searchTerm = nameOrId.trim();
  
  // Get all batches and filter in memory for case-insensitive match
  const allBatches = await prisma.batches.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
  });
  
  // Find exact match first (case-insensitive)
  let batch = allBatches.find(
    (b) => b.name.toLowerCase() === searchTerm.toLowerCase() || 
           (b.code && b.code.toLowerCase() === searchTerm.toLowerCase())
  );
  
  // If no exact match, try contains match
  if (!batch) {
    batch = allBatches.find(
      (b) => b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (b.code && b.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
  
  if (!batch) {
    throw new Error(`Batch not found: "${nameOrId}"`);
  }
  
  return batch.id;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and get user data
    const { success, user, error } = await requireAuth(request);
    if (!success) {
      return NextResponse.json({ error }, { status: 401 });
    }

    // Check if user has admin role
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const content = await file.text();
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const record of records) {
      try {
        // Validate required fields
        if (!record.email || !record.role) {
          throw new Error('Missing required fields');
        }

        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
          where: { email: record.email },
        });

        if (existingUser) {
          throw new Error('User already exists');
        }

        // Get role-based default password if not provided
        const passwordToUse = record.password || getDefaultPasswordByRoleName(record.role);
        const hashedPassword = await hash(passwordToUse, 12);

        // Create user
        await prisma.users.create({
          data: {
            first_name: record.firstName,
            last_name: record.lastName,
            email: record.email,
            username: record.email.split('@')[0], // Generate username from email
            password_hash: hashedPassword,
            status: 'active',
            email_verified: false,
            updatedAt: new Date(),
            userrole: {
              create: {
                role: {
                  connect: { name: record.role },
                },
                updatedAt: new Date(),
              },
            },
            ...(record.role === 'faculty' && {
              faculty: {
                create: {
                  departmentId: await resolveDepartmentId(record.departmentName || record.departmentId),
                  designation: record.designation || 'Faculty',
                  status: 'active',
                  updatedAt: new Date(),
                },
              },
            }),
            ...(record.role === 'student' && {
              student: {
                create: {
                  rollNumber: record.rollNumber,
                  departmentId: await resolveDepartmentId(record.departmentName || record.departmentId),
                  programId: await resolveProgramId(record.programName || record.programId),
                  batchId: record.batchName || record.batchId ? await resolveBatchId(record.batchName || record.batchId) : null,
                  status: record.status || 'active',
                  updatedAt: new Date(),
                },
              },
            }),
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to import user ${record.email}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error importing users:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
