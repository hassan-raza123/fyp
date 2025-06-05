import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, plo_status } from '@prisma/client';

interface PLOAttainment {
  ploId: number;
  ploCode: string;
  description: string;
  attainment: number;
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

    // Fetch PLOs for the program
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

    // Calculate PLO attainments
    const ploAttainments: PLOAttainment[] = plos.map((plo) => {
      // Get CLOs that contribute to this PLO
      const contributingClos = plo.cloMappings.map((mapping) => ({
        cloId: mapping.clo.id,
        cloCode: mapping.clo.code,
        attainment: mapping.clo.closAttainments[0]?.attainmentPercent || 0,
        weight: mapping.weight,
      }));

      // Calculate weighted average of CLO attainments
      const totalWeight = contributingClos.reduce(
        (sum: number, clo) => sum + clo.weight,
        0
      );

      const weightedSum = contributingClos.reduce(
        (sum: number, clo) => sum + clo.attainment * clo.weight,
        0
      );

      const attainment = totalWeight > 0 ? weightedSum / totalWeight : 0;

      return {
        ploId: plo.id,
        ploCode: plo.code,
        description: plo.description,
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
