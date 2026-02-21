'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  User,
  Clock3,
  BookMarked,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down';
  iconBgColor: string;
  iconColor: string;
}

const StatCard = ({
  title,
  value,
  icon,
  change,
  trend,
  iconBgColor,
  iconColor,
}: StatCardProps) => (
  <div className="bg-card border border-card-border rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-secondary-text">{title}</p>
        <h3 className="text-lg font-bold mt-1 text-primary-text">{value}</h3>
        {change !== undefined && (
          <div className='flex items-center mt-2'>
            <span
              className={`text-sm font-medium ${
                trend === 'up' ? 'text-[var(--success-green)]' : 'text-[var(--error)]'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp className='inline w-4 h-4' />
              ) : (
                <TrendingUp className='inline w-4 h-4 rotate-180' />
              )}
              {change}%
            </span>
            <span className="text-xs text-muted-text ml-2">vs last semester</span>
          </div>
        )}
      </div>
      <div className="p-2 rounded-lg transition-transform duration-200 hover:scale-110" style={{ backgroundColor: iconBgColor }}>
        <div style={{ color: iconColor }}>{icon}</div>
      </div>
    </div>
  </div>
);

interface CourseCardProps {
  courseCode: string;
  courseName: string;
  instructor: string;
  grade?: string;
  attendance: number;
  nextClass: string;
  color: string;
  courseId?: number;
}

const CourseCard = ({
  courseCode,
  courseName,
  instructor,
  grade,
  attendance,
  nextClass,
  color,
  courseId,
}: CourseCardProps) => (
  <Link
    href={courseId ? `/student/courses/${courseId}` : '#'}
    className="block bg-card border border-card-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-primary-text">{courseCode}</h3>
        <p className="text-xs text-secondary-text">{courseName}</p>
        <p className="text-[10px] text-muted-text mt-1">Prof. {instructor}</p>
      </div>
      {grade && (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-[var(--brand-primary-opacity-20)] text-[var(--blue)] dark:bg-[var(--brand-secondary-opacity-20)] dark:text-[var(--orange)]">
          {grade}
        </span>
      )}
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-secondary-text">Attendance</span>
        <span className="font-medium text-primary-text">{attendance}%</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-secondary-text">Next Class</span>
        <span className="font-medium text-primary-text">{nextClass}</span>
      </div>
    </div>
  </Link>
);

interface AssignmentProps {
  title: string;
  course: string;
  dueDate: string;
  status: 'upcoming' | 'submitted' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  assessmentId?: number;
}

const AssignmentItem = ({
  title,
  course,
  dueDate,
  status,
  priority,
  assessmentId,
}: AssignmentProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'submitted':
        return 'bg-[var(--success-green)] text-white';
      case 'overdue':
        return 'bg-[var(--error)] text-white';
      default:
        return 'bg-[var(--warning)] text-white';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const content = (
    <div className='flex items-center justify-between p-4 hover:bg-hover-bg rounded-lg transition-colors'>
      <div className='flex items-center space-x-3'>
        <div className={`w-2 h-2 rounded-full ${getPriorityColor()}`}></div>
        <div>
          <p className='text-sm font-medium text-primary-text'>
            {title}
          </p>
          <p className='text-xs text-muted-text'>
            {course} • Due {dueDate}
          </p>
        </div>
      </div>
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor()}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );

  if (assessmentId) {
    return (
      <Link href={`/student/assessments/${assessmentId}`} className='block'>
        {content}
      </Link>
    );
  }

  return content;
};

interface StudentDashboardData {
  studentInfo: {
    name: string;
    studentId: string;
    program: string;
    semester: string;
    cgpa: number;
  };
  stats: {
    enrolledCourses: number;
    averageGrade: number;
    attendanceRate: number;
    completedAssignments: number;
    pendingAssignments?: number;
  };
  courses: Array<{
    courseCode: string;
    courseName: string;
    instructor: string;
    grade?: string;
    attendance: number;
    nextClass: string;
    color: string;
    courseId?: number;
  }>;
  assignments: Array<{
    title: string;
    course: string;
    dueDate: string;
    status: 'upcoming' | 'submitted' | 'overdue';
    priority: 'high' | 'medium' | 'low';
    assessmentId?: number;
  }>;
  recentActivities: Array<{
    id: string;
    summary: string;
    time: string;
    type: string;
    link?: string;
  }>;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
  const iconColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/student/overview', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const result = await response.json();
        if (result.success) {
          // Transform API data to match component interface
          const transformedData: StudentDashboardData = {
            studentInfo: result.data.studentInfo,
            stats: {
              ...result.data.stats,
              pendingAssignments: result.data.upcomingAssessments + result.data.overdueAssessments,
            },
            courses: result.data.courses.map((course: any, index: number) => ({
              courseCode: course.code,
              courseName: course.name,
              instructor: course.instructor,
              grade: course.grade || undefined,
              attendance: 0, // TODO: Implement attendance
              nextClass: 'N/A', // TODO: Implement next class
              color: ['blue', 'green', 'purple', 'orange', 'pink'][index % 5],
              courseId: course.id,
            })),
            assignments: result.data.assignments.map((assignment: any) => ({
              title: assignment.title,
              course: assignment.course,
              dueDate: assignment.dueDate 
                ? new Date(assignment.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No due date',
              status: assignment.status,
              priority: assignment.priority,
              assessmentId: assignment.id,
            })),
            recentActivities: result.data.recentActivities,
          };
          
          setData(transformedData);
        } else {
          throw new Error(result.error || 'Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep loading state or show error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderTopColor: primaryColor,
              borderBottomColor: primaryColor,
              borderRightColor: 'transparent',
              borderLeftColor: 'transparent',
            }}
          />
          <p className="text-xs text-secondary-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header - admin CLO style (title + subtitle only) */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-primary-text">Student Dashboard</h1>
          <p className="text-xs text-secondary-text mt-0.5">
            Welcome back, {data.studentInfo.name}! Here&apos;s your academic overview.
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          <div className='text-right'>
            <p className='text-sm text-secondary-text'>
              Student ID
            </p>
            <p className='text-sm font-medium text-primary-text'>
              {data.studentInfo.studentId}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-sm text-secondary-text'>CGPA</p>
            <p className='text-sm font-medium text-primary-text'>
              {data.studentInfo.cgpa}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
        <StatCard
          title='Enrolled Courses'
          value={data.stats.enrolledCourses}
          icon={<BookOpen className='w-6 h-6' />}
          iconBgColor={iconBgColor}
          iconColor={iconColor}
        />
        <StatCard
          title='Average Grade'
          value={`${data.stats.averageGrade}%`}
          icon={<Award className='w-6 h-6' />}
          change={5.2}
          trend='up'
          iconBgColor={iconBgColor}
          iconColor={iconColor}
        />
        <StatCard
          title='Attendance Rate'
          value={`${data.stats.attendanceRate}%`}
          icon={<CheckCircle className='w-6 h-6' />}
          change={2.1}
          trend='up'
          iconBgColor={iconBgColor}
          iconColor={iconColor}
        />
        <StatCard
          title='Completed Assignments'
          value={data.stats.completedAssignments}
          icon={<FileText className='w-6 h-6' />}
          iconBgColor={iconBgColor}
          iconColor={iconColor}
        />
        {data.stats.pendingAssignments !== undefined && (
          <StatCard
            title='Pending Assignments'
            value={data.stats.pendingAssignments}
            icon={<Clock className='w-6 h-6' />}
            iconBgColor={iconBgColor}
            iconColor={iconColor}
          />
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-card-border rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold text-primary-text mb-3">Enrolled Courses</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {data.courses.map((course, index) => (
                <CourseCard
                  key={index}
                  courseCode={course.courseCode}
                  courseName={course.courseName}
                  instructor={course.instructor}
                  grade={course.grade}
                  attendance={course.attendance}
                  nextClass={course.nextClass}
                  color={course.color}
                />
              ))}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Upcoming Assignments</h2>
            </div>
            <div className="divide-y divide-card-border">
              {data.assignments.map((assignment, index) => (
                <AssignmentItem
                  key={index}
                  title={assignment.title}
                  course={assignment.course}
                  dueDate={assignment.dueDate}
                  status={assignment.status}
                  priority={assignment.priority}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Student Info */}
          <div className="bg-card border border-card-border rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold text-primary-text mb-3">Student Information</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: iconBgColor }}>
                  <User className="w-4 h-4" style={{ color: iconColor }} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-text">Program</p>
                  <p className="text-xs font-medium text-primary-text">{data.studentInfo.program}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: iconBgColor }}>
                  <Calendar className="w-4 h-4" style={{ color: iconColor }} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-text">Current Semester</p>
                  <p className="text-xs font-medium text-primary-text">{data.studentInfo.semester}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: iconBgColor }}>
                  <Target className="w-4 h-4" style={{ color: iconColor }} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-text">CGPA</p>
                  <p className="text-xs font-medium text-primary-text">{data.studentInfo.cgpa}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Recent Activities</h2>
            </div>
            <div className="divide-y divide-card-border">
              {data.recentActivities.map((activity) => {
                const content = (
                  <div className="p-3 hover:bg-hover-bg transition-colors cursor-pointer">
                    <p className="text-xs text-primary-text">{activity.summary}</p>
                    <p className="text-[10px] text-muted-text mt-0.5">{activity.time}</p>
                  </div>
                );

                if (activity.link) {
                  return (
                    <Link key={activity.id} href={activity.link}>
                      {content}
                    </Link>
                  );
                }

                return <div key={activity.id}>{content}</div>;
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="rounded-lg shadow-sm p-4 text-white"
            style={{
              background: `linear-gradient(to bottom right, ${primaryColor}, ${primaryColorDark})`,
              boxShadow: isDarkMode ? '0 4px 12px rgba(252, 153, 40, 0.25)' : '0 4px 12px rgba(38, 40, 149, 0.2)',
            }}
          >
            <h2 className="text-sm font-semibold mb-2">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/student/results"
                className="block w-full px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium text-center"
              >
                View Grades
              </Link>
              <Link
                href="/student/assessments"
                className="block w-full px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium text-center"
              >
                View Assessments
              </Link>
              <Link
                href="/student/results/clo-attainments"
                className="block w-full px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium text-center"
              >
                View CLO Attainments
              </Link>
              <Link
                href="/student/results/plo-attainments"
                className="block w-full px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium text-center"
              >
                View PLO Attainments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
