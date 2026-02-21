'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  BarChart3,
  FileText,
  GraduationCap,
  ListChecks,
  Target,
  ChevronRight,
  PenLine,
  ListTodo,
  Calculator,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResultsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  const cards = [
    {
      href: '/faculty/results/marks-entry',
      icon: FileText,
      title: 'Marks Entry',
      description: 'Enter and manage student assessment marks',
    },
    {
      href: '/faculty/results/result-evaluation',
      icon: ListChecks,
      title: 'Result Evaluation',
      description: 'Review and evaluate assessment results',
    },
    {
      href: '/faculty/results/analytics',
      icon: BarChart3,
      title: 'Analytics',
      description: 'View detailed analytics and performance metrics',
    },
    {
      href: '/faculty/results/clo-attainments',
      icon: Target,
      title: 'CLO Attainments',
      description: 'Calculate and analyze CLO achievement percentages',
    },
    {
      href: '/faculty/results/plo-attainments',
      icon: GraduationCap,
      title: 'PLO Attainments',
      description: 'Track and analyze program learning outcomes',
    },
    {
      href: '/faculty/results/grade-management',
      icon: FileText,
      title: 'Grade Management',
      description: 'Calculate, review, and manage student final grades',
    },
  ];

  const quickActions = [
    { href: '/faculty/results/marks-entry', label: 'Enter New Marks', icon: PenLine },
    { href: '/faculty/results/result-evaluation', label: 'Evaluate Results', icon: ListTodo },
    { href: '/faculty/results/clo-attainments', label: 'Calculate CLOs', icon: Calculator },
    { href: '/faculty/results/plo-attainments', label: 'Calculate PLOs', icon: BookOpen },
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header - Admin CLO / Results style */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBgColor }}
        >
          <TrendingUp className="h-5 w-5" style={{ color: primaryColor }} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-primary-text">Results Management</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Marks, evaluations, analytics, and grade management
          </p>
        </div>
      </div>

      {/* Main cards - Admin CLO theme with icon boxes + ChevronRight */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href}>
            <Card className="rounded-lg border border-card-border bg-card overflow-hidden transition-all cursor-pointer hover:bg-[var(--hover-bg)]">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-primary-text">
                  <span
                    className="card-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                    style={{ backgroundColor: iconBgColor }}
                  >
                    <Icon className="h-4 w-4" style={{ color: primaryColor }} />
                  </span>
                  <span className="flex-1">{title}</span>
                  <ChevronRight className="h-4 w-4 text-muted-text" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-secondary-text">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions - Admin CLO page button style */}
      <div className="rounded-lg border border-card-border bg-card overflow-hidden p-4">
        <h2 className="text-sm font-semibold mb-3 text-primary-text">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button
                type="button"
                className="w-full px-3 py-2.5 rounded-lg transition-colors text-xs font-medium h-9 flex items-center gap-2 border border-transparent"
                style={{ backgroundColor: iconBgColor, color: primaryColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(252, 153, 40, 0.2)'
                    : 'rgba(38, 40, 149, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = iconBgColor;
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
