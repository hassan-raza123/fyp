'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Target, BarChart3, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import Link from 'next/link';

interface Course {
  id: number;
  code: string;
  name: string;
  description: string | null;
  creditHours: number;
  theoryHours: number | null;
  labHours: number | null;
  type: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS';
  status: 'active' | 'inactive' | 'archived';
  department: {
    id: number;
    name: string;
    code: string;
  };
  prerequisites: {
    prerequisite: {
      id: number;
      code: string;
      name: string;
    };
  }[];
  corequisites: {
    corequisite: {
      id: number;
      code: string;
      name: string;
    };
  }[];
  clos: {
    id: number;
    code: string;
    description: string;
  }[];
  faculty: {
    faculty: {
      id: number;
      name: string;
      email: string;
    };
  }[];
  programs: {
    program: {
      id: number;
      name: string;
      code: string;
    };
    semester: number;
    isCore: boolean;
    creditHours: number;
  }[];
}

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('information');

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const primaryColorDark = isDarkMode ? 'var(--orange-dark)' : 'var(--blue-dark)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!courseId) {
      setError('Course ID is missing');
      setLoading(false);
      return;
    }
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/courses/${courseId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch course');
      const data = await response.json();
      if (data.success && data.data) {
        setCourse({
          ...data.data,
          status: data.data.status?.toLowerCase() || 'inactive',
          prerequisites: data.data.prerequisites || [],
          corequisites: data.data.corequisites || [],
          clos: data.data.clos || [],
          faculty: data.data.faculty || [],
          programs: data.data.programs || [],
        });
      } else {
        throw new Error(data.error || 'Failed to fetch course');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch course'
      );
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch course'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: 'THEORY' | 'LAB' | 'PROJECT' | 'THESIS') => {
    switch (type) {
      case 'THEORY':
        return <Badge className="bg-[var(--blue)] text-white text-[10px] px-1.5 py-0.5">Theory</Badge>;
      case 'LAB':
        return <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5">Lab</Badge>;
      case 'PROJECT':
        return <Badge className="bg-[var(--gray-500)] text-white text-[10px] px-1.5 py-0.5">Project</Badge>;
      case 'THESIS':
        return <Badge className="bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5">Thesis</Badge>;
      default:
        return <Badge className="text-[10px] px-1.5 py-0.5">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: 'active' | 'inactive' | 'archived') => {
    switch (status) {
      case 'active':
        return <Badge className="bg-[var(--success-green)] text-white text-[10px] px-1.5 py-0.5">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-[var(--gray-500)] text-white text-[10px] px-1.5 py-0.5">Inactive</Badge>;
      case 'archived':
        return <Badge className="bg-[var(--error)] text-white text-[10px] px-1.5 py-0.5">Archived</Badge>;
      default:
        return <Badge className="text-[10px] px-1.5 py-0.5">{status}</Badge>;
    }
  };

  // Loading state
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
          <p className="text-xs text-secondary-text">Loading course details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-[var(--error)]">{error}</p>
        <button
          onClick={() => router.push('/student/courses')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Courses
        </button>
      </div>
    );
  }

  // Not found state
  if (!course) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-secondary-text">Course not found</p>
        <button
          onClick={() => router.push('/student/courses')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-hover-bg flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Courses
        </button>
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/student/courses')}
            className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-hover-bg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-primary-text">{course?.name || 'Untitled Course'}</h1>
            <p className="text-xs text-secondary-text mt-0.5">Course Code: {course?.code || 'N/A'}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="information">
            <BookOpen className="w-4 h-4 mr-2" />
            Information
          </TabsTrigger>
          <TabsTrigger value="clos">
            <Target className="w-4 h-4 mr-2" />
            CLOs
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="offerings">
            <Calendar className="w-4 h-4 mr-2" />
            Offerings
          </TabsTrigger>
        </TabsList>

        {/* Course Information Tab */}
        <TabsContent value="information" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">Basic Information</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-secondary-text">Department</p>
                  <p className="text-sm font-medium text-primary-text">
                    {course.department
                      ? `${course.department.name} (${course.department.code})`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary-text">Credit Hours</p>
                  <p className="text-sm font-medium text-primary-text">{course.creditHours || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-text">Theory Hours</p>
                  <p className="text-sm font-medium text-primary-text">{course.theoryHours || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-text">Lab Hours</p>
                  <p className="text-sm font-medium text-primary-text">{course.labHours || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-text">Type</p>
                  <div className="mt-1">{getTypeBadge(course.type)}</div>
                </div>
                <div>
                  <p className="text-xs text-secondary-text">Status</p>
                  <div className="mt-1">{getStatusBadge(course.status)}</div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">Course Details</h2>
              </div>
              <div className="p-4 space-y-4">
                {course.description && (
                  <div>
                    <p className="text-xs text-secondary-text">Description</p>
                    <p className="mt-1 text-sm text-primary-text">{course.description}</p>
                  </div>
                )}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div>
                    <p className="text-xs text-secondary-text">Prerequisites</p>
                    <ul className="mt-1 list-disc list-inside text-sm text-primary-text">
                      {course.prerequisites.map((prereq) => (
                        <li key={prereq.prerequisite?.id}>
                          {prereq.prerequisite?.code} - {prereq.prerequisite?.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {course.corequisites && course.corequisites.length > 0 && (
                  <div>
                    <p className="text-xs text-secondary-text">Co-requisites</p>
                    <ul className="mt-1 list-disc list-inside text-sm text-primary-text">
                      {course.corequisites.map((coreq) => (
                        <li key={coreq.corequisite?.id}>
                          {coreq.corequisite?.code} - {coreq.corequisite?.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">Course Learning Outcomes</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {course.clos && course.clos.length > 0 ? (
                    <>
                      {course.clos.slice(0, 3).map((clo) => (
                        <div key={clo.id}>
                          <p className="text-sm font-medium text-primary-text">{clo.code}</p>
                          <p className="text-xs text-secondary-text">{clo.description}</p>
                        </div>
                      ))}
                      {course.clos.length > 3 && (
                        <Link
                          href={`/student/courses/${courseId}/clos`}
                          className="text-xs hover:underline"
                          style={{ color: primaryColor }}
                        >
                          View all {course.clos.length} CLOs →
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-secondary-text">
                      No learning outcomes defined
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">Assigned Faculty</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {course.faculty && course.faculty.length > 0 ? (
                    course.faculty.map((facultyMember, index) => (
                      <div key={facultyMember.faculty?.id || index}>
                        <p className="text-sm font-medium text-primary-text">{facultyMember.faculty?.name}</p>
                        <p className="text-xs text-secondary-text">
                          {facultyMember.faculty?.email}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-secondary-text">No faculty assigned</p>
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-card border border-card-border rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <h2 className="text-sm font-semibold text-primary-text">Programs Offering This Course</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {course.programs && course.programs.length > 0 ? (
                    course.programs.map((program) => (
                      <div key={program.program?.id}>
                        <p className="text-sm font-medium text-primary-text">
                          {program.program?.name} ({program.program?.code})
                        </p>
                        <p className="text-xs text-secondary-text">
                          Semester {program.semester} •{' '}
                          {program.isCore ? 'Core' : 'Elective'} •{' '}
                          {program.creditHours} Credit Hours
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-secondary-text">
                      No programs offering this course
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CLOs Tab */}
        <TabsContent value="clos" className="mt-6">
          <div className="flex justify-end mb-4">
            <Link href={`/student/courses/${courseId}/clos`}>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: iconBgColor, color: primaryColor }}
              >
                View All CLOs
              </button>
            </Link>
          </div>
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Course Learning Outcomes</h2>
            </div>
            <div className="p-4">
              {course.clos && course.clos.length > 0 ? (
                <div className="space-y-4">
                  {course.clos.map((clo) => (
                    <div key={clo.id} className="border-b border-card-border pb-4 last:border-0">
                      <p className="text-sm font-medium text-primary-text">{clo.code}</p>
                      <p className="text-xs text-secondary-text mt-1">{clo.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-secondary-text">
                  No learning outcomes defined for this course
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Course Analytics</h2>
            </div>
            <div className="p-4">
              <div className="text-center py-8">
                <p className="text-xs text-secondary-text mb-4">
                  Course analytics will be displayed here
                </p>
                <Link href={`/student/courses/${courseId}/analytics`}>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 transition-colors"
                    style={{ backgroundColor: iconBgColor, color: primaryColor }}
                  >
                    View Detailed Analytics
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Offerings Tab */}
        <TabsContent value="offerings" className="mt-6">
          <div className="rounded-lg border border-card-border bg-card overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-primary-text">Course Offerings</h2>
            </div>
            <div className="p-4">
              <div className="text-center py-8">
                <p className="text-xs text-secondary-text mb-4">
                  Course offerings history will be displayed here
                </p>
                <Link href={`/student/courses/${courseId}/offerings`}>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 transition-colors"
                    style={{ backgroundColor: iconBgColor, color: primaryColor }}
                  >
                    View All Offerings
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
