import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parse } from 'csv-parse/sync';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        const existingUser = await prisma.user.findUnique({
          where: { email: record.email },
        });

        if (existingUser) {
          throw new Error('User already exists');
        }

        // Create user
        await prisma.user.create({
          data: {
            first_name: record.firstName,
            last_name: record.lastName,
            email: record.email,
            password_hash: record.password || 'defaultPassword', // In production, generate a secure password
            userrole: {
              create: {
                role: {
                  connect: { name: record.role },
                },
              },
            },
            ...(record.role === 'teacher' && {
              faculty: {
                create: {
                  employeeId: record.employeeId,
                  departmentId: parseInt(record.departmentId),
                },
              },
            }),
            ...(record.role === 'student' && {
              student: {
                create: {
                  rollNumber: record.rollNumber,
                  departmentId: parseInt(record.departmentId),
                  programId: parseInt(record.programId),
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
