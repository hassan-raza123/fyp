import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the department admin's department
    const departmentAdmin = await prisma.users.findFirst({
      where: {
        id: parseInt(userId),
        departmentAdmin: {
          isNot: null,
        },
      },
      include: {
        departmentAdmin: true,
      },
    });

    if (!departmentAdmin || !departmentAdmin.departmentAdmin) {
      return NextResponse.json(
        { error: 'Department admin not found' },
        { status: 403 }
      );
    }

    const departmentId = departmentAdmin.departmentAdmin.id;

    // Get basic counts first
    const totalStudents = await prisma.students.count({
      where: {
        departmentId: departmentId,
      },
    });

    const totalPrograms = await prisma.programs.count({
      where: {
        departmentId: departmentId,
      },
    });

    const totalCourses = await prisma.courses.count({
      where: {
        departmentId: departmentId,
      },
    });

    const totalFaculty = await prisma.faculties.count({
      where: {
        departmentId: departmentId,
      },
    });

    // Mock data for now (can be replaced with real data later)
    const enrollmentTrend = [
      { month: '2024-01', students: 45 },
      { month: '2024-02', students: 52 },
      { month: '2024-03', students: 48 },
      { month: '2024-04', students: 55 },
      { month: '2024-05', students: 60 },
      { month: '2024-06', students: 58 },
    ];

    const programDistribution = [
      { name: 'Computer Science', value: 120 },
      { name: 'Software Engineering', value: 85 },
      { name: 'Information Technology', value: 65 },
      { name: 'Data Science', value: 45 },
    ];

    const gpaDistribution = [
      { gpa: 4.0, students: 15 },
      { gpa: 3.5, students: 45 },
      { gpa: 3.0, students: 78 },
      { gpa: 2.5, students: 52 },
      { gpa: 2.0, students: 23 },
      { gpa: 1.5, students: 8 },
    ];

    // Calculate program completion (15% of total students)
    const programCompletion = Math.floor(totalStudents * 0.15);

    // Mock retention rate
    const retentionRate = 85;

    // Calculate average GPA (mock calculation)
    const averageGPA = 3.2;

    const analyticsData = {
      enrollmentTrend: enrollmentTrend,
      programDistribution: programDistribution,
      gpaDistribution: gpaDistribution,
      stats: {
        totalEnrollment: totalStudents,
        programCompletion: programCompletion,
        averageGPA: averageGPA,
        retentionRate: retentionRate,
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Department analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
