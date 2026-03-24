'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText } from 'lucide-react';
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const primaryColor = isDarkMode ? 'var(--orange)' : 'var(--blue)';
  const iconBgColor = isDarkMode ? 'rgba(252, 153, 40, 0.15)' : 'rgba(38, 40, 149, 0.15)';

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="flex items-center justify-center min-h-[50vh] bg-page">
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: primaryColor,
              borderRightColor: 'transparent',
              borderBottomColor: primaryColor,
              borderLeftColor: 'transparent',
            }}
          />
          <p className="text-xs text-secondary-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] bg-page gap-4">
        <p className="text-xs text-secondary-text">Assessment not found</p>
        <button
          type="button"
          onClick={() => router.push('/admin/assessments')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium h-8 flex items-center gap-1.5"
          style={{ backgroundColor: iconBgColor, color: primaryColor }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Assessments
        </button>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {/* Header - CLO style with back + icon box */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/assessments')}
            className="p-2 rounded-lg border border-card-border bg-transparent text-primary-text hover:bg-[var(--hover-bg)] shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: iconBgColor }}
          >
            <FileText className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-text">{assessment.title}</h1>
            <p className="text-xs text-secondary-text mt-0.5">
              {assessment.courseOffering
                ? `${assessment.courseOffering.course.code} - ${assessment.courseOffering.course.name} (${assessment.courseOffering.semester.name})`
                : 'Assessment Details'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary-text">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <p className="text-xs text-secondary-text mb-1">Title</p>
              <p className="text-sm font-medium text-primary-text">{assessment.title}</p>
            </div>
            <div>
              <p className="text-xs text-secondary-text mb-1">Description</p>
              <p className="text-sm text-primary-text">{assessment.description || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary-text mb-1">Type</p>
                <Badge variant="secondary" className="text-[10px]">{assessment.type}</Badge>
              </div>
              <div>
                <p className="text-xs text-secondary-text mb-1">Total Marks</p>
                <p className="text-sm font-medium text-primary-text">{assessment.totalMarks}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-text mb-1">Weightage</p>
                <p className="text-sm font-medium text-primary-text">{assessment.weightage}%</p>
              </div>
              <div>
                <p className="text-xs text-secondary-text mb-1">Due Date</p>
                <p className="text-sm text-primary-text">
                  {format(new Date(assessment.dueDate), 'PPP')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {assessment.courseOffering && (
          <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-primary-text">Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div>
                <p className="text-xs text-secondary-text mb-1">Course</p>
                <p className="text-sm font-medium text-primary-text">
                  {assessment.courseOffering.course.code} - {assessment.courseOffering.course.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-text mb-1">Semester</p>
                <p className="text-sm text-primary-text">{assessment.courseOffering.semester.name}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {assessment.instructions && (
        <Card className="rounded-lg border border-card-border bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary-text">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-primary-text whitespace-pre-wrap">{assessment.instructions}</p>
          </CardContent>
        </Card>
      )}

      {assessment.assessmentItems && assessment.assessmentItems.length > 0 && (
        <div className="rounded-lg border border-card-border bg-card overflow-hidden">
          <div className="p-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-primary-text">Assessment Items</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold text-primary-text">Question No</TableHead>
                <TableHead className="text-xs font-semibold text-primary-text">Marks</TableHead>
                <TableHead className="text-xs font-semibold text-primary-text">CLO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessment.assessmentItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                  <TableCell className="text-xs text-primary-text">{item.questionNo}</TableCell>
                  <TableCell className="text-xs text-secondary-text">{item.marks}</TableCell>
                  <TableCell className="text-xs text-secondary-text">
                    {item.cloId ? `CLO-${item.cloId}` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
