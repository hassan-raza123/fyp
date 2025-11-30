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
      <h1 className='text-2xl font-bold mb-6 text-primary-text'>Results Management</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Link href='/admin/results/marks-entry'>
          <Card 
            className='transition-colors cursor-pointer border-card-border'
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
          >
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-primary-text'>
                <FileText className='h-5 w-5' style={{ color: 'var(--blue)' }} />
                Marks Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-secondary-text'>
                Enter and manage student assessment marks
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/result-evaluation'>
          <Card 
            className='transition-colors cursor-pointer border-card-border'
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
          >
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-primary-text'>
                <ListChecks className='h-5 w-5' style={{ color: 'var(--blue)' }} />
                Result Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-secondary-text'>
                Review and evaluate assessment results
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/analytics'>
          <Card 
            className='transition-colors cursor-pointer border-card-border'
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
          >
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-primary-text'>
                <BarChart3 className='h-5 w-5' style={{ color: 'var(--blue)' }} />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-secondary-text'>
                View detailed analytics and performance metrics
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/clo-attainments'>
          <Card 
            className='transition-colors cursor-pointer border-card-border'
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
          >
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-primary-text'>
                <Target className='h-5 w-5' style={{ color: 'var(--blue)' }} />
                CLO Attainments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-secondary-text'>
                Calculate and analyze CLO achievement percentages
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/plo-attainments'>
          <Card 
            className='transition-colors cursor-pointer border-card-border'
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
          >
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-primary-text'>
                <GraduationCap className='h-5 w-5' style={{ color: 'var(--blue)' }} />
                PLO Attainments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-secondary-text'>
                Track and analyze program learning outcomes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/llo-attainments'>
          <Card 
            className='transition-colors cursor-pointer border-card-border'
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
            }}
          >
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-primary-text'>
                <Target className='h-5 w-5' style={{ color: 'var(--blue)' }} />
                LLO Attainments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-secondary-text'>
                Calculate and view Lab Learning Outcome achievements
              </p>
            </CardContent>
          </Card>
        </Link>

      </div>

      <div className='mt-8'>
        <h2 className='text-xl font-semibold mb-4 text-primary-text'>Quick Actions</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Link
            href='/admin/results/marks-entry'
            className='transition-colors hover:underline'
            style={{ color: 'var(--blue)' }}
          >
            Enter New Marks
          </Link>
          <Link
            href='/admin/results/result-evaluation'
            className='transition-colors hover:underline'
            style={{ color: 'var(--blue)' }}
          >
            Evaluate Results
          </Link>
          <Link
            href='/admin/results/clo-attainments'
            className='transition-colors hover:underline'
            style={{ color: 'var(--blue)' }}
          >
            Calculate CLOs
          </Link>
          <Link
            href='/admin/results/plo-attainments'
            className='transition-colors hover:underline'
            style={{ color: 'var(--blue)' }}
          >
            Calculate PLOs
          </Link>
          <Link
            href='/admin/results/llo-attainments'
            className='transition-colors hover:underline'
            style={{ color: 'var(--blue)' }}
          >
            Calculate LLOs
          </Link>
        </div>
      </div>
    </div>
  );
}
