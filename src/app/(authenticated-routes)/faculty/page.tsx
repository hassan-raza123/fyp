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
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Plus,
  Calculator,
  Eye,
  AlertTriangle,
  Star,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    totalCourses: number;
    totalSections: number;
    activeAssessments: number;
  };
  recentActivities: Array<{
    id: string;
    summary: string;
    createdAt: string;
    user: string;
    course?: string;
  }>;
  currentSemester: {
    name: string;
    startDate: string | null;
    endDate: string | null;
  } | null;
  upcomingAssessments: Array<{
    id: number;
    title: string;
    type: string;
    dueDate: string | null;
    course: {
      code: string;
      name: string;
    };
  }>;
  overdueAssessments: Array<{
    id: number;
    title: string;
    type: string;
    dueDate: string | null;
    course: {
      code: string;
      name: string;
    };
  }>;
  pendingWork: {
    pendingEvaluations: number;
    pendingMarksEntry: number;
    totalPending: number;
  };
  cloAttainmentSummary: {
    overallAttainment: number;
    totalCLOs: number;
    attainedCLOs: number;
    lowAttainmentCourses: Array<{
      courseCode: string;
      courseName: string;
      cloCode: string;
      attainment: number;
      threshold: number;
    }>;
  };
  studentAlerts: {
    atRiskStudents: Array<{
      studentId: number;
      studentName: string;
      rollNumber: string;
      course: {
        code: string;
        name: string;
      };
      assessment: string;
      percentage: number;
    }>;
    topPerformers: Array<{
      studentId: number;
      studentName: string;
      rollNumber: string;
      course: {
        code: string;
        name: string;
      };
      assessment: string;
      percentage: number;
    }>;
    averageClassPerformance: number;
  };
  recentGradingActivity: Array<{
    assessmentId: number;
    assessmentTitle: string;
    course: {
      code: string;
      name: string;
    };
    evaluatedAt: string | null;
    status: string;
  }>;
}

export default function FacultyOverview() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/faculty/overview', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch dashboard data');
        }
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

  if (!data) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Faculty Dashboard
          </h1>
          <p className='text-gray-500 dark:text-gray-400'>
            Welcome back! Here's your teaching overview.
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
          title='My Students'
          value={data.stats.totalStudents.toLocaleString()}
          icon={
            <Users className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
        />
        <StatCard
          title='My Courses'
          value={data.stats.totalCourses}
          icon={
            <BookOpen className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
        />
        <StatCard
          title='My Sections'
          value={data.stats.totalSections}
          icon={
            <GraduationCap className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
        />
        <StatCard
          title='Active Assessments'
          value={data.stats.activeAssessments}
          icon={
            <Target className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
        />
      </div>

      {/* Upcoming Assessments & Pending Work */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Upcoming Assessments */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='w-5 h-5 text-purple-600' />
                Upcoming Assessments
              </CardTitle>
              {data.overdueAssessments.length > 0 && (
                <Badge variant='destructive' className='gap-1'>
                  <AlertCircle className='w-3 h-3' />
                  {data.overdueAssessments.length} Overdue
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.upcomingAssessments.length === 0 &&
            data.overdueAssessments.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-4'>
                No upcoming assessments
              </p>
            ) : (
              <div className='space-y-3'>
                {data.overdueAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className='p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 rounded-lg'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p className='font-medium text-sm text-red-900 dark:text-red-100'>
                          {assessment.title}
                        </p>
                        <p className='text-xs text-red-700 dark:text-red-300 mt-1'>
                          {assessment.course.code} - {assessment.course.name}
                        </p>
                        <p className='text-xs text-red-600 dark:text-red-400 mt-1'>
                          Due: {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge variant='destructive' className='ml-2'>
                        Overdue
                      </Badge>
                    </div>
                  </div>
                ))}
                {data.upcomingAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer'
                    onClick={() => router.push(`/faculty/assessments/${assessment.id}`)}
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <p className='font-medium text-sm'>
                          {assessment.title}
                        </p>
                        <p className='text-xs text-muted-foreground mt-1'>
                          {assessment.course.code} - {assessment.course.name}
                        </p>
                        <p className='text-xs text-muted-foreground mt-1'>
                          Due: {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge variant='outline' className='ml-2'>
                        {assessment.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Work Summary */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertCircle className='w-5 h-5 text-orange-600' />
              Pending Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <FileText className='w-5 h-5 text-orange-600' />
                  <div>
                    <p className='font-medium text-sm'>Pending Evaluations</p>
                    <p className='text-xs text-muted-foreground'>
                      Results waiting for evaluation
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold text-orange-600'>
                    {data.pendingWork.pendingEvaluations}
                  </p>
                </div>
              </div>
              <div className='flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <Target className='w-5 h-5 text-blue-600' />
                  <div>
                    <p className='font-medium text-sm'>Pending Marks Entry</p>
                    <p className='text-xs text-muted-foreground'>
                      Assessments without marks
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-2xl font-bold text-blue-600'>
                    {data.pendingWork.pendingMarksEntry}
                  </p>
                </div>
              </div>
              {data.pendingWork.totalPending > 0 && (
                <Button
                  className='w-full'
                  onClick={() => router.push('/faculty/results/marks-entry')}
                >
                  <FileText className='w-4 h-4 mr-2' />
                  Go to Marks Entry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CLO Attainment & Student Performance */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* CLO Attainment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='w-5 h-5 text-purple-600' />
              CLO Attainment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg'>
                <div>
                  <p className='text-sm font-medium'>Overall Attainment</p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {data.cloAttainmentSummary.attainedCLOs} of{' '}
                    {data.cloAttainmentSummary.totalCLOs} CLOs attained
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-3xl font-bold text-purple-600'>
                    {data.cloAttainmentSummary.overallAttainment.toFixed(1)}%
                  </p>
                </div>
              </div>
              {data.cloAttainmentSummary.lowAttainmentCourses.length > 0 && (
                <div>
                  <p className='text-sm font-medium mb-2 text-orange-600'>
                    Low Attainment CLOs
                  </p>
                  <div className='space-y-2'>
                    {data.cloAttainmentSummary.lowAttainmentCourses.map(
                      (course, index) => (
                        <div
                          key={index}
                          className='p-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded text-xs'
                        >
                          <p className='font-medium'>
                            {course.courseCode} - {course.cloCode}
                          </p>
                          <p className='text-muted-foreground'>
                            {course.attainment.toFixed(1)}% (Threshold:{' '}
                            {course.threshold}%)
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
              <Button
                variant='outline'
                className='w-full'
                onClick={() => router.push('/faculty/results/clo-attainments')}
              >
                <Target className='w-4 h-4 mr-2' />
                View All CLO Attainments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Performance Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5 text-blue-600' />
              Student Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {/* Average Class Performance */}
              <div className='p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium'>Average Class Performance</p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Across all assessments
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-bold text-blue-600'>
                      {data.studentAlerts.averageClassPerformance.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {data.studentAlerts.atRiskStudents.length > 0 && (
                <div>
                  <p className='text-sm font-medium mb-2 text-red-600 flex items-center gap-1'>
                    <AlertTriangle className='w-4 h-4' />
                    At-Risk Students
                  </p>
                  <div className='space-y-2 max-h-32 overflow-y-auto'>
                    {data.studentAlerts.atRiskStudents.map((student) => (
                      <div
                        key={student.studentId}
                        className='p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded text-xs'
                      >
                        <p className='font-medium'>
                          {student.studentName} ({student.rollNumber})
                        </p>
                        <p className='text-muted-foreground'>
                          {student.course.code} - {student.assessment}:{' '}
                          {student.percentage.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.studentAlerts.topPerformers.length > 0 && (
                <div>
                  <p className='text-sm font-medium mb-2 text-green-600 flex items-center gap-1'>
                    <Star className='w-4 h-4' />
                    Top Performers
                  </p>
                  <div className='space-y-2 max-h-32 overflow-y-auto'>
                    {data.studentAlerts.topPerformers.map((student) => (
                      <div
                        key={student.studentId}
                        className='p-2 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded text-xs'
                      >
                        <p className='font-medium'>
                          {student.studentName} ({student.rollNumber})
                        </p>
                        <p className='text-muted-foreground'>
                          {student.course.code} - {student.assessment}:{' '}
                          {student.percentage.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button
                variant='outline'
                className='w-full'
                onClick={() => router.push('/faculty/students')}
              >
                <Eye className='w-4 h-4 mr-2' />
                View All Students
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grading Activity */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle2 className='w-5 h-5 text-green-600' />
            Recent Grading Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentGradingActivity.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-4'>
              No recent grading activity
            </p>
          ) : (
            <div className='space-y-3'>
              {data.recentGradingActivity.map((activity) => (
                <div
                  key={activity.assessmentId}
                  className='p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer'
                  onClick={() =>
                    router.push(`/faculty/assessments/${activity.assessmentId}`)
                  }
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <p className='font-medium text-sm'>
                        {activity.assessmentTitle}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {activity.course.code} - {activity.course.name}
                      </p>
                      {activity.evaluatedAt && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          Evaluated:{' '}
                          {new Date(activity.evaluatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        activity.status === 'published'
                          ? 'default'
                          : 'secondary'
                      }
                      className='ml-2'
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.pendingWork.pendingEvaluations > 0 && (
            <Button
              variant='outline'
              className='w-full mt-4'
              onClick={() => router.push('/faculty/results/result-evaluation')}
            >
              <FileText className='w-4 h-4 mr-2' />
              View Pending Evaluations ({data.pendingWork.pendingEvaluations})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Zap className='w-5 h-5 text-yellow-600' />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <Button
                variant='outline'
                className='w-full justify-start'
                onClick={() => router.push('/faculty/assessments')}
              >
                <Plus className='w-4 h-4 mr-2' />
                Create Assessment
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start'
                onClick={() => router.push('/faculty/results/marks-entry')}
              >
                <FileText className='w-4 h-4 mr-2' />
                Enter Marks
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start'
                onClick={() => router.push('/faculty/results/clo-attainments')}
              >
                <Calculator className='w-4 h-4 mr-2' />
                Calculate CLO Attainments
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start'
                onClick={() => router.push('/faculty/results')}
              >
                <Award className='w-4 h-4 mr-2' />
                Manage Grades
              </Button>
              <Button
                variant='outline'
                className='w-full justify-start'
                onClick={() => router.push('/faculty/analytics')}
              >
                <BarChart2 className='w-4 h-4 mr-2' />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  summary={
                    activity.course
                      ? `${activity.summary} - ${activity.course}`
                      : activity.summary
                  }
                  user={activity.user}
                  time={new Date(activity.createdAt).toLocaleString()}
                  icon={
                    <FileText className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg'>
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
            <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <BarChart2 className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  Total Pending Work
                </span>
              </div>
              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                {data.pendingWork.totalPending}
              </span>
            </div>
            <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg'>
              <div className='flex items-center space-x-3'>
                <Target className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  CLO Attainment
                </span>
              </div>
              <span className='text-sm font-medium text-gray-900 dark:text-white'>
                {data.cloAttainmentSummary.overallAttainment.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
