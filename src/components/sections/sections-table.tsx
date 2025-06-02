'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export function SectionsTable() {
  const { data: sections, isLoading } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const response = await fetch('/api/sections');
      if (!response.ok) {
        throw new Error('Failed to fetch sections');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Faculty</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Max Students</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections?.map((section: any) => (
            <TableRow key={section.id}>
              <TableCell>{section.name}</TableCell>
              <TableCell>{section.course.name}</TableCell>
              <TableCell>
                {section.faculty
                  ? `${section.faculty.user.first_name} ${section.faculty.user.last_name}`
                  : 'Not Assigned'}
              </TableCell>
              <TableCell>{section.semester}</TableCell>
              <TableCell>{section.maxStudents}</TableCell>
              <TableCell>
                {format(new Date(section.startDate), 'PPP')}
              </TableCell>
              <TableCell>{format(new Date(section.endDate), 'PPP')}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    section.status === 'active' ? 'default' : 'secondary'
                  }
                >
                  {section.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant='ghost' size='sm'>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
