import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const CourseType = {
  THEORY: 'THEORY',
  LAB: 'LAB',
  PROJECT: 'PROJECT',
  THESIS: 'THESIS',
} as const;

const CourseStatus = {
  active: 'active',
  inactive: 'inactive',
  archived: 'archived',
} as const;

const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  creditHours: z.coerce.number().min(1, 'Credit hours must be at least 1'),
  theoryHours: z.coerce.number().min(0, 'Theory hours cannot be negative'),
  labHours: z.coerce.number().min(0, 'Lab hours cannot be negative'),
  type: z.enum(['THEORY', 'LAB', 'PROJECT', 'THESIS'] as const),
  departmentId: z.string().min(1, 'Department is required'),
  status: z.enum(['active', 'inactive', 'archived'] as const).default('active'),
});

type CreateCourseInput = z.infer<typeof createCourseSchema>;

interface CourseResponse {
  id: number;
  code: string;
  name: string;
  creditHours: number;
  type: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS';
  department: {
    id: number;
    name: string;
    code: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  prerequisites: {
    prerequisite: {
      id: number;
      code: string;
      name: string;
    };
  }[];
  corequisites: {
    corequisite: {
      id: number;
      code: string;
      name: string;
    };
  }[];
}

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     description: Retrieve a list of courses with optional filtering and pagination
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for course code or name
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [THEORY, LAB, PROJECT, THESIS]
 *         description: Filter by course type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, ARCHIVED]
 *         description: Filter by course status
 *     responses:
 *       200:
 *         description: List of courses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                       creditHours:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [THEORY, LAB, PROJECT, THESIS]
 *                       department:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           code:
 *                             type: string
 *                       status:
 *                         type: string
 *                         enum: [ACTIVE, INACTIVE, ARCHIVED]
 *                       prerequisites:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             prerequisite:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 code:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                       corequisites:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             corequisite:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 code:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }
    if (departmentId && departmentId !== 'all') {
      where.departmentId = parseInt(departmentId);
    }
    if (type && type !== 'all') {
      where.type = type;
    }
    if (status && status !== 'all') {
      where.status = status.toLowerCase();
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          course_A: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          course_B: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }) as unknown as (Omit<
        CourseResponse,
        'prerequisites' | 'corequisites' | 'status'
      > & {
        course_A: { id: number; code: string; name: string }[];
        course_B: { id: number; code: string; name: string }[];
        status: string;
      })[],
      prisma.course.count({ where }),
    ]);

    // Transform the data to match the frontend interface
    const transformedCourses: CourseResponse[] = courses.map((course) => {
      const { course_A, course_B, ...rest } = course;
      return {
        ...rest,
        status: course.status.toUpperCase() as
          | 'ACTIVE'
          | 'INACTIVE'
          | 'ARCHIVED',
        prerequisites: course_A.map((c) => ({
          prerequisite: {
            id: c.id,
            code: c.code,
            name: c.name,
          },
        })),
        corequisites: course_B.map((c) => ({
          corequisite: {
            id: c.id,
            code: c.code,
            name: c.name,
          },
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedCourses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received POST request for course creation');
    const body = await request.json();
    console.log('Request body:', body);

    const validatedData = createCourseSchema.parse(body) as CreateCourseInput;
    console.log('Validated data:', validatedData);

    const courseData = {
      code: validatedData.code,
      name: validatedData.name,
      description: validatedData.description ?? '',
      creditHours: validatedData.creditHours,
      theoryHours: validatedData.theoryHours,
      labHours: validatedData.labHours,
      type: validatedData.type,
      departmentId: parseInt(validatedData.departmentId),
      status: validatedData.status,
    } as const;

    const course = await prisma.course.create({
      data: courseData,
    });

    console.log('Course created:', course);
    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error in course creation:', error);

    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: error.errors[0].message,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('Error details:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while creating the course',
      },
      { status: 500 }
    );
  }
}
