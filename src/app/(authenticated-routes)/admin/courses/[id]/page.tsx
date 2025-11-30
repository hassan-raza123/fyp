'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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

  const handleDelete = async () => {
    if (!course) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete course');
      }

      toast.success('Course deleted successfully');
      router.push('/admin/courses');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete course'
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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

  if (!mounted || loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-4" style={{ borderTopColor: 'var(--blue)', borderBottomColor: 'var(--blue)' }}></div>
            <p className="text-secondary-text">Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--error)' }}>{error}</p>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-secondary-text mb-4">Course not found</p>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/courses')}
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
            onClick={() => router.push('/admin/courses')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary-text">
              {course?.name || 'Untitled Course'}
            </h1>
            <p className="text-secondary-text">
              Course Code: {course?.code || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
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

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Course Details</h2>
          <div className="space-y-4">
            {course.description && (
              <div>
                <p className="text-sm text-secondary-text">Description</p>
                <p className="mt-1 text-primary-text">{course.description}</p>
              </div>
            )}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div>
                <p className="text-sm text-secondary-text">Prerequisites</p>
                <ul className="mt-1 list-disc list-inside text-primary-text">
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
                <ul className="mt-1 list-disc list-inside text-primary-text">
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
                  <p className="font-medium text-primary-text">{clo.code}</p>
                  <p className="text-secondary-text">{clo.description}</p>
                </div>
              ))
            ) : (
              <p className="text-secondary-text">
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
                <div key={facultyMember.faculty?.id || index}>
                  <p className="font-medium text-primary-text">{facultyMember.faculty?.name}</p>
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

        <Card className="p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              course "{course.name}" and all its associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
