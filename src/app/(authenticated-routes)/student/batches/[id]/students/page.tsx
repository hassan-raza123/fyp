'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Search,
  Filter,
  UserPlus,
  UserMinus,
  ArrowLeft,
  Check,
  X,
  Users,
} from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

export default function BatchStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [batchData, setBatchData] = useState<any>(null);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<any[]>([]);
  const [selectedBatchStudents, setSelectedBatchStudents] = useState<number[]>(
    []
  );
  const [selectedUnassignedStudents, setSelectedUnassignedStudents] = useState<
    number[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isBatchStudentsLoading, setIsBatchStudentsLoading] = useState(true);
  const [isUnassignedStudentsLoading, setIsUnassignedStudentsLoading] =
    useState(true);
  const [isRemovingStudents, setIsRemovingStudents] = useState(false);
  const [isAddingStudents, setIsAddingStudents] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Fetch batch data
  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/batches/${batchId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch batch data');
        }

        const data = await response.json();
        setBatchData(data);
        // Auto-set program filter to match batch's program
        setProgramFilter(data.programId.toString());
      } catch (err) {
        console.error('Error fetching batch data:', err);
        setError('Failed to load batch data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (batchId) {
      fetchBatchData();
    }
  }, [batchId]);

  // Fetch batch students
  useEffect(() => {
    const fetchBatchStudents = async () => {
      try {
        setIsBatchStudentsLoading(true);
        const response = await fetch(`/api/batches/${batchId}/students`);

        if (!response.ok) {
          throw new Error('Failed to fetch batch students');
        }

        const data = await response.json();
        setBatchStudents(data);
      } catch (err) {
        console.error('Error fetching batch students:', err);
      } finally {
        setIsBatchStudentsLoading(false);
      }
    };

    if (batchId) {
      fetchBatchStudents();
    }
  }, [batchId]);

  // Fetch unassigned students
  useEffect(() => {
    const fetchUnassignedStudents = async () => {
      try {
        setIsUnassignedStudentsLoading(true);

        let url = `/api/batches/unassigned-students?`;

        if (programFilter) {
          url += `programId=${programFilter}&`;
        }

        if (departmentFilter) {
          url += `departmentId=${departmentFilter}&`;
        }

        if (searchTerm) {
          url += `search=${encodeURIComponent(searchTerm)}&`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch unassigned students');
        }

        const data = await response.json();
        setUnassignedStudents(data);
      } catch (err) {
        console.error('Error fetching unassigned students:', err);
      } finally {
        setIsUnassignedStudentsLoading(false);
      }
    };

    fetchUnassignedStudents();
  }, [programFilter, departmentFilter, searchTerm]);

  // Handle assign students
  const handleAssignStudents = async () => {
    if (selectedUnassignedStudents.length === 0) return;

    try {
      setIsAddingStudents(true);

      const response = await fetch(`/api/batches/${batchId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedUnassignedStudents,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign students');
      }

      // Refresh lists
      const batchStudentsResponse = await fetch(
        `/api/batches/${batchId}/students`
      );
      const newBatchStudents = await batchStudentsResponse.json();
      setBatchStudents(newBatchStudents);

      // Update unassigned students list by removing the assigned ones
      setUnassignedStudents((prev) =>
        prev.filter(
          (student) => !selectedUnassignedStudents.includes(student.id)
        )
      );

      // Clear selection
      setSelectedUnassignedStudents([]);
    } catch (err: any) {
      console.error('Error assigning students:', err);
      alert(err.message || 'Failed to assign students');
    } finally {
      setIsAddingStudents(false);
    }
  };

  // Handle remove students
  const handleRemoveStudents = async () => {
    if (selectedBatchStudents.length === 0) return;

    try {
      setIsRemovingStudents(true);

      const response = await fetch(`/api/batches/${batchId}/students`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedBatchStudents,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove students');
      }

      // Update batch students list by removing the ones that were unassigned
      setBatchStudents((prev) =>
        prev.filter((student) => !selectedBatchStudents.includes(student.id))
      );

      // Refetch unassigned students to include newly unassigned ones
      const unassignedResponse = await fetch(
        `/api/batches/unassigned-students?programId=${programFilter}`
      );
      const newUnassignedStudents = await unassignedResponse.json();
      setUnassignedStudents(newUnassignedStudents);

      // Clear selection
      setSelectedBatchStudents([]);
    } catch (err: any) {
      console.error('Error removing students:', err);
      alert(err.message || 'Failed to remove students');
    } finally {
      setIsRemovingStudents(false);
    }
  };

  // Handle batch student selection
  const toggleBatchStudentSelection = (studentId: number) => {
    setSelectedBatchStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Handle unassigned student selection
  const toggleUnassignedStudentSelection = (studentId: number) => {
    setSelectedUnassignedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Select all batch students
  const selectAllBatchStudents = () => {
    if (selectedBatchStudents.length === batchStudents.length) {
      setSelectedBatchStudents([]);
    } else {
      setSelectedBatchStudents(batchStudents.map((student) => student.id));
    }
  };

  // Select all unassigned students
  const selectAllUnassignedStudents = () => {
    if (selectedUnassignedStudents.length === unassignedStudents.length) {
      setSelectedUnassignedStudents([]);
    } else {
      setSelectedUnassignedStudents(
        unassignedStudents.map((student) => student.id)
      );
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto p-6 flex justify-center items-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (error || !batchData) {
    return (
      <div className='container mx-auto p-6'>
        <PageTitle heading='Manage Batch Students' />
        <div className='rounded-md bg-red-50 p-4 mb-6 text-red-700'>
          {error || 'Failed to load batch data'}
        </div>
        <Button variant='outline' asChild>
          <Link href='/admin/batches'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Batches
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      {/* Back button */}
      <div className='mb-6'>
        <Button variant='outline' asChild>
          <Link href={`/admin/batches/${batchId}`}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Batch
          </Link>
        </Button>
      </div>

      <PageTitle
        heading={`Manage Students: ${batchData.name}`}
        text={`Assign or remove students from the batch "${batchData.code}"`}
      />

      <Tabs defaultValue='batch-students' className='mt-6'>
        <TabsList className='mb-4'>
          <TabsTrigger value='batch-students'>Current Students</TabsTrigger>
          <TabsTrigger value='unassigned-students'>Add Students</TabsTrigger>
        </TabsList>

        {/* Current Batch Students Tab */}
        <TabsContent value='batch-students'>
          <Card>
            <CardHeader>
              <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                  <CardTitle>Current Students</CardTitle>
                  <CardDescription>
                    {isBatchStudentsLoading
                      ? 'Loading students...'
                      : `${batchStudents.length} students in this batch`}
                  </CardDescription>
                </div>

                {selectedBatchStudents.length > 0 && (
                  <Button
                    variant='destructive'
                    onClick={handleRemoveStudents}
                    disabled={isRemovingStudents}
                  >
                    {isRemovingStudents ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <UserMinus className='mr-2 h-4 w-4' />
                    )}
                    Remove {selectedBatchStudents.length} Student
                    {selectedBatchStudents.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isBatchStudentsLoading ? (
                <div className='flex justify-center items-center py-12'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
              ) : batchStudents.length === 0 ? (
                <div className='text-center py-12'>
                  <Users className='mx-auto h-12 w-12 text-muted-foreground' />
                  <h3 className='mt-4 text-lg font-medium'>
                    No students in this batch
                  </h3>
                  <p className='mt-2 text-muted-foreground'>
                    Switch to the "Add Students" tab to assign students to this
                    batch.
                  </p>
                </div>
              ) : (
                <div className='border rounded-md'>
                  <table className='min-w-full divide-y divide-border'>
                    <thead>
                      <tr className='bg-muted/50'>
                        <th className='px-4 py-3'>
                          <Checkbox
                            checked={
                              selectedBatchStudents.length ===
                                batchStudents.length && batchStudents.length > 0
                            }
                            onCheckedChange={selectAllBatchStudents}
                            aria-label='Select all students'
                          />
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Roll Number
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Name
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Program
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Department
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-border'>
                      {batchStudents.map((student) => (
                        <tr key={student.id} className='hover:bg-muted/50'>
                          <td className='px-4 py-3 whitespace-nowrap'>
                            <Checkbox
                              checked={selectedBatchStudents.includes(
                                student.id
                              )}
                              onCheckedChange={() =>
                                toggleBatchStudentSelection(student.id)
                              }
                              aria-label={`Select ${student.first_name} ${student.last_name}`}
                            />
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap text-sm'>
                            {student.rollNumber}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap text-sm'>
                            {student.first_name} {student.last_name}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap text-sm'>
                            {student.program_code}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap text-sm'>
                            {student.department_code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unassigned Students Tab */}
        <TabsContent value='unassigned-students'>
          <Card>
            <CardHeader>
              <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div>
                  <CardTitle>Available Students</CardTitle>
                  <CardDescription>
                    {isUnassignedStudentsLoading
                      ? 'Loading students...'
                      : `${unassignedStudents.length} unassigned students`}
                  </CardDescription>
                </div>

                {selectedUnassignedStudents.length > 0 && (
                  <Button
                    variant='default'
                    onClick={handleAssignStudents}
                    disabled={isAddingStudents}
                  >
                    {isAddingStudents ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <UserPlus className='mr-2 h-4 w-4' />
                    )}
                    Add {selectedUnassignedStudents.length} Student
                    {selectedUnassignedStudents.length !== 1 ? 's' : ''}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className='flex flex-col sm:flex-row gap-4 mb-6'>
                <div className='relative flex-1'>
                  <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search students...'
                    className='pl-8'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger className='w-full sm:w-[180px]'>
                    <SelectValue placeholder='Department' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>All Departments</SelectItem>
                    {/* Would need department data to populate options */}
                  </SelectContent>
                </Select>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='w-full sm:w-[180px]'>
                        <Select
                          value={programFilter}
                          onValueChange={setProgramFilter}
                          disabled={true}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Program' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={batchData.programId.toString()}>
                              {batchData.program_code}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Only students from this program can be added to the
                        batch
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {isUnassignedStudentsLoading ? (
                <div className='flex justify-center items-center py-12'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
              ) : unassignedStudents.length === 0 ? (
                <div className='text-center py-12 border rounded-lg'>
                  <Users className='mx-auto h-12 w-12 text-muted-foreground' />
                  <h3 className='mt-4 text-lg font-medium'>
                    No unassigned students
                  </h3>
                  <p className='mt-2 text-muted-foreground'>
                    There are no unassigned students matching your filters.
                  </p>
                </div>
              ) : (
                <div className='border rounded-md'>
                  <table className='min-w-full divide-y divide-border'>
                    <thead>
                      <tr className='bg-muted/50'>
                        <th className='px-4 py-3'>
                          <Checkbox
                            checked={
                              selectedUnassignedStudents.length ===
                                unassignedStudents.length &&
                              unassignedStudents.length > 0
                            }
                            onCheckedChange={selectAllUnassignedStudents}
                            aria-label='Select all students'
                          />
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Roll Number
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Name
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Program
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Department
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-border'>
                      {unassignedStudents.map((student) => (
                        <tr key={student.id} className='hover:bg-muted/50'>
                          <td className='px-4 py-3 whitespace-nowrap'>
                            <Checkbox
                              checked={selectedUnassignedStudents.includes(
                                student.id
                              )}
                              onCheckedChange={() =>
                                toggleUnassignedStudentSelection(student.id)
                              }
                              aria-label={`Select ${student.first_name} ${student.last_name}`}
                            />
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap text-sm'>
                            {student.rollNumber}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap text-sm'>
                            {student.first_name} {student.last_name}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap text-sm'>
                            {student.program_code}
                          </td>
                          <td className='px-4 py-3 whitespace-nowrap text-sm'>
                            {student.department_code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
