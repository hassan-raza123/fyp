'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('information');

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
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin border-primary" />
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
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {course.department
                      ? `${course.department.name} (${course.department.code})`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credit Hours</p>
                  <p className="font-medium">{course.creditHours || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Theory Hours</p>
                  <p className="font-medium">{course.theoryHours || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lab Hours</p>
                  <p className="font-medium">{course.labHours || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <div className="mt-1">{getTypeBadge(course.type)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(course.status)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="mt-1">{course.description}</p>
                  </div>
                )}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Prerequisites</p>
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
                    <p className="text-sm text-muted-foreground">Co-requisites</p>
                    <ul className="mt-1 list-disc list-inside">
                      {course.corequisites.map((coreq) => (
                        <li key={coreq.corequisite?.id}>
                          {coreq.corequisite?.code} - {coreq.corequisite?.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Learning Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.clos && course.clos.length > 0 ? (
                    <>
                      {course.clos.slice(0, 3).map((clo) => (
                        <div key={clo.id}>
                          <p className="font-medium">{clo.code}</p>
                          <p className="text-muted-foreground text-sm">{clo.description}</p>
                        </div>
                      ))}
                      {course.clos.length > 3 && (
                        <Link
                          href={`/student/courses/${courseId}/clos`}
                          className="text-primary hover:underline text-sm"
                        >
                          View all {course.clos.length} CLOs →
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      No learning outcomes defined
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Faculty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.faculty && course.faculty.length > 0 ? (
                    course.faculty.map((facultyMember, index) => (
                      <div key={facultyMember.faculty?.id || index}>
                        <p className="font-medium">{facultyMember.faculty?.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {facultyMember.faculty?.email}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No faculty assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Programs Offering This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.programs && course.programs.length > 0 ? (
                    course.programs.map((program) => (
                      <div key={program.program?.id}>
                        <p className="font-medium">
                          {program.program?.name} ({program.program?.code})
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Semester {program.semester} •{' '}
                          {program.isCore ? 'Core' : 'Elective'} •{' '}
                          {program.creditHours} Credit Hours
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No programs offering this course
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CLOs Tab */}
        <TabsContent value="clos" className="mt-6">
          <div className="flex justify-end mb-4">
            <Link href={`/student/courses/${courseId}/clos`}>
              <Button variant="outline">
                View All CLOs
              </Button>
            </Link>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Course Learning Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              {course.clos && course.clos.length > 0 ? (
                <div className="space-y-4">
                  {course.clos.map((clo) => (
                    <div key={clo.id} className="border-b pb-4 last:border-0">
                      <p className="font-medium text-lg">{clo.code}</p>
                      <p className="text-muted-foreground mt-1">{clo.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No learning outcomes defined for this course
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Course analytics will be displayed here
                </p>
                <Link href={`/student/courses/${courseId}/analytics`}>
                  <Button>View Detailed Analytics</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offerings Tab */}
        <TabsContent value="offerings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Offerings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Course offerings history will be displayed here
                </p>
                <Link href={`/student/courses/${courseId}/offerings`}>
                  <Button>View All Offerings</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
