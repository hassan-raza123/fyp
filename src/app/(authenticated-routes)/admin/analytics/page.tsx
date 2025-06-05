'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  FileText,
  Target,
  Award,
  Download,
  Filter,
} from 'lucide-react';

// Chart components (you'll need to install and import these)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalyticsData {
  enrollmentTrend: { month: string; students: number }[];
  programDistribution: { name: string; value: number }[];
  gpaDistribution: { gpa: number; students: number }[];
  stats: {
    totalEnrollment: number;
    programCompletion: number;
    averageGPA: number;
    retentionRate: number;
  };
}

const COLORS = ['#8B5CF6', '#6366F1', '#4F46E5', '#3730A3', '#312E81'];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down';
}

const StatCard = ({ title, value, icon, change, trend }: StatCardProps) => (
  <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700'>
    <div className='flex items-center justify-between'>
      <div>
        <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
          {title}
        </p>
        <h3 className='text-2xl font-bold mt-1 text-gray-900 dark:text-white'>
          {value}
        </h3>
        {change !== undefined && (
          <div className='flex items-center mt-2'>
            <span
              className={`text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend === 'up' ? (
                <ArrowUpRight className='inline w-4 h-4' />
              ) : (
                <ArrowDownRight className='inline w-4 h-4' />
              )}
              {change}%
            </span>
            <span className='text-sm text-gray-500 dark:text-gray-400 ml-2'>
              vs last month
            </span>
          </div>
        )}
      </div>
      <div className='p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
        {icon}
      </div>
    </div>
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500'></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-red-500'>Error: {error}</div>
      </div>
    );
  }
  if (!data) return null;

  // GPA buckets for bar chart
  const gpaBuckets = [4, 3.5, 3, 2.5, 2, 0];
  const gpaBarData = gpaBuckets.slice(0, -1).map((gpa, i) => {
    const count = data.gpaDistribution
      .filter((d) => d.gpa >= gpaBuckets[i + 1] && d.gpa < gpa)
      .reduce((sum, d) => sum + d.students, 0);
    return {
      range: `${gpaBuckets[i + 1].toFixed(1)}-${gpa.toFixed(1)}`,
      students: count,
    };
  });

  // Program completion percentage
  const programCompletionPercent = data.stats.totalEnrollment
    ? Math.round(
        (data.stats.programCompletion / data.stats.totalEnrollment) * 100
      )
    : 0;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Analytics Dashboard
          </h1>
          <p className='text-gray-500 dark:text-gray-400'>
            Comprehensive insights and statistics
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          <button className='px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-primary rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors'>
            <Filter className='w-4 h-4 inline mr-2' />
            Filter
          </button>
          <button className='px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-primary rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors'>
            <Download className='w-4 h-4 inline mr-2' />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total Enrollment'
          value={data.stats.totalEnrollment.toLocaleString()}
          icon={
            <Users className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={12}
          trend='up'
        />
        <StatCard
          title='Program Completion'
          value={programCompletionPercent + '%'}
          icon={
            <GraduationCap className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={5}
          trend='up'
        />
        <StatCard
          title='Average GPA'
          value={data.stats.averageGPA.toFixed(2)}
          icon={
            <BarChart2 className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={2}
          trend='up'
        />
        <StatCard
          title='Retention Rate'
          value={Math.round(data.stats.retentionRate * 100) + '%'}
          icon={
            <TrendingUp className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={3}
          trend='up'
        />
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Enrollment Trend */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Enrollment Trend
          </h2>
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data.enrollmentTrend}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='month' stroke='#6B7280' />
                <YAxis stroke='#6B7280' />
                <Tooltip />
                <Line
                  type='monotone'
                  dataKey='students'
                  stroke='#8B5CF6'
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program Distribution */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Program Distribution
          </h2>
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={data.programDistribution}
                  cx='50%'
                  cy='50%'
                  innerRadius={60}
                  outerRadius={80}
                  fill='#8884d8'
                  paddingAngle={5}
                  dataKey='value'
                >
                  {data.programDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className='grid grid-cols-2 gap-4 mt-4'>
            {data.programDistribution.map((program, index) => (
              <div key={program.name} className='flex items-center space-x-2'>
                <div
                  className='w-3 h-3 rounded-full'
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  {program.name}
                </span>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  {program.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GPA Distribution */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            GPA Distribution
          </h2>
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={gpaBarData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='range' stroke='#6B7280' />
                <YAxis stroke='#6B7280' />
                <Tooltip />
                <Bar dataKey='students' fill='#8B5CF6' />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics */}
        <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Key Metrics
          </h2>
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <Calendar className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  Current Semester
                </span>
              </div>
              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                -
              </span>
            </div>
            <div className='flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <Target className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  Program Success Rate
                </span>
              </div>
              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                {programCompletionPercent}%
              </span>
            </div>
            <div className='flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <Award className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  Top Performing Program
                </span>
              </div>
              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                {data.programDistribution.length > 0
                  ? data.programDistribution.reduce((a, b) =>
                      a.value > b.value ? a : b
                    ).name
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
