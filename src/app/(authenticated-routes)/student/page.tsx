'use client';

import React, { useEffect, useState } from 'react';
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
  Activity,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down';
  color?: string;
}

const StatCard = ({
  title,
  value,
  icon,
  change,
  trend,
  color = 'purple',
}: StatCardProps) => (
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
                <TrendingUp className='inline w-4 h-4' />
              ) : (
                <TrendingUp className='inline w-4 h-4 rotate-180' />
              )}
              {change}%
            </span>
            <span className='text-sm text-gray-500 dark:text-gray-400 ml-2'>
              vs last semester
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 bg-${color}-50 dark:bg-${color}-900/20 rounded-lg`}>
        {icon}
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
}

const CourseCard = ({
  courseCode,
  courseName,
  instructor,
  grade,
  attendance,
  nextClass,
  color,
}: CourseCardProps) => (
  <div className='bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700'>
    <div className='flex items-start justify-between mb-4'>
      <div>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
          {courseCode}
        </h3>
        <p className='text-sm text-gray-600 dark:text-gray-400'>{courseName}</p>
        <p className='text-xs text-gray-500 dark:text-gray-500 mt-1'>
          Prof. {instructor}
        </p>
      </div>
      {grade && (
        <div
          className={`px-3 py-1 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-800 dark:text-${color}-200 rounded-full text-sm font-medium`}
        >
          {grade}
        </div>
      )}
    </div>
    <div className='space-y-3'>
      <div className='flex items-center justify-between text-sm'>
        <span className='text-gray-600 dark:text-gray-400'>Attendance</span>
        <span className='font-medium text-gray-900 dark:text-white'>
          {attendance}%
        </span>
      </div>
      <div className='flex items-center justify-between text-sm'>
        <span className='text-gray-600 dark:text-gray-400'>Next Class</span>
        <span className='font-medium text-gray-900 dark:text-white'>
          {nextClass}
        </span>
      </div>
    </div>
  </div>
);

interface AssignmentProps {
  title: string;
  course: string;
  dueDate: string;
  status: 'upcoming' | 'submitted' | 'overdue';
  priority: 'high' | 'medium' | 'low';
}

const AssignmentItem = ({
  title,
  course,
  dueDate,
  status,
  priority,
}: AssignmentProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'submitted':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
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

  return (
    <div className='flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors'>
      <div className='flex items-center space-x-3'>
        <div className={`w-2 h-2 rounded-full ${getPriorityColor()}`}></div>
        <div>
          <p className='text-sm font-medium text-gray-900 dark:text-white'>
            {title}
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400'>
            {course} • Due {dueDate}
          </p>
        </div>
      </div>
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
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
  };
  courses: Array<{
    courseCode: string;
    courseName: string;
    instructor: string;
    grade?: string;
    attendance: number;
    nextClass: string;
    color: string;
  }>;
  assignments: Array<{
    title: string;
    course: string;
    dueDate: string;
    status: 'upcoming' | 'submitted' | 'overdue';
    priority: 'high' | 'medium' | 'low';
  }>;
  recentActivities: Array<{
    id: string;
    summary: string;
    time: string;
    type: string;
  }>;
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
            stats: result.data.stats,
            courses: result.data.courses.map((course: any, index: number) => ({
              courseCode: course.code,
              courseName: course.name,
              instructor: course.instructor,
              grade: course.grade || undefined,
              attendance: 0, // TODO: Implement attendance
              nextClass: 'N/A', // TODO: Implement next class
              color: ['blue', 'green', 'purple', 'orange', 'pink'][index % 5],
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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500'></div>
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
            Student Dashboard
          </h1>
          <p className='text-gray-500 dark:text-gray-400'>
            Welcome back, {data.studentInfo.name}! Here's your academic
            overview.
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          <div className='text-right'>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Student ID
            </p>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {data.studentInfo.studentId}
            </p>
          </div>
          <div className='text-right'>
            <p className='text-sm text-gray-600 dark:text-gray-400'>CGPA</p>
            <p className='text-sm font-medium text-gray-900 dark:text-white'>
              {data.studentInfo.cgpa}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Enrolled Courses'
          value={data.stats.enrolledCourses}
          icon={
            <BookOpen className='w-6 h-6 text-blue-600 dark:text-blue-400' />
          }
          color='blue'
        />
        <StatCard
          title='Average Grade'
          value={`${data.stats.averageGrade}%`}
          icon={
            <Award className='w-6 h-6 text-green-600 dark:text-green-400' />
          }
          change={5.2}
          trend='up'
          color='green'
        />
        <StatCard
          title='Attendance Rate'
          value={`${data.stats.attendanceRate}%`}
          icon={
            <CheckCircle className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={2.1}
          trend='up'
          color='purple'
        />
        <StatCard
          title='Completed Assignments'
          value={data.stats.completedAssignments}
          icon={
            <FileText className='w-6 h-6 text-orange-600 dark:text-orange-400' />
          }
          color='orange'
        />
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Enrolled Courses */}
        <div className='lg:col-span-2 space-y-6'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Enrolled Courses
            </h2>
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
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700'>
            <div className='p-6 border-b border-gray-100 dark:border-gray-700'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Upcoming Assignments
              </h2>
            </div>
            <div className='divide-y divide-gray-100 dark:divide-gray-700'>
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
        <div className='space-y-6'>
          {/* Student Info */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              Student Information
            </h2>
            <div className='space-y-3'>
              <div className='flex items-center space-x-3'>
                <User className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Program
                  </p>
                  <p className='text-sm font-medium text-gray-900 dark:text-white'>
                    {data.studentInfo.program}
                  </p>
                </div>
              </div>
              <div className='flex items-center space-x-3'>
                <Calendar className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Current Semester
                  </p>
                  <p className='text-sm font-medium text-gray-900 dark:text-white'>
                    {data.studentInfo.semester}
                  </p>
                </div>
              </div>
              <div className='flex items-center space-x-3'>
                <Target className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    CGPA
                  </p>
                  <p className='text-sm font-medium text-gray-900 dark:text-white'>
                    {data.studentInfo.cgpa}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700'>
            <div className='p-6 border-b border-gray-100 dark:border-gray-700'>
              <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Recent Activities
              </h2>
            </div>
            <div className='divide-y divide-gray-100 dark:divide-gray-700'>
              {data.recentActivities.map((activity) => (
                <div key={activity.id} className='p-4'>
                  <p className='text-sm text-gray-900 dark:text-white'>
                    {activity.summary}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    {activity.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className='bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white'>
            <h2 className='text-lg font-semibold mb-2'>Quick Actions</h2>
            <div className='space-y-3'>
              <button className='w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium'>
                View Grades
              </button>
              <button className='w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium'>
                Check Attendance
              </button>
              <button className='w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium'>
                Contact Advisor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
