'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
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
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);

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
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => router.push('/faculty/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!course) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Course not found</p>
          <Button
            variant="outline"
            onClick={() => router.push('/faculty/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/faculty/courses')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {course?.name || 'Untitled Course'}
            </h1>
            <p className="text-muted-foreground">
              Course Code: {course?.code || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
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
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Course Details</h2>
          <div className="space-y-4">
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
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Course Learning Outcomes
          </h2>
          <div className="space-y-4">
            {course.clos && course.clos.length > 0 ? (
              course.clos.map((clo) => (
                <div key={clo.id}>
                  <p className="font-medium">{clo.code}</p>
                  <p className="text-muted-foreground">{clo.description}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                No learning outcomes defined
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Assigned Faculty</h2>
          <div className="space-y-4">
            {course.faculty && course.faculty.length > 0 ? (
              course.faculty.map((facultyMember, index) => (
                <div
                  key={facultyMember.faculty?.id || index}
                >
                  <p className="font-medium">
                    {facultyMember.faculty?.name}
                  </p>
                  <p className="text-muted-foreground">
                    {facultyMember.faculty?.email}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No faculty assigned</p>
            )}
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
            Programs Offering This Course
          </h2>
          <div className="space-y-4">
            {course.programs && course.programs.length > 0 ? (
              course.programs.map((program) => (
                <div key={program.program?.id}>
                  <p className="font-medium">
                    {program.program?.name} ({program.program?.code})
                  </p>
                  <p className="text-muted-foreground">
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
        </Card>
      </div>
    </div>
  );
}
