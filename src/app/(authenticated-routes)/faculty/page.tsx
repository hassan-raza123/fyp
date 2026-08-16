'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Target,
  Award,
  Clock,
  AlertCircle,
  Zap,
  Plus,
  Calculator,
  Eye,
  AlertTriangle,
  Star,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ContactForm from '@/components/forms/ContactForm';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down';
  isDarkMode?: boolean;
}

const StatCard = ({ title, value, icon, change, trend, isDarkMode = false }: StatCardProps) => {
  const iconBgColor = isDarkMode
    ? 'var(--brand-primary-opacity-15)'
    : 'var(--brand-primary-opacity-15)';
  const iconColor = 'var(--accent)';

  return (
    <div className="bg-card border-card-border rounded-xl p-4 shadow-sm border transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-secondary-text">{title}</p>
          <h3 className="text-lg font-bold mt-1 text-primary-text">{value}</h3>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span
                className={`text-xs font-medium ${
                  trend === 'up' ? 'text-[var(--success-green)]' : 'text-[var(--error)]'
                }`}
              >
                {trend === 'up' ? (
                  <ArrowUpRight className="inline w-3 h-3" />
                ) : (
                  <ArrowDownRight className="inline w-3 h-3" />
                )}
                {change}%
              </span>
              <span className="text-xs text-secondary-text ml-2">vs last month</span>
            </div>
          )}
        </div>
        <div
          className="p-2 rounded-lg transition-transform duration-200 hover:scale-110"
          style={{ backgroundColor: iconBgColor }}
        >
          <div style={{ color: iconColor }}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

interface ActivityItemProps {
  summary: string;
  user: string;
  time: string;
  icon: React.ReactNode;
  isDarkMode?: boolean;
}

const ActivityItem = ({ summary, user, time, icon, isDarkMode = false }: ActivityItemProps) => {
  const iconBgColor = isDarkMode
    ? 'var(--brand-primary-opacity-10)'
    : 'var(--brand-primary-opacity-10)';
  const iconColor = 'var(--accent)';

  return (
    <div
      className="flex items-start space-x-3 p-3 rounded-lg transition-colors"
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div
        className="p-1.5 rounded-lg"
        style={{ backgroundColor: iconBgColor }}
      >
        <div style={{ color: iconColor }}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary-text">{summary}</p>
        <p className="text-[10px] text-secondary-text">By {user}</p>
        <p className="text-[10px] text-secondary-text mt-1">{time}</p>
      </div>
    </div>
  );
};

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
  attendance?: {
    sectionsTaught: number;
    openSessionCount: number;
    openSessions: Array<{
      sessionId: number;
      sectionId: number;
      sectionName: string;
      courseCode: string;
      date: string;
      slot: number;
    }>;
  };
}

export default function FacultyOverview() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  const isDarkMode = resolvedTheme === 'dark';
  const primaryColor = 'var(--accent)';
  const primaryColorDark = 'var(--accent-hover)';

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || loading) return <PageLoading message="Loading dashboard..." />;
  if (error) return <PageError message={error} />;

  if (!data) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header - same as admin */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-primary-text">
              Faculty Dashboard
            </h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Welcome back! Here's your teaching overview.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/faculty/analytics')}
              className="px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
              style={{
                backgroundColor: isDarkMode
                  ? 'var(--brand-primary-opacity-10)'
                  : 'var(--brand-primary-opacity-10)',
                color: primaryColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'var(--brand-primary-opacity-20)'
                  : 'var(--brand-primary-opacity-20)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode
                  ? 'var(--brand-primary-opacity-10)'
                  : 'var(--brand-primary-opacity-10)';
              }}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />
              Generate Report
            </button>
          </div>
        </div>

        {/* An attendance session left open does not count towards any
            student's percentage yet, so it is surfaced here rather than left
            to be discovered when the figures look wrong. */}
        {data.attendance && data.attendance.openSessionCount > 0 && (
          <button
            onClick={() => router.push('/faculty/attendance')}
            className="w-full flex items-start gap-3 rounded-lg border border-warn/40 bg-warn/10 p-4 text-left transition-colors hover:bg-warn/20"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
            <div className="text-sm">
              <p className="font-medium text-primary-text">
                {data.attendance.openSessionCount} attendance session
                {data.attendance.openSessionCount > 1 ? 's are' : ' is'} still
                open
              </p>
              <p className="mt-1 text-secondary-text">
                {data.attendance.openSessions
                  .slice(0, 3)
                  .map((s) => `${s.courseCode} ${s.date}`)
                  .join(', ')}
                {data.attendance.openSessionCount > 3 && ' and more'}. Open
                sessions do not count towards attendance until finalized.
              </p>
            </div>
          </button>
        )}

        {/* Stats Grid - admin style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="My Students"
            value={data.stats.totalStudents.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="My Courses"
            value={data.stats.totalCourses}
            icon={<BookOpen className="w-6 h-6" />}
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="My Sections"
            value={data.stats.totalSections}
            icon={<GraduationCap className="w-6 h-6" />}
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Active Assessments"
            value={data.stats.activeAssessments}
            icon={<Target className="w-6 h-6" />}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Upcoming Assessments & Pending Work */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming Assessments */}
          <div className="bg-card border-card-border rounded-xl shadow-sm border">
            <div className="p-4 border-b border-card-border">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-primary-text flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                  Upcoming Assessments
                </h2>
                {data.overdueAssessments.length > 0 && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {data.overdueAssessments.length} Overdue
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-4">
              {data.upcomingAssessments.length === 0 &&
              data.overdueAssessments.length === 0 ? (
                <p className="text-xs text-secondary-text text-center py-4">
                  No upcoming assessments
                </p>
              ) : (
                <div className="space-y-3">
                  {data.overdueAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="p-3 border rounded-lg text-xs"
                      style={{
                        borderColor: 'var(--error)',
                        backgroundColor: 'var(--error-opacity-10)',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-primary-text" style={{ color: 'var(--error)' }}>
                            {assessment.title}
                          </p>
                          <p className="text-secondary-text mt-1">
                            {assessment.course.code} - {assessment.course.name}
                          </p>
                          <p className="text-secondary-text mt-1">
                            Due: {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          Overdue
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {data.upcomingAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="p-3 border border-card-border rounded-lg transition-colors cursor-pointer hover:bg-[var(--hover-bg)]"
                      onClick={() => router.push(`/faculty/assessments/${assessment.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-primary-text">
                            {assessment.title}
                          </p>
                          <p className="text-xs text-secondary-text mt-1">
                            {assessment.course.code} - {assessment.course.name}
                          </p>
                          <p className="text-xs text-secondary-text mt-1">
                            Due: {assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          {assessment.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Work Summary */}
          <div className="bg-card border-card-border rounded-xl shadow-sm border">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text flex items-center gap-2">
                <AlertCircle className="w-4 h-4" style={{ color: primaryColor }} />
                Pending Work
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div
                className="flex items-center justify-between p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--brand-primary-opacity-10)',
                  borderColor: 'var(--brand-primary-opacity-20)',
                }}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                  <div>
                    <p className="font-medium text-sm text-primary-text">Pending Evaluations</p>
                    <p className="text-xs text-secondary-text">Results waiting for evaluation</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-primary-text" style={{ color: primaryColor }}>
                  {data.pendingWork.pendingEvaluations}
                </p>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--brand-primary-opacity-08)',
                  borderColor: 'var(--brand-primary-opacity-20)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5" style={{ color: primaryColor }} />
                  <div>
                    <p className="font-medium text-sm text-primary-text">Pending Marks Entry</p>
                    <p className="text-xs text-secondary-text">Assessments without marks</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-primary-text" style={{ color: primaryColor }}>
                  {data.pendingWork.pendingMarksEntry}
                </p>
              </div>
              {data.pendingWork.totalPending > 0 && (
                <button
                  type="button"
                  onClick={() => router.push('/faculty/results/marks-entry')}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-medium h-8 inline-flex items-center justify-center gap-1.5 text-white"
                  style={{ backgroundColor: primaryColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = primaryColorDark; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = primaryColor; }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Go to Marks Entry
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CLO Attainment & Student Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CLO Attainment Summary */}
          <div className="bg-card border-card-border rounded-xl shadow-sm border">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: primaryColor }} />
                CLO Attainment Overview
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div
                className="flex items-center justify-between p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--brand-primary-opacity-10)',
                  borderColor: 'var(--brand-primary-opacity-20)',
                }}
              >
                <div>
                  <p className="text-sm font-medium text-primary-text">Overall Attainment</p>
                  <p className="text-xs text-secondary-text mt-1">
                    {data.cloAttainmentSummary.attainedCLOs} of {data.cloAttainmentSummary.totalCLOs} CLOs attained
                  </p>
                </div>
                <p className="text-xl font-bold text-primary-text" style={{ color: primaryColor }}>
                  {data.cloAttainmentSummary.overallAttainment.toFixed(1)}%
                </p>
              </div>
              {data.cloAttainmentSummary.lowAttainmentCourses.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 text-primary-text" style={{ color: 'var(--error)' }}>
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Low Attainment CLOs
                  </p>
                  <div className="space-y-2">
                    {data.cloAttainmentSummary.lowAttainmentCourses.map((course, index) => (
                      <div
                        key={index}
                        className="p-2 rounded text-xs border border-card-border bg-card"
                      >
                        <p className="font-medium text-primary-text">
                          {course.courseCode} - {course.cloCode}
                        </p>
                        <p className="text-secondary-text">
                          {course.attainment.toFixed(1)}% (Threshold: {course.threshold}%)
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => router.push('/faculty/results/clo-attainments')}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] inline-flex items-center justify-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5" />
                View All CLO Attainments
              </button>
            </div>
          </div>

          {/* Student Performance Alerts */}
          <div className="bg-card border-card-border rounded-xl shadow-sm border">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: primaryColor }} />
                Student Performance
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--brand-primary-opacity-08)',
                  borderColor: 'var(--brand-primary-opacity-20)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-text">Average Class Performance</p>
                    <p className="text-xs text-secondary-text mt-1">Across all assessments</p>
                  </div>
                  <p className="text-lg font-bold text-primary-text" style={{ color: primaryColor }}>
                    {data.studentAlerts.averageClassPerformance.toFixed(1)}%
                  </p>
                </div>
              </div>
              {data.studentAlerts.atRiskStudents.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                    <AlertTriangle className="w-3 h-3" />
                    At-Risk Students
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {data.studentAlerts.atRiskStudents.map((student) => (
                      <div
                        key={student.studentId}
                        className="p-2 rounded text-xs border bg-card"
                        style={{ borderColor: 'var(--error)', backgroundColor: 'var(--error-opacity-05)' }}
                      >
                        <p className="font-medium text-primary-text">
                          {student.studentName} ({student.rollNumber})
                        </p>
                        <p className="text-secondary-text">
                          {student.course.code} - {student.assessment}: {student.percentage.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.studentAlerts.topPerformers.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1 text-[var(--success-green)]">
                    <Star className="w-3 h-3" />
                    Top Performers
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {data.studentAlerts.topPerformers.map((student) => (
                      <div
                        key={student.studentId}
                        className="p-2 rounded text-xs border border-card-border bg-card"
                      >
                        <p className="font-medium text-primary-text">
                          {student.studentName} ({student.rollNumber})
                        </p>
                        <p className="text-secondary-text">
                          {student.course.code} - {student.assessment}: {student.percentage.toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => router.push('/faculty/students')}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] inline-flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                View All Students
              </button>
            </div>
          </div>
        </div>

        {/* Recent Grading Activity */}
        <div className="bg-card border-card-border rounded-xl shadow-sm border">
          <div className="p-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-primary-text flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success-green)' }} />
              Recent Grading Activity
            </h2>
          </div>
          <div className="p-4">
            {data.recentGradingActivity.length === 0 ? (
              <p className="text-xs text-secondary-text text-center py-4">
                No recent grading activity
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentGradingActivity.map((activity) => (
                  <div
                    key={activity.assessmentId}
                    className="p-3 border border-card-border rounded-lg transition-colors cursor-pointer hover:bg-[var(--hover-bg)]"
                    onClick={() => router.push(`/faculty/assessments/${activity.assessmentId}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-primary-text">
                          {activity.assessmentTitle}
                        </p>
                        <p className="text-xs text-secondary-text mt-1">
                          {activity.course.code} - {activity.course.name}
                        </p>
                        {activity.evaluatedAt && (
                          <p className="text-xs text-secondary-text mt-1">
                            Evaluated: {new Date(activity.evaluatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={activity.status === 'published' ? 'default' : 'secondary'}
                        className="ml-2 text-[10px]"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {data.pendingWork.pendingEvaluations > 0 && (
              <button
                type="button"
                onClick={() => router.push('/faculty/results/result-evaluation')}
                className="w-full mt-4 px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] inline-flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                View Pending Evaluations ({data.pendingWork.pendingEvaluations})
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid - Quick Stats, Recent Activity, Contact Support (admin layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Quick Actions + Quick Stats combined */}
          <div className="space-y-4">
            <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold text-primary-text mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: primaryColor }} />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/faculty/assessments')}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium border border-card-border hover:bg-[var(--hover-bg)] transition-colors text-primary-text"
                >
                  <Plus className="w-3.5 h-3.5 mr-2" style={{ color: primaryColor }} />
                  Create Assessment
                </button>
                <button
                  onClick={() => router.push('/faculty/results/marks-entry')}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium border border-card-border hover:bg-[var(--hover-bg)] transition-colors text-primary-text"
                >
                  <FileText className="w-3.5 h-3.5 mr-2" style={{ color: primaryColor }} />
                  Enter Marks
                </button>
                <button
                  onClick={() => router.push('/faculty/results/clo-attainments')}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium border border-card-border hover:bg-[var(--hover-bg)] transition-colors text-primary-text"
                >
                  <Calculator className="w-3.5 h-3.5 mr-2" style={{ color: primaryColor }} />
                  Calculate CLO Attainments
                </button>
                <button
                  onClick={() => router.push('/faculty/results')}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium border border-card-border hover:bg-[var(--hover-bg)] transition-colors text-primary-text"
                >
                  <Award className="w-3.5 h-3.5 mr-2" style={{ color: primaryColor }} />
                  Manage Grades
                </button>
                <button
                  onClick={() => router.push('/faculty/analytics')}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium border border-card-border hover:bg-[var(--hover-bg)] transition-colors text-primary-text"
                >
                  <BarChart2 className="w-3.5 h-3.5 mr-2" style={{ color: primaryColor }} />
                  Generate Report
                </button>
              </div>
            </div>
            <div className="bg-card border-card-border rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold text-primary-text mb-3">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                    <span className="text-xs text-secondary-text">Current Semester</span>
                  </div>
                  <span className="text-xs font-medium text-primary-text">
                    {data.currentSemester ? data.currentSemester.name : 'No active semester'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4" style={{ color: primaryColor }} />
                    <span className="text-xs text-secondary-text">Total Pending Work</span>
                  </div>
                  <span className="text-xs font-medium text-primary-text">
                    {data.pendingWork.totalPending}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" style={{ color: primaryColor }} />
                    <span className="text-xs text-secondary-text">CLO Attainment</span>
                  </div>
                  <span className="text-xs font-medium text-primary-text">
                    {data.cloAttainmentSummary.overallAttainment.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div
              className="rounded-xl shadow-sm p-4 text-white"
              style={{
                background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColorDark})`,
              }}
            >
              <h2 className="text-sm font-semibold mb-1.5">Need Help?</h2>
              <p className="text-xs mb-3" style={{ color: 'var(--white-opacity-80)' }}>
                Get support from our team or check the documentation
              </p>
              <button
                onClick={() => setIsContactDialogOpen(true)}
                className="w-full px-3 py-1.5 rounded-lg transition-colors text-xs font-medium h-8"
                style={{ backgroundColor: 'var(--white-opacity-10)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--white-opacity-20)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--white-opacity-10)';
                }}
              >
                Contact Support
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-card border-card-border rounded-xl shadow-sm border">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Recent Activity</h2>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {data.recentActivities.length === 0 ? (
                <div className="p-4 text-center text-xs text-secondary-text">
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
                    icon={<FileText className="w-4 h-4" />}
                    isDarkMode={isDarkMode}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support Dialog - same as admin */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-card-border text-primary-text">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary-text">
              Contact Support
            </DialogTitle>
            <DialogDescription className="text-xs text-secondary-text">
              Need help? Fill out the form below and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ContactForm />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
