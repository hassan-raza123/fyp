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
  AlertTriangle,
  UserCheck,
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

interface ApiError {
  error: string;
  status?: number;
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
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/department/analytics');
        const responseData = await response.json();

        if (!response.ok) {
          // Check if it's a department assignment error
          if (
            responseData.error &&
            responseData.error.includes('Department admin not found')
          ) {
            setError({
              error: 'No department assigned',
              status: response.status,
            });
          } else {
            setError({
              error: responseData.error || 'Failed to fetch analytics data',
              status: response.status,
            });
          }
          return;
        }

        setData(responseData);
      } catch (err) {
        setError({
          error:
            err instanceof Error
              ? err.message
              : 'An error occurred while fetching analytics data',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>
            Loading analytics dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Handle department not assigned error
  if (error && error.error === 'No department assigned') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='max-w-md mx-auto text-center'>
          <div className='bg-yellow-50 dark:bg-yellow-900/20 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center'>
            <AlertTriangle className='w-10 h-10 text-yellow-600 dark:text-yellow-400' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            No Department Assigned
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            You don't have a department assigned yet. Please contact the system
            administrator to assign you to a department.
          </p>
          <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400'>
            <p className='font-medium mb-2'>What you can do:</p>
            <ul className='text-left space-y-1'>
              <li>• Contact your system administrator</li>
              <li>• Request department assignment</li>
              <li>• Check your user role and permissions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Handle other errors
  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='max-w-md mx-auto text-center'>
          <div className='bg-red-50 dark:bg-red-900/20 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center'>
            <AlertTriangle className='w-10 h-10 text-red-600 dark:text-red-400' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Something went wrong
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>{error.error}</p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors'
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='bg-gray-50 dark:bg-gray-800 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center'>
            <UserCheck className='w-10 h-10 text-gray-400' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            No Analytics Data Available
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            No analytics data found. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

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
          change={-2}
          trend='down'
        />
        <StatCard
          title='Retention Rate'
          value={data.stats.retentionRate + '%'}
          icon={
            <TrendingUp className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={8}
          trend='up'
        />
      </div>

      {/* Charts Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Enrollment Trend */}
        <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Enrollment Trend
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <LineChart data={data.enrollmentTrend}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='month' />
              <YAxis />
              <Tooltip />
              <Line
                type='monotone'
                dataKey='students'
                stroke='#8B5CF6'
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Program Distribution */}
        <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
            Program Distribution
          </h3>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={data.programDistribution}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill='#8884d8'
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
      </div>

      {/* GPA Distribution */}
      <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
          GPA Distribution
        </h3>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={gpaBarData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='range' />
            <YAxis />
            <Tooltip />
            <Bar dataKey='students' fill='#8B5CF6' />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
