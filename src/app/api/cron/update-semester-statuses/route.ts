import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { semester_status } from '@prisma/client';

async function updateSemesterStatus(semesterId: number) {
  const semester = await prisma.semesters.findUnique({
    where: { id: semesterId },
  });

  if (!semester) return;

  const now = new Date();
  const endDate = new Date(semester.endDate);
  const startDate = new Date(semester.startDate);

  let newStatus = semester.status;

  if (now > endDate) {
    newStatus = semester_status.completed;
  } else if (now >= startDate && now <= endDate) {
    newStatus = semester_status.active;
  } else if (now < startDate) {
    newStatus = semester_status.inactive;
  }

  if (newStatus !== semester.status) {
    await prisma.semesters.update({
      where: { id: semesterId },
      data: { status: newStatus },
    });
    return true;
  }
  return false;
}

export async function GET(request: Request) {
  try {
    // Verify the request is from a trusted source (e.g., cron job)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const semesters = await prisma.semesters.findMany();
    const updates = await Promise.all(
      semesters.map((semester) => updateSemesterStatus(semester.id))
    );

    const updatedCount = updates.filter(Boolean).length;

    return NextResponse.json({
      success: true,
      message: 'Semester statuses updated successfully',
      updatedCount,
      totalSemesters: semesters.length,
    });
  } catch (error) {
    console.error('Error updating semester statuses:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
