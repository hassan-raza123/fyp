'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResultsPage() {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>My Results</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Link href='/student/results/clo-attainments'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                My CLO Attainments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                View my Course Learning Outcomes achievement
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/student/results/plo-attainments'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <GraduationCap className='h-5 w-5' />
                My PLO Attainments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                View my Program Learning Outcomes achievement
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
