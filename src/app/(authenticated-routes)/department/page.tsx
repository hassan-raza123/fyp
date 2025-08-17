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
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

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

interface ActivityItemProps {
  summary: string;
  user: string;
  time: string;
  icon: React.ReactNode;
}

const ActivityItem = ({ summary, user, time, icon }: ActivityItemProps) => (
  <div className='flex items-start space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors'>
    <div className='p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
      {icon}
    </div>
    <div className='flex-1 min-w-0'>
      <p className='text-sm font-medium text-gray-900 dark:text-white'>
        {summary}
      </p>
      <p className='text-xs text-gray-500 dark:text-gray-400'>By {user}</p>
      <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>{time}</p>
    </div>
  </div>
);

interface DashboardData {
  stats: {
    totalStudents: number;
    totalPrograms: number;
    totalCourses: number;
    totalFaculty: number;
  };
  recentActivities: Array<{
    id: string;
    summary: string;
    createdAt: string;
    user: string;
  }>;
  currentSemester: {
    name: string;
    startDate: string;
    endDate: string;
  };
  departmentInfo: {
    name: string;
    code: string;
  };
}

interface ApiError {
  error: string;
  status?: number;
}

export default function DepartmentOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/department/overview');
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
              error: responseData.error || 'Failed to fetch dashboard data',
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
              : 'An error occurred while fetching data',
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
            Loading department dashboard...
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
            No Data Available
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            No dashboard data found. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Department Dashboard
          </h1>
          <p className='text-gray-500 dark:text-gray-400'>
            Welcome to {data.departmentInfo.name} ({data.departmentInfo.code})
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          <button className='px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-primary rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors'>
            <FileText className='w-4 h-4 inline mr-2' />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total Students'
          value={data.stats.totalStudents.toLocaleString()}
          icon={
            <Users className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={12}
          trend='up'
        />
        <StatCard
          title='Active Programs'
          value={data.stats.totalPrograms}
          icon={
            <GraduationCap className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={8}
          trend='up'
        />
        <StatCard
          title='Total Courses'
          value={data.stats.totalCourses}
          icon={
            <BookOpen className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={-3}
          trend='down'
        />
        <StatCard
          title='Faculty Members'
          value={data.stats.totalFaculty}
          icon={
            <Building2 className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Recent Activity */}
        <div className='lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700'>
          <div className='p-6 border-b border-gray-100 dark:border-gray-700'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Recent Activity
            </h2>
          </div>
          <div className='divide-y divide-gray-100 dark:divide-gray-700'>
            {data.recentActivities.length === 0 ? (
              <div className='p-6 text-center text-gray-400 dark:text-gray-500'>
                No recent activity.
              </div>
            ) : (
              data.recentActivities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  summary={activity.summary}
                  user={activity.user}
                  time={new Date(activity.createdAt).toLocaleString()}
                  icon={
                    <Users className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className='space-y-6'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Quick Stats
            </h2>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <Calendar className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                  <span className='text-sm text-gray-600 dark:text-gray-400'>
                    Current Semester
                  </span>
                </div>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  {data.currentSemester
                    ? data.currentSemester.name
                    : 'No active semester'}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <BarChart2 className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                  <span className='text-sm text-gray-600 dark:text-gray-400'>
                    Average GPA
                  </span>
                </div>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  3.45
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <TrendingUp className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                  <span className='text-sm text-gray-600 dark:text-gray-400'>
                    Enrollment Rate
                  </span>
                </div>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  +15%
                </span>
              </div>
            </div>
          </div>

          <div className='bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white'>
            <h2 className='text-lg font-semibold mb-2'>Need Help?</h2>
            <p className='text-sm text-purple-100 mb-4'>
              Get support from our team or check the documentation
            </p>
            <button className='w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium'>
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
