'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { course_offering_status } from '@prisma/client';

interface CourseOffering {
  id: number;
  course: {
    id: number;
    code: string;
    name: string;
  };
  semester: {
    id: number;
    name: string;
  };
  status: course_offering_status;
}

export default function EditCourseOfferingPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [courseOffering, setCourseOffering] = useState<CourseOffering | null>(
    null
  );
  const [status, setStatus] = useState<course_offering_status>('active');

  useEffect(() => {
    if (params.id) {
      fetchCourseOffering();
    }
  }, [params.id]);

  const fetchCourseOffering = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch(`/api/courses/offerings/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch course offering');
      }
      const data = await response.json();
      if (data.success && data.data) {
        setCourseOffering(data.data);
        setStatus(data.data.status);
      } else {
        throw new Error(data.error || 'Failed to fetch course offering');
      }
    } catch (error) {
      console.error('Error fetching course offering:', error);
      toast.error('Failed to fetch course offering details');
      router.push('/admin/course-offerings');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/courses/offerings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(params.id as string),
          status: status,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update course offering');
      }

      toast.success('Course offering updated successfully');
      router.push(`/admin/course-offerings/${params.id}`);
    } catch (error) {
      console.error('Error updating course offering:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update course offering'
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!courseOffering) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground">Course offering not found</p>
          <Button
            onClick={() => router.push('/admin/course-offerings')}
            className="mt-4"
          >
            Back to Course Offerings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/admin/course-offerings/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Course Offering</h1>
          <p className="text-muted-foreground">
            Update course offering information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {courseOffering.course.code} - {courseOffering.course.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Course</Label>
                <Input
                  value={`${courseOffering.course.code} - ${courseOffering.course.name}`}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Course cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label>Semester</Label>
                <Input
                  value={courseOffering.semester.name}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Semester cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={status}
                  onValueChange={(value: course_offering_status) =>
                    setStatus(value)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/admin/course-offerings/${params.id}`)
                }
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
