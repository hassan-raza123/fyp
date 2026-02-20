'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Assessment {
  id: number;
  title: string;
  description: string;
  type: string;
  totalMarks: number;
  dueDate: string;
  weightage: number;
  instructions: string;
  courseOffering?: {
    course: {
      code: string;
      name: string;
    };
    semester: {
      name: string;
    };
  };
  assessmentItems?: {
    id: number;
    questionNo: string;
    marks: number;
    cloId: number | null;
  }[];
}

export default function AssessmentViewPage() {
  const router = useRouter();
  const params = useParams();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchAssessment();
    }
  }, [params.id]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assessments/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assessment');
      }
      const data = await response.json();
      setAssessment(data);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment');
      router.push('/admin/assessments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-muted-foreground">Assessment not found</p>
          <Button onClick={() => router.push('/admin/assessments')} className="mt-4">
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/assessments')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{assessment.title}</h1>
          <p className="text-muted-foreground">Assessment Details</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Title</p>
              <p className="text-lg font-medium">{assessment.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="text-lg">{assessment.description || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge>{assessment.type}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Marks</p>
                <p className="text-lg font-medium">{assessment.totalMarks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weightage</p>
                <p className="text-lg font-medium">{assessment.weightage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="text-lg">
                  {format(new Date(assessment.dueDate), 'PPP')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {assessment.courseOffering && (
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Course</p>
                <p className="text-lg font-medium">
                  {assessment.courseOffering.course.code} -{' '}
                  {assessment.courseOffering.course.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semester</p>
                <p className="text-lg">{assessment.courseOffering.semester.name}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {assessment.instructions && (
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{assessment.instructions}</p>
            </CardContent>
          </Card>
        )}

        {assessment.assessmentItems && assessment.assessmentItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assessment Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question No</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>CLO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessment.assessmentItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.questionNo}</TableCell>
                      <TableCell>{item.marks}</TableCell>
                      <TableCell>
                        {item.cloId ? `CLO-${item.cloId}` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
