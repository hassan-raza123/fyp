'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Faculty {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
  };
  employeeId?: string;
  designation: string;
  status: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
}

export default function FacultyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const facultyId = params?.id;
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (facultyId) {
      fetchFaculty();
    }
  }, [facultyId]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/faculty/${facultyId}`);
      if (!response.ok) throw new Error('Failed to fetch faculty');

      const data = await response.json();
      if (data.success && data.data) {
        setFaculty(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch faculty'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !faculty) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Faculty not found'}</p>
          <Button variant="outline" onClick={() => router.push('/admin/faculty')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Faculty
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/faculty')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {faculty.user.first_name} {faculty.user.last_name}
          </h1>
          <p className="text-muted-foreground">
            Faculty Details
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Employee ID</p>
              <p className="font-medium">{faculty.employeeId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">
                {faculty.user.first_name} {faculty.user.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{faculty.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Designation</p>
              <p className="font-medium">{faculty.designation || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">
                {faculty.department.name} ({faculty.department.code})
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(faculty.user.status)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

