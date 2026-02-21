'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Target } from 'lucide-react';

interface CLO {
  id: number;
  code: string;
  description: string;
  bloomLevel: string | null;
  status: 'active' | 'inactive' | 'archived';
  courseId: number;
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

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [closRes, courseRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/clos`, {
          credentials: 'include',
        }),
        fetch(`/api/courses/${courseId}`, {
          credentials: 'include',
        }),
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
      console.error('Error fetching CLOs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Loading CLOs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/student/courses/${courseId}`)}
            className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-hover-bg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-primary-text">CLOs for {course?.name} ({course?.code})</h1>
            <p className="text-xs text-secondary-text mt-0.5">View Course Learning Outcomes</p>
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Course Learning Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No learning outcomes defined for this course
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Bloom's Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clos.map((clo) => (
                  <TableRow key={clo.id}>
                    <TableCell className="font-medium">{clo.code}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
