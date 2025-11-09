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

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function EditFacultyPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({
    designation: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (params.id) {
      fetchFaculty();
      fetchDepartments();
    }
  }, [params.id]);

  const fetchFaculty = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch(`/api/faculty/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch faculty');
      }
      const data = await response.json();
      if (data.success && data.data) {
        setFaculty(data.data);
        setFormData({
          designation: data.data.designation || '',
          status: data.data.status || 'active',
        });
      } else {
        throw new Error(data.error || 'Failed to fetch faculty');
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to fetch faculty details');
      router.push('/admin/faculty');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      if (data.success) {
        setDepartments(data.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/faculty/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update faculty');
      }

      toast.success('Faculty member updated successfully');
      router.push(`/admin/faculty/${params.id}`);
    } catch (error) {
      console.error('Error updating faculty:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update faculty'
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

  if (!faculty) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground">Faculty not found</p>
          <Button onClick={() => router.push('/admin/faculty')} className="mt-4">
            Back to Faculty
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
          onClick={() => router.push(`/admin/faculty/${params.id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Faculty Member</h1>
          <p className="text-muted-foreground">
            Update faculty member information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {faculty.user.first_name} {faculty.user.last_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={`${faculty.user.first_name} ${faculty.user.last_name}`}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Name cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={faculty.user.email} disabled className="bg-gray-50" />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  placeholder="e.g., Assistant Professor"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={`${faculty.department.name} (${faculty.department.code})`}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Department cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/faculty/${params.id}`)}
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

