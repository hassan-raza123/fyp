'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

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
  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

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
      const response = await fetch(`/api/courses/${courseId}`);
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
        return <Badge variant="default">Theory</Badge>;
      case 'LAB':
        return <Badge variant="success">Lab</Badge>;
      case 'PROJECT':
        return <Badge variant="secondary">Project</Badge>;
      case 'THESIS':
        return <Badge variant="destructive">Thesis</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: 'active' | 'inactive' | 'archived') => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'archived':
        return <Badge variant="destructive">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderTopColor: primaryColor, borderRightColor: 'transparent', borderBottomColor: primaryColor, borderLeftColor: 'transparent' }}
          />
          <p className="text-xs text-secondary-text">Loading course details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-page gap-4">
        <p className="text-xs text-[var(--error)]">{error}</p>
        <button
          type="button"
          onClick={() => router.push('/faculty/courses')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] inline-flex items-center gap-1.5"
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-page gap-4">
        <p className="text-xs text-secondary-text">Course not found</p>
        <button
          type="button"
          onClick={() => router.push('/faculty/courses')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] inline-flex items-center gap-1.5"
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
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/faculty/courses')}
            className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <BookOpen className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">
              {course?.name || 'Untitled Course'}
            </h1>
            <p className="text-xs text-secondary-text mt-0.5">
              Course Code: {course?.code || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden p-6">
          <h2 className="text-sm font-semibold text-primary-text mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-secondary-text">Department</p>
              <p className="font-medium text-primary-text">
                {course.department
                  ? `${course.department.name} (${course.department.code})`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-text">Credit Hours</p>
              <p className="font-medium text-primary-text">{course.creditHours || 0}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-text">Theory Hours</p>
              <p className="font-medium text-primary-text">{course.theoryHours || 0}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-text">Lab Hours</p>
              <p className="font-medium text-primary-text">{course.labHours || 0}</p>
            </div>
            <div>
              <p className="text-sm text-secondary-text">Type</p>
              <div className="mt-1">{getTypeBadge(course.type)}</div>
            </div>
            <div>
              <p className="text-sm text-secondary-text">Status</p>
              <div className="mt-1">{getStatusBadge(course.status)}</div>
            </div>
          </div>
        </Card>

        <Card className="rounded-lg border border-card-border bg-card overflow-hidden p-6">
          <h2 className="text-sm font-semibold text-primary-text mb-4">Course Details</h2>
          <div className="space-y-4">
            {course.description && (
              <div>
                <p className="text-sm text-secondary-text">Description</p>
                <p className="mt-1">{course.description}</p>
              </div>
            )}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div>
                <p className="text-sm text-secondary-text">Prerequisites</p>
                <ul className="mt-1 list-disc list-inside">
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
                <p className="text-sm text-secondary-text">Co-requisites</p>
                <ul className="mt-1 list-disc list-inside">
                  {course.corequisites.map((coreq) => (
                    <li key={coreq.corequisite?.id}>
                      {coreq.corequisite?.code} - {coreq.corequisite?.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        <Card className="rounded-lg border border-card-border bg-card overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-primary-text">
              Course Learning Outcomes
            </h2>
            {course.clos && course.clos.length > 0 && (
              <button
                type="button"
                onClick={() => router.push(`/faculty/courses/${courseId}/clos`)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
                style={{ backgroundColor: iconBgColor, color: primaryColor }}
              >
                View All CLOs
              </button>
            )}
          </div>
          <div className="space-y-4">
            {course.clos && course.clos.length > 0 ? (
              <>
                {course.clos.slice(0, 3).map((clo) => (
                  <div key={clo.id}>
                    <p className="font-medium text-primary-text">{clo.code}</p>
                    <p className="text-secondary-text">{clo.description}</p>
                  </div>
                ))}
                {course.clos.length > 3 && (
                  <p className="text-sm text-secondary-text">
                    +{course.clos.length - 3} more CLOs
                  </p>
                )}
              </>
            ) : (
              <p className="text-secondary-text">
                No learning outcomes defined
              </p>
            )}
          </div>
        </Card>

        <Card className="rounded-lg border border-card-border bg-card overflow-hidden p-6">
          <h2 className="text-sm font-semibold text-primary-text mb-4">Assigned Faculty</h2>
          <div className="space-y-4">
            {course.faculty && course.faculty.length > 0 ? (
              course.faculty.map((facultyMember, index) => (
                <div
                  key={facultyMember.faculty?.id || index}
                >
                  <p className="font-medium text-primary-text">
                    {facultyMember.faculty?.name}
                  </p>
                  <p className="text-secondary-text">
                    {facultyMember.faculty?.email}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-secondary-text">No faculty assigned</p>
            )}
          </div>
        </Card>

        <Card className="rounded-lg border border-card-border bg-card overflow-hidden p-6 md:col-span-2">
          <h2 className="text-sm font-semibold text-primary-text mb-4">
            Programs Offering This Course
          </h2>
          <div className="space-y-4">
            {course.programs && course.programs.length > 0 ? (
              course.programs.map((program) => (
                <div key={program.program?.id}>
                  <p className="font-medium text-primary-text">
                    {program.program?.name} ({program.program?.code})
                  </p>
                  <p className="text-secondary-text">
                    Semester {program.semester} •{' '}
                    {program.isCore ? 'Core' : 'Elective'} •{' '}
                    {program.creditHours} Credit Hours
                  </p>
                </div>
              ))
            ) : (
              <p className="text-secondary-text">
                No programs offering this course
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Course Offerings & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-primary-text">Course Offerings</h2>
            <button
              type="button"
              onClick={() => router.push(`/faculty/courses/${courseId}/offerings`)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
              style={{ backgroundColor: iconBgColor, color: primaryColor }}
            >
              View All Offerings
            </button>
          </div>
          <CourseOfferingsPreview courseId={courseId as string} />
        </Card>

        <Card className="rounded-lg border border-card-border bg-card overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-primary-text">Course Analytics</h2>
            <button
              type="button"
              onClick={() => router.push(`/faculty/courses/${courseId}/analytics`)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 border border-card-border text-primary-text hover:bg-[var(--hover-bg)]"
              style={{ backgroundColor: iconBgColor, color: primaryColor }}
            >
              View Analytics
            </button>
          </div>
          <CourseAnalyticsPreview courseId={courseId as string} />
        </Card>
      </div>
    </div>
  );
}

// Course Offerings Preview Component
function CourseOfferingsPreview({ courseId }: { courseId: string }) {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const response = await fetch(
          `/api/courses/${courseId}/offerings`,
          { credentials: 'include' }
        );
        const data = await response.json();
        if (data.success) {
          setOfferings(data.data.slice(0, 3)); // Show first 3
        }
      } catch (error) {
        console.error('Error fetching offerings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, [courseId]);

  if (loading) {
    return <p className="text-sm text-secondary-text">Loading...</p>;
  }

  if (offerings.length === 0) {
    return (
      <p className="text-sm text-secondary-text">
        No course offerings found
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {offerings.map((offering) => (
        <div
          key={offering.id}
          className="p-3 border border-card-border bg-card rounded-lg"
        >
          <p className="font-medium text-sm text-primary-text">{offering.semester.name}</p>
          <p className="text-xs text-secondary-text mt-1">
            {offering.sections.length} section(s) •{' '}
            {offering.totalAssessments} assessment(s)
          </p>
        </div>
      ))}
      {offerings.length >= 3 && (
        <p className="text-xs text-secondary-text text-center">
          + More offerings available
        </p>
      )}
    </div>
  );
}

// Course Analytics Preview Component
function CourseAnalyticsPreview({ courseId }: { courseId: string }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          `/api/courses/${courseId}/analytics`,
          { credentials: 'include' }
        );
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [courseId]);

  if (loading) {
    return <p className="text-sm text-secondary-text">Loading...</p>;
  }

  if (!analytics) {
    return (
      <p className="text-sm text-secondary-text">
        No analytics data available
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg border border-card-border bg-card">
        <p className="text-xs font-medium text-secondary-text">Overall Performance</p>
        <p className="text-lg font-bold text-primary-text mt-1">
          {analytics.overallPerformance.averageCLOAttainment.toFixed(1)}%
        </p>
        <p className="text-xs text-secondary-text mt-1">
          {analytics.overallPerformance.attainedCLOs} / {analytics.overallPerformance.totalCLOs} CLOs attained
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-secondary-text">Total Students</p>
          <p className="font-medium text-primary-text">{analytics.overallPerformance.totalStudents}</p>
        </div>
        <div>
          <p className="text-secondary-text">Assessments</p>
          <p className="font-medium text-primary-text">{analytics.overallPerformance.totalAssessments}</p>
        </div>
      </div>
    </div>
  );
}
