'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  FileText,
  Target,
  Award,
  CheckCircle,
  TrendingUp,
  User,
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
      <div className='p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
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
}

const CourseCard = ({
  courseCode,
  courseName,
  instructor,
  grade,
  attendance,
  nextClass,
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
        <div className='px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium'>
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
}

const AssignmentItem = ({
  title,
  course,
  dueDate,
  status,
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

  return (
    <div className='flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors'>
      <div>
        <p className='text-sm font-medium text-gray-900 dark:text-white'>
          {title}
        </p>
        <p className='text-xs text-gray-500 dark:text-gray-400'>
          {course} • Due {dueDate}
        </p>
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
  }>;
  assignments: Array<{
    title: string;
    course: string;
    dueDate: string;
    status: 'upcoming' | 'submitted' | 'overdue';
  }>;
  recentActivities: Array<{
    id: string;
    summary: string;
    time: string;
  }>;
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with dummy data
    const fetchData = async () => {
      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const dummyData: StudentDashboardData = {
        studentInfo: {
          name: 'Ahmed Hassan',
          studentId: '2021-CS-123',
          program: 'Bachelor of Computer Science',
          semester: 'Fall 2024',
          cgpa: 3.75,
        },
        stats: {
          enrolledCourses: 5,
          averageGrade: 85.2,
          attendanceRate: 92.5,
          completedAssignments: 18,
        },
        courses: [
          {
            courseCode: 'CS-301',
            courseName: 'Data Structures & Algorithms',
            instructor: 'Dr. Sarah Johnson',
            grade: 'A-',
            attendance: 95,
            nextClass: 'Today, 2:00 PM',
          },
          {
            courseCode: 'CS-302',
            courseName: 'Database Systems',
            instructor: 'Prof. Michael Chen',
            grade: 'A',
            attendance: 88,
            nextClass: 'Tomorrow, 10:00 AM',
          },
          {
            courseCode: 'CS-303',
            courseName: 'Software Engineering',
            instructor: 'Dr. Emily Rodriguez',
            attendance: 90,
            nextClass: 'Wednesday, 3:30 PM',
          },
          {
            courseCode: 'MATH-201',
            courseName: 'Linear Algebra',
            instructor: 'Prof. David Kim',
            grade: 'B+',
            attendance: 85,
            nextClass: 'Thursday, 1:00 PM',
          },
          {
            courseCode: 'ENG-101',
            courseName: 'Technical Writing',
            instructor: 'Dr. Lisa Thompson',
            attendance: 94,
            nextClass: 'Friday, 11:00 AM',
          },
        ],
        assignments: [
          {
            title: 'Final Project Submission',
            course: 'CS-301',
            dueDate: 'Dec 15, 2024',
            status: 'upcoming',
          },
          {
            title: 'Database Design Report',
            course: 'CS-302',
            dueDate: 'Dec 12, 2024',
            status: 'upcoming',
          },
          {
            title: 'Software Requirements Document',
            course: 'CS-303',
            dueDate: 'Dec 10, 2024',
            status: 'submitted',
          },
          {
            title: 'Linear Algebra Quiz',
            course: 'MATH-201',
            dueDate: 'Dec 8, 2024',
            status: 'overdue',
          },
          {
            title: 'Technical Report Draft',
            course: 'ENG-101',
            dueDate: 'Dec 20, 2024',
            status: 'upcoming',
          },
        ],
        recentActivities: [
          {
            id: '1',
            summary: 'Assignment submitted: Software Requirements Document',
            time: '2 hours ago',
          },
          {
            id: '2',
            summary: 'Grade updated: Database Systems (A)',
            time: '1 day ago',
          },
          {
            id: '3',
            summary: 'Attendance marked: Data Structures & Algorithms',
            time: '2 days ago',
          },
          {
            id: '4',
            summary: 'New assignment posted: Final Project',
            time: '3 days ago',
          },
          {
            id: '5',
            summary: 'Course registration confirmed: Technical Writing',
            time: '1 week ago',
          },
        ],
      };

      setData(dummyData);
      setLoading(false);
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
            <BookOpen className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
        />
        <StatCard
          title='Average Grade'
          value={`${data.stats.averageGrade}%`}
          icon={
            <Award className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={5.2}
          trend='up'
        />
        <StatCard
          title='Attendance Rate'
          value={`${data.stats.attendanceRate}%`}
          icon={
            <CheckCircle className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
          change={2.1}
          trend='up'
        />
        <StatCard
          title='Completed Assignments'
          value={data.stats.completedAssignments}
          icon={
            <FileText className='w-6 h-6 text-purple-600 dark:text-purple-400' />
          }
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
