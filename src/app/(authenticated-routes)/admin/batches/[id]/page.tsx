'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Calendar,
  BookOpen,
  Users,
  Clock,
  Info,
  Pencil,
  ArrowLeft,
  UserPlus,
  Edit,
} from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';

interface Batch {
  id: string;
  name: string;
  program: {
    id: number;
    name: string;
    code: string;
  };
  startDate: string;
  endDate: string;
  maxStudents: number;
  description: string;
  status: 'active' | 'completed' | 'upcoming';
  students: number;
}

export default function BatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const fetchBatch = async () => {
    try {
      const response = await fetch(`/api/batches/${batchId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch batch');
      }
      const data = await response.json();
      setBatch(data);
    } catch (error) {
      console.error('Error fetching batch:', error);
      setError('Failed to load batch data');
      toast.error('Failed to load batch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'upcoming':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto p-6 flex justify-center items-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className='container mx-auto p-6'>
        <PageTitle heading='Batch Details' />
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
      {/* Back button and actions */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <Button variant='outline' asChild>
          <Link href='/admin/batches'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Batches
          </Link>
        </Button>

        <div className='flex gap-3'>
          <Button variant='outline' asChild>
            <Link href={`/admin/batches/${batch.id}/edit`}>
              <Edit className='mr-2 h-4 w-4' />
              Edit Batch
            </Link>
          </Button>

          <Button variant='default' asChild>
            <Link href={`/admin/batches/${batch.id}/students`}>
              <UserPlus className='mr-2 h-4 w-4' />
              Manage Students
            </Link>
          </Button>
        </div>
      </div>

      <PageTitle heading={batch.name} text={`Program: ${batch.program.name}`} />

      <Tabs defaultValue='overview' className='mt-6'>
        <TabsList className='mb-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='students'>Students</TabsTrigger>
        </TabsList>

        <TabsContent value='overview'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Basic Information */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <div className='flex items-center mt-2'>
                  <Badge
                    variant='outline'
                    className={`${getStatusBadge(batch.status)}`}
                  >
                    {batch.status.charAt(0).toUpperCase() +
                      batch.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground mb-1'>
                      Name
                    </h4>
                    <p>{batch.name}</p>
                  </div>
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground mb-1'>
                      Program
                    </h4>
                    <p>{batch.program.name}</p>
                  </div>
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground mb-1'>
                      Student Count
                    </h4>
                    <p>
                      {batch.students} of {batch.maxStudents}
                    </p>
                  </div>
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground mb-1'>
                      Start Date
                    </h4>
                    <p>{formatDate(batch.startDate)}</p>
                  </div>
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground mb-1'>
                      End Date
                    </h4>
                    <p>
                      {batch.endDate ? formatDate(batch.endDate) : 'Ongoing'}
                    </p>
                  </div>
                </div>

                {batch.description && (
                  <div className='mt-4'>
                    <h4 className='text-sm font-medium text-muted-foreground mb-1'>
                      Description
                    </h4>
                    <p>{batch.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center p-4 border rounded-lg'>
                  <Users className='h-8 w-8 mr-4 text-primary' />
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground'>
                      Students
                    </h4>
                    <p className='text-2xl font-bold'>{batch.students}</p>
                  </div>
                </div>

                <div className='flex items-center p-4 border rounded-lg'>
                  <Calendar className='h-8 w-8 mr-4 text-primary' />
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground'>
                      Duration
                    </h4>
                    <p className='text-2xl font-bold'>
                      {batch.endDate
                        ? Math.ceil(
                            (new Date(batch.endDate).getTime() -
                              new Date(batch.startDate).getTime()) /
                              (1000 * 60 * 60 * 24 * 30)
                          )
                        : 'Ongoing'}{' '}
                      {batch.endDate ? 'months' : ''}
                    </p>
                  </div>
                </div>

                <div className='flex items-center p-4 border rounded-lg'>
                  <BookOpen className='h-8 w-8 mr-4 text-primary' />
                  <div>
                    <h4 className='text-sm font-medium text-muted-foreground'>
                      Program
                    </h4>
                    <p className='text-lg font-medium'>{batch.program.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='students'>
          <Card>
            <CardHeader>
              <CardTitle>Students in Batch</CardTitle>
              <CardDescription>
                {isLoadingStudents
                  ? 'Loading students...'
                  : `Total ${batch.students} student${
                      batch.students !== 1 ? 's' : ''
                    }`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStudents ? (
                <div className='flex justify-center items-center py-12'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
              ) : batch.students === 0 ? (
                <div className='text-center py-12'>
                  <Users className='mx-auto h-12 w-12 text-muted-foreground' />
                  <h3 className='mt-4 text-lg font-medium'>
                    No students assigned
                  </h3>
                  <p className='mt-2 text-muted-foreground'>
                    This batch doesn't have any students assigned yet.
                  </p>
                  <Button variant='outline' className='mt-4' asChild>
                    <Link href={`/admin/batches/${batch.id}/students`}>
                      <UserPlus className='mr-2 h-4 w-4' />
                      Assign Students
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className='border rounded-md'>
                  <table className='min-w-full divide-y divide-border'>
                    <thead>
                      <tr className='bg-muted/50'>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Roll Number
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Name
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Email
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Department
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-border'>
                      {/* TODO: Add student list */}
                      <tr className='hover:bg-muted/50'>
                        <td className='px-4 py-3 whitespace-nowrap text-sm'>
                          No students found
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap text-sm'>
                          -
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap text-sm'>
                          -
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap text-sm'>
                          -
                        </td>
                        <td className='px-4 py-3 whitespace-nowrap text-sm'>
                          -
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter className='border-t flex justify-end'>
              <Button variant='outline' size='sm' asChild>
                <Link href={`/admin/batches/${batch.id}/students`}>
                  <Users className='mr-2 h-4 w-4' />
                  Manage Students
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
