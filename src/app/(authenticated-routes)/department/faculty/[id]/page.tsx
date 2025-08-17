'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Edit, User, BookOpen, Users, Calendar } from 'lucide-react';

interface Faculty {
  id: number;
  employeeId: string;
  designation: string;
  status: 'active' | 'inactive';
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
  };
  department: {
    id: number;
    name: string;
    code: string;
  };
  sections: Array<{
    id: number;
    name: string;
    courseOffering: {
      course: {
        code: string;
        name: string;
      };
      semester: {
        name: string;
      };
    };
    batch: {
      name: string;
    };
  }>;
  courses: Array<{
    id: number;
    course: {
      code: string;
      name: string;
    };
  }>;
}

export default function FacultyViewPage() {
  const router = useRouter();
  const params = useParams();
  const facultyId = params.id as string;

  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (facultyId) {
      fetchFaculty();
    }
  }, [facultyId]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/department/faculty/${facultyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch faculty');
      }
      const data = await response.json();
      if (data.success) {
        setFaculty(data.data);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to fetch faculty');
      router.push('/department/faculty');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto py-6'>
        <div className='text-center'>Loading...</div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className='container mx-auto py-6'>
        <div className='text-center text-red-600'>Faculty not found</div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='p-0 h-auto'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back
          </Button>
          <h1 className='text-3xl font-bold'>Faculty Details</h1>
        </div>
        <Button
          onClick={() => router.push(`/department/faculty/${facultyId}/edit`)}
        >
          <Edit className='mr-2 h-4 w-4' />
          Edit
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Information */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <User className='mr-2 h-5 w-5' />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Employee ID
                  </label>
                  <p className='text-lg font-semibold'>{faculty.employeeId}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Designation
                  </label>
                  <p className='text-lg font-semibold'>{faculty.designation}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Status
                  </label>
                  <Badge
                    variant={
                      faculty.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {faculty.status}
                  </Badge>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Department
                  </label>
                  <p className='text-lg font-semibold'>
                    {faculty.department.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Full Name
                  </label>
                  <p className='text-lg font-semibold'>
                    {faculty.user.first_name} {faculty.user.last_name}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Email
                  </label>
                  <p className='text-lg font-semibold'>{faculty.user.email}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Phone
                  </label>
                  <p className='text-lg font-semibold'>
                    {faculty.user.phone_number || 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Sections */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Users className='mr-2 h-5 w-5' />
                Current Sections ({faculty.sections.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {faculty.sections.length > 0 ? (
                <div className='space-y-3'>
                  {faculty.sections.map((section) => (
                    <div
                      key={section.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div>
                        <p className='font-medium'>{section.name}</p>
                        <p className='text-sm text-gray-600'>
                          {section.courseOffering.course.code} -{' '}
                          {section.courseOffering.course.name}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {section.courseOffering.semester.name} •{' '}
                          {section.batch.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-4'>
                  No active sections
                </p>
              )}
            </CardContent>
          </Card>

          {/* Assigned Courses */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <BookOpen className='mr-2 h-5 w-5' />
                Assigned Courses ({faculty.courses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {faculty.courses.length > 0 ? (
                <div className='space-y-3'>
                  {faculty.courses.map((course) => (
                    <div
                      key={course.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div>
                        <p className='font-medium'>{course.course.code}</p>
                        <p className='text-sm text-gray-600'>
                          {course.course.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 text-center py-4'>
                  No assigned courses
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {faculty.sections.length}
                </div>
                <div className='text-sm text-gray-500'>Active Sections</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {faculty.courses.length}
                </div>
                <div className='text-sm text-gray-500'>Assigned Courses</div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                variant='outline'
                className='w-full'
                onClick={() =>
                  router.push(`/department/faculty/${facultyId}/edit`)
                }
              >
                <Edit className='mr-2 h-4 w-4' />
                Edit Faculty
              </Button>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => router.push('/department/faculty')}
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
