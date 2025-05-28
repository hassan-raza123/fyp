import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const sections = await prisma.sections.findMany({
      include: {
        course: true,
        faculty: {
          include: {
            user: true,
          },
        },
      },
    });
    return NextResponse.json(sections);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, courseId, facultyId, semester, maxStudents, startDate, endDate } = body;

    const section = await prisma.sections.create({
      data: {
        name,
        courseId,
        facultyId,
        semester,
        maxStudents,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      include: {
        course: true,
        faculty: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create section" }, { status: 500 });
  }
} 