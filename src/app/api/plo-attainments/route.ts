import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { plo_status } from '@prisma/client';

interface ContributingCLO {
  cloId: number;
  cloCode: string;
  attainment: number;
  weight: number;
}

interface ContributingLLO {
  lloId: number;
  lloCode: string;
  attainment: number;
  weight: number;
}

interface PLOAttainment {
  ploId: number;
  ploCode: string;
  description: string;
  attainment: number;
  directAttainment: number;
  indirectAttainment: number | null;
  contributingClos: ContributingCLO[];
  contributingLlos: ContributingLLO[];
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const semesterId = searchParams.get('semesterId');

    if (!programId || !semesterId) {
      return NextResponse.json(
        { error: 'Program ID and Semester ID are required' },
        { status: 400 }
      );
    }

    // Fetch PLOs with BOTH CLO and LLO mappings + their attainments for the semester
    const plos = await prisma.plos.findMany({
      where: {
        programId: Number(programId),
        status: plo_status.active,
      },
      include: {
        cloMappings: {
          include: {
            clo: {
              include: {
                closAttainments: {
                  where: {
                    courseOffering: {
                      semesterId: Number(semesterId),
                    },
                  },
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
                  where: {
                    courseOffering: {
                      semesterId: Number(semesterId),
                    },
                  },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // --- DIRECT ATTAINMENT: weighted average of CLO + LLO attainments ---
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
        attainment: mapping.clo.closAttainments[0]?.attainmentPercent ?? 0,
        weight: mapping.weight,
      }));

      const contributingLlos: ContributingLLO[] = plo.lloMappings.map((mapping) => ({
        lloId: mapping.llo.id,
        lloCode: mapping.llo.code,
        attainment: mapping.llo.llosAttainments[0]?.attainmentPercent ?? 0,
        weight: mapping.weight,
      }));

      // Combine CLO + LLO contributions with their respective weights
      const allContributions = [
        ...contributingClos.map((c) => ({ attainment: c.attainment, weight: c.weight })),
        ...contributingLlos.map((l) => ({ attainment: l.attainment, weight: l.weight })),
      ];

      const totalWeight = allContributions.reduce((sum, c) => sum + c.weight, 0);
      const weightedSum = allContributions.reduce((sum, c) => sum + c.attainment * c.weight, 0);
      const directAttainment = totalWeight > 0 ? weightedSum / totalWeight : 0;

      directAttainmentByPlo.set(plo.id, {
        attainment: directAttainment,
        contributingClos,
        contributingLlos,
      });
    }

    // --- INDIRECT ATTAINMENT: from closed surveys in this program's course offerings ---
    const courseOfferings = await prisma.courseofferings.findMany({
      where: {
        semesterId: Number(semesterId),
        course: {
          programs: { some: { id: Number(programId) } },
        },
      },
      select: { id: true },
    });

    const offeringIds = courseOfferings.map((co) => co.id);
    const indirectByPlo = new Map<number, { sumRating: number; count: number }>();

    if (offeringIds.length > 0) {
      const surveys = await prisma.surveys.findMany({
        where: {
          courseOfferingId: { in: offeringIds },
          status: 'closed',
        },
        include: {
          questions: {
            where: { ploId: { not: null } },
            include: {
              answers: { select: { ratingValue: true } },
            },
          },
          _count: { select: { responses: true } },
        },
      });

      for (const survey of surveys) {
        const responseCount = survey._count.responses;
        if (responseCount === 0) continue;

        for (const q of survey.questions) {
          if (!q.ploId) continue;
          const ratings = q.answers
            .filter((a) => a.ratingValue !== null)
            .map((a) => a.ratingValue as number);
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

    // Convert indirect Map to percentage (rating/5 * 100)
    const indirectAttainmentByPloId = new Map<number, number>();
    for (const [ploId, data] of indirectByPlo.entries()) {
      const avgRating = data.count > 0 ? data.sumRating / data.count : 0;
      indirectAttainmentByPloId.set(ploId, Math.round((avgRating / 5) * 100 * 10) / 10);
    }

    // --- Fetch program-level direct/indirect weights from graduation criteria ---
    // Falls back to 80% direct / 20% indirect if not configured per program.
    const graduationCriteria = await prisma.graduation_criteria.findUnique({
      where: { programId: Number(programId) },
      select: { directWeight: true, indirectWeight: true },
    });
    const directWeight = graduationCriteria?.directWeight ?? 0.8;
    const indirectWeight = graduationCriteria?.indirectWeight ?? 0.2;

    // --- COMBINE: directWeight% direct (CLO + LLO) + indirectWeight% indirect ---
    const ploAttainments: PLOAttainment[] = plos.map((plo) => {
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
    console.error('Error fetching PLO attainments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PLO attainments' },
      { status: 500 }
    );
  }
}

// POST - Persist PLO attainments to the ploattainments table for historical tracking
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['admin', 'faculty', 'super_admin'].includes(auth.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { programId, semesterId } = body;

    if (!programId || !semesterId) {
      return NextResponse.json(
        { error: 'programId and semesterId are required' },
        { status: 400 }
      );
    }

    // ── Fetch PLOs with CLO + LLO attainments (same as GET) ───────────────────
    const plos = await prisma.plos.findMany({
      where: { programId: Number(programId), status: plo_status.active },
      include: {
        cloMappings: {
          include: {
            clo: {
              include: {
                closAttainments: {
                  where: { courseOffering: { semesterId: Number(semesterId) } },
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
                  where: { courseOffering: { semesterId: Number(semesterId) } },
                  orderBy: { calculatedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    // ── Direct attainment (weighted avg of CLO + LLO) ─────────────────────────
    const directByPlo = new Map<number, number>();
    for (const plo of plos) {
      const contributions = [
        ...plo.cloMappings.map((m) => ({
          attainment: m.clo.closAttainments[0]?.attainmentPercent ?? 0,
          weight: m.weight,
        })),
        ...plo.lloMappings.map((m) => ({
          attainment: m.llo.llosAttainments[0]?.attainmentPercent ?? 0,
          weight: m.weight,
        })),
      ];
      const totalWeight = contributions.reduce((s, c) => s + c.weight, 0);
      const weightedSum = contributions.reduce((s, c) => s + c.attainment * c.weight, 0);
      directByPlo.set(plo.id, totalWeight > 0 ? weightedSum / totalWeight : 0);
    }

    // ── Indirect attainment (closed surveys) ──────────────────────────────────
    const courseOfferings = await prisma.courseofferings.findMany({
      where: {
        semesterId: Number(semesterId),
        course: { programs: { some: { id: Number(programId) } } },
      },
      select: { id: true },
    });
    const offeringIds = courseOfferings.map((co) => co.id);
    const indirectByPlo = new Map<number, { sumRating: number; count: number }>();

    if (offeringIds.length > 0) {
      const surveys = await prisma.surveys.findMany({
        where: { courseOfferingId: { in: offeringIds }, status: 'closed' },
        include: {
          questions: {
            where: { ploId: { not: null } },
            include: { answers: { select: { ratingValue: true } } },
          },
          _count: { select: { responses: true } },
        },
      });
      for (const survey of surveys) {
        const responseCount = survey._count.responses;
        if (responseCount === 0) continue;
        for (const q of survey.questions) {
          if (!q.ploId) continue;
          const ratings = q.answers
            .filter((a) => a.ratingValue !== null)
            .map((a) => a.ratingValue as number);
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

    // ── Graduation criteria weights + PLO threshold ────────────────────────────
    const graduationCriteria = await prisma.graduation_criteria.findUnique({
      where: { programId: Number(programId) },
      select: { directWeight: true, indirectWeight: true, minPloAttainmentPercent: true },
    });
    const directWeight = graduationCriteria?.directWeight ?? 0.8;
    const indirectWeight = graduationCriteria?.indirectWeight ?? 0.2;
    const ploThreshold = graduationCriteria?.minPloAttainmentPercent ?? 50;

    // ── Count total students enrolled in this program/semester ────────────────
    const enrolledStudentSections = await prisma.studentsections.findMany({
      where: {
        status: 'active',
        student: { programId: Number(programId) },
        section: { courseOffering: { semesterId: Number(semesterId) } },
      },
      select: { studentId: true },
    });
    const totalStudents = new Set(enrolledStudentSections.map((ss) => ss.studentId)).size;

    // ── Upsert each PLO attainment record ─────────────────────────────────────
    const saved = await Promise.all(
      plos.map((plo) => {
        const directAttainment = directByPlo.get(plo.id) ?? 0;
        const indirectRaw = indirectByPlo.get(plo.id);
        const indirectAttainment =
          indirectRaw && indirectRaw.count > 0
            ? Math.round((indirectRaw.sumRating / indirectRaw.count / 5) * 100 * 10) / 10
            : null;

        const attainmentPercent =
          indirectAttainment !== null
            ? directWeight * directAttainment + indirectWeight * indirectAttainment
            : directAttainment;

        const studentsAchieved =
          totalStudents > 0 ? Math.round((attainmentPercent / 100) * totalStudents) : 0;

        return prisma.ploattainments.upsert({
          where: {
            ploId_programId_semesterId: {
              ploId: plo.id,
              programId: Number(programId),
              semesterId: Number(semesterId),
            },
          },
          update: {
            attainmentPercent,
            directAttainment,
            indirectAttainment,
            totalStudents,
            studentsAchieved,
            threshold: ploThreshold,
            calculatedAt: new Date(),
            calculatedBy: auth.user!.userId,
            status: 'active',
          },
          create: {
            ploId: plo.id,
            programId: Number(programId),
            semesterId: Number(semesterId),
            attainmentPercent,
            directAttainment,
            indirectAttainment,
            totalStudents,
            studentsAchieved,
            threshold: ploThreshold,
            calculatedBy: auth.user!.userId,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `PLO attainments saved for ${saved.length} PLO(s)`,
      data: saved,
    });
  } catch (error) {
    console.error('Error saving PLO attainments:', error);
    return NextResponse.json({ error: 'Failed to save PLO attainments' }, { status: 500 });
  }
}
