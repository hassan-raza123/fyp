'use client';

import { useQuery } from '@tanstack/react-query';
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
import { format } from 'date-fns';

export function SemestersTable() {
  const { data: semesters, isLoading } = useQuery({
    queryKey: ['semesters'],
    queryFn: async () => {
      const response = await fetch('/api/semesters');
      if (!response.ok) {
        throw new Error('Failed to fetch semesters');
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
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {semesters?.map((semester: any) => (
            <TableRow key={semester.id}>
              <TableCell>{semester.name}</TableCell>
              <TableCell>
                {format(new Date(semester.startDate), 'PPP')}
              </TableCell>
              <TableCell>{format(new Date(semester.endDate), 'PPP')}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    semester.status === 'active'
                      ? 'default'
                      : semester.status === 'completed'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {semester.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant='outline' size='sm'>
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
