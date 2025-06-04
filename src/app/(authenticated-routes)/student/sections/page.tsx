'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Section {
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
  faculty: {
    user: {
      first_name: string;
      last_name: string;
    };
  } | null;
  batch: {
    name: string;
  };
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
}

export default function SectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections');
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setSections(data);
      } else if (Array.isArray(data.data)) {
        setSections(data.data);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to fetch sections');
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSections = sections.filter((section) => {
    const matchesSearch =
      section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.courseOffering.course.code
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      section.courseOffering.course.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (section.faculty &&
        `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || section.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-yellow-500';
      case 'deleted':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto py-10'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Sections</h1>
        <Button onClick={() => router.push('/admin/sections/create')}>
          <Plus className='mr-2 h-4 w-4' />
          Create Section
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex gap-4 mb-6'>
            <div className='relative flex-1'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search sections...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-8'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
                <SelectItem value='suspended'>Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center'>
                      No sections found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>{section.name || 'N/A'}</TableCell>
                      <TableCell>
                        {section.courseOffering?.course?.code || 'N/A'} -{' '}
                        {section.courseOffering?.course?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {section.courseOffering?.semester?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {section.faculty?.user
                          ? `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
                          : 'Not assigned'}
                      </TableCell>
                      <TableCell>{section.batch?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {section.currentStudents ?? 0} /{' '}
                        {section.maxStudents ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(section.status)}>
                          {section.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          onClick={() =>
                            router.push(`/admin/sections/${section.id}`)
                          }
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
