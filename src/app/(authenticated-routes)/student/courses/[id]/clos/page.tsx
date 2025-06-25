'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CLO {
  id: number;
  code: string;
  description: string;
  bloomLevel: string | null;
  status: 'active' | 'inactive' | 'archived';
  courseId: number;
  course?: { id: number; name: string; code: string };
}

interface Course {
  id: number;
  name: string;
  code: string;
}

export default function CourseCLOsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [clos, setCLOs] = useState<CLO[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCLO, setSelectedCLO] = useState<CLO | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
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
      const [closRes, courseRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/clos`),
        fetch(`/api/courses/${courseId}`),
      ]);
      const [closData, courseData] = await Promise.all([
        closRes.json(),
        courseRes.json(),
      ]);
      if (!closData.success || !courseData.success) {
        throw new Error(
          closData.error || courseData.error || 'Failed to fetch data'
        );
      }
      setCLOs(closData.data);
      setCourse(courseData.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const handleCreateCLO = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/clos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('CLO created successfully');
        setIsCreateDialogOpen(false);
        setFormData({
          code: '',
          description: '',
          bloomLevel: '',
          status: 'active',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create CLO');
      }
    } catch {
      toast.error('Failed to create CLO');
    }
  };

  const handleUpdateCLO = async () => {
    if (!selectedCLO) return;
    try {
      const response = await fetch(
        `/api/courses/${courseId}/clos/${selectedCLO.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
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
          bloomLevel: '',
          status: 'active',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update CLO');
      }
    } catch {
      toast.error('Failed to update CLO');
    }
  };

  const handleDeleteCLO = async () => {
    if (!selectedCLO) return;
    try {
      const response = await fetch(
        `/api/courses/${courseId}/clos/${selectedCLO.id}`,
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
    } catch {
      toast.error('Failed to delete CLO');
    }
  };

  const handleEditClick = (clo: CLO) => {
    setSelectedCLO(clo);
    setFormData({
      code: clo.code,
      description: clo.description,
      bloomLevel: clo.bloomLevel || '',
      status: clo.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (clo: CLO) => {
    setSelectedCLO(clo);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className='container mx-auto py-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>
            CLOs for {course?.name} ({course?.code})
          </h1>
          <p className='text-gray-500'>Manage CLOs for this course</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className='w-4 h-4 mr-2' /> Add CLO
        </Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Bloom's Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clos.map((clo) => (
              <TableRow key={clo.id}>
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
                      <Edit className='w-4 h-4 mr-2' /> Edit
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleDeleteClick(clo)}
                    >
                      <Trash2 className='w-4 h-4 mr-2' /> Delete
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
            <DialogTitle>Create New CLO</DialogTitle>
            <DialogDescription>
              Add a new Course Learning Outcome for this course.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='code'>Code</Label>
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
              <Label htmlFor='bloomLevel'>Bloom's Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bloom's Level" />
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
                  <SelectValue placeholder='Select Status' />
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
              Modify the Course Learning Outcome details.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-code'>Code</Label>
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
              <Label htmlFor='edit-bloomLevel'>Bloom's Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bloom's Level" />
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
                  <SelectValue placeholder='Select Status' />
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
