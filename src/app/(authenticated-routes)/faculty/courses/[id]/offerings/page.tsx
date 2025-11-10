'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, FileText, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

interface CourseOffering {
  id: number;
  semester: {
    id: number;
    name: string;
    startDate: string | null;
    endDate: string | null;
    status: string;
  };
  status: string;
  sections: Array<{
    id: number;
    name: string;
    batch: {
      id: string;
      name: string;
    } | null;
    currentStudents: number;
    averagePerformance: number;
    totalAssessments: number;
  }>;
  totalAssessments: number;
}

export default function CourseOfferingsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, offeringsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`, { credentials: 'include' }),
        fetch(`/api/courses/${courseId}/offerings`, { credentials: 'include' }),
      ]);

      const [courseData, offeringsData] = await Promise.all([
        courseRes.json(),
        offeringsRes.json(),
      ]);

      if (!courseData.success) {
        throw new Error(courseData.error || 'Failed to fetch course');
      }

      setCourse(courseData.data);

      if (offeringsData.success) {
        setOfferings(offeringsData.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
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
            <p>Loading course offerings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/faculty/courses/${courseId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            Course Offerings - {course?.name} ({course?.code})
          </h1>
          <p className="text-muted-foreground">
            View all offerings and section-wise performance
          </p>
        </div>
      </div>

      {offerings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No course offerings found for this course
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {offerings.map((offering) => (
            <Card key={offering.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {offering.semester.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {offering.semester.startDate &&
                        new Date(offering.semester.startDate).toLocaleDateString()}{' '}
                      -{' '}
                      {offering.semester.endDate &&
                        new Date(offering.semester.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      offering.status === 'active' ? 'default' : 'secondary'
                    }
                  >
                    {offering.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {offering.sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sections found
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section Name</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Enrollment</TableHead>
                        <TableHead>Assessments</TableHead>
                        <TableHead>Avg Performance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offering.sections.map((section) => (
                        <TableRow key={section.id}>
                          <TableCell className="font-medium">
                            {section.name}
                          </TableCell>
                          <TableCell>
                            {section.batch?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              {section.currentStudents}
                            </div>
                          </TableCell>
                          <TableCell>{section.totalAssessments}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="font-medium">
                                {section.averagePerformance.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/faculty/sections/${section.id}`)
                              }
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

