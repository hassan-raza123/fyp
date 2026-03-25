import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getFacultyIdFromRequest } from '@/lib/auth';
import { plo_status } from '@prisma/client';

interface ContributingCLO {
  cloId: number;
  cloCode: string;
  attainment: number | null;
  weight: number;
}

interface ContributingLLO {
  lloId: number;
  lloCode: string;
  attainment: number | null;
  weight: number;
}

// GET - Returns faculty-specific PLO attainment data
// Without programId/semesterId: returns { programs, semesters } for filter dropdowns
// With programId + semesterId: returns PLO attainments for that program/semester
export async function GET(req: NextRequest) {
  try {
    const facultyId = await getFacultyIdFromRequest(req);
    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty not found or unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const programId = searchParams.get('programId');
    const semesterId = searchParams.get('semesterId');

    // Get faculty's sections to determine relevant programs + semesters
    const sections = await prisma.sections.findMany({
      where: { facultyId, status: 'active' },
      include: {
        courseOffering: {
          include: {
            semester: { select: { id: true, name: true } },
            course: {
              include: {
                programMappings: { include: { program: { select: { id: true, name: true, code: true } } } },
              },
            },
          },
        },
      },
    });

    // Collect unique programs and semesters
    const programsMap = new Map<number, { id: number; name: string; code: string }>();
    const semestersMap = new Map<number, { id: number; name: string }>();

    sections.forEach((section) => {
      const { course, semester } = section.courseOffering;
      course.programMappings.map((m) => m.program).forEach((program) => {
        if (!programsMap.has(program.id)) {
          programsMap.set(program.id, program);
        }
      });
      if (!semestersMap.has(semester.id)) {
        semestersMap.set(semester.id, semester);
      }
    });

    // If no programId/semesterId: return filter options only
    if (!programId || !semesterId) {
      return NextResponse.json({
        success: true,
        data: {
          programs: Array.from(programsMap.values()),
          semesters: Array.from(semestersMap.values()),
        },
      });
    }

    const pid = Number(programId);
    const sid = Number(semesterId);

    // Validate faculty teaches in this program
    if (!programsMap.has(pid)) {
      return NextResponse.json(
        { success: false, error: 'You do not teach any courses in this program' },
        { status: 403 }
      );
    }

    // Fetch PLOs with CLO + LLO mapping attainments for the semester
    const plos = await prisma.plos.findMany({
      where: { programId: pid, status: plo_status.active },
      include: {
        cloMappings: {
          include: {
            clo: {
              include: {
                closAttainments: {
                  where: { courseOffering: { semesterId: sid } },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        lloMappings: {
          include: {
            llo: {
              include: {
                llosAttainments: {
                  where: { courseOffering: { semesterId: sid } },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Fetch graduation criteria for weights
    const graduationCriteria = await prisma.graduation_criteria.findUnique({
      where: { programId: pid },
      select: { directWeight: true, indirectWeight: true, minSurveyResponseRate: true },
    });
    const directWeight = graduationCriteria?.directWeight ?? 0.7;
    const indirectWeight = graduationCriteria?.indirectWeight ?? 0.3;
    const minSurveyResponseRate = graduationCriteria?.minSurveyResponseRate ?? 0.0;

    // Direct attainment: weighted average of CLO + LLO attainments
    const directAttainmentByPlo = new Map<
      number,
      {
        attainment: number;
        contributingClos: ContributingCLO[];
        contributingLlos: ContributingLLO[];
      }
    >();

    for (const plo of plos) {
      const contributingClos: ContributingCLO[] = plo.cloMappings.map((mapping) => ({
        cloId: mapping.clo.id,
        cloCode: mapping.clo.code,
        attainment: mapping.clo.closAttainments[0]?.attainmentPercent ?? null,
        weight: mapping.weight,
      }));

      const contributingLlos: ContributingLLO[] = plo.lloMappings.map((mapping) => ({
        lloId: mapping.llo.id,
        lloCode: mapping.llo.code,
        attainment: mapping.llo.llosAttainments[0]?.attainmentPercent ?? null,
        weight: mapping.weight,
      }));

      const allContributions = [
        ...contributingClos.filter((c) => c.attainment !== null).map((c) => ({ attainment: c.attainment as number, weight: c.weight })),
        ...contributingLlos.filter((l) => l.attainment !== null).map((l) => ({ attainment: l.attainment as number, weight: l.weight })),
      ];

      const totalWeight = allContributions.reduce((sum, c) => sum + c.weight, 0);
      const weightedSum = allContributions.reduce((sum, c) => sum + c.attainment * c.weight, 0);

      directAttainmentByPlo.set(plo.id, {
        attainment: totalWeight > 0 ? weightedSum / totalWeight : 0,
        contributingClos,
        contributingLlos,
      });
    }

    // Fetch course offerings for this program + semester (for surveys)
    const courseOfferingsRaw = await prisma.courseofferings.findMany({
      where: {
        semesterId: sid,
        course: { programMappings: { some: { A: pid } } },
      },
      select: {
        id: true,
        sections: {
          where: { status: 'active' },
          select: {
            studentsections: {
              where: { status: 'active' },
              select: { studentId: true },
            },
          },
        },
      },
    });

    const enrolledByOffering = new Map<number, number>();
    const allStudentIds = new Set<number>();
    for (const co of courseOfferingsRaw) {
      const students = new Set<number>();
      for (const section of co.sections) {
        for (const ss of section.studentsections) {
          students.add(ss.studentId);
          allStudentIds.add(ss.studentId);
        }
      }
      enrolledByOffering.set(co.id, students.size);
    }
    const totalStudents = allStudentIds.size;
    const offeringIds = courseOfferingsRaw.map((co) => co.id);

    // Indirect attainment: course-exit surveys
    const indirectByPlo = new Map<number, { sumRating: number; count: number }>();

    if (offeringIds.length > 0) {
      const courseExitSurveys = await prisma.surveys.findMany({
        where: { courseOfferingId: { in: offeringIds }, status: 'closed' },
        include: {
          questions: {
            where: { ploId: { not: null } },
            include: { answers: { select: { ratingValue: true } } },
          },
          _count: { select: { responses: true } },
        },
      });

      const validSurveys = courseExitSurveys.filter((s) => {
        if (minSurveyResponseRate <= 0) return true;
        const enrolled = s.courseOfferingId !== null ? (enrolledByOffering.get(s.courseOfferingId) ?? 0) : 0;
        if (enrolled === 0) return s._count.responses > 0;
        return s._count.responses / enrolled >= minSurveyResponseRate;
      });

      for (const survey of validSurveys) {
        const responseCount = survey._count.responses;
        if (responseCount === 0) continue;
        for (const q of survey.questions) {
          if (!q.ploId) continue;
          const ratings = q.answers.filter((a) => a.ratingValue !== null).map((a) => a.ratingValue as number);
          if (ratings.length === 0) continue;
          const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
          const existing = indirectByPlo.get(q.ploId) ?? { sumRating: 0, count: 0 };
          indirectByPlo.set(q.ploId, {
            sumRating: existing.sumRating + avg * responseCount,
            count: existing.count + responseCount,
          });
        }
      }
    }

    // Program-level surveys
    const programLevelSurveys = await prisma.surveys.findMany({
      where: {
        programId: pid,
        status: 'closed',
        type: { in: ['program_exit', 'alumni', 'employer'] },
      },
      include: {
        questions: {
          where: { ploId: { not: null } },
          include: { answers: { select: { ratingValue: true } } },
        },
        _count: { select: { responses: true } },
      },
    });

    const validProgramSurveys = programLevelSurveys.filter((s) => {
      if (minSurveyResponseRate <= 0 || totalStudents === 0) return s._count.responses > 0;
      return s._count.responses / totalStudents >= minSurveyResponseRate;
    });

    for (const survey of validProgramSurveys) {
      const responseCount = survey._count.responses;
      if (responseCount === 0) continue;
      for (const q of survey.questions) {
        if (!q.ploId) continue;
        const ratings = q.answers.filter((a) => a.ratingValue !== null).map((a) => a.ratingValue as number);
        if (ratings.length === 0) continue;
        const avg = ratings.reduce((s, v) => s + v, 0) / ratings.length;
        const existing = indirectByPlo.get(q.ploId) ?? { sumRating: 0, count: 0 };
        indirectByPlo.set(q.ploId, {
          sumRating: existing.sumRating + avg * responseCount,
          count: existing.count + responseCount,
        });
      }
    }

    // Convert indirect map to percentage (avg_rating / 5 × 100)
    const indirectAttainmentByPloId = new Map<number, number>();
    for (const [ploId, data] of indirectByPlo.entries()) {
      const avgRating = data.count > 0 ? data.sumRating / data.count : 0;
      indirectAttainmentByPloId.set(ploId, Math.round((avgRating / 5) * 100 * 10) / 10);
    }

    // Combine direct + indirect
    const ploAttainments = plos.map((plo) => {
      const direct = directAttainmentByPlo.get(plo.id);
      const directAttainment = direct?.attainment ?? 0;
      const contributingClos = direct?.contributingClos ?? [];
      const contributingLlos = direct?.contributingLlos ?? [];
      const indirectAttainment = indirectAttainmentByPloId.get(plo.id) ?? null;

      const attainment =
        indirectAttainment !== null
          ? directWeight * directAttainment + indirectWeight * indirectAttainment
          : directAttainment;

      return {
        ploId: plo.id,
        ploCode: plo.code,
        description: plo.description,
        directAttainment,
        indirectAttainment,
        attainment,
        contributingClos,
        contributingLlos,
      };
    });

    return NextResponse.json(ploAttainments);
  } catch (error) {
    console.error('Error fetching faculty PLO attainments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PLO attainments' },
      { status: 500 }
    );
  }
}
