import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { parse } from 'csv-parse/sync';
import { hash } from 'bcryptjs';
import { getDefaultPasswordByRoleName } from '@/lib/password-utils';

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
                  departmentId: Number(record.departmentId),
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
                  departmentId: Number(record.departmentId),
                  programId: Number(record.programId),
                  status: 'active',
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
