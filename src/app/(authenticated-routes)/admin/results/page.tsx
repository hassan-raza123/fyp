'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  BarChart3,
  GraduationCap,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResultsPage() {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div>
        <h1 className='text-lg font-bold text-primary-text'>Results</h1>
        <p className='text-xs text-secondary-text mt-0.5'>View attainments and analytics across the department</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
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
                <BarChart3 className='h-5 w-5' style={{ color: primaryColor }} />
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
                <Target className='h-5 w-5' style={{ color: primaryColor }} />
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
                <GraduationCap className='h-5 w-5' style={{ color: primaryColor }} />
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
                <Target className='h-5 w-5' style={{ color: primaryColor }} />
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

      <div>
        <h2 className='text-sm font-semibold mb-3 text-primary-text'>Quick Actions</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Link
            href='/admin/results/clo-attainments'
            className='transition-colors hover:underline'
            style={{ color: primaryColor }}
          >
            Calculate CLOs
          </Link>
          <Link
            href='/admin/results/plo-attainments'
            className='transition-colors hover:underline'
            style={{ color: primaryColor }}
          >
            Calculate PLOs
          </Link>
          <Link
            href='/admin/results/llo-attainments'
            className='transition-colors hover:underline'
            style={{ color: primaryColor }}
          >
            Calculate LLOs
          </Link>
        </div>
      </div>
    </div>
  );
}
