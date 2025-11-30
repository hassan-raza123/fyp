'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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

interface LLO {
  id: number;
  code: string;
  description: string;
  courseId: number;
  bloomLevel: string | null;
  status: 'active' | 'inactive' | 'archived';
  course: {
    id: number;
    code: string;
    name: string;
  };
}

interface Course {
  id: number;
  name: string;
  code: string;
}

export default function AdminLLOsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDarkMode = resolvedTheme === 'dark';
  
  const router = useRouter();
  const [llos, setLLOs] = useState<LLO[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLLO, setSelectedLLO] = useState<LLO | null>(null);
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
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
      const [llosResponse, coursesResponse] = await Promise.all([
        fetch('/api/llos', { credentials: 'include' }),
        fetch('/api/courses', { credentials: 'include' }),
      ]);

      if (!llosResponse.ok || !coursesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [llosData, coursesData] = await Promise.all([
        llosResponse.json(),
        coursesResponse.json(),
      ]);

      if (!llosData.success || !coursesData.success) {
        throw new Error(
          llosData.error || coursesData.error || 'Failed to fetch data'
        );
      }

      if (!Array.isArray(llosData.data) || !Array.isArray(coursesData.data)) {
        throw new Error('Invalid data format received from server');
      }

      setLLOs(llosData.data);
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

  const handleCreateLLO = async () => {
    try {
      if (!formData.courseId || !formData.code || !formData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/llos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          courseId: parseInt(formData.courseId),
          bloomLevel: formData.bloomLevel || undefined,
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('LLO created successfully');
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
        toast.error(data.error || 'Failed to create LLO');
      }
    } catch (error) {
      toast.error('Failed to create LLO');
      console.error(error);
    }
  };

  const handleUpdateLLO = async () => {
    if (!selectedLLO) return;

    try {
      const response = await fetch(`/api/llos/${selectedLLO.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code,
          description: formData.description,
          bloomLevel: formData.bloomLevel || undefined,
          status: formData.status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('LLO updated successfully');
        setIsEditDialogOpen(false);
        setSelectedLLO(null);
        setFormData({
          code: '',
          description: '',
          courseId: '',
          bloomLevel: '',
          status: 'active',
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update LLO');
      }
    } catch (error) {
      toast.error('Failed to update LLO');
      console.error(error);
    }
  };

  const handleDeleteLLO = async () => {
    if (!selectedLLO) return;

    try {
      const response = await fetch(`/api/llos/${selectedLLO.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('LLO deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedLLO(null);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete LLO');
      }
    } catch (error) {
      toast.error('Failed to delete LLO');
      console.error(error);
    }
  };

  const handleEditClick = (llo: LLO) => {
    setSelectedLLO(llo);
    setFormData({
      code: llo.code,
      description: llo.description,
      courseId: llo.courseId.toString(),
      bloomLevel: llo.bloomLevel || '',
      status: llo.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (llo: LLO) => {
    setSelectedLLO(llo);
    setIsDeleteDialogOpen(true);
  };

  const filteredLLOs =
    selectedCourse === 'all'
      ? llos
      : llos.filter((llo) => llo.courseId.toString() === selectedCourse);

  if (!mounted || isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12 text-secondary-text">Loading LLOs...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-text">Lab Learning Outcomes (LLOs)</h1>
          <p className="text-secondary-text">Manage all lab learning outcomes</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add LLO
          </Button>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
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
              <TableHead>LLO Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Bloom's Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLLOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No LLOs found. Create your first LLO to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredLLOs.map((llo) => (
                <TableRow key={llo.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{llo.course.name}</div>
                      <div className="text-sm text-secondary-text">
                        {llo.course.code}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{llo.code}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {llo.description}
                  </TableCell>
                  <TableCell>{llo.bloomLevel || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        llo.status === 'active'
                          ? 'default'
                          : llo.status === 'inactive'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {llo.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(llo)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(llo)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/courses/${llo.courseId}`)
                        }
                      >
                        <BookOpen className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create LLO Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create LLO</DialogTitle>
            <DialogDescription>
              Add a new Lab Learning Outcome
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="course">Course *</Label>
              <Select
                value={formData.courseId}
                onValueChange={(value) =>
                  setFormData({ ...formData, courseId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
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
            <div className="grid gap-2">
              <Label htmlFor="code">LLO Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g., LLO1, LLO2"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter LLO description"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bloomLevel">Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bloom's level (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateLLO}>Create LLO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit LLO Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit LLO</DialogTitle>
            <DialogDescription>
              Update Lab Learning Outcome details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-code">LLO Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="e.g., LLO1, LLO2"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter LLO description"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-bloomLevel">Bloom's Taxonomy Level</Label>
              <Select
                value={formData.bloomLevel}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloomLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bloom's level (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {bloomLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'archived') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateLLO}>Update LLO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete LLO Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete LLO</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this LLO? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLLO}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

