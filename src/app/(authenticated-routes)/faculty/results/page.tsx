'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  BarChart3,
  FileText,
  GraduationCap,
  ListChecks,
  Target,
  PenLine,
  ListTodo,
  Calculator,
  BookOpen,
} from 'lucide-react';

export default function ResultsPage() {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode
    ? 'rgba(252, 153, 40, 0.15)'
    : 'rgba(38, 40, 149, 0.15)';

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

  return (
    <div className="p-6 bg-page min-h-[50vh]">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-primary-text">Results Management</h1>
        <p className="text-xs text-secondary-text mt-0.5">
          Marks, evaluations, analytics, and grade management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href}>
            <div
              className="rounded-xl border border-card-border bg-card shadow-sm p-4 hover:bg-[var(--hover-bg)] transition-colors cursor-pointer h-full"
              style={{ borderColor: 'var(--card-border)' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: iconBgColor, color: primaryColor }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-primary-text">{title}</h2>
              <p className="text-xs text-secondary-text mt-1">{description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-card-border bg-card shadow-sm p-4">
        <h2 className="text-sm font-semibold text-primary-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-90"
                style={{
                  backgroundColor: iconBgColor,
                  color: primaryColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(252, 153, 40, 0.25)'
                    : 'rgba(38, 40, 149, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = iconBgColor;
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
