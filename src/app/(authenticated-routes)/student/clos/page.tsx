'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CLO } from '@/app/types/clo';

interface Course {
  id: number;
  name: string;
  code: string;
}

export default function AdminCLOsPage() {
  const router = useRouter();
  const [clos, setCLOs] = useState<CLO[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCLO, setSelectedCLO] = useState<CLO | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    courseId: '',
    bloomLevel: '',
    status: 'active' as 'active' | 'inactive' | 'archived',
  });

  const bloomLevels = [
    'Remember',
    'Understand',
    'Apply',
    'Analyze',
    'Evaluate',
    'Create',
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [closResponse, coursesResponse] = await Promise.all([
        fetch('/api/clos'),
        fetch('/api/courses'),
      ]);

      if (!closResponse.ok || !coursesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [closData, coursesData] = await Promise.all([
        closResponse.json(),
        coursesResponse.json(),
      ]);

      if (!closData.success || !coursesData.success) {
        throw new Error(
          closData.error || coursesData.error || 'Failed to fetch data'
        );
      }

      if (!Array.isArray(closData.data) || !Array.isArray(coursesData.data)) {
        throw new Error('Invalid data format received from server');
      }

      setCLOs(closData.data);
      setCourses(coursesData.data);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCLO = async () => {
    try {
      const response = await fetch(`/api/courses/${formData.courseId}/clos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          bloomLevel: formData.bloomLevel,
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('CLO created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          code: '',
          description: '',
          courseId: '',
          bloomLevel: '',
          status: 'active',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create CLO');
      }
    } catch (error) {
      toast.error('Failed to create CLO');
    }
  };

  const handleUpdateCLO = async () => {
    if (!selectedCLO) return;

    try {
      const response = await fetch(
        `/api/courses/${selectedCLO.courseId}/clos/${selectedCLO.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: formData.code,
            description: formData.description,
            bloomLevel: formData.bloomLevel,
            status: formData.status,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('CLO updated successfully');
        setIsEditDialogOpen(false);
        setSelectedCLO(null);
        setFormData({
          code: '',
          description: '',
          courseId: '',
          bloomLevel: '',
          status: 'active',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update CLO');
      }
    } catch (error) {
      toast.error('Failed to update CLO');
    }
  };

  const handleDeleteCLO = async () => {
    if (!selectedCLO) return;

    try {
      const response = await fetch(
        `/api/courses/${selectedCLO.courseId}/clos/${selectedCLO.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('CLO deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedCLO(null);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete CLO');
      }
    } catch (error) {
      toast.error('Failed to delete CLO');
    }
  };

  const handleEditClick = (clo: CLO) => {
    setSelectedCLO(clo);
    setFormData({
      code: clo.code,
      description: clo.description,
      courseId: clo.courseId.toString(),
      bloomLevel: clo.bloomLevel || '',
      status: clo.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (clo: CLO) => {
    setSelectedCLO(clo);
    setIsDeleteDialogOpen(true);
  };

  const filteredCLOs =
    selectedCourse === 'all'
      ? clos
      : clos.filter((clo) => clo.courseId.toString() === selectedCourse);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='container mx-auto py-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Course Learning Outcomes</h1>
          <p className='text-gray-500'>Manage all course learning outcomes</p>
        </div>
        <div className='flex gap-4'>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Add CLO
          </Button>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='Filter by course' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Bloom's Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCLOs.map((clo) => (
              <TableRow key={clo.id}>
                <TableCell>{clo.course?.name}</TableCell>
                <TableCell>{clo.code}</TableCell>
                <TableCell>{clo.description}</TableCell>
                <TableCell>{clo.bloomLevel || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      clo.status === 'active'
                        ? 'default'
                        : clo.status === 'inactive'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {clo.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEditClick(clo)}
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleDeleteClick(clo)}
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        router.push(`/admin/courses/${clo.courseId}/clos`)
                      }
                    >
                      <BookOpen className='w-4 h-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create CLO Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create CLO</DialogTitle>
            <DialogDescription>
              Add a new Course Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='course'>Course</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, courseId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select course' />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='code'>CLO Code</Label>
              <Input
                id='code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g., CLO1'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter CLO description'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='bloomLevel'>Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bloom's level" />
                </SelectTrigger>
                <SelectContent>
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='archived'>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCLO}>Create CLO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit CLO Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit CLO</DialogTitle>
            <DialogDescription>
              Update Course Learning Outcome details
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-code'>CLO Code</Label>
              <Input
                id='edit-code'
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder='e.g., CLO1'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-description'>Description</Label>
              <Textarea
                id='edit-description'
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder='Enter CLO description'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-bloomLevel'>Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bloom's level" />
                </SelectTrigger>
                <SelectContent>
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='edit-status'>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='archived'>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateCLO}>Update CLO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete CLO Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete CLO</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this CLO? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeleteCLO}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
