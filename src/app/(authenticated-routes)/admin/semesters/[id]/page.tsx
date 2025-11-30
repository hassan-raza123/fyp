'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Calendar, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { semester_status } from '@prisma/client';

interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: semester_status;
  description?: string;
  _count: {
    courseOfferings: number;
  };
}

export default function SemesterViewPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const params = useParams();
  const [semester, setSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchSemester();
    }
  }, [params.id]);

  const fetchSemester = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/semesters?id=${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch semester');
      }
      const data = await response.json();
      if (data.success && data.data) {
        setSemester(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch semester');
      }
    } catch (error) {
      console.error('Error fetching semester:', error);
      toast.error('Failed to fetch semester details');
      router.push('/admin/semesters');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{
            borderTopColor: 'var(--blue)',
            borderBottomColor: 'var(--blue)',
            borderRightColor: 'transparent',
            borderLeftColor: 'transparent',
          }}
        ></div>
      </div>
    );
  }

  if (!mounted) {
    return null;
  }

  if (!semester) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-secondary-text">Semester not found</p>
          <Button
            onClick={() => router.push('/admin/semesters')}
            className="mt-4"
          >
            Back to Semesters
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: semester_status) => {
    switch (status) {
      case semester_status.active:
        return <Badge variant="default">Active</Badge>;
      case semester_status.inactive:
        return <Badge variant="secondary">Inactive</Badge>;
      case semester_status.completed:
        return <Badge variant="destructive">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/semesters')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Semesters
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary-text">{semester.name}</h1>
              <p className="text-secondary-text">Semester Details</p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/admin/semesters/${semester.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Semester
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-secondary-text">
                Semester Name
              </label>
              <p className="text-lg text-primary-text">{semester.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-text">
                  Start Date
                </label>
                <p className="text-lg text-primary-text">
                  {format(new Date(semester.startDate), 'MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary-text">
                  End Date
                </label>
                <p className="text-lg text-primary-text">
                  {format(new Date(semester.endDate), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-secondary-text">
                Status
              </label>
              <div className="mt-1">{getStatusBadge(semester.status)}</div>
            </div>
            {semester.description && (
              <div>
                <label className="text-sm font-medium text-secondary-text">
                  Description
                </label>
                <p className="text-lg text-primary-text">{semester.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Course Offerings
            </CardTitle>
            <BookOpen className="h-4 w-4 text-secondary-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-text">
              {semester._count.courseOfferings}
            </div>
            <p className="text-xs text-secondary-text">
              Total course offerings in this semester
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/admin/course-offerings?semesterId=${semester.id}`
                  )
                }
              >
                View Course Offerings
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/admin/sections?semesterId=${semester.id}`)
                }
              >
                View Sections
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
