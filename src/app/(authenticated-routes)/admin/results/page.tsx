'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  FileText,
  GraduationCap,
  LineChart,
  ListChecks,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResultsPage() {
  return (
    <div className='p-6'>
      <h1 className='text-2xl font-bold mb-6'>Results Management</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Link href='/admin/results/marks-entry'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                Marks Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                Enter and manage student assessment marks
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/evaluation'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ListChecks className='h-5 w-5' />
                Result Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                Review and evaluate assessment results
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/analytics'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5' />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                View detailed analytics and performance metrics
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/clo-attainments'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                CLO Attainments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                Calculate and analyze CLO achievement percentages
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/plo-attainments'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <GraduationCap className='h-5 w-5' />
                PLO Attainments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                Track and analyze program learning outcomes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/reports'>
          <Card className='hover:bg-gray-50 transition-colors cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <LineChart className='h-5 w-5' />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-500'>
                Generate and view detailed result reports
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold mb-4'>Quick Actions</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Link
            href='/admin/results/marks-entry'
            className='text-blue-600 hover:underline'
          >
            Enter New Marks
          </Link>
          <Link
            href='/admin/results/evaluation'
            className='text-blue-600 hover:underline'
          >
            Evaluate Results
          </Link>
          <Link
            href='/admin/results/clo-attainments'
            className='text-blue-600 hover:underline'
          >
            Calculate CLOs
          </Link>
          <Link
            href='/admin/results/plo-attainments'
            className='text-blue-600 hover:underline'
          >
            Calculate PLOs
          </Link>
        </div>
      </div>
    </div>
  );
}
