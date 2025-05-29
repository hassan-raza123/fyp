'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';

const studentSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  batchId: z.string().min(1, 'Batch is required'),
});

interface Student {
  id: string;
  rollNumber: string;
  status: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  batch: {
    id: string;
    name: string;
  };
  _count: {
    studentsections: number;
  };
}

interface Batch {
  id: string;
  name: string;
}

export function StudentManagement() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    rollNumber: '',
    batchId: '',
  });

  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batches');
      const data = await response.json();
      if (data.success) {
        setBatches(data.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch batches',
        variant: 'destructive',
      });
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = studentSchema.safeParse(formData);
      if (!result.success) {
        toast({
          title: 'Validation Error',
          description: 'Please check your input',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Student added successfully',
        });
        setIsAddDialogOpen(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          rollNumber: '',
          batchId: '',
        });
        fetchStudents();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to add student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive',
      });
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const result = studentSchema.safeParse(formData);
      if (!result.success) {
        toast({
          title: 'Validation Error',
          description: 'Please check your input',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Student updated successfully',
        });
        setIsEditDialogOpen(false);
        setSelectedStudent(null);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          rollNumber: '',
          batchId: '',
        });
        fetchStudents();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Student deleted successfully',
        });
        fetchStudents();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete student',
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students.filter((student) => {
    const searchTerm = search.toLowerCase();
    return (
      student.user.first_name.toLowerCase().includes(searchTerm) ||
      student.user.last_name.toLowerCase().includes(searchTerm) ||
      student.user.email.toLowerCase().includes(searchTerm) ||
      student.rollNumber.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Student Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className='mr-2 h-4 w-4' />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>First Name</Label>
                  <Input
                    id='firstName'
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='lastName'>Last Name</Label>
                  <Input
                    id='lastName'
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='rollNumber'>Roll Number</Label>
                <Input
                  id='rollNumber'
                  value={formData.rollNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, rollNumber: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='batchId'>Batch</Label>
                <Select
                  value={formData.batchId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, batchId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a batch' />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type='submit' className='w-full'>
                Add Student
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='relative'>
        <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search students...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-8'
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roll Number</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className='text-center'>
                Loading...
              </TableCell>
            </TableRow>
          ) : filteredStudents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className='text-center'>
                No students found
              </TableCell>
            </TableRow>
          ) : (
            filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  {student.user.first_name} {student.user.last_name}
                </TableCell>
                <TableCell>{student.user.email}</TableCell>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>{student.batch.name}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      student.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {student.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className='flex space-x-2'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => {
                        setSelectedStudent(student);
                        setFormData({
                          firstName: student.user.first_name,
                          lastName: student.user.last_name,
                          email: student.user.email,
                          password: '',
                          rollNumber: student.rollNumber,
                          batchId: student.batch.id,
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDeleteStudent(student.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStudent} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='editFirstName'>First Name</Label>
                <Input
                  id='editFirstName'
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='editLastName'>Last Name</Label>
                <Input
                  id='editLastName'
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='editEmail'>Email</Label>
              <Input
                id='editEmail'
                type='email'
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='editPassword'>
                Password (leave blank to keep current)
              </Label>
              <Input
                id='editPassword'
                type='password'
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='editRollNumber'>Roll Number</Label>
              <Input
                id='editRollNumber'
                value={formData.rollNumber}
                onChange={(e) =>
                  setFormData({ ...formData, rollNumber: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='editBatchId'>Batch</Label>
              <Select
                value={formData.batchId}
                onValueChange={(value) =>
                  setFormData({ ...formData, batchId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select a batch' />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type='submit' className='w-full'>
              Update Student
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
