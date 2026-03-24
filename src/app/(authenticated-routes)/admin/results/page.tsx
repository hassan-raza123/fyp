'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  BarChart3,
  GraduationCap,
  Target,
  ChevronRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResultsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const quickActions = [
    { href: '/admin/results/clo-attainments', label: 'Calculate CLOs', icon: Target },
    { href: '/admin/results/plo-attainments', label: 'Calculate PLOs', icon: GraduationCap },
    { href: '/admin/results/llo-attainments', label: 'Calculate LLOs', icon: BookOpen },
  ];

  return (
    <div className='space-y-4'>
      {/* Header - CLO page style */}
      <div className='flex items-center gap-3'>
        <div
          className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'
          style={{ backgroundColor: iconBgColor }}
        >
          <TrendingUp className='h-5 w-5' style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className='text-lg font-bold text-primary-text'>Results</h1>
          <p className='text-xs text-secondary-text mt-0.5'>
            View attainments and analytics across the department
          </p>
        </div>
      </div>

      {/* Main cards - CLO theme with icon boxes */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <Link href='/admin/results/analytics'>
          <Card
            className='rounded-lg border border-card-border bg-card overflow-hidden transition-all cursor-pointer hover:bg-hover-bg'
          >
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-3 text-primary-text'>
                <span
                  className='card-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors'
                  style={{ backgroundColor: iconBgColor }}
                >
                  <BarChart3 className='h-4 w-4' style={{ color: primaryColor }} />
                </span>
                <span className='flex-1'>Analytics</span>
                <ChevronRight className='h-4 w-4 text-muted-text' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-secondary-text'>
                View detailed analytics and performance metrics
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/clo-attainments'>
          <Card
            className='rounded-lg border border-card-border bg-card overflow-hidden transition-all cursor-pointer hover:bg-hover-bg'
          >
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-3 text-primary-text'>
                <span
                  className='card-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors'
                  style={{ backgroundColor: iconBgColor }}
                >
                  <Target className='h-4 w-4' style={{ color: primaryColor }} />
                </span>
                <span className='flex-1'>CLO Attainments</span>
                <ChevronRight className='h-4 w-4 text-muted-text' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-secondary-text'>
                Calculate and analyze CLO achievement percentages
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/plo-attainments'>
          <Card
            className='rounded-lg border border-card-border bg-card overflow-hidden transition-all cursor-pointer hover:bg-hover-bg'
          >
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-3 text-primary-text'>
                <span
                  className='card-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors'
                  style={{ backgroundColor: iconBgColor }}
                >
                  <GraduationCap className='h-4 w-4' style={{ color: primaryColor }} />
                </span>
                <span className='flex-1'>PLO Attainments</span>
                <ChevronRight className='h-4 w-4 text-muted-text' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-secondary-text'>
                Track and analyze program learning outcomes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href='/admin/results/llo-attainments'>
          <Card
            className='rounded-lg border border-card-border bg-card overflow-hidden transition-all cursor-pointer hover:bg-hover-bg'
          >
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center gap-3 text-primary-text'>
                <span
                  className='card-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors'
                  style={{ backgroundColor: iconBgColor }}
                >
                  <Target className='h-4 w-4' style={{ color: primaryColor }} />
                </span>
                <span className='flex-1'>LLO Attainments</span>
                <ChevronRight className='h-4 w-4 text-muted-text' />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-secondary-text'>
                Calculate and view Lab Learning Outcome achievements
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions - CLO page button style */}
      <div className='rounded-lg border border-card-border bg-card overflow-hidden p-4'>
        <h2 className='text-sm font-semibold mb-3 text-primary-text'>Quick Actions</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button
                type='button'
                className='w-full px-3 py-2.5 rounded-lg transition-colors text-xs font-medium h-9 flex items-center gap-2 border border-transparent'
                style={{ backgroundColor: iconBgColor, color: primaryColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(252, 153, 40, 0.2)' : 'rgba(38, 40, 149, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = iconBgColor;
                }}
              >
                <Icon className='w-3.5 h-3.5 shrink-0' />
                {label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
