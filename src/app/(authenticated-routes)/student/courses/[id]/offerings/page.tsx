'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Award } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Offering {
  courseOfferingId: number;
  semester: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  section: {
    id: number;
    name: string;
    faculty: string;
  };
  grade: {
    grade: string;
    percentage: number;
    gpaPoints: number;
    obtainedMarks: number;
    totalMarks: number;
  } | null;
  enrollmentDate: string;
}

interface OfferingsData {
  course: {
    id: number;
    code: string;
    name: string;
  };
  offerings: Offering[];
}

export default function CourseOfferingsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OfferingsData | null>(null);

  useEffect(() => {
    if (!courseId) return;
    fetchOfferings();
  }, [courseId]);

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/courses/${courseId}/offerings`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch offerings');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch offerings');
      }
    } catch (error) {
      console.error('Error fetching offerings:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch offerings'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p>Loading offerings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No offerings data available</p>
          <Button
            variant="outline"
            onClick={() => router.push(`/student/courses/${courseId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  const getGradeBadgeColor = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'bg-green-100 text-green-800';
    if (['B+', 'B'].includes(grade)) return 'bg-blue-100 text-blue-800';
    if (['C+', 'C'].includes(grade)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/student/courses/${courseId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Course Offerings</h1>
            <p className="text-muted-foreground">
              {data.course.code} - {data.course.name}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            All Semesters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.offerings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No course offerings found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>GPA Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.offerings.map((offering) => (
                  <TableRow key={offering.courseOfferingId}>
                    <TableCell className="font-medium">
                      {offering.semester.name}
                    </TableCell>
                    <TableCell>{offering.section.name}</TableCell>
                    <TableCell>{offering.section.faculty}</TableCell>
                    <TableCell>
                      {formatDate(offering.enrollmentDate)}
                    </TableCell>
                    <TableCell>
                      {offering.grade ? (
                        <Badge className={getGradeBadgeColor(offering.grade.grade)}>
                          {offering.grade.grade}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {offering.grade
                        ? `${offering.grade.percentage.toFixed(1)}%`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {offering.grade
                        ? offering.grade.gpaPoints.toFixed(2)
                        : 'N/A'}
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

