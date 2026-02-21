import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { plo_status } from '@prisma/client';

interface PLOAttainment {
  ploId: number;
  ploCode: string;
  description: string;
  attainment: number;
  directAttainment: number;
  indirectAttainment: number | null;
  contributingClos: {
    cloId: number;
    cloCode: string;
    attainment: number;
    weight: number;
  }[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const semesterId = searchParams.get('semesterId');

    if (!programId || !semesterId) {
      return NextResponse.json(
        { error: 'Program ID and Semester ID are required' },
        { status: 400 }
      );
    }

    // Fetch PLOs for the program with CLO mappings and attainments
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
                },
              },
            },
          },
        },
      },
    });

    // --- DIRECT ATTAINMENT: weighted average of CLO attainments ---
    const directAttainmentByPlo = new Map<number, { attainment: number; contributingClos: PLOAttainment['contributingClos'] }>();

    for (const plo of plos) {
      const contributingClos = plo.cloMappings.map((mapping) => ({
        cloId: mapping.clo.id,
        cloCode: mapping.clo.code,
        attainment: mapping.clo.closAttainments[0]?.attainmentPercent || 0,
        weight: mapping.weight,
      }));

      const totalWeight = contributingClos.reduce((sum, clo) => sum + clo.weight, 0);
      const weightedSum = contributingClos.reduce((sum, clo) => sum + clo.attainment * clo.weight, 0);
      const directAttainment = totalWeight > 0 ? weightedSum / totalWeight : 0;

      directAttainmentByPlo.set(plo.id, { attainment: directAttainment, contributingClos });
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

    // --- COMBINE: 70% direct + 30% indirect (if indirect data exists) ---
    const ploAttainments: PLOAttainment[] = plos.map((plo) => {
      const direct = directAttainmentByPlo.get(plo.id);
      const directAttainment = direct?.attainment ?? 0;
      const contributingClos = direct?.contributingClos ?? [];
      const indirectAttainment = indirectAttainmentByPloId.get(plo.id) ?? null;

      const attainment =
        indirectAttainment !== null
          ? 0.7 * directAttainment + 0.3 * indirectAttainment
          : directAttainment;

      return {
        ploId: plo.id,
        ploCode: plo.code,
        description: plo.description,
        directAttainment,
        indirectAttainment,
        attainment,
        contributingClos,
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
